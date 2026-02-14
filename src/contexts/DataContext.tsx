import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PrinterData, PrinterConfig, ChecklistTemplate, PrinterLog, PrinterStatus, User } from '../types';
import { StorageRepository } from '../lib/repository/StorageRepository';
import { SupabaseRepository } from '../lib/repository/SupabaseRepository';
import { MOCK_PRINTERS } from '../constants';

interface DataContextType {
    printers: PrinterData[];
    loading: boolean;
    isSyncing: boolean;
    refreshPrinters: () => Promise<void>;
    updatePrinter: (id: string, data: Partial<PrinterData>) => Promise<void>;
    resetPrinter: (id: string) => Promise<void>;
    createPrinter: (name: string) => Promise<void>;
    deletePrinter: (id: string) => Promise<void>;

    // Checklists
    checklistTemplates: ChecklistTemplate[];
    saveChecklistTemplate: (template: ChecklistTemplate | Omit<ChecklistTemplate, 'id'>) => Promise<void>;
    deleteChecklistTemplate: (id: string) => Promise<void>;

    // Files
    uploadFile: (file: Blob, path: string) => Promise<string>;

    // Logs
    saveShiftLog: (log: Omit<PrinterLog, 'id'>) => Promise<void>;
    getShiftLogs: (filters?: { printerId?: string, date?: string, shift?: string }) => Promise<PrinterLog[]>;
    getUsers: () => Promise<User[]>;
    updateUser: (id: string, data: Partial<User>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    createUser: (user: { name: string; role: 'Admin' | 'Worker'; pin?: string; password?: string }) => Promise<void>;
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

        // Set up polling for basic real-time feel
        const interval = setInterval(async () => {
            // Only poll if tab is visible to save resources
            if (!document.hidden) {
                const data = await repository.getPrinters();
                setPrinters(data);

                // Also poll checklists just in case another admin changed them
                // In high traffic app, maybe not needed so often, but here it's fine
                // const checklists = await repository.getChecklistTemplates();
                // setChecklistTemplates(checklists); 
                // Commented out to save requests, admin updates are rare.
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
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

    const updatePrinter = async (id: string, data: Partial<PrinterData>) => {
        // Optimistic update
        setPrinters(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));

        setIsSyncing(true);
        await repository.updatePrinter(id, data);

        // Re-fetch to ensure consistency is not strictly required if we trust optimistic update,
        // but useful if there are server-side triggers. 
        // We'll rely on the polling for eventual consistency/other user updates.
        setIsSyncing(false);
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
                vit: { ...p.vit, confirmed: false, signature: '' } // Partial reset visual
            };
        }));

        setIsSyncing(true);
        await repository.resetPrinter(id);
        const data = await repository.getPrinters(); // Fetch full fresh state to be sure
        setPrinters(data);
        setIsSyncing(false);
    };

    const createPrinter = async (name: string) => {
        setIsSyncing(true);
        await repository.createPrinter(name);
        const data = await repository.getPrinters();
        setPrinters(data);
        setIsSyncing(false);
    };

    const deletePrinter = async (id: string) => {
        setIsSyncing(true);
        await repository.deletePrinter(id);
        const data = await repository.getPrinters();
        setPrinters(data);
        setIsSyncing(false);
    };

    const saveShiftLog = async (log: Omit<PrinterLog, 'id'>) => {
        await repository.saveShiftLog(log);
    };

    const getShiftLogs = async (filters?: { printerId?: string, date?: string }) => {
        return await repository.getShiftLogs(filters);
    };

    const getUsers = async () => {
        return await repository.getUsers();
    };

    const updateUser = async (id: string, data: Partial<any>) => { // using any to avoid import cycles or complex types in context for now, or just import User
        await repository.updateUser(id, data);
    };

    const deleteUser = async (id: string) => {
        await repository.deleteUser(id);
    };

    const createUser = async (user: { name: string; role: 'Admin' | 'Worker'; pin?: string; password?: string }) => {
        await repository.createUser(user);
    };

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
            getShiftLogs,
            getUsers,
            updateUser,
            deleteUser,
            createUser
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
