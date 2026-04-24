import React, { useState, useEffect, useMemo } from 'react';
import { PrinterLog } from '../types';
import { usePrinters } from '../contexts/DataContext';
import { getVilniusShiftBoundaries } from '../lib/utils';
import { Edit, Trash2, X, Search, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Factory, Package, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface AdminJournalTabProps {
  isSuperUser: boolean;
  addToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminJournalTab: React.FC<AdminJournalTabProps> = ({ isSuperUser, addToast }) => {
  const { getShiftLogs, updateShiftLog, deleteShiftLog } = usePrinters();
  
  const [logs, setLogs] = useState<PrinterLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  
  const [shiftFilter, setShiftFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState<string>(getVilniusShiftBoundaries().logicalDateString);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [deletingLog, setDeletingLog] = useState<PrinterLog | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    setLoadingLogs(true);
    getShiftLogs({
      shift: shiftFilter === 'All' ? undefined : shiftFilter,
      date: dateFilter || undefined
    }).then(data => {
      setLogs(data);
      setLoadingLogs(false);
    });
  }, [getShiftLogs, shiftFilter, dateFilter]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const lowerQ = searchQuery.toLowerCase();
    return logs.filter(log => 
      log.printerName.toLowerCase().includes(lowerQ) || 
      (log.operatorName && log.operatorName.toLowerCase().includes(lowerQ)) ||
      (log.defectsReason && log.defectsReason.toLowerCase().includes(lowerQ))
    );
  }, [logs, searchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    let totalProd = 0;
    let totalDefects = 0;
    let totalRobot = 0;
    let totalPrint = 0;
    let totalGlue = 0;
    let recordsWithAlerts = 0;
    
    filteredLogs.forEach(log => {
      const isPackaging = log.printerName.toLowerCase().includes('pakavimas');
      
      if (isPackaging) {
        totalRobot += Number(log.robotDefects || 0);
        totalPrint += Number(log.printingDefects || 0);
        totalGlue += Number(log.glueDefects || 0);
      } else {
        const prod = Number(log.productionAmount || 0);
        const def = Number(log.defectsAmount || 0);
        totalProd += prod;
        totalDefects += def;
        
        if (prod > 0 && (def / prod) > 0.05) {
          recordsWithAlerts++;
        }
      }
    });

    const defectRate = totalProd > 0 ? ((totalDefects / totalProd) * 100).toFixed(1) : '0.0';
    
    return { totalProd, totalDefects, defectRate, totalRobot, totalPrint, totalGlue, recordsWithAlerts };
  }, [filteredLogs]);

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Viso Pagaminta</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalProd.toLocaleString('lt-LT')}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Viso Brokuota</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalDefects.toLocaleString('lt-LT')}</p>
            <p className="text-xs font-bold text-red-500">{stats.defectRate}% nuo bendro kiekio</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roboto / Spaudos / Klijų</p>
            <p className="text-xl font-black text-slate-800">
              <span className="text-amber-600">{stats.totalRobot}</span> / <span className="text-red-500">{stats.totalPrint}</span> / <span className="text-yellow-600">{stats.totalGlue}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kritiniai Įrašai</p>
            <p className="text-2xl font-black text-slate-800">{stats.recordsWithAlerts}</p>
            <p className="text-xs font-medium text-slate-500">&gt;5% broko lygis</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header & Filters */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gamybos Žurnalas</h3>
            <p className="text-slate-500 text-sm font-medium mt-1">Rasta įrašų: {filteredLogs.length}</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center w-full xl:w-auto">
            {/* SEARCH */}
            <div className="relative flex-grow xl:flex-grow-0 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Ieškoti operatoriaus, įrenginio..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-mimaki-blue focus:border-mimaki-blue block pl-10 p-2.5 font-bold"
              />
            </div>

            {/* DATE FILTER */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-mimaki-blue focus:border-mimaki-blue block p-2.5 font-bold uppercase min-w-[140px]"
            />

            {/* SHIFT FILTER */}
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-mimaki-blue focus:border-mimaki-blue block p-2.5 font-bold uppercase min-w-[130px]"
            >
              <option value="All">Visos</option>
              <option value="Dieninė">Dieninė (06-18)</option>
              <option value="Naktinė">Naktinė (18-06)</option>
            </select>
          </div>
        </div>

        {/* Data List (Cards) */}
        <div className="p-6 md:p-8 bg-slate-50 flex-1 min-h-[400px]">
          {loadingLogs ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-8 h-8 border-4 border-mimaki-blue border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-bold uppercase tracking-widest text-sm">Kraunama duomenų bazė...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
              <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
              <p className="font-bold uppercase tracking-widest text-sm text-slate-500">Duomenų pagal jūsų filtrus nerasta</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map(log => {
                const isPackaging = log.printerName.toLowerCase().includes('pakavimas');
                const prod = Number(log.productionAmount || 0);
                const def = Number(log.defectsAmount || 0);
                const isHighDefect = !isPackaging && prod > 0 && (def / prod) > 0.05;
                const isExpanded = expandedLogId === log.id;

                return (
                  <div key={log.id} className={`bg-white rounded-3xl border transition-all duration-200 ${isHighDefect ? 'border-red-200 shadow-sm shadow-red-100' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
                    {/* Compact View Row */}
                    <div className="p-5 flex flex-col lg:flex-row gap-4 items-center justify-between cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                      
                      {/* 1. Meta (Time & Operator & Printer) */}
                      <div className="flex items-center gap-4 w-full lg:w-4/12">
                        <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-xs ${log.shift === 'Dieninė' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {log.shift === 'Dieninė' ? 'DIENA' : 'NAKTIS'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-800 text-lg truncate uppercase tracking-tight" title={log.printerName}>{log.printerName}</h4>
                          <p className="text-sm font-medium text-slate-500 truncate">{log.operatorName}</p>
                        </div>
                      </div>

                      {/* 2. Core Stats (Production/Defects) */}
                      <div className="flex items-center gap-6 w-full lg:w-4/12 justify-start lg:justify-center">
                        {isPackaging ? (
                          <div className="flex gap-4">
                            <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Robotas</p>
                              <p className="font-black text-amber-700 text-lg">{log.robotDefects || 0}</p>
                            </div>
                            <div className="bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Spauda</p>
                              <p className="font-black text-red-700 text-lg">{log.printingDefects || 0}</p>
                            </div>
                            <div className="bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100">
                              <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Klijai</p>
                              <p className="font-black text-yellow-700 text-lg">{log.glueDefects || 0}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-4">
                            <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 min-w-[80px]">
                              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Gamyba</p>
                              <p className="font-black text-emerald-700 text-lg">{prod}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-xl border min-w-[80px] ${isHighDefect ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                              <p className={`text-[9px] font-black uppercase tracking-widest ${isHighDefect ? 'text-red-500' : 'text-slate-400'}`}>Brokas</p>
                              <p className={`font-black text-lg flex items-baseline gap-1 ${isHighDefect ? 'text-red-700' : 'text-slate-700'}`}>
                                {def}
                                <span className="text-xs font-bold text-slate-400">
                                  {prod > 0 ? `(${((def / prod) * 100).toFixed(1)}%)` : ''}
                                </span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Badges & Status */}
                      <div className="flex items-center gap-3 w-full lg:w-3/12 justify-start lg:justify-end">
                        {/* VIT Status */}
                        {log.vitData?.confirmed ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" /> VIT OK
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
                            VIT -
                          </div>
                        )}
                        
                        {/* High Defect Reason Badge */}
                        {isHighDefect && log.defectsReason && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold uppercase truncate max-w-[120px]" title={log.defectsReason}>
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {log.defectsReason}
                          </div>
                        )}

                        <Button variant="ghost" size="sm" className="p-2 h-auto rounded-xl text-slate-400 hover:text-mimaki-blue hover:bg-blue-50 ml-auto lg:ml-0" onClick={(e) => { e.stopPropagation(); setExpandedLogId(isExpanded ? null : log.id); }}>
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </Button>
                      </div>

                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 p-6 bg-slate-50/50 rounded-b-3xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        
                        {/* Details Col 1 */}
                        <div className="space-y-4">
                          <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">Papildomi Rodikliai</h5>
                          
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex align-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase">Atsilikimas:</span>
                            <span className="font-black text-orange-600 text-sm">{log.backlog || 0}</span>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex align-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase">Liko gaminti:</span>
                            <span className="font-black text-blue-600 text-sm">{log.remainingAmount || 0}</span>
                          </div>
                          {log.defectsReason && (
                            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 shadow-sm">
                              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-1">Broko Priežastis (-ys)</span>
                              <span className="font-medium text-red-800 text-sm">{log.defectsReason}</span>
                            </div>
                          )}
                        </div>

                        {/* Col 2 - Visuals & Media */}
                        <div className="space-y-4">
                          <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">Nozzle Patikra & Failai</h5>
                          
                          <div className="flex flex-wrap gap-2">
                            {log.nozzleData?.url ? (
                              <img
                                src={log.nozzleData.url}
                                className="w-16 h-16 object-cover rounded-xl border-2 border-slate-200 cursor-zoom-in hover:border-mimaki-blue transition-colors"
                                onClick={() => setSelectedImg(log.nozzleData.url!)}
                                alt="Nozzle"
                              />
                            ) : log.nozzleData?.mimakiFiles ? (
                              Object.entries(log.nozzleData.mimakiFiles).map(([unit, file]: any) => (
                                <img
                                  key={unit}
                                  src={file.url}
                                  className="w-16 h-16 object-cover rounded-xl border-2 border-slate-200 cursor-zoom-in hover:border-mimaki-blue transition-colors"
                                  onClick={() => setSelectedImg(file.url)}
                                  alt={`Nozzle ${unit}`}
                                  title={`Blokas ${unit}`}
                                />
                              ))
                            ) : (
                              <div className="bg-slate-100 text-slate-400 text-xs font-medium p-4 rounded-xl w-full text-center border border-dashed border-slate-300">
                                Nozzle nuotraukų nėra
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Col 3 - Timestamps & Admin Actions */}
                        <div className="space-y-4">
                          <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-2">Pamainos Laikai & Veiksmai</h5>
                          
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-400 uppercase">Pradžia:</span>
                              <span className="font-mono text-slate-700">{log.startedAt ? new Date(log.startedAt).toLocaleTimeString('lt-LT') : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-400 uppercase">Pabaiga:</span>
                              <span className="font-mono text-slate-700">{log.finishedAt ? new Date(log.finishedAt).toLocaleTimeString('lt-LT') : '-'}</span>
                            </div>
                          </div>

                          {isSuperUser && (
                            <div className="flex gap-2 mt-4">
                              <Button 
                                onClick={() => setEditingLog(log)} 
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold uppercase text-xs"
                              >
                                <Edit className="w-4 h-4 mr-2" /> Redaguoti
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => setDeletingLog(log)} 
                                className="shrink-0 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl py-3 px-4"
                                title="Ištrinti įrašą"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {editingLog && isSuperUser && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[32px] shadow-2xl max-w-lg w-full">
            <h2 className="text-2xl font-black text-slate-800 uppercase mb-6">Redaguoti Įrašą</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pagaminta</label>
                <input 
                  type="number" 
                  value={editingLog.productionAmount || ''} 
                  onChange={e => setEditingLog({...editingLog, productionAmount: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Brokas</label>
                <input 
                  type="number" 
                  value={editingLog.defectsAmount || ''} 
                  onChange={e => setEditingLog({...editingLog, defectsAmount: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Atsilikimas</label>
                <input 
                  type="number" 
                  value={editingLog.backlog || ''} 
                  onChange={e => setEditingLog({...editingLog, backlog: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="outline" onClick={() => setEditingLog(null)} className="rounded-xl px-6">Atšaukti</Button>
              <Button 
                className="bg-mimaki-blue text-white rounded-xl px-8"
                onClick={async () => {
                  try {
                    await updateShiftLog(editingLog.id, {
                      productionAmount: Number(editingLog.productionAmount) || 0,
                      defectsAmount: Number(editingLog.defectsAmount) || 0,
                      remainingAmount: Number(editingLog.remainingAmount) || 0,
                      backlog: Number(editingLog.backlog) || 0,
                    });
                    
                    // Optimistic update locally
                    setLogs(prevLogs => prevLogs.map(l => l.id === editingLog.id ? {...l, 
                      productionAmount: Number(editingLog.productionAmount) || 0,
                      defectsAmount: Number(editingLog.defectsAmount) || 0,
                      remainingAmount: Number(editingLog.remainingAmount) || 0,
                      backlog: Number(editingLog.backlog) || 0,
                    } : l));
                    
                    setEditingLog(null);
                    addToast?.("Įrašas sėkmingai atnaujintas!", "success");
                  } catch (err: any) {
                    addToast?.("Nepavyko atnaujinti: " + err.message, "error");
                  }
                }}
              >
                Išsaugoti
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Overlay */}
      {deletingLog && isSuperUser && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase mb-2">Ištrinti įrašą?</h2>
            <p className="text-sm text-slate-500 font-medium mb-8">
              Ar tikrai norite negrįžtamai ištrinti šį gamybos žurnalo įrašą (<span className="font-bold text-slate-700">{deletingLog.printerName}</span> - pamainos pabaiga: <span className="font-bold text-slate-700">{deletingLog.finishedAt ? new Date(deletingLog.finishedAt).toLocaleDateString('lt-LT') : '-'}</span>)?
            </p>
            
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setDeletingLog(null)} className="rounded-xl px-6">Atšaukti</Button>
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-8 shadow-sm shadow-red-200"
                onClick={async () => {
                  try {
                    await deleteShiftLog(deletingLog.id);
                    setLogs(prev => prev.filter(l => l.id !== deletingLog.id));
                    setDeletingLog(null);
                    addToast?.("Įrašas sėkmingai ištrintas!", "success");
                  } catch (err: any) {
                    addToast?.("Nepavyko ištrinti: " + err.message, "error");
                  }
                }}
              >
                Taip, Ištrinti
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImg && (
        <div
          className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setSelectedImg(null)}
        >
          <img
            src={selectedImg}
            alt="Enlarged Nozzle Check"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-10 h-10" />
          </button>
        </div>
      )}
    </div>
  );
};
