import { PrinterData, PrinterStatus, ChecklistTemplate, User, Feedback, UserRole } from '../types';
import React, { useState, useEffect } from 'react';
import { usePrinters } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { ChecklistEditor } from './ChecklistEditor';
import { StationEditor } from './StationEditor';
import { getVilniusShiftBoundaries } from '../lib/utils';
import { InstructionGenerator } from './InstructionGenerator';
import { AdminTVPanel } from './AdminTVPanel';
import { TransfersJournal } from './TransfersJournal';
import { Button } from './ui/button';
import { Plus, Settings, Printer, Users, Trash2, Edit, RotateCcw, MessageSquare, ExternalLink, X, QrCode, Monitor, Truck, BookOpen } from 'lucide-react';
import { AdminInstructions } from './AdminInstructions';

// ... (existing code)

interface AdminViewProps {
  printers: PrinterData[];
  onBack: () => void;
  addToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ printers, onBack, addToast }) => {
  const { user } = useAuth();
  const {
    checklistTemplates,
    saveChecklistTemplate,
    deleteChecklistTemplate,
    updatePrinter,
    getShiftLogs,
    getUsers,
    deleteUser,
    createUser,
    createPrinter,
    deletePrinter,
    resetPrinter,
    getFeedback,
    clearAllData
  } = usePrinters();

  // ... (existing state)
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | PrinterData | undefined | 'NEW' | 'NEW_USER' | 'NEW_STATION'>(undefined);
  const [selectedInstructionPrinter, setSelectedInstructionPrinter] = useState<PrinterData | null>(null);

  const [viewMode, setViewMode] = useState<'PRINTERS' | 'CHECKLISTS' | 'JOURNAL' | 'USERS' | 'MESSAGES' | 'TV' | 'TRANSFERS_JOURNAL' | 'INSTRUCTIONS'>('PRINTERS');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  // ...
  const [shiftFilter, setShiftFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState<string>(getVilniusShiftBoundaries().logicalDateString); // Default to today's logical shift date
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Worker'>('Worker');

  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    getUsers().then(setUsers);
  }, [getUsers]);

  useEffect(() => {
    if (viewMode === 'JOURNAL') {
      setLoadingLogs(true);
      getShiftLogs({
        shift: shiftFilter === 'All' ? undefined : shiftFilter,
        date: dateFilter || undefined
      }).then(data => {
        setLogs(data);
        setLoadingLogs(false);
      });
    } else if (viewMode === 'MESSAGES') {
      setLoadingFeedback(true);
      getFeedback().then(data => {
        setFeedback(data);
        setLoadingFeedback(false);
      });
    }
  }, [getShiftLogs, shiftFilter, dateFilter, viewMode, getFeedback]);

  // Check if current user is 'uniprintpro' or has Admin role
  const isSuperUser = user?.role === UserRole.ADMIN || user?.name.toLowerCase().includes('uniprintpro');

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">

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

      {/* Edit Modal Overlay */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          {/* Logic to choose editor based on type */}
          {editingTemplate === 'NEW_STATION' || (typeof editingTemplate === 'object' && 'isMimaki' in editingTemplate) ? (
            <StationEditor
              station={editingTemplate === 'NEW_STATION' ? undefined : (editingTemplate as PrinterData)}
              onSave={async (data) => {
                try {
                  if (editingTemplate === 'NEW_STATION') {
                    await createPrinter(data as any);
                    addToast?.("Stationas sukurtas", "success");
                  } else {
                    await updatePrinter((editingTemplate as PrinterData).id, data);
                    addToast?.("Stationas atnaujintas", "success");
                  }
                  setEditingTemplate(undefined);
                } catch (e) {
                  console.error(e);
                  addToast?.("Klaida saugant stationą", "error");
                }
              }}
              onDelete={async (id) => {
                try {
                  await deletePrinter(id);
                  addToast?.("Stationas ištrintas", "success");
                  setEditingTemplate(undefined);
                } catch (e) {
                  console.error(e);
                  addToast?.("Klaida trinant stationą", "error");
                }
              }}
              onCancel={() => setEditingTemplate(undefined)}
            />
          ) : (editingTemplate === 'NEW_USER' ? (
            // Placeholder for User Editor if needed, or keeping existing logic separate
            <div className="bg-white p-8 rounded-2xl">
              <p>Vartotojų kūrimas/redagavimas dar kuriamas.</p>
              <Button onClick={() => setEditingTemplate(undefined)}>Uždaryti</Button>
            </div>
          ) : (
            <ChecklistEditor
              template={editingTemplate === 'NEW' ? undefined : (editingTemplate as ChecklistTemplate)}
              onSave={saveChecklistTemplate}
              onDelete={deleteChecklistTemplate}
              onCancel={() => setEditingTemplate(undefined)}
            />
          ))}
        </div>
      )}

      {/* Instruction Modal Overlay */}
      {selectedInstructionPrinter && (
        <InstructionGenerator
          printer={selectedInstructionPrinter}
          onClose={() => setSelectedInstructionPrinter(null)}
        />
      )}

      <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Gamybos Kontrolė</h1>
          <p className="text-slate-500 font-medium text-lg">
            {viewMode === 'PRINTERS' ? 'Visų įrenginių vizualinė patikra' :
              viewMode === 'CHECKLISTS' ? 'Checklist Šablonų Valdymas' :
                viewMode === 'JOURNAL' ? 'Pamainų Istorija' :
                  viewMode === 'MESSAGES' ? 'Vartotojų Pranešimai' :
                    viewMode === 'TV' ? 'TV Ekrano Duomenų Istorija' :
                      viewMode === 'TRANSFERS_JOURNAL' ? 'Visi Registruoti Pervežimai' :
                        viewMode === 'INSTRUCTIONS' ? 'Sistemos Naudojimo Instrukcija' :
                          'Vartotojų Valdymas'}
          </p>
        </div>

        <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar items-center">
          <div className="bg-white rounded-2xl p-1 flex shadow-sm border border-slate-200 w-max shrink-0">
            <button
              onClick={() => setViewMode('PRINTERS')}
              className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold uppercase text-[10px] lg:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${viewMode === 'PRINTERS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Printer className="w-4 h-4" /> Stationai
            </button>
            <button
              onClick={() => setViewMode('CHECKLISTS')}
              className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold uppercase text-[10px] lg:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${viewMode === 'CHECKLISTS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Settings className="w-4 h-4" /> Checklistai
            </button>
            <button
              onClick={() => setViewMode('JOURNAL')}
              className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold uppercase text-[10px] lg:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${viewMode === 'JOURNAL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <RotateCcw className="w-4 h-4" /> Žurnalas
            </button>
            <button
              onClick={() => setViewMode('USERS')}
              className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold uppercase text-[10px] lg:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${viewMode === 'USERS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Users className="w-4 h-4" /> Vartotojai
            </button>
            <button
              onClick={() => setViewMode('INSTRUCTIONS')}
              className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold uppercase text-[10px] lg:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${viewMode === 'INSTRUCTIONS' ? 'bg-amber-500 text-white shadow-md' : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'}`}
            >
              <BookOpen className="w-4 h-4" /> Instrukcija
            </button>

            {/* Super User Tabs */}
            {isSuperUser && (
              <>
                <button
                  onClick={() => setViewMode('MESSAGES')}
                  className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold uppercase text-[10px] lg:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${viewMode === 'MESSAGES' ? 'bg-mimaki-blue text-white shadow-md' : 'text-mimaki-blue hover:text-blue-600 hover:bg-blue-50'}`}
                >
                  <MessageSquare className="w-4 h-4" /> Pranešimai
                </button>
                <button
                  onClick={() => setViewMode('TV')}
                  className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold uppercase text-[10px] lg:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${viewMode === 'TV' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50'}`}
                >
                  <Monitor className="w-4 h-4" /> TV Ekranas
                </button>
                <button
                  onClick={() => setViewMode('TRANSFERS_JOURNAL')}
                  className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold uppercase text-[10px] lg:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${viewMode === 'TRANSFERS_JOURNAL' ? 'bg-pink-600 text-white shadow-md' : 'text-pink-500 hover:text-pink-700 hover:bg-pink-50'}`}
                >
                  <Truck className="w-4 h-4" /> Pervežimai
                </button>
              </>
            )}
          </div>

          <button
            onClick={onBack}
            className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all shrink-0"
          >
            Grįžti
          </button>
        </div>
      </header>

      {viewMode === 'MESSAGES' && isSuperUser ? (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <h3 className="text-xl font-black text-slate-800 uppercase">Vartotojų Atsiliepimai ir Klaidos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Tipas</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Vartotojas</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest w-1/2">Žinutė</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Nuoroda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingFeedback ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">Kraunama...</td></tr>
                ) : feedback.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">Pranešimų nėra.</td></tr>
                ) : (
                  feedback.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors align-top">
                      <td className="p-6 text-sm text-slate-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString('lt-LT')}
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${item.type === 'BUG' ? 'bg-red-100 text-red-700' :
                          item.type === 'FEATURE' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                          {item.type === 'BUG' ? 'Klaida' : item.type === 'FEATURE' ? 'Idėja' : 'Kita'}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="font-bold text-slate-700">{item.userName}</div>
                        <div className="text-xs text-slate-400 font-mono">{item.userId}</div>
                      </td>
                      <td className="p-6 text-slate-700 font-medium">
                        {item.message}
                      </td>
                      <td className="p-6">
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-mimaki-blue hover:text-blue-700 flex items-center gap-1 text-xs font-bold uppercase">
                            Atidaryti <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'TV' && isSuperUser ? (
        <AdminTVPanel />
      ) : viewMode === 'TRANSFERS_JOURNAL' && isSuperUser ? (
        <TransfersJournal />
      ) : viewMode === 'CHECKLISTS' ? (
        <div className="space-y-8">
          <div className="flex justify-end">
            <Button onClick={() => setEditingTemplate('NEW')} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 px-6 font-bold uppercase tracking-wide shadow-lg shadow-emerald-200">
              <Plus className="w-5 h-5 mr-2" /> Naujas Šablonas
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {checklistTemplates.map(template => (
              <div key={template.id} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group" onClick={() => setEditingTemplate(template)}>
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-black text-slate-800">{template.name}</h3>
                  <Settings className="w-5 h-5 text-slate-300 group-hover:text-mimaki-blue transition-colors" />
                </div>
                <div className="space-y-2">
                  {template.items.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center text-sm text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></div>
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                  {template.items.length > 5 && (
                    <p className="text-xs font-bold text-slate-400 uppercase mt-2 pt-2 border-t border-slate-50">+ dar {template.items.length - 5}</p>
                  )}
                </div>
              </div>
            ))}

            {checklistTemplates.length === 0 && (
              <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-200 rounded-[40px]">
                <p className="text-slate-400 font-bold uppercase">Nėra sukurtų šablonų</p>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'JOURNAL' ? (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xl font-black text-slate-800 uppercase">Gamybos Žurnalas</h3>
            <div className="flex gap-4 items-center">
              {/* DATE FILTER */}
              <div className="relative">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-mimaki-blue focus:border-mimaki-blue block p-2.5 font-bold uppercase"
                />
              </div>

              {/* SHIFT FILTER */}
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-mimaki-blue focus:border-mimaki-blue block p-2.5 font-bold uppercase"
              >
                <option value="All">Visos</option>
                <option value="Dieninė">Dieninė (06:00-18:00)</option>
                <option value="Naktinė">Naktinė (18:00-06:00)</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Pamaina</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Įrenginys</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Operatorius</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Gamyba / Brokas</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">VIT</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Nozzle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 italic">
                      {loadingLogs ? 'Kraunama...' : 'Įrašų nerasta'}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 font-bold text-slate-700">{log.date}</td>
                      <td className="p-6 font-bold text-slate-700">{log.shift}</td>
                      <td className="p-6 font-bold text-slate-900">{log.printerName}</td>
                      <td className="p-6 text-slate-600">{log.operatorName}</td>
                      <td className="p-6 text-right font-mono">
                        {log.printerName.toLowerCase().includes('pakavimas') ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Robotas</span>
                              <span className="font-bold text-amber-600 text-sm">{log.robotDefects || 0}</span>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Spauda</span>
                              <span className="font-bold text-red-600 text-sm">{log.printingDefects || 0}</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <span className="font-bold text-emerald-600" title="Pagaminta">{log.productionAmount}</span>
                              <span className="text-slate-300 mx-1">/</span>
                              <span className="font-bold text-red-500" title="Brokas">
                                {log.productionAmount ? (
                                  ((Number(log.defectsAmount) || 0) / (Number(log.productionAmount) || 0) * 100).toFixed(1) + '%'
                                ) : (
                                  (log.defectsAmount || 0)
                                )}
                              </span>
                              {log.defectsReason && (
                                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold uppercase cursor-help" title={`Broko priežastis: ${log.defectsReason}`}>
                                  Priežastis
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 flex gap-2">
                              {Number(log.backlog) > 0 && <span title="Atsilikimas">Atsilikimas: <span className="text-orange-600 font-bold">{log.backlog}</span></span>}
                              {Number(log.remainingAmount) > 0 && <span title="Liko gaminti">Liko: <span className="text-blue-600 font-bold">{log.remainingAmount}</span></span>}
                            </div>
                            {(Number(log.robotDefects) > 0 || Number(log.printingDefects) > 0) && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                {Number(log.robotDefects) > 0 && <span>Robot: <span className="text-amber-600 font-bold">{log.robotDefects}</span> </span>}
                                {Number(log.printingDefects) > 0 && <span>Spauda: <span className="text-red-700 font-bold">{log.printingDefects}</span></span>}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        {log.vitData?.confirmed ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">OK</span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">Ne</span>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex justify-center gap-1">
                          {log.nozzleData?.url ? (
                            <img
                              src={log.nozzleData.url}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 cursor-zoom-in hover:scale-150 transition-transform"
                              onClick={() => setSelectedImg(log.nozzleData.url)}
                              alt="Nozzle"
                            />
                          ) : log.nozzleData?.mimakiFiles ? (
                            <div className="flex -space-x-2 overflow-hidden">
                              {Object.entries(log.nozzleData.mimakiFiles).map(([unit, file]: any) => (
                                <img
                                  key={unit}
                                  src={file.url}
                                  className="w-10 h-10 object-cover rounded-full border-2 border-white cursor-zoom-in hover:scale-150 transition-transform hover:z-10"
                                  onClick={() => setSelectedImg(file.url)}
                                  alt={`Nozzle ${unit}`}
                                  title={`Blokas ${unit}`}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'USERS' ? (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800">Vartotojų Sąrašas</h3>
            <div className="flex gap-4">
              <Button onClick={() => setEditingTemplate('NEW_USER')} className="bg-slate-900 text-white rounded-xl h-10 px-4 font-bold uppercase text-xs">
                <Plus className="w-4 h-4 mr-2" /> Pridėti Vartotoją
              </Button>
            </div>
            <div className="text-xs text-slate-400 italic">Naujus vartotojus registruokite per prisijungimo langą</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Vardas</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Rolė</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Veiksmai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 font-bold text-slate-700">{user.name}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          alert('Norint ištrinti vartotoją, prašome susisiekti su Lukas Kuprys.');
                        }}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'PRINTERS' ? (
        <div className="space-y-10">
          <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-800 uppercase">Stationų Sąrašas</h3>
            <Button onClick={() => setEditingTemplate('NEW_STATION')} className="bg-slate-900 text-white rounded-xl h-10 px-4 font-bold uppercase text-xs">
              <Plus className="w-4 h-4 mr-2" /> Pridėti Stationą
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-10">
            {printers.map((printer) => (
              <div key={printer.id} className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row relative group">

                {/* Edit Button */}
                {/* Action Buttons */}
                <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white shadow-sm hover:bg-slate-100 rounded-full h-10 w-10 text-slate-400 hover:text-red-500"
                    title="Nunulinti (Reset)"
                    onClick={async () => {
                      if (confirm(`Ar tikrai norite pilnai nunulinti ${printer.name}? Tai ištrins visą šios pamainos progresą.`)) {
                        try {
                          await resetPrinter(printer.id);
                          addToast?.("Stationas sėkmingai nunulintas", "success");
                        } catch (e) {
                          console.error(e);
                          addToast?.("Klaida nunulinant", "error");
                        }
                      }
                    }}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white shadow-sm hover:bg-slate-100 rounded-full h-10 w-10 text-slate-400 hover:text-mimaki-blue"
                    title="Atsisiųsti Instrukciją (QR)"
                    onClick={() => setSelectedInstructionPrinter(printer)}
                  >
                    <QrCode className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white shadow-sm hover:bg-slate-100 rounded-full h-10 w-10 text-slate-400 hover:text-mimaki-blue"
                    onClick={() => setEditingTemplate(printer as any)}
                  >
                    <Edit className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex-1 p-10 border-r border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{printer.name}</h3>
                    <span className={`px-4 py-2 rounded-xl text-xs font-black border uppercase ${printer.status === PrinterStatus.WORKING ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-400'
                      }`}>
                      {printer.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Operatorius</p>
                      <p className="font-bold text-slate-800 truncate text-sm">{printer.operatorName || '—'}</p>
                    </div>
                    {printer.name.toLowerCase().includes('pakavimas') ? (
                      <>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                          <p className="text-[10px] font-black text-amber-500 uppercase mb-1">Roboto Brokas</p>
                          <input
                            type="number"
                            className="bg-transparent font-black text-xl text-amber-700 w-full focus:outline-none"
                            value={printer.robotDefects ?? ''}
                            placeholder="0"
                            onChange={(e) => updatePrinter(printer.id, { robotDefects: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                          <p className="text-[10px] font-black text-red-500 uppercase mb-1">Spaudos Brokas</p>
                          <input
                            type="number"
                            className="bg-transparent font-black text-xl text-red-700 w-full focus:outline-none"
                            value={printer.printingDefects ?? ''}
                            placeholder="0"
                            onChange={(e) => updatePrinter(printer.id, { printingDefects: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Pagamino</p>
                          <input
                            type="number"
                            className="bg-transparent font-black text-xl text-emerald-700 w-full focus:outline-none"
                            value={printer.productionAmount ?? ''}
                            placeholder="0"
                            onChange={(e) => updatePrinter(printer.id, { productionAmount: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                          <p className="text-[10px] font-black text-red-500 uppercase mb-1">Brokas</p>
                          <input
                            type="number"
                            className="bg-transparent font-black text-xl text-red-700 w-full focus:outline-none"
                            value={printer.defectsAmount ?? ''}
                            placeholder="0"
                            onChange={(e) => updatePrinter(printer.id, { defectsAmount: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </>
                    )}
                    <div className="bg-slate-50 p-4 rounded-2xl flex flex-col justify-center border border-slate-100">
                      {printer.name.toLowerCase().includes('pakavimas') ? null : (
                        <div className="mb-2">
                          <p className="text-[9px] font-black text-orange-500 uppercase mb-0.5">Atsilikimas</p>
                          <input
                            type="number"
                            className="bg-transparent font-black text-sm text-orange-700 w-full focus:outline-none"
                            value={printer.backlog ?? ''}
                            placeholder="0"
                            onChange={(e) => updatePrinter(printer.id, { backlog: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-[9px] font-black text-blue-500 uppercase mb-0.5">Liko</p>
                        <input
                          type="number"
                          className="bg-transparent font-black text-sm text-blue-700 w-full focus:outline-none"
                          value={printer.remainingAmount ?? ''}
                          placeholder="0"
                          onChange={(e) => updatePrinter(printer.id, { remainingAmount: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase">Pradžios Checklistas</label>
                      <select
                        className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-mimaki-blue/50"
                        value={printer.checklistTemplateId || ''}
                        onChange={(e) => updatePrinter(printer.id, { checklistTemplateId: e.target.value })}
                      >
                        <option value="">-- Nėra --</option>
                        {checklistTemplates.filter(t => !t.type || t.type === 'START').map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Pabaigos Checklistas</label>
                      <select
                        className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-mimaki-blue/50"
                        value={printer.endShiftChecklistId || ''}
                        onChange={(e) => updatePrinter(printer.id, { endShiftChecklistId: e.target.value })}
                      >
                        <option value="">-- Nėra --</option>
                        {checklistTemplates.filter(t => t.type === 'END').map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${printer.maintenanceDone ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                      <span className="font-bold text-slate-600 text-sm">Priežiūra atlikta</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${printer.vit.confirmed ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                      <span className="font-bold text-slate-600 text-sm">VIT Forma patvirtinta</span>
                    </div>
                  </div>

                  {printer.nextOperatorMessage && (
                    <div className="mt-8 p-6 bg-amber-50 rounded-3xl text-amber-800 text-sm italic font-medium border border-amber-100">
                      <span className="block text-[10px] font-black uppercase mb-1 opacity-50">Žinutė kitai pamainai:</span>
                      "{printer.nextOperatorMessage}"
                    </div>
                  )}
                </div>

                <div className="w-full md:w-[400px] p-10 bg-slate-50 flex flex-col items-center justify-center">
                  <p className="text-sm font-black text-slate-400 uppercase mb-6 tracking-widest text-center">Nozzle Check Foto</p>
                  {printer.isMimaki ? (
                    <div className="grid grid-cols-2 gap-4 w-full">
                      {(printer.selectedMimakiUnits || []).map(unit => (
                        <div key={unit} className="relative group cursor-zoom-in" onClick={() => setSelectedImg(printer.mimakiNozzleFiles?.[unit]?.url || null)}>
                          <div className="mb-2 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-slate-400">Blokas {unit}</span>
                            {printer.mimakiNozzleFiles?.[unit] ? (
                              <span className="text-[10px] font-bold text-emerald-500">Yra</span>
                            ) : (
                              <span className="text-[10px] font-bold text-red-400">Nėra</span>
                            )}
                          </div>
                          {printer.mimakiNozzleFiles?.[unit] ? (
                            <img
                              src={printer.mimakiNozzleFiles[unit].url}
                              className="rounded-xl shadow-sm border-2 border-white w-full h-24 object-cover transition-transform group-hover:scale-105"
                              alt={`Nozzle ${unit}`}
                            />
                          ) : (
                            <div className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-slate-100">
                              <span className="text-slate-300 text-[10px] font-bold">---</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {(!printer.selectedMimakiUnits || printer.selectedMimakiUnits.length === 0) && (
                        <div className="col-span-2 text-center py-4 text-slate-400 text-xs italic">Nėra pasirinktų blokų</div>
                      )}
                    </div>
                  ) : (
                    printer.nozzleFile ? (
                      <div className="relative group cursor-zoom-in w-full text-center" onClick={() => setSelectedImg(printer.nozzleFile?.url || null)}>
                        <img
                          src={printer.nozzleFile.url}
                          className="rounded-3xl shadow-xl border-4 border-white max-h-60 mx-auto transition-transform group-hover:scale-105"
                          alt="Nozzle"
                        />
                        <div className="mt-4">
                          <p className="text-[10px] font-bold text-slate-500">{printer.nozzleFile.timestamp}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 border-4 border-dashed border-slate-200 rounded-[32px] flex items-center justify-center">
                        <span className="text-slate-300 font-bold uppercase text-xs">Nuotraukos nėra</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null
      }

      {/* Create User Modal */}
      {
        editingTemplate === 'NEW_USER' && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-300">
              <button
                onClick={() => setEditingTemplate(undefined)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <Trash2 className="w-5 h-5 text-slate-400" />
              </button>

              <h3 className="text-2xl font-black text-slate-800 mb-6">Naujas Vartotojas</h3>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const role = formData.get('role') as 'Admin' | 'Worker';
                const password = formData.get('password') as string;

                if (!name) return;

                try {
                  await createUser({ name, role, password });
                  setEditingTemplate(undefined);
                  setNewUserRole('Worker'); // Reset
                  getUsers().then(setUsers);

                  if (addToast) {
                    addToast(`Vartotojas ${name} sukurtas!`, 'success');
                    if (role === 'Admin') {
                      alert(`Admin vartotojas ${name} sukurtas!\nSlaptažodis: ${password}`);
                    } else {
                      alert(`Vartotojas ${name} sukurtas!\nSlaptažodis: uniprint`);
                    }
                  } else {
                    if (role === 'Admin') {
                      alert(`Admin vartotojas ${name} sukurtas!\nSlaptažodis: ${password}`);
                    } else {
                      alert(`Vartotojas ${name} sukurtas!\nSlaptažodis: uniprint`);
                    }
                  }

                } catch (error: any) {
                  if (addToast) addToast(error.message, 'error');
                  else alert('Klaida kuriant vartotoją: ' + error.message);
                }
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Vardas Pavardė</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Vardas Pavardė"
                    className="w-full h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Rolė</label>
                  <select
                    name="role"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'Admin' | 'Worker')}
                    className="w-full h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="Worker">Darbuotojas (Worker)</option>
                    <option value="Admin">Administratorius (Admin)</option>
                  </select>
                </div>

                {newUserRole === 'Admin' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider ml-1">Slaptažodis</label>
                    <input
                      name="password"
                      type="text" // Visible so they know what they typed
                      placeholder="Įrašykite slaptažodį"
                      className="w-full h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setEditingTemplate(undefined)}
                    className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                  >
                    Atšaukti
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20"
                  >
                    Sukurti Vartotoją
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )
      }
      {/* Instructions Zone */}
      {viewMode === 'INSTRUCTIONS' && (
        <AdminInstructions />
      )}

      {/* Super User Zone */}
      {isSuperUser && (
        <div className="mt-20 border-t-2 border-red-100 pt-10">
          <h2 className="text-2xl font-black text-red-600 mb-6 flex items-center gap-3">
            <Trash2 className="w-6 h-6" />
            PAVOJINGA ZONA (SUPER ADMIN)
          </h2>

          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-2xl">
            <p className="text-red-800 mb-6 font-medium">
              Ši funkcija ištrins <span className="font-bold underline">VISĄ</span> gamybos istoriją (žurnalą) ir atstatys visus stationus į pradinę būseną.
              <br /><br />
              Tai yra negrįžtamas veiksmas, skirtas sistemos paruošimui "švariai" pradžiai.
            </p>

            <button
              onClick={() => {
                const confirmation = window.prompt("Įrašykite 'DELETE ALL' norėdami patvirtinti visų duomenų ištrynimą:");
                if (confirmation === 'DELETE ALL') {
                  clearAllData()
                    .then(() => addToast?.("Visi duomenys sėkmingai ištrinti", "success"))
                    .catch(() => addToast?.("Klaida trinant duomenis", "error"));
                } else if (confirmation !== null) {
                  addToast?.("Veiksmas atšauktas: neteisingas patvirtinimo kodas", "info");
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center gap-3"
            >
              <Trash2 className="w-5 h-5" />
              IŠTRINTI VISĄ ISTORIJĄ IR NUNULINTI STATIONUS
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
