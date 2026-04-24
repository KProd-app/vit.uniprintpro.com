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
import { Plus, Settings, Printer, Users, Trash2, Edit, RotateCcw, MessageSquare, ExternalLink, X, QrCode, Monitor, Truck, BookOpen, Check, Droplet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminInstructions } from './AdminInstructions';
import { AdminJournalTab } from './AdminJournalTab';
import { AdminInkTab } from './AdminInkTab';

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
    resolveFeedback,
    clearAllData,
    updateShiftLog
  } = usePrinters();

  // ... (existing state)
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | PrinterData | undefined | 'NEW' | 'NEW_USER' | 'NEW_STATION'>(undefined);
  const [selectedInstructionPrinters, setSelectedInstructionPrinters] = useState<PrinterData[]>([]);

  const [viewMode, setViewMode] = useState<'PRINTERS' | 'CHECKLISTS' | 'JOURNAL' | 'USERS' | 'MESSAGES' | 'TV' | 'TRANSFERS_JOURNAL' | 'INSTRUCTIONS' | 'INK'>('PRINTERS');
  const [users, setUsers] = useState<User[]>([]);
  // ...
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Worker'>('Worker');
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    getUsers().then(setUsers);
  }, [getUsers]);

  useEffect(() => {
    if (viewMode === 'MESSAGES') {
      setLoadingFeedback(true);
      getFeedback().then(data => {
        setFeedback(data);
        setLoadingFeedback(false);
      });
    }
  }, [viewMode, getFeedback]);

  // Check if current user is 'uniprintpro' or has Admin role
  const isSuperUser = user?.role === UserRole.ADMIN || user?.name.toLowerCase().includes('uniprintpro');
  const isUniprintProUser = user?.name.toLowerCase().includes('uniprintpro');

  return (
    <div className={`p-6 md:p-10 max-w-7xl mx-auto ${selectedInstructionPrinters.length > 0 ? 'print:p-0 print:max-w-none print:m-0' : ''}`}>

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
      {selectedInstructionPrinters.length > 0 && (
        <InstructionGenerator
          printers={selectedInstructionPrinters}
          onClose={() => setSelectedInstructionPrinters([])}
        />
      )}



      {/* ALL CONTENT EXCEPT MODALS GETS HIDDEN ON PRINT */}
      <div className={selectedInstructionPrinters.length > 0 ? 'print:hidden' : ''}>
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
                          viewMode === 'INK' ? 'Dažų Inventoriaus Valdymas' :
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
            <button
              onClick={() => setViewMode('INK')}
              className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold uppercase text-[10px] lg:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${viewMode === 'INK' ? 'bg-emerald-500 text-white shadow-md' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}`}
            >
              <Droplet className="w-4 h-4" /> Dažai
            </button>

            {/* Super User Tabs */}
            {isUniprintProUser && (
                <button
                  onClick={() => setViewMode('MESSAGES')}
                  className={`px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold uppercase text-[10px] lg:text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${viewMode === 'MESSAGES' ? 'bg-mimaki-blue text-white shadow-md' : 'text-mimaki-blue hover:text-blue-600 hover:bg-blue-50'}`}
                >
                  <MessageSquare className="w-4 h-4" /> Pranešimai
                </button>
            )}
            {isSuperUser && (
              <>
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

      {viewMode === 'INK' ? (
        <AdminInkTab printers={printers} addToast={addToast} />
      ) : viewMode === 'MESSAGES' && isUniprintProUser ? (
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
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Statusas</th>
                  <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Veiksmai</th>
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
                        {item.url && (
                          <div className="mt-2">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-mimaki-blue hover:text-blue-700 inline-flex items-center gap-1 text-xs font-bold uppercase">
                              Priedas / Nuoroda <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="p-6">
                        {item.resolved ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">Išspręsta</span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase">Laukia</span>
                        )}
                      </td>
                      <td className="p-6">
                        {!item.resolved && (
                          <Button 
                            onClick={async () => {
                              try {
                                await resolveFeedback(item.id);
                                setFeedback(prev => prev.map(f => f.id === item.id ? { ...f, resolved: true } : f));
                                addToast?.("Problema pažymėta kaip išspręsta", "success");
                              } catch (e) {
                                addToast?.("Nepavyko atnaujinti", "error");
                              }
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase px-3 py-1 h-auto"
                          >
                            <Check className="w-3 h-3 mr-1" /> Žymėti
                          </Button>
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
            {Object.entries(
              checklistTemplates.reduce((acc, template) => {
                // Extract base name, removing "(Pradžia)" or "(Pabaiga)"
                const match = template.name.match(/^(.*?)\s*(\(Pradžia\)|\(Pabaiga\))?$/i);
                const baseName = match && match[1] ? match[1].trim() : template.name.trim();

                if (!acc[baseName]) {
                  acc[baseName] = { START: [], END: [], UNKNOWN: [] };
                }
                if (template.type === 'START') acc[baseName].START.push(template);
                else if (template.type === 'END') acc[baseName].END.push(template);
                else acc[baseName].UNKNOWN.push(template);

                return acc;
              }, {} as Record<string, { START: ChecklistTemplate[], END: ChecklistTemplate[], UNKNOWN: ChecklistTemplate[] }>)
            ).sort(([a], [b]) => a.localeCompare(b)).map(([baseName, groups]) => (
              <div key={baseName} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-black text-slate-800 uppercase">{baseName}</h3>
                </div>
                
                <div className="space-y-6">
                  {/* Pradžios Checklistai */}
                  <div>
                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">Pradžios (Start)</h4>
                    {groups.START.length > 0 ? (
                      <div className="space-y-2">
                        {groups.START.map(t => (
                          <div 
                            key={t.id} 
                            onClick={() => setEditingTemplate(t)} 
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md cursor-pointer group flex justify-between items-center transition-all"
                          >
                            <span className="text-sm font-bold text-slate-700 truncate mr-2">{t.name}</span>
                            <Settings className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 shrink-0" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic font-medium px-2">Nėra pradžios šablono</p>
                    )}
                  </div>

                  {/* Pabaigos Checklistai */}
                  <div>
                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">Pabaigos (End)</h4>
                    {groups.END.length > 0 ? (
                      <div className="space-y-2">
                        {groups.END.map(t => (
                          <div 
                            key={t.id} 
                            onClick={() => setEditingTemplate(t)} 
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-rose-200 hover:shadow-md cursor-pointer group flex justify-between items-center transition-all"
                          >
                            <span className="text-sm font-bold text-slate-700 truncate mr-2">{t.name}</span>
                            <Settings className="w-4 h-4 text-slate-300 group-hover:text-rose-500 shrink-0" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic font-medium px-2">Nėra pabaigos šablono</p>
                    )}
                  </div>

                  {/* Kiti Checklistai */}
                  {groups.UNKNOWN.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Kiti</h4>
                        <div className="space-y-2">
                          {groups.UNKNOWN.map(t => (
                            <div 
                              key={t.id} 
                              onClick={() => setEditingTemplate(t)} 
                              className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 hover:shadow-md cursor-pointer group flex justify-between items-center transition-all"
                            >
                              <span className="text-sm font-bold text-slate-700 truncate mr-2">{t.name}</span>
                              <Settings className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                            </div>
                          ))}
                        </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {checklistTemplates.length === 0 && (
              <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-200 rounded-[40px]">
                <p className="text-slate-400 font-bold uppercase tracking-widest">Nėra sukurtų šablonų</p>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'JOURNAL' ? (
        <AdminJournalTab isSuperUser={isSuperUser} addToast={addToast} />
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
            <div className="flex gap-4">
              <Button onClick={() => setSelectedInstructionPrinters(printers)} className="bg-mimaki-blue hover:bg-blue-600 text-white rounded-xl h-10 px-4 font-bold uppercase text-xs shadow-lg">
                <Printer className="w-4 h-4 mr-2" /> Visos Instrukcijos
              </Button>
              <Button onClick={() => setEditingTemplate('NEW_STATION')} className="bg-slate-900 text-white rounded-xl h-10 px-4 font-bold uppercase text-xs">
                <Plus className="w-4 h-4 mr-2" /> Pridėti Stationą
              </Button>
            </div>
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
                    onClick={() => setSelectedInstructionPrinters([printer])}
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
    </div>
  );
};
