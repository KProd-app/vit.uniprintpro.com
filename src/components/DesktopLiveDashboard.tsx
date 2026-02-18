import React, { useEffect, useState } from 'react';
import { PrinterData, PrinterStatus } from '../types';
import { CheckCircle2, XCircle, AlertCircle, Clock, Droplets, Box, ShieldAlert, LayoutGrid } from 'lucide-react';

interface LiveDashboardProps {
    printers: PrinterData[];
}

export const DesktopLiveDashboard: React.FC<LiveDashboardProps> = ({ printers }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getStatusColor = (status: PrinterStatus) => {
        switch (status) {
            case PrinterStatus.WORKING: return 'bg-emerald-50 border-emerald-200 text-emerald-700';
            case PrinterStatus.READY_TO_WORK: return 'bg-blue-50 border-blue-200 text-blue-700';
            case PrinterStatus.IN_PROGRESS: return 'bg-yellow-50 border-yellow-200 text-yellow-700';
            case PrinterStatus.ENDING_SHIFT: return 'bg-purple-50 border-purple-200 text-purple-700';
            default: return 'bg-white border-slate-200 text-slate-500';
        }
    };

    const sortedPrinters = [...printers].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <LayoutGrid className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                        Gamybos Skydas <span className="text-slate-400 font-medium ml-2 text-lg normal-case tracking-normal">Desktop</span>
                    </h1>
                </div>
                <div className="bg-slate-50 px-6 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-2xl font-mono font-bold text-slate-700">
                        {currentTime.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </header>

            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedPrinters.map(printer => {
                        const hasNozzleCheck = !!printer.nozzleFile?.url;
                        const statusStyle = getStatusColor(printer.status);

                        return (
                            <div
                                key={printer.id}
                                className={`relative rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg ${statusStyle}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight mb-1">{printer.name}</h2>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${params => {
                                                // Simple status dot
                                                switch (printer.status) {
                                                    case PrinterStatus.WORKING: return 'bg-emerald-500';
                                                    case PrinterStatus.READY_TO_WORK: return 'bg-blue-500';
                                                    case PrinterStatus.IN_PROGRESS: return 'bg-yellow-500';
                                                    default: return 'bg-slate-400';
                                                }
                                            }}`}></div>
                                            <p className="text-sm font-semibold uppercase tracking-wide opacity-70">
                                                {printer.operatorName || 'Nėra operatoriaus'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white/50 backdrop-blur-sm px-3 py-1 rounded-lg border text-xs font-black uppercase tracking-wider">
                                        {printer.status === PrinterStatus.NOT_STARTED ? 'LAUKIA' : printer.status}
                                    </div>
                                </div>

                                {/* Status Indicators */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {/* Maintenance */}
                                    <div className="flex items-center gap-3 bg-white/60 p-3 rounded-xl border border-black/5">
                                        {printer.vit.confirmed
                                            ? <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                            : (Object.keys(printer.vit.checklist).length > 0
                                                ? <AlertCircle className="w-8 h-8 text-yellow-500" />
                                                : <XCircle className="w-8 h-8 text-red-500" />)
                                        }
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase text-slate-400 leading-tight">Valymas</span>
                                            <span className="text-sm font-bold leading-tight">
                                                {printer.vit.confirmed ? 'ATLIKTA' : (Object.keys(printer.vit.checklist).length > 0 ? 'VYKDOMA' : 'NEATLIKTA')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Nozzle */}
                                    <div className="flex items-center gap-3 bg-white/60 p-3 rounded-xl border border-black/5 relative group">
                                        <Droplets className={`w-8 h-8 ${hasNozzleCheck ? 'text-blue-500' : 'text-red-500'}`} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase text-slate-400 leading-tight">Nozzle</span>
                                            <span className={`text-sm font-bold leading-tight ${hasNozzleCheck ? 'underline decoration-dotted cursor-help' : ''}`}>
                                                {hasNozzleCheck ? 'ATLIKTA' : 'NEATLIKTA'}
                                            </span>
                                        </div>
                                        {hasNozzleCheck && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white p-1 rounded-lg shadow-xl border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                <img src={printer.nozzleFile!.url} alt="Nozzle" className="w-full rounded" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col justify-center text-center shadow-sm">
                                        <span className="text-[10px] font-bold uppercase opacity-50 mb-1">Pagaminta</span>
                                        <span className="text-3xl font-black leading-none">{printer.productionAmount || 0}</span>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-center text-center shadow-sm">
                                        <span className="text-[10px] font-bold uppercase text-blue-500 mb-1">Liko</span>
                                        <span className="text-3xl font-black text-blue-600 leading-none">{printer.remainingAmount || 0}</span>
                                    </div>
                                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-center text-center shadow-sm">
                                        <span className="text-[10px] font-bold uppercase text-red-500 mb-1">Brokas</span>
                                        <span className={`text-3xl font-black leading-none ${printer.productionAmount && ((printer.defectsAmount || 0) / printer.productionAmount * 100) > 5
                                                ? 'text-red-600'
                                                : 'text-emerald-600'
                                            }`}>
                                            {printer.productionAmount ? (
                                                ((printer.defectsAmount || 0) / (printer.productionAmount || 1) * 100).toFixed(1) + '%'
                                            ) : (
                                                (printer.defectsAmount || 0)
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
