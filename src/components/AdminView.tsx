import { PrinterData, PrinterStatus, ChecklistTemplate, User } from '../types';
import React, { useState, useEffect } from 'react';
import { usePrinters } from '../contexts/DataContext'; // Import context hooks to get checklists
import { ChecklistEditor } from './ChecklistEditor';
import { Button } from './ui/button';
import { Plus, Settings, Printer, Users, Trash2, Edit } from 'lucide-react';

interface AdminViewProps {
  printers: PrinterData[];
  onBack: () => void;
  addToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ printers, onBack, addToast }) => {
  const {
    checklistTemplates,
    saveChecklistTemplate,
    deleteChecklistTemplate,
    updatePrinter,
    getShiftLogs,
    getUsers,
    deleteUser,
    createUser,
    createPrinter
  } = usePrinters();
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'PRINTERS' | 'CHECKLISTS' | 'JOURNAL' | 'USERS'>('PRINTERS');
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | undefined | 'NEW' | 'NEW_USER' | 'NEW_STATION'>(undefined);
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Worker'>('Worker'); // Track role for conditional UI
  const [shiftFilter, setShiftFilter] = useState<string>('All');

  // Load data based on view mode
  useEffect(() => {
    if (viewMode === 'JOURNAL') {
      setLoadingLogs(true);
      getShiftLogs({
        shift: shiftFilter === 'All' ? undefined : shiftFilter
      }).then(data => {
        setLogs(data);
        setLoadingLogs(false);
      });
    } else if (viewMode === 'USERS') {
      getUsers().then(setUsers);
    }
  }, [viewMode, shiftFilter, getShiftLogs, getUsers]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Debug Indicator - Remove later */}
      <div className="bg-red-500 text-white p-2 text-center text-xs font-bold uppercase mb-4 rounded">
        ADMIN PANELIS VEIKIA (ViewMode: {viewMode})
      </div>
      {selectedImg && (
        <div
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-10 cursor-zoom-out"
          onClick={() => setSelectedImg(null)}
        >
          <img src={selectedImg} className="max-w-full max-h-full rounded-2xl shadow-2xl" alt="Zoomed" />
        </div>
      )}

      {/* Edit Modal Overlay */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-4">
          <ChecklistEditor
            template={editingTemplate === 'NEW' ? undefined : editingTemplate}
            onSave={saveChecklistTemplate}
            onDelete={deleteChecklistTemplate}
            onCancel={() => setEditingTemplate(undefined)}
          />
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Gamybos Kontrolė</h1>
          <p className="text-slate-500 font-medium text-lg">
            {viewMode === 'PRINTERS' ? 'Visų įrenginių vizualinė patikra' : 'Checklist Šablonų Valdymas'}
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
              <Settings className="w-4 h-4" /> Žurnalas
            </button>
            <button
              onClick={() => setViewMode('USERS')}
              className={`px-6 py-3 rounded-xl font-bold uppercase text-sm flex items-center gap-2 transition-all ${viewMode === 'USERS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Users className="w-4 h-4" /> Vartotojai
            </button>
          </div>

          <button
            onClick={onBack}
            className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Grįžti
          </button>
        </div>
      </header>

      {viewMode === 'CHECKLISTS' ? (
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
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase text-slate-400">Pamaina:</span>
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-mimaki-blue focus:border-mimaki-blue block p-2.5 font-bold outline-none transition-all hover:border-slate-300"
              >
                <option value="All">Visos</option>
                <option value="Ryto">Ryto (06:00-18:00)</option>
                <option value="Vakaro">Vakaro (18:00-06:00)</option>
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
                        <span className="font-bold text-emerald-600">{log.productionAmount}</span>
                        <span className="text-slate-300 mx-2">/</span>
                        <span className="font-bold text-red-500">{log.defectsAmount}</span>
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
      ) : (
        <div className="space-y-10">
          <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-800 uppercase">Stationų Sąrašas</h3>
            <Button onClick={() => setEditingTemplate('NEW_STATION')} className="bg-slate-900 text-white rounded-xl h-10 px-4 font-bold uppercase text-xs">
              <Plus className="w-4 h-4 mr-2" /> Pridėti Stationą
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-10">
            {printers.map((printer) => (
              <div key={printer.id} className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
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
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-500 uppercase mb-1">Pagamino</p>
                      <p className="font-black text-xl text-emerald-700">{printer.productionAmount ?? '0'}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                      <p className="text-[10px] font-black text-red-500 uppercase mb-1">Brokas</p>
                      <p className="font-black text-xl text-red-700">{printer.defectsAmount ?? '0'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Pamaina</p>
                      <p className="font-bold text-slate-800 text-sm">{printer.vit.shift || '—'}</p>
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
      )}
      {/* Create User Modal */}
      {editingTemplate === 'NEW_USER' && (
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
      )}

      {/* New Station Modal */}
      {editingTemplate === 'NEW_STATION' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[32px] shadow-xl w-full max-w-md relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setEditingTemplate(undefined)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors"
              type="button"
            >
              <Trash2 className="w-5 h-5 text-slate-400" />
            </button>
            <h3 className="text-2xl font-black uppercase text-slate-800 mb-6">Naujas Stationas</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                if (!name) return;

                try {
                  await createPrinter(name);
                  setEditingTemplate(undefined);
                  if (addToast) addToast('Stationas sukurtas sėkmingai', 'success');
                } catch (e: any) {
                  console.error(e);
                  if (addToast) addToast(`Klaida: ${e.message}`, 'error');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Pavadinimas</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Pvz.: Mimaki JFX200"
                  className="w-full h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={() => setEditingTemplate(undefined)} className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">Atšaukti</Button>
                <Button type="submit" className="flex-1 h-12 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20">Sukurti</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
