import React, { useState, useEffect } from 'react';
import { PrinterData, PrinterStatus, VITData, User, Station, ChecklistTemplate } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Stepper } from './ui/stepper';
import { Check, ArrowLeft, ChevronRight, Printer, AlertTriangle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SetupProcess } from './SetupProcess'; // Recycle existing single setup logic?
// Actually, better to compose it or just reuse the logic. 
// Reusing the full SetupProcess component for each printer in a sequence is a good strategy.

interface StationSetupProcessProps {
    station: Station;
    assignedPrinters: PrinterData[];
    currentUser: User;
    checklistTemplates: ChecklistTemplate[];
    onFinish: () => void;
    onCancel: () => void;
    updatePrinter: (id: string, data: Partial<PrinterData>, silent?: boolean) => Promise<void>;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    uploadFile: (file: Blob, path: string) => Promise<string>;
}

export const StationSetupProcess: React.FC<StationSetupProcessProps> = ({
    station,
    assignedPrinters,
    currentUser,
    checklistTemplates,
    onFinish,
    onCancel,
    updatePrinter,
    addToast,
    uploadFile
}) => {
    // Step 0: Printer Selection
    // Step 1..N: SetupProcess for each selected printer
    // Step N+1: Final Confirmation

    const [selectedPrinterIds, setSelectedPrinterIds] = useState<string[]>([]);
    const [activePrinterIndex, setActivePrinterIndex] = useState<number>(-1); // -1 means Selection Step
    const [completedPrinterIds, setCompletedPrinterIds] = useState<string[]>([]);

    // Initialize selection with all printers by default?
    useEffect(() => {
        setSelectedPrinterIds(assignedPrinters.map(p => p.id));
    }, [assignedPrinters]);

    const handlePrinterToggle = (id: string) => {
        setSelectedPrinterIds(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const startSetup = () => {
        if (selectedPrinterIds.length === 0) {
            addToast("Pasirinkite bent vieną įrenginį", "error");
            return;
        }
        setActivePrinterIndex(0);
    };

    const handleSinglePrinterFinish = (printerId: string) => {
        setCompletedPrinterIds(prev => [...prev, printerId]);

        // Move to next
        if (activePrinterIndex < selectedPrinterIds.length - 1) {
            setActivePrinterIndex(prev => prev + 1);
        } else {
            // All done
            onFinish();
        }
    };

    // If in selection mode
    if (activePrinterIndex === -1) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
                    <div className="px-6 py-4 flex justify-between items-center max-w-5xl mx-auto w-full">
                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-2xl hover:bg-slate-100">
                                <ArrowLeft className="w-6 h-6 text-slate-700" />
                            </Button>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 leading-none uppercase tracking-tight">{station.name}</h2>
                                <p className="text-[10px] text-mimaki-blue font-black uppercase tracking-[0.2em] mt-1">Stoties paruošimas</p>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="flex-1 p-6 md:p-10 max-w-3xl mx-auto w-full flex flex-col justify-center">
                    <Card className="shadow-xl border-0 bg-white rounded-3xl overflow-hidden">
                        <CardHeader className="p-8 pb-4 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                                <Printer className="w-10 h-10" />
                            </div>
                            <CardTitle className="text-3xl font-black uppercase text-slate-800">Pasirinkite Įrenginius</CardTitle>
                            <p className="text-slate-500 font-medium mt-2">
                                Su kuriais {station.name} įrenginiais dirbsite šią pamainą?
                            </p>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 gap-4">
                                {assignedPrinters.map(printer => (
                                    <label
                                        key={printer.id}
                                        className={cn(
                                            "flex items-center p-6 rounded-2xl border-2 cursor-pointer transition-all",
                                            selectedPrinterIds.includes(printer.id)
                                                ? "border-mimaki-blue bg-blue-50/50 shadow-md"
                                                : "border-slate-100 bg-white hover:border-slate-200"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            className="w-6 h-6 rounded-md accent-mimaki-blue mr-6"
                                            checked={selectedPrinterIds.includes(printer.id)}
                                            onChange={() => handlePrinterToggle(printer.id)}
                                        />
                                        <div>
                                            <span className="block text-lg font-bold text-slate-800">{printer.name}</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{printer.status}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="mt-10">
                                <Button
                                    className="w-full h-16 text-xl font-black uppercase tracking-widest bg-mimaki-blue hover:bg-blue-600 text-white rounded-2xl shadow-xl shadow-mimaki-blue/20"
                                    onClick={startSetup}
                                >
                                    Pradėti Paruošimą ({selectedPrinterIds.length})
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    // Active Printer Setup
    const activePrinterId = selectedPrinterIds[activePrinterIndex];
    const activePrinter = assignedPrinters.find(p => p.id === activePrinterId);

    if (!activePrinter) return <div>Error: Printer not found</div>;

    return (
        <div className="fixed inset-0 z-50 bg-white">
            {/* We reuse the SetupProcess component but wrap/inject props to handle the sequence */}
            <SetupProcess
                printer={activePrinter}
                currentUser={currentUser}
                checklistTemplates={checklistTemplates}
                onSave={(data, silent) => updatePrinter(activePrinter.id, data, silent)}
                onFinish={() => {
                    // Instead of closing, we move to next
                    // We also likely want to set status to WORKING for this printer immediately?
                    // SetupProcess usually calls onFinish when user clicks "Start Work".
                    // In SetupProcess onFinish usually just closes the modal in App.tsx logic?
                    // Wait, App.tsx handleSetupComplete sets status to WORKING.

                    // So here we must duplicate that logic:
                    updatePrinter(activePrinter.id, {
                        status: PrinterStatus.WORKING,
                        maintenanceDone: true,
                        workStartedAt: new Date().toLocaleString('lt-LT'),
                        operatorName: currentUser.name
                    }).then(() => {
                        handleSinglePrinterFinish(activePrinter.id);
                    });
                }}
                onCancel={onCancel} // Or back to selection?
                addToast={addToast}
                uploadFile={uploadFile}
            // Custom prop to show progress?
            />

            {/* Overlay progress indicator? */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md z-[60] shadow-2xl flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Progresas</span>
                <div className="flex gap-2">
                    {selectedPrinterIds.map((id, idx) => (
                        <div
                            key={id}
                            className={cn(
                                "w-3 h-3 rounded-full transition-all",
                                idx < activePrinterIndex ? "bg-emerald-500" :
                                    idx === activePrinterIndex ? "bg-white scale-125" : "bg-white/20"
                            )}
                        />
                    ))}
                </div>
                <span className="text-xs font-bold font-mono ml-2">
                    {activePrinterIndex + 1} / {selectedPrinterIds.length}
                </span>
            </div>
        </div>
    );
};
