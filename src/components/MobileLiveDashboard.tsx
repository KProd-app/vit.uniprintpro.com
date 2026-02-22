import React, { useEffect, useState } from 'react';
import { PrinterData, PrinterStatus } from '../types';
import { CheckCircle2, XCircle, AlertCircle, Clock, Droplets, Box, ShieldAlert, MonitorPlay } from 'lucide-react';

interface LiveDashboardProps {
    printers: PrinterData[];
}

export const MobileLiveDashboard: React.FC<LiveDashboardProps> = ({ printers }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getStatusColor = (status: PrinterStatus) => {
        switch (status) {
            case PrinterStatus.WORKING: return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600';
            case PrinterStatus.READY_TO_WORK: return 'bg-blue-500/10 border-blue-500/30 text-blue-600';
            case PrinterStatus.IN_PROGRESS: return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600';
            case PrinterStatus.ENDING_SHIFT: return 'bg-purple-500/10 border-purple-500/30 text-purple-600';
            default: return 'bg-slate-50 border-slate-200 text-slate-500';
        }
    };

    const sortedPrinters = [...printers].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <MonitorPlay className="w-5 h-5 text-blue-600" />
                    <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                        Gamyba
                    </h1>
                </div>
                <div className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                    <span className="text-sm font-mono font-bold text-slate-600">
                        {currentTime.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </header>

            {/* List */}
            <div className="p-4 space-y-4">
                {sortedPrinters.map(printer => {
                    const hasNozzleCheck = !!printer.nozzleFile?.url;
                    const statusStyle = getStatusColor(printer.status);

                    return (
                        <div
                            key={printer.id}
                            className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${statusStyle} bg-white shadow-sm`}
                        >
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-1">{printer.name}</h2>
                                    <p className="text-xs font-medium uppercase tracking-wider opacity-60">
                                        {printer.operatorName || 'Nėra operatoriaus'}
                                    </p>
                                </div>
                                <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ml-2 bg-white/50 backdrop-blur-sm`}>
                                    {printer.status === PrinterStatus.NOT_STARTED ? 'LAUKIA' : printer.status}
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                {/* Maintenance */}
                                <div className={`p-2 rounded-xl border flex flex-col justify-center items-center text-center bg-white/50`}>
                                    <div className="flex items-center gap-1 mb-1">
                                        {printer.vit.confirmed
                                            ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            : (Object.keys(printer.vit.checklist).length > 0
                                                ? <AlertCircle className="w-3 h-3 text-yellow-500" />
                                                : <XCircle className="w-3 h-3 text-red-500" />)
                                        }
                                        <span className="text-[9px] font-bold uppercase text-slate-400">Valymas</span>
                                    </div>
                                    <span className={`text-xs font-black ${printer.vit.confirmed
                                        ? 'text-emerald-600'
                                        : (Object.keys(printer.vit.checklist).length > 0
                                            ? 'text-yellow-600'
                                            : 'text-red-500')
                                        }`}>
                                        {printer.vit.confirmed ? 'ATLIKTA' : (Object.keys(printer.vit.checklist).length > 0 ? 'VYKDOMA' : 'NEATLIKTA')}
                                    </span>
                                </div>

                                {/* Nozzle */}
                                <div
                                    className={`p-2 rounded-xl border flex flex-col justify-center items-center text-center ${hasNozzleCheck ? 'bg-blue-50/50 cursor-pointer hover:bg-blue-100' : 'bg-white/50'}`}
                                    onClick={() => {
                                        if (hasNozzleCheck) setSelectedImage(printer.nozzleFile!.url);
                                    }}
                                >
                                    <div className="flex items-center gap-1 mb-1">
                                        <Droplets className={`w-3 h-3 ${hasNozzleCheck ? 'text-blue-500' : 'text-red-500'}`} />
                                        <span className="text-[9px] font-bold uppercase text-slate-400">Nozzle</span>
                                    </div>
                                    <span className={`text-xs font-black ${hasNozzleCheck ? 'text-blue-600 underline decoration-dotted' : 'text-red-500'}`}>
                                        {hasNozzleCheck ? 'ATLIKTA' : 'NEATLIKTA'}
                                    </span>
                                </div>
                            </div>

                            {/* Counts Row */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-900 p-2 rounded-xl flex flex-col items-center justify-center text-center">
                                    <span className="text-[9px] font-bold uppercase text-slate-400 mb-0.5">Pagaminta</span>
                                    <span className="text-xl font-black text-white leading-none">{printer.productionAmount || 0}</span>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl flex flex-col items-center justify-center text-center">
                                    <span className="text-[9px] font-bold uppercase text-blue-400 mb-0.5">Liko</span>
                                    <span className="text-xl font-black text-blue-600 leading-none">{printer.remainingAmount || 0}</span>
                                </div>
                                <div className="bg-red-50 border border-red-100 p-2 rounded-xl flex flex-col items-center justify-center text-center">
                                    <span className="text-[9px] font-bold uppercase text-red-400 mb-0.5">Brokas</span>
                                    <span className={`text-xl font-black leading-none ${printer.productionAmount && ((printer.defectsAmount || 0) / printer.productionAmount * 100) > 5
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

            {/* Fullscreen Image Modal for Mobile */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative w-full h-full flex items-center justify-center">
                        <button
                            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-lg transition-colors z-[110]"
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                        >
                            <XCircle className="w-8 h-8" />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Ekrano nuotrauka išdidinta"
                            className="w-full h-auto max-h-[90vh] object-contain rounded-xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
