import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PrinterData, PrinterConfig, ChecklistTemplate, PrinterLog, PrinterStatus, User, Feedback } from '../types';
import { supabase } from '../lib/supabase';
import { getVilniusShiftBoundaries } from '../lib/utils';
import { StorageRepository } from '../lib/repository/StorageRepository';
import { SupabaseRepository } from '../lib/repository/SupabaseRepository';
import { MOCK_PRINTERS, DEFAULT_TEMPLATES } from '../constants';

interface DataContextType {
    printers: PrinterData[];
    loading: boolean;
    isSyncing: boolean;
    refreshPrinters: () => Promise<void>;
    updatePrinter: (id: string, data: Partial<PrinterData>, silent?: boolean) => Promise<void>;
    resetPrinter: (id: string) => Promise<void>;
    createPrinter: (data: Partial<PrinterConfig>) => Promise<void>;
    deletePrinter: (id: string) => Promise<void>;

    // Checklists
    checklistTemplates: ChecklistTemplate[];
    saveChecklistTemplate: (template: ChecklistTemplate | Omit<ChecklistTemplate, 'id'>) => Promise<void>;
    deleteChecklistTemplate: (id: string) => Promise<void>;

    // Files
    uploadFile: (file: Blob, path: string) => Promise<string>;

    // Logs
    saveShiftLog(log: Omit<PrinterLog, 'id'>): Promise<void>;
    updateShiftLog(id: string, updates: Partial<PrinterLog>): Promise<void>;
    deleteShiftLog(id: string): Promise<void>;
    getShiftLogs: (filters?: { printerId?: string, date?: string, shift?: string }) => Promise<PrinterLog[]>;
    getUsers: () => Promise<User[]>;
    updateUser: (id: string, data: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    createUser: (user: { name: string; role: 'Admin' | 'Worker'; pin?: string; password?: string }) => Promise<void>;
    // Feedback
    saveFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt'>) => Promise<void>;
    getFeedback: () => Promise<Feedback[]>;
    resolveFeedback: (id: string) => Promise<void>;
    clearAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initialize Repository with Supabase
const repository: StorageRepository = new SupabaseRepository();

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [printers, setPrinters] = useState<PrinterData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);

    // Initial load
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            // Ensure DB is initialized (will skip if already exists)
            // MOCK_PRINTERS are used as defaults if DB is empty
            await repository.initialize(MOCK_PRINTERS);

            const [printersData, checklistsData] = await Promise.all([
                repository.getPrinters(),
                repository.getChecklistTemplates()
            ]);

            setPrinters(printersData);
            setChecklistTemplates(checklistsData);
            setLoading(false);
        };
        init();

        // Shift Rotation Logic
        const checkShiftRotation = async () => {
            const { shiftStartAbsolute: shiftStart, currentShiftName } = getVilniusShiftBoundaries();
            const now = new Date();
            const isDayShift = currentShiftName === 'Dieninė';

            const printers = await repository.getPrinters();

            let updatesMade = false;

            const updatedPrinters = await Promise.all(printers.map(async (p) => {
                // Check if we need to reset for this new shift window
                // If lastShiftReset is missing, or is before the current shift start, we reset.
                const lastReset = p.lastShiftReset ? new Date(p.lastShiftReset) : new Date(0);

                // We add a small buffer (e.g., 1 min) to avoid double resetting if logic runs exactly at 06:00:00
                // But simply comparing if lastReset < shiftStart is sufficient.

                if (lastReset < shiftStart) {
                    console.log(`Resetting shift for ${p.name}. Current time: ${now.toLocaleTimeString()}, Shift Start: ${shiftStart.toLocaleTimeString()}`);

                    // 1. Auto-Log if active or has data
                    if (p.productionAmount || p.defectsAmount || p.status === PrinterStatus.WORKING) {
                        const previousShift = isDayShift ? 'Naktinė' : 'Dieninė';
                        const actualShift = p.vit.shift || previousShift;
                        
                        // FIX: Correct date for auto-closed Night shifts. If it's morning (auto-closing night shift), use yesterday!
                        let correctDate = getVilniusShiftBoundaries().logicalDateString;
                        if (actualShift === 'Naktinė' && isDayShift) {
                            const d = new Date();
                            d.setDate(d.getDate() - 1);
                            correctDate = getVilniusShiftBoundaries(d.toISOString()).logicalDateString;
                        }

                        try {
                            await repository.saveShiftLog({
                                printerId: p.id,
                                printerName: p.name,
                                shift: actualShift,
                                operatorName: p.operatorName || 'Sistema (Auto)',
                                date: correctDate,
                                startedAt: p.workStartedAt || new Date().toISOString(),
                                finishedAt: new Date().toISOString(),
                                productionAmount: p.productionAmount || 0,
                                defectsAmount: p.defectsAmount || 0,
                                robotDefects: p.robotDefects || 0,
                                printingDefects: p.printingDefects || 0,
                                glueDefects: p.glueDefects || 0,
                                vitData: p.vit,
                                nozzleData: {
                                    url: p.nozzleFile?.url,
                                    mimakiFiles: p.mimakiNozzleFiles
                                },
                                nextOperatorMessage: "Automatinis uždarymas: VIT pabaiga neužpildyta",
                            });
                        } catch (e) {
                            console.error("Failed to auto-save log on shift change", e);
                        }
                    }

                    // 2. Full Reset for Next Shift
                    const newState: Partial<PrinterData> = {
                        lastShiftReset: new Date().toISOString(),

                        // Reset Status and Operator
                        status: PrinterStatus.NOT_STARTED,
                        operatorName: null as any,
                        handoverVerified: false, // Require next operator to verify

                        // Reset Times
                        workStartedAt: undefined,
                        workFinishedAt: undefined,

                        // Reset VIT
                        vit: { ...p.vit, shift: currentShiftName, confirmed: false, signature: '', checklist: {}, notes: '' },

                        // Reset Process Flags
                        maintenanceDone: false,
                        nozzlePrintDone: false,
                        nozzleFile: null,
                        mimakiNozzleFiles: {},
                        selectedMimakiUnits: [],

                        // Reset Counts
                        productionAmount: 0,
                        defectsAmount: 0,
                        robotDefects: 0,
                        printingDefects: 0,
                        glueDefects: 0,

                        // Default remainingAmount to 0 if undefined, but ideally we KEEP it if it exists. 
                        // However, wait, if shift rotates, remaining amount is still remaining right? YES.
                        // So we do NOT reset remainingAmount.
                        // We also KEEP nextOperatorMessage.

                        // Reset Checklists
                        startShiftChecklist: {},
                        endShiftChecklist: {},

                        // Clear Message - NO, keep it for handover
                        // nextOperatorMessage: "" 
                    };

                    await repository.updatePrinter(p.id, newState);
                    updatesMade = true;
                    return { ...p, ...newState };
                }
                return p;
            }));

            if (updatesMade) {
                setPrinters(updatedPrinters);
            }
        };

        // Run shift check immediately on load, then every minute
        checkShiftRotation();
        const shiftInterval = setInterval(checkShiftRotation, 60000);

        // Subscripbe to Realtime updates
        const channel = supabase
            .channel('public:printers')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'printers' }, (payload) => {
                console.log('Realtime update received:', payload);
                // Refresh data on any change
                // We could be more granular but full refresh is safest and easy
                refreshPrinters();
            })
            .subscribe();

        // Set up polling as fallback (faster interval for "Live" feel)
        const interval = setInterval(async () => {
            // Always poll, even if hidden, to ensure background tabs (like on a TV that might switch inputs) stay fresh
            // Reduced to 2s for better responsiveness if realtime fails
            try {
                const data = await repository.getPrinters();
                setPrinters(data);
                await checkShiftRotation();
            } catch (e) {
                console.error("Polling error:", e);
            }
        }, 2000);

        return () => {
            clearInterval(interval);
            clearInterval(shiftInterval);
            supabase.removeChannel(channel);
        };
    }, []);

    const refreshPrinters = async () => {
        setIsSyncing(true);
        const data = await repository.getPrinters();
        setPrinters(data);
        setIsSyncing(false);
    };

    const saveChecklistTemplate = async (template: ChecklistTemplate | Omit<ChecklistTemplate, 'id'>) => {
        setIsSyncing(true);
        await repository.saveChecklistTemplate(template);
        const updated = await repository.getChecklistTemplates();
        setChecklistTemplates(updated);
        setIsSyncing(false);
    };

    const deleteChecklistTemplate = async (id: string) => {
        setIsSyncing(true);
        await repository.deleteChecklistTemplate(id);
        setChecklistTemplates(prev => prev.filter(t => t.id !== id));
        setIsSyncing(false);
    };

    const uploadFile = async (file: Blob, path: string) => {
        setIsSyncing(true);
        try {
            const url = await repository.uploadFile(file, path);
            setIsSyncing(false);
            return url;
        } catch (error) {
            setIsSyncing(false);
            throw error;
        }
    };

    const updatePrinter = async (id: string, data: Partial<PrinterData>, silent: boolean = false) => {
        // Optimistic update
        setPrinters(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));

        if (!silent) setIsSyncing(true);
        await repository.updatePrinter(id, data);

        // Re-fetch to ensure consistency is not strictly required if we trust optimistic update,
        // but useful if there are server-side triggers.
        // We'll rely on the polling for eventual consistency/other user updates.
        if (!silent) setIsSyncing(false);
    };

    const resetPrinter = async (id: string) => {
        // Optimistic update
        setPrinters(prev => prev.map(p => {
            if (p.id !== id) return p;
            // Construct a partial reset state for UI immediate feedback
            return {
                ...p,
                status: PrinterStatus.NOT_STARTED,
                maintenanceDone: false,
                handoverVerified: false,
                vit: { ...p.vit, confirmed: false, signature: '' } // Partial reset visual
            };
        }));

        setIsSyncing(true);
        await repository.resetPrinter(id);
        const data = await repository.getPrinters(); // Fetch full fresh state to be sure
        setPrinters(data);
        setIsSyncing(false);
    };

    const createPrinter = async (data: Partial<PrinterConfig>) => {
        setIsSyncing(true);
        try {
            await repository.createPrinter(data as any);
            const printers = await repository.getPrinters();
            setPrinters(printers);
        } catch (e) {
            console.error("Error in createPrinter:", e);
            throw e;
        } finally {
            setIsSyncing(false);
        }
    };

    const deletePrinter = async (id: string) => {
        setIsSyncing(true);
        await repository.deletePrinter(id);
        const data = await repository.getPrinters();
        setPrinters(data);
        setIsSyncing(false);
    };

    const saveShiftLog = useCallback(async (log: Omit<PrinterLog, 'id'>) => {
        await repository.saveShiftLog(log);
    }, []);

    const updateShiftLog = useCallback(async (id: string, updates: Partial<PrinterLog>) => {
        await repository.updateShiftLog(id, updates);
    }, []);

    const deleteShiftLog = useCallback(async (id: string) => {
        await repository.deleteShiftLog(id);
    }, []);

    const getShiftLogs = useCallback(async (filters?: { printerId?: string, date?: string }) => {
        return await repository.getShiftLogs(filters);
    }, []);

    const getUsers = useCallback(async () => {
        return await repository.getUsers();
    }, []);

    const updateUser = useCallback(async (id: string, data: Partial<any>) => {
        await repository.updateUser(id, data);
    }, []);

    const deleteUser = useCallback(async (id: string) => {
        await repository.deleteUser(id);
    }, []);

    const createUser = useCallback(async (user: { name: string; role: 'Admin' | 'Worker'; pin?: string; password?: string }) => {
        await repository.createUser(user);
    }, []);

    const saveFeedback = useCallback(async (feedback: Omit<Feedback, 'id' | 'createdAt'>) => {
        await repository.saveFeedback(feedback);
    }, []);

    const getFeedback = useCallback(async () => {
        return await repository.getFeedback();
    }, []);

    const resolveFeedback = useCallback(async (id: string) => {
        await repository.resolveFeedback(id);
    }, []);

    const clearAllData = useCallback(async () => {
        setIsSyncing(true);
        try {
            await repository.clearAllData();
            await refreshPrinters();
        } catch (e) {
            console.error("Error clearing all data:", e);
            throw e;
        } finally {
            setIsSyncing(false);
        }
    }, [refreshPrinters]);

    return (
        <DataContext.Provider value={{
            printers,
            loading,
            isSyncing,
            refreshPrinters,
            updatePrinter,
            resetPrinter,
            createPrinter,
            deletePrinter,
            checklistTemplates,
            saveChecklistTemplate,
            deleteChecklistTemplate,
            uploadFile,
            saveShiftLog,
            updateShiftLog,
            deleteShiftLog,
            getShiftLogs,
            getUsers,
            updateUser,
            deleteUser,
            createUser,
            saveFeedback,
            getFeedback,
            resolveFeedback,
            clearAllData
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const usePrinters = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('usePrinters must be used within a DataProvider');
    }
    return context;
};
