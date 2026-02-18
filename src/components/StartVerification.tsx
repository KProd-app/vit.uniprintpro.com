import React, { useState } from 'react';
import { PrinterData, User } from '../types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Check, X, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StartVerificationProps {
    printer: PrinterData;
    currentUser: User;
    onConfirm: (remainingAmount: number) => void;
    onCancel: () => void;
}

export const StartVerification: React.FC<StartVerificationProps> = ({ printer, currentUser, onConfirm, onCancel }) => {
    const [remainingAmount, setRemainingAmount] = useState<string>(printer.remainingAmount?.toString() || '0');

    const handleConfirm = () => {
        const val = parseFloat(remainingAmount);
        if (isNaN(val) || val < 0) {
            // Ideally should show a toast here, but simple alert for now if toast prop not available
            alert("Įveskite korektišką kiekį!");
            return;
        }
        onConfirm(val);
    };

    return (
        <div className="min-h-screen bg-mimaki-dark/95 backdrop-blur-xl flex items-center justify-center p-0 md:p-6 z-[100] animate-in fade-in duration-300 fixed inset-0">
            <Card className="w-full max-w-3xl border-0 shadow-none md:shadow-2xl flex flex-col h-full min-h-screen md:min-h-0 md:max-h-[90vh] bg-white rounded-none md:rounded-[3rem] overflow-hidden">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center flex-shrink-0 bg-white/50 backdrop-blur-md">
                    <div>
                        <h2 className="text-3xl font-black text-mimaki-dark tracking-tighter uppercase relative">
                            Pamainos Perėmimas
                            <div className="absolute -bottom-2 left-0 w-12 h-1 bg-mimaki-blue rounded-full"></div>
                        </h2>
                        <p className="text-mimaki-blue font-black uppercase text-[10px] tracking-[0.2em] mt-3">
                            {printer.name} • {currentUser.name}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-2xl h-12 w-12 hover:bg-slate-100">
                        <X className="w-8 h-8 text-slate-400" />
                    </Button>
                </div>

                <div className="p-10 overflow-y-auto space-y-10 flex-1">
                    {/* Previous Operator Message */}
                    {printer.nextOperatorMessage ? (
                        <div className="bg-amber-50/50 rounded-[3rem] p-10 border border-amber-100 relative overflow-hidden shadow-inner">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <MessageSquare className="w-32 h-32 text-amber-500" />
                            </div>
                            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-6 flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                Žinutė nuo ankstesnės pamainos
                            </h3>
                            <p className="text-2xl font-bold text-amber-900 leading-relaxed italic relative z-10">
                                "{printer.nextOperatorMessage}"
                            </p>
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100 text-center flex flex-col items-center justify-center h-48">
                            <div className="p-4 bg-slate-100 rounded-2xl mb-4">
                                <MessageSquare className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-wide">Nėra paliktų žinučių</p>
                        </div>
                    )}

                    {/* Remaining Amount Confirmation */}
                    <div className="bg-blue-50/50 rounded-[3rem] p-10 border border-blue-100 flex flex-col items-center text-center shadow-inner relative overflow-hidden group focus-within:ring-4 focus-within:ring-blue-500/20 transition-all">
                        <div className="absolute top-0 left-0 p-8 opacity-5">
                            <Clock className="w-32 h-32 text-blue-500" />
                        </div>
                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-8 flex items-center gap-3 relative z-10">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Clock className="w-4 h-4" />
                            </div>
                            Liko gaminti (Patvirtinkite arba Pataisykite)
                        </h3>

                        <div className="relative w-full max-w-sm mx-auto z-10">
                            <input
                                type="number"
                                value={remainingAmount}
                                onChange={(e) => setRemainingAmount(e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="w-full bg-white border-2 border-blue-100 p-8 rounded-[2.5rem] font-black text-7xl text-blue-900 focus:ring-0 outline-none text-center transition-all focus:border-blue-400 shadow-xl shadow-blue-900/5 placeholder-blue-200"
                                placeholder="0"
                            />
                            <p className="text-blue-400 text-xs font-black uppercase tracking-widest mt-6">vnt. / m²</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-10 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row gap-4 md:gap-0 md:space-x-4 flex-shrink-0">
                    <Button
                        size="lg"
                        onClick={handleConfirm}
                        className="w-full md:flex-[2] uppercase tracking-widest font-black text-lg md:text-xl bg-mimaki-dark hover:bg-slate-800 shadow-xl md:shadow-2xl shadow-mimaki-dark/30 rounded-2xl md:rounded-3xl h-16 md:h-20 transition-all active:scale-95 flex items-center justify-center gap-3 order-1 md:order-2"
                    >
                        <Check className="w-6 h-6 md:w-7 md:h-7" />
                        <div>
                            <span className="block leading-none">PATVIRTINTI</span>
                            <span className="text-[9px] md:text-[10px] font-bold opacity-50 tracking-widest font-mono">IR PRADĖTI DARBĄ</span>
                        </div>
                        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 opacity-50" />
                    </Button>
                    <Button variant="outline" size="lg" onClick={onCancel} className="w-full md:flex-1 uppercase tracking-widest text-slate-400 rounded-2xl md:rounded-3xl h-14 md:h-20 text-sm md:text-lg border-2 hover:bg-slate-100 hover:text-slate-600 order-2 md:order-1">
                        Atšaukti
                    </Button>
                </div>
            </Card>
        </div>
    );
};
