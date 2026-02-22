import React, { useEffect, useState } from 'react';
import { PrinterData, PrinterStatus, PrinterLog } from '../types';
import { CheckCircle2, XCircle, AlertCircle, Clock, Droplets } from 'lucide-react';
import { usePrinters } from '../contexts/DataContext';

interface MorningBoardProps {
    printers: PrinterData[];
}

export const MorningBoard: React.FC<MorningBoardProps> = ({ printers }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [logs, setLogs] = useState<Record<string, PrinterLog[]>>({});
    const [loading, setLoading] = useState(true);
    const { getShiftLogs } = usePrinters();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchAllLogs = async () => {
            setLoading(true);
            try {
                // Fetch recent logs (could be optimized, but ok for a few printers)
                const allLogs = await getShiftLogs();

                // Group by printer
                const grouped: Record<string, PrinterLog[]> = {};

                // Polyfill-safe iteration
                if (allLogs && Array.isArray(allLogs)) {
                    allLogs.forEach(log => {
                        if (!log) return;
                        if (!grouped[log.printerId]) grouped[log.printerId] = [];
                        grouped[log.printerId].push(log);
                    });
                }

                // Sort and slice top 4 for each
                const pids = Object.keys(grouped);
                for (let i = 0; i < pids.length; i++) {
                    const pid = pids[i];
                    grouped[pid].sort((a, b) => {
                        const tA = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
                        const tB = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
                        return tB - tA;
                    });
                    grouped[pid] = grouped[pid].slice(0, 4);
                }

                setLogs(grouped);
            } catch (err) {
                console.error("Failed to load logs for Lenta", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllLogs();
        // Refresh logs every 5 minutes just in case
        const logsTimer = setInterval(fetchAllLogs, 5 * 60 * 1000);
        return () => clearInterval(logsTimer);
    }, [getShiftLogs]);

    const getStatusColor = (status: PrinterStatus) => {
        switch (status) {
            case PrinterStatus.WORKING: return 'bg-emerald-500/20 text-emerald-400';
            case PrinterStatus.READY_TO_WORK: return 'bg-blue-500/20 text-blue-400';
            case PrinterStatus.IN_PROGRESS: return 'bg-yellow-500/20 text-yellow-400';
            case PrinterStatus.ENDING_SHIFT: return 'bg-purple-500/20 text-purple-400';
            default: return 'bg-slate-800 text-slate-500';
        }
    };

    const sortedPrinters = [...printers].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="fixed inset-0 z-50 h-screen w-screen bg-slate-950 text-white p-6 font-sans flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex justify-between items-center mb-6 bg-slate-900/80 px-8 py-4 rounded-2xl border border-slate-800 shrink-0">
                <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-4">
                    <span className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></span>
                    Gamybos Fakto sekimas
                </h1>
                <div className="flex items-center gap-3 bg-slate-800/80 px-6 py-3 rounded-xl border border-slate-700">
                    <Clock className="w-8 h-8 text-blue-400" />
                    <span className="text-3xl font-mono font-bold tracking-wider">
                        {currentTime.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </header>

            {/* List Table */}
            <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
                {/* Table Header */}
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 bg-slate-900 px-6 py-4 border-b border-slate-800 font-bold uppercase tracking-wider text-sm text-slate-400 shrink-0">
                    <div>Įrenginys & Gyvas Statusas</div>
                    <div className="text-center bg-slate-800/50 rounded-lg py-1">Paskutinė Pamaina (-1)</div>
                    <div className="text-center bg-slate-800/50 rounded-lg py-1">Priešpaskutinė (-2)</div>
                    <div className="text-center bg-slate-800/50 rounded-lg py-1">Ankstesnė (-3)</div>
                    <div className="text-center bg-slate-800/50 rounded-lg py-1">Seniausia (-4)</div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-slate-500 text-xl font-medium">kraunama istorija...</div>
                    ) : (
                        <div className="divide-y divide-slate-800/50">
                            {sortedPrinters.map(printer => {
                                const printerLogs = logs[printer.id] || [];
                                const hasNozzleCheck = !!printer.nozzleFile?.url;

                                return (
                                    <div key={printer.id} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors items-center">

                                        {/* Column 1: Live Status */}
                                        <div className="flex gap-4 items-center">
                                            <div className="flex-1 min-w-0">
                                                <h2 className="text-2xl font-black text-white truncate">{printer.name}</h2>
                                                <div className="flex gap-2 mt-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(printer.status)}`}>
                                                        {printer.status === PrinterStatus.NOT_STARTED ? 'LAUKIA' : printer.status.replace('_', ' ')}
                                                    </span>
                                                    {/* Maintenance Badge */}
                                                    {printer.vit.confirmed ? (
                                                        <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 rounded font-bold uppercase">
                                                            <CheckCircle2 className="w-3 h-3" /> Valymas
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 px-2 rounded font-bold uppercase">
                                                            <XCircle className="w-3 h-3" /> Valymas
                                                        </span>
                                                    )}
                                                    {/* Nozzle Badge */}
                                                    {hasNozzleCheck ? (
                                                        <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 px-2 rounded font-bold uppercase">
                                                            <Droplets className="w-3 h-3" /> Nozzle
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-400 px-2 rounded font-bold uppercase">
                                                            <XCircle className="w-3 h-3" /> Nozzle
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Column 2, 3, 4, 5: Logs (-1, -2, -3, -4) */}
                                        {[0, 1, 2, 3].map(index => {
                                            const log = printerLogs[index];
                                            if (!log) {
                                                return (
                                                    <div key={index} className="h-full bg-slate-800/20 border border-slate-800/50 rounded-xl flex items-center justify-center p-4">
                                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Nėra Data</span>
                                                    </div>
                                                );
                                            }

                                            // Formatting the log
                                            const dateObj = new Date(log.finishedAt);
                                            const dateString = dateObj.toLocaleDateString('lt-LT', { month: 'short', day: 'numeric' });
                                            const shiftColor = log.shift === 'Dieninė' ? 'text-amber-400' : 'text-blue-400';

                                            return (
                                                <div key={index} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 flex flex-col justify-between">
                                                    <div className="flex justify-between items-start mb-2 border-b border-slate-700/50 pb-2">
                                                        <span className="text-xs text-slate-400 font-medium">{dateString}</span>
                                                        <span className={`text-[10px] font-black uppercase tracking-wider bg-slate-900/50 px-2 py-0.5 rounded ${shiftColor}`}>
                                                            {log.shift}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 text-center">
                                                        <div>
                                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Pagam.</div>
                                                            <div className="text-lg font-black text-emerald-400">{log.productionAmount}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Brokas</div>
                                                            <div className="text-lg font-black text-red-400">{log.defectsAmount}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Liko</div>
                                                            <div className="text-lg font-black text-slate-300">
                                                                {log.remainingAmount !== undefined && log.remainingAmount !== null ? log.remainingAmount : '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
