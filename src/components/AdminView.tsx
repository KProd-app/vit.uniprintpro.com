import { PrinterData, PrinterStatus, ChecklistTemplate, User, Feedback } from '../types';
import React, { useState, useEffect } from 'react';
import { usePrinters } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { ChecklistEditor } from './ChecklistEditor';
import { StationEditor } from './StationEditor';
import { PrinterEditor } from './PrinterEditor';
import { Button } from './ui/button';
import { Plus, Settings, Printer, Users, Trash2, Edit, RotateCcw, MessageSquare, ExternalLink, X } from 'lucide-react';

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
    clearAllData,
    assignPrinterToStation,
    createStation,
    updateStation,
    deleteStation,
    stations
  } = usePrinters();

  // ... (existing state)
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | PrinterData | undefined | 'NEW' | 'NEW_USER' | 'NEW_STATION'>(undefined);

  const [viewMode, setViewMode] = useState<'PRINTERS' | 'CHECKLISTS' | 'JOURNAL' | 'USERS' | 'MESSAGES'>('PRINTERS');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [shiftFilter, setShiftFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
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

  // Check if current user is 'uniprintpro'
  const isSuperUser = user?.name.toLowerCase().includes('uniprintpro');

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
          {editingTemplate === 'NEW_STATION' || (typeof editingTemplate === 'object' && 'stationQrLink' in editingTemplate) ? (
            <StationEditor
              station={editingTemplate === 'NEW_STATION' ? undefined : (editingTemplate as any)}
              allPrinters={printers}
              onSave={async (data, assignedPrinterIds) => {
                try {
                  let stationId = (editingTemplate as any)?.id;

                  if (editingTemplate === 'NEW_STATION') {
                    // Create
                    stationId = await createStation(data);
                    addToast?.("Stationas sukurtas", "success");
                  } else {
                    // Update
                    await updateStation(stationId, data);
                    addToast?.("Stationas atnaujintas", "success");
                  }

                  // Handle Printer Assignments
                  // We get existing assigned to this station
                  // But since we are in Admin, we can just fetch all printers again to be sure?
                  // Or rely on `printers` prop.

                  const currentAssignedIds = printers.filter(p => p.stationId === stationId).map(p => p.id);
                  const newAssignedIds = assignedPrinterIds;

                  const toUnassign = currentAssignedIds.filter(id => !newAssignedIds.includes(id));
                  const toAssign = newAssignedIds.filter(id => !currentAssignedIds.includes(id));

                  await Promise.all([
                    ...toUnassign.map(id => assignPrinterToStation(id, null)),
                    ...toAssign.map(id => assignPrinterToStation(id, stationId))
                  ]);

                  setEditingTemplate(undefined);
                } catch (e) {
                  console.error(e);
                  addToast?.("Klaida saugant stationą", "error");
                }
              }}
              onDelete={async (id) => {
                if (confirm('Ar tikrai norite ištrinti šį stationą?')) {
                  try {
                    await deleteStation(id);
                    addToast?.("Stationas ištrintas", "success");
                    setEditingTemplate(undefined);
                  } catch (e) {
                    console.error(e);
                    addToast?.("Klaida trinant stationą", "error");
                  }
                }
              }}
              onCancel={() => setEditingTemplate(undefined)}
            />
          ) : editingTemplate === 'NEW_USER' ? (
            // User creation is handled below in a separate block? 
            // Actually currently 'NEW_USER' is handled in the main render flow at line 688
            // So here we should probably NOT render anything if it conflicts, 
            // OR move the user creation modal here.
            // Looking at existing code, line 688 handles NEW_USER.
            // So here we just return null or empty?
            // But 'editingTemplate' IS 'NEW_USER', so this block renders.
            // The existing code at line 671 checks `editingTemplate === 'NEW_USER'` independently.
            // So I should exclude NEW_USER from THIS block.
            null
          ) : (typeof editingTemplate === 'object' && 'isMimaki' in editingTemplate) ? (
            <PrinterEditor
              printer={editingTemplate as PrinterData}
              onSave={async (data) => {
                try {
                  await updatePrinter((editingTemplate as PrinterData).id, data);
                  addToast?.("Įrenginys atnaujintas", "success");
                  setEditingTemplate(undefined);
                } catch (e) {
                  console.error(e);
                  addToast?.("Klaida saugant įrenginį", "error");
                }
              }}
              onDelete={async (id) => {
                try {
                  await deletePrinter(id);
                  addToast?.("Įrenginys ištrintas", "success");
                  setEditingTemplate(undefined);
                } catch (e) {
                  console.error(e);
                  addToast?.("Klaida trinant įrenginį", "error");
                }
              }}
              onCancel={() => setEditingTemplate(undefined)}
            />
          ) : (
            <ChecklistEditor
              template={editingTemplate === 'NEW' ? undefined : (editingTemplate as ChecklistTemplate)}
              onSave={saveChecklistTemplate}
              onDelete={deleteChecklistTemplate}
              onCancel={() => setEditingTemplate(undefined)}
            />
          )}
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Gamybos Kontrolė</h1>
          <p className="text-slate-500 font-medium text-lg">
            {viewMode === 'PRINTERS' ? 'Visų įrenginių vizualinė patikra' :
              viewMode === 'CHECKLISTS' ? 'Checklist Šablonų Valdymas' :
                viewMode === 'JOURNAL' ? 'Pamainų Istorija' :
                  viewMode === 'MESSAGES' ? 'Vartotojų Pranešimai' :
                    'Vartotojų Valdymas'}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white rounded-2xl p-1 flex shadow-sm border border-slate-200">
            <button
              onClick={() => setViewMode('PRINTERS')}
              className={`px-6 py-3 rounded-xl font-bold uppercase text-sm flex items-center gap-2 transition-all ${viewMode === 'PRINTERS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Printer className="w-4 h-4" /> Stationai
            </button>
            <button
              onClick={() => setViewMode('CHECKLISTS')}
              className={`px-6 py-3 rounded-xl font-bold uppercase text-sm flex items-center gap-2 transition-all ${viewMode === 'CHECKLISTS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Settings className="w-4 h-4" /> Checklistai
            </button>
            <button
              onClick={() => setViewMode('JOURNAL')}
              className={`px-6 py-3 rounded-xl font-bold uppercase text-sm flex items-center gap-2 transition-all ${viewMode === 'JOURNAL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <RotateCcw className="w-4 h-4" /> Žurnalas
            </button>
            <button
              onClick={() => setViewMode('USERS')}
              className={`px-6 py-3 rounded-xl font-bold uppercase text-sm flex items-center gap-2 transition-all ${viewMode === 'USERS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Users className="w-4 h-4" /> Vartotojai
            </button>

            {/* Super User Tab */}
            {isSuperUser && (
              <button
                onClick={() => setViewMode('MESSAGES')}
                className={`px-6 py-3 rounded-xl font-bold uppercase text-sm flex items-center gap-2 transition-all ${viewMode === 'MESSAGES' ? 'bg-mimaki-blue text-white shadow-md' : 'text-mimaki-blue hover:text-blue-600 hover:bg-blue-50'}`}
              >
                <MessageSquare className="w-4 h-4" /> Pranešimai
              </button>
            )}
          </div>

          <button
            onClick={onBack}
            className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
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
                              <span className="font-bold text-emerald-600">{log.productionAmount}</span>
                              <span className="text-slate-300 mx-2">/</span>
                              <span className="font-bold text-red-500">
                                {log.productionAmount ? (
                                  ((Number(log.defectsAmount) || 0) / (Number(log.productionAmount) || 1) * 100).toFixed(1) + '%'
                                ) : (
                                  (log.defectsAmount || 0)
                                )}
                              </span>
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
          {/* Stations List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Add Station Card */}
            <div
              className="bg-slate-100 border-4 border-slate-200 border-dashed rounded-[40px] p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 hover:border-slate-300 transition-all min-h-[300px]"
              onClick={() => setEditingTemplate('NEW_STATION')}
            >
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Plus className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-black text-slate-500 uppercase">Naujas Stationas</h3>
            </div>

            {stations.map(station => {
              const assignedPrinters = printers.filter(p => p.stationId === station.id);
              const isMimaki = station.name.toLowerCase().includes('mimaki');

              return (
                <div key={station.id} className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-all group relative">
                  <div className={`p-8 ${isMimaki ? 'bg-mimaki-blue/5' : 'bg-slate-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-tight pointer-events-none">
                        {station.name}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-white shadow-sm hover:bg-slate-100 rounded-full h-10 w-10 text-slate-400 hover:text-mimaki-blue"
                        onClick={() => setEditingTemplate(station as any)}
                      >
                        <Edit className="w-5 h-5" />
                      </Button>
                    </div>
                    {station.stationQrLink && (
                      <a href={station.stationQrLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-mimaki-blue hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Instrukcijos Link
                      </a>
                    )}
                  </div>

                  <div className="p-8 flex-1">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Priskirti Įrenginiai</h4>
                    {assignedPrinters.length > 0 ? (
                      <div className="space-y-3">
                        {assignedPrinters.map(printer => (
                          <div
                            key={printer.id}
                            className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 cursor-pointer transition-colors group/printer"
                            onClick={() => setEditingTemplate(printer)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${printer.status === PrinterStatus.WORKING ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <span className="font-bold text-slate-700 text-sm">{printer.name}</span>
                            </div>
                            <Edit className="w-3 h-3 text-slate-300 group-hover/printer:text-mimaki-blue transition-colors" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-xl">
                        <p className="text-xs font-bold text-slate-300 uppercase">Nėra įrenginių</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unassigned Printers Section (Optional?) */}
          {printers.filter(p => !p.stationId).length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-6">Nepriskirti Įrenginiai</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {printers.filter(p => !p.stationId).map(printer => (
                  <div key={printer.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 opacity-75 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-slate-700">{printer.name}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-mimaki-blue"
                        onClick={() => setEditingTemplate(printer)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Nepriskirtas</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Original PRINTERS view (which was listing all printers) is now STATIONS view essentially. 
           But wait, the user might still want to see the Detailed Printer Cards?
           Actually, the requirement is "Admin UI: Add Station detail view".
           The previous view was "PRINTERS". I reused 'PRINTERS' viewMode for the new Station view.
           Do we still need the old Detailed Printer Cards view? 
           Typically "Admin Station Assignment" implies organizing them.
           But the Admin needs to see live status too?
           
           Maybe we keep 'PRINTERS' as the Detailed List, and add 'STATIONS' as a separate tab?
           In Step 506, I added 'PRINTERS' tab which listed Printer Cards.
           
           If I replace the content of 'PRINTERS' viewMode with Stations List, where do the Printer Cards go?
           
           The user task says: "Admin UI: Add Station detail view".
           And "Update station selection to show new stations".
           
           If I hide the detailed printer cards, how does the admin monitor production?
           The AdminView is primarily for "Gamybos Kontrolė" (Production Control).
           So seeing the BIG printer cards is important.
           
           Maybe 'STATIONS' should be a NEW tab "STATIONAI" (which I added in header), 
           and 'PRINTERS' remains "ĮRENGINIAI" (Detailed View).
           
           Let's check the header I modified in step 506/501?
           In step 506 line 185:
           <button onClick={() => setViewMode('PRINTERS')}> Stationai </button>
           
           I accepted 'PRINTERS' as 'Stationai' in the label.
           This implies I intended to REPLACE the view.
           
           However, the Station Card I just designed is a high-level grouping.
           The Printer Card (original) has all the stats (Production, Defects, Nozzle Photo).
           
           If I replace it, I lose that visibility unless I embed it inside the Station Card?
           The Station Card I designed above only lists names.
           
           Proposed Solution:
           1. Rename 'PRINTERS' viewMode to 'DASHBOARD' or keep 'PRINTERS' but restore the Detailed Cards.
           2. Add 'STATIONS' viewMode for managing the Stations (CRUD).
           
           Let's look at the ViewMode state in `AdminView`:
           const [viewMode, setViewMode] = useState<'PRINTERS' | 'CHECKLISTS' | ...>('PRINTERS');
           
           I will add 'STATIONS' to the state type allowing me to switch.
           I will keep 'PRINTERS' as the detailed dashboard.
           I will add 'STATIONS' tab in the header.
        */

        /* I will stick to what I wrote:
           1. 'STATIONS' Mode -> Management of Stations (Edit/Assign).
           2. 'PRINTERS' Mode -> The Live Dashboard (Original).
           
           So I need to:
           - Render Stations List ONLY when viewMode === 'STATIONS'.
           - Restore/Keep Printers List when viewMode === 'PRINTERS'.
        */

        /* Wait, I am replacing the content of `) : ( <div className="space-y-10"> ...` which was the DEFAULT case (PRINTERS).
           I need to wrap this properly.
        */

        <div className="space-y-10">
          {/* Original Printer Dashboard Content */}
          <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-800 uppercase">Įrenginių Kontrolė</h3>
            {/* Maybe add a button to switch to Station Management if separate? or just rely on Tab */}
          </div>
          {/* ... mapped printers ... */}
        </div>
      )}


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
      {/* Super User Zone */}
      {
        isSuperUser && (
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
        )
      }

    </div >
  );
};
