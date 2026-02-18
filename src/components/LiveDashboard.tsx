import React, { useEffect, useState } from 'react';
import { PrinterData, PrinterStatus } from '../types';
import { CheckCircle2, XCircle, AlertCircle, Clock, Droplets, Box, ShieldAlert } from 'lucide-react';

interface LiveDashboardProps {
    printers: PrinterData[];
}

export const LiveDashboard: React.FC<LiveDashboardProps> = ({ printers }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getStatusColor = (status: PrinterStatus) => {
        switch (status) {
            case PrinterStatus.WORKING: return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
            case PrinterStatus.READY_TO_WORK: return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
            case PrinterStatus.IN_PROGRESS: return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
            case PrinterStatus.ENDING_SHIFT: return 'bg-purple-500/20 border-purple-500/50 text-purple-400';
            default: return 'bg-slate-800 border-slate-700 text-slate-500';
        }
    };

    const sortedPrinters = [...printers].sort((a, b) => a.name.localeCompare(b.name));
    const count = sortedPrinters.length;

    // Calculate grid layout - aim for slight rectangle landscape cards
    // If 1-3: 1 row
    // If 4-8: 2 rows
    // If 9-12: 3 rows
    // If 13+: 4 rows
    let cols = 1;
    if (count <= 3) cols = count;
    else if (count <= 4) cols = 2; // 2x2
    else if (count <= 6) cols = 3; // 3x2
    else if (count <= 8) cols = 4; // 4x2
    else if (count <= 12) cols = 4; // 4x3
    else cols = 5;

    return (
        <div style={{ backgroundColor: '#020617' }} className="fixed inset-0 z-50 h-screen w-screen bg-slate-950 text-white p-4 font-sans flex flex-col overflow-hidden">
            {/* Header - Compact */}
            <header className="flex justify-between items-center mb-4 bg-slate-900/50 px-6 py-3 rounded-2xl border border-slate-800 backdrop-blur-xl shrink-0">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-blue-400 uppercase">
                        Gamybos Skydas
                    </h1>
                </div>
                <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
                    <Clock className="w-6 h-6 text-blue-400" />
                    <span className="text-2xl font-mono font-bold tracking-wider">
                        {currentTime.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </header>

            {/* Grid - Auto Fit Remaining Space */}
            <div
                className="grid gap-4 flex-1 min-h-0"
                style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    gridAutoRows: 'minmax(0, 1fr)'
                }}
            >
                {sortedPrinters.map(printer => {
                    const hasNozzleCheck = !!printer.nozzleFile?.url;
                    const statusStyle = getStatusColor(printer.status);

                    return (
                        <div
                            key={printer.id}
                            className={`relative overflow-hidden rounded-2xl border flex flex-col justify-between p-4 transition-all duration-500 ${statusStyle} bg-slate-900/80 backdrop-blur-sm`}
                        >
                            {/* Card Header: Name + Status */}
                            <div className="flex justify-between items-start mb-2 shrink-0">
                                <div className="min-w-0">
                                    <h2 className="text-2xl font-bold text-white tracking-tight truncate">{printer.name}</h2>
                                    <p className="text-base opacity-80 flex items-center gap-2 truncate">
                                        {(printer.operatorName || printer.vit.signature) ? (
                                            <span className="font-medium text-white truncate">
                                                {printer.operatorName || printer.vit.signature}
                                            </span>
                                        ) : (
                                            <span className="italic opacity-50">Nėra operatoriaus</span>
                                        )}
                                    </p>
                                </div>
                                <div className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ml-2 ${statusStyle}`}>
                                    {printer.status === PrinterStatus.NOT_STARTED ? 'LAUKIA' : printer.status}
                                </div>
                            </div>

                            {/* Metrics Rows - Using Flex to distribute vertical space */}
                            <div className="flex flex-col gap-2 flex-1 min-h-0 justify-center">
                                {/* Row 1: Maintenance + Nozzle */}
                                <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
                                    {/* Maintenance Status */}
                                    <div className={`p-3 rounded-xl border flex flex-col justify-center items-center text-center ${printer.vit.confirmed
                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                        : (Object.keys(printer.vit.checklist).length > 0
                                            ? 'bg-yellow-500/10 border-yellow-500/30'
                                            : 'bg-red-500/10 border-red-500/30')
                                        }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            {printer.vit.confirmed
                                                ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                : (Object.keys(printer.vit.checklist).length > 0
                                                    ? <AlertCircle className="w-5 h-5 text-yellow-400" />
                                                    : <XCircle className="w-5 h-5 text-red-400" />)
                                            }
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Valymas</span>
                                        </div>
                                        <span className={`text-lg font-bold leading-none ${printer.vit.confirmed
                                            ? 'text-emerald-300'
                                            : (Object.keys(printer.vit.checklist).length > 0
                                                ? 'text-yellow-300'
                                                : 'text-red-300')
                                            }`}>
                                            {printer.vit.confirmed
                                                ? 'ATLIKTA'
                                                : (Object.keys(printer.vit.checklist).length > 0
                                                    ? 'VYKDOMAS'
                                                    : 'NEATLIKTA')
                                            }
                                        </span>
                                    </div>

                                    {/* Nozzle Check */}
                                    <div className={`p-3 rounded-xl border flex flex-col justify-center items-center text-center ${hasNozzleCheck ? 'bg-blue-500/10 border-blue-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Droplets className={`w-5 h-5 ${hasNozzleCheck ? 'text-blue-400' : 'text-red-400'}`} />
                                            <span className="text-[10px] font-bold uppercase text-slate-400">Nozzle</span>
                                        </div>
                                        {hasNozzleCheck ? (
                                            <div className="relative group cursor-pointer">
                                                <span className="text-lg font-bold text-blue-300 underline decoration-dotted leading-none">ATLIKTAS</span>
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 w-64 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                                    <img src={printer.nozzleFile!.url} alt="Nozzle" className="w-full h-auto object-cover bg-black" />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-lg font-bold text-red-300 leading-none">NEATLIKTAS</span>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Production + Remaining + Defects */}
                                <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
                                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                                            <Box className="w-5 h-5" />
                                            <span className="text-[10px] font-bold uppercase">Pagaminta</span>
                                        </div>
                                        <span className="text-3xl font-black text-white leading-none">{printer.productionAmount || 0}</span>
                                    </div>

                                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center">
                                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                                            <Clock className="w-5 h-5" />
                                            <span className="text-[10px] font-bold uppercase">Liko</span>
                                        </div>
                                        <span className="text-3xl font-black text-blue-400 leading-none">{printer.remainingAmount || 0}</span>
                                    </div>

                                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center">
                                        <div className="flex items-center gap-2 text-red-400 mb-1">
                                            <ShieldAlert className="w-5 h-5" />
                                            <span className="text-[10px] font-bold uppercase">Brokas</span>
                                        </div>
                                        <span className={`text-3xl font-black leading-none ${printer.productionAmount && ((printer.defectsAmount || 0) / printer.productionAmount * 100) > 5
                                                ? 'text-red-500'
                                                : 'text-emerald-500'
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
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
