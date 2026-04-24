import React, { useEffect, useState } from 'react';
import { PrinterData, InkLog, AppSetting, PrinterInk } from '../types';
import { usePrinters } from '../contexts/DataContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Droplet, Plus, Save, QrCode, Search, History, Settings2, Trash2 } from 'lucide-react';
import { getVilniusShiftBoundaries } from '../lib/utils';
import { getAdminInkPrinters, syncGroupedInks } from '../lib/inkGrouping';

export const AdminInkTab: React.FC<{ printers: PrinterData[], addToast?: (m: string, t: 'success'|'error') => void }> = ({ printers, addToast }) => {
  const { getSettings, updateSetting, getInkLogs, updatePrinter } = usePrinters();
  const [logs, setLogs] = useState<InkLog[]>([]);
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [isSavingQr, setIsSavingQr] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [shiftFilter, setShiftFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState<string>(getVilniusShiftBoundaries().logicalDateString);

  const groupedPrinters = getAdminInkPrinters(printers);

  const [selectedPrinter, setSelectedPrinter] = useState<PrinterData | null>(null);
  
  // Ink Edit Modal State
  const [newInkName, setNewInkName] = useState('');
  const [newInkQr, setNewInkQr] = useState('');
  const [newInkInv, setNewInkInv] = useState<number | ''>('');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [shiftFilter, dateFilter]);

  const loadSettings = async () => {
    try {
      const fetchedSettings = await getSettings();
      setSettings(fetchedSettings || []);
      const qrSetting = fetchedSettings?.find(s => s.key === 'inkToolQrCode');
      if (qrSetting) {
        setQrCode(qrSetting.value);
      }
    } catch (e) {}
  };

  const loadLogs = async () => {
    try {
      const fetchedLogs = await getInkLogs({
        shift: shiftFilter === 'All' ? undefined : shiftFilter,
        date: dateFilter || undefined
      });
      setLogs(fetchedLogs || []);

    } catch (error) {
      console.error("Error loading ink logs:", error);
    }
  };

  const handleSaveQr = async () => {
    setIsSavingQr(true);
    try {
      await updateSetting('inkToolQrCode', qrCode);
      addToast?.('Įrankio QR Kodas išsaugotas!', 'success');
    } catch (e) {
      addToast?.('Klaida išsaugant QR kodą', 'error');
    } finally {
      setIsSavingQr(false);
    }
  };

  const handleAddInk = async () => {
    if (!selectedPrinter || !newInkName) return;
    
    const newInk: PrinterInk = {
      id: crypto.randomUUID(),
      name: newInkName,
      qrCode: newInkQr,
      inventory: Number(newInkInv) || 0
    };

    const currentInks = selectedPrinter.inks || [];
    const updatedInks = [...currentInks, newInk];

    try {
      await syncGroupedInks(selectedPrinter.id, updatedInks, printers, updatePrinter);
      addToast?.('Dažas pridėtas', 'success');
      // Update local state to reflect UI changes immediately
      setSelectedPrinter({ ...selectedPrinter, inks: updatedInks });
      setNewInkName('');
      setNewInkQr('');
      setNewInkInv('');
    } catch (e) {
      addToast?.('Klaida pridedant dažą', 'error');
    }
  };

  const handleDeleteInk = async (inkId: string) => {
    if (!selectedPrinter) return;
    if (!confirm('Ar tikrai norite ištrinti šį dažą?')) return;

    const currentInks = selectedPrinter.inks || [];
    const updatedInks = currentInks.filter(i => i.id !== inkId);

    try {
      await syncGroupedInks(selectedPrinter.id, updatedInks, printers, updatePrinter);
      addToast?.('Dažas ištrintas', 'success');
      setSelectedPrinter({ ...selectedPrinter, inks: updatedInks });
    } catch (e) {
      addToast?.('Klaida trinant dažą', 'error');
    }
  };

  const handleUpdateInkInv = async (inkId: string, newValue: number) => {
     if (!selectedPrinter) return;
     const currentInks = selectedPrinter.inks || [];
     const updatedInks = currentInks.map(i => i.id === inkId ? { ...i, inventory: newValue } : i);

     try {
       await syncGroupedInks(selectedPrinter.id, updatedInks, printers, updatePrinter);
       setSelectedPrinter({ ...selectedPrinter, inks: updatedInks });
     } catch(e) {
       addToast?.('Klaida atnaujinant likutį', 'error');
     }
  };

  const filteredLogs = logs.filter(l => 
    l.printerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.inkName && l.inkName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative">
      
      {/* INK EDITOR MODAL */}
      {selectedPrinter && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                 {selectedPrinter.name} Dažų Valdymas
               </h3>
               <Button variant="ghost" onClick={() => setSelectedPrinter(null)} className="text-slate-400 hover:text-slate-600 rounded-full h-10 w-10 p-0">
                  ✕
               </Button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
               <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Pridėti Naują Dažą</h4>
               <div className="flex flex-wrap gap-4 items-end">
                  <div className="flex-1 min-w-[200px]">
                     <label className="text-[10px] font-bold uppercase text-slate-400">Pavadinimas (pvz. Cyan)</label>
                     <input type="text" value={newInkName} onChange={e => setNewInkName(e.target.value)} className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-mimaki-blue/50" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                     <label className="text-[10px] font-bold uppercase text-slate-400">QR Kodas / Barkodas</label>
                     <input type="text" value={newInkQr} onChange={e => setNewInkQr(e.target.value)} className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-mimaki-blue/50" />
                  </div>
                  <div className="w-24">
                     <label className="text-[10px] font-bold uppercase text-slate-400">Likutis</label>
                     <input type="number" value={newInkInv} onChange={e => setNewInkInv(e.target.value ? Number(e.target.value) : '')} className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-mimaki-blue/50" />
                  </div>
                  <Button onClick={handleAddInk} disabled={!newInkName} className="h-12 bg-mimaki-blue hover:bg-blue-600 px-6 rounded-xl font-bold uppercase text-xs">
                     <Plus className="w-4 h-4 mr-2" /> Pridėti
                  </Button>
               </div>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pavadinimas</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">QR Kodas</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Likutis</th>
                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Veiksmai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!selectedPrinter.inks || selectedPrinter.inks.length === 0) ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic font-medium">Nėra priskirtų dažų</td></tr>
                  ) : (
                    selectedPrinter.inks.map(ink => (
                      <tr key={ink.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-700">{ink.name}</td>
                        <td className="p-4 text-slate-500 text-sm font-mono">{ink.qrCode || '—'}</td>
                        <td className="p-4">
                           <input 
                             type="number" 
                             value={ink.inventory} 
                             onChange={(e) => handleUpdateInkInv(ink.id, Number(e.target.value))}
                             className={`w-20 rounded-lg px-2 py-1 font-bold outline-none border ${ink.inventory <= 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-emerald-600 border-slate-200 focus:ring-2 focus:ring-emerald-500'}`}
                           />
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteInk(ink.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nustatymai */}
        <Card className="col-span-1 border-mimaki-blue/20 shadow-md">
          <CardHeader className="bg-blue-50/50 rounded-t-xl pb-4 border-b border-blue-100">
            <CardTitle className="flex items-center gap-2 text-mimaki-blue">
              <QrCode className="w-5 h-5" /> Pagrindinis Įrankio Kodas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Bendras Dažų Įrankio QR</label>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={qrCode}
                onChange={e => setQrCode(e.target.value)}
                placeholder="Skaitmeninis kodas..."
                className="flex-1 rounded-xl border-slate-200 bg-slate-50 px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-mimaki-blue/50"
              />
              <Button onClick={handleSaveQr} disabled={isSavingQr} className="bg-mimaki-blue hover:bg-blue-600 px-4">
                <Save className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">Naudojamas norint atidaryti įrankį ir pasirinkti spausdintuvą.</p>
          </CardContent>
        </Card>

        {/* Spausdintuvai */}
        <Card className="col-span-1 lg:col-span-2 border-emerald-500/20 shadow-md overflow-hidden">
          <CardHeader className="bg-emerald-50/50 rounded-t-xl pb-4 border-b border-emerald-100">
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <Droplet className="w-5 h-5" /> Spausdintuvų Dažų Valdymas
            </CardTitle>
          </CardHeader>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Spausdintuvas</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dažų Rūšys</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Veiksmai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedPrinters.map(printer => {
                  const inksCount = printer.inks?.length || 0;
                  const hasZeroInventory = printer.inks?.some(i => i.inventory <= 0);

                  return (
                    <tr key={printer.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-700 text-sm">{printer.name}</td>
                      <td className="p-4">
                        {inksCount === 0 ? (
                           <span className="text-xs font-bold text-slate-300">Nepriskirta</span>
                        ) : (
                           <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${hasZeroInventory ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                             {inksCount} rūšys
                           </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          onClick={() => setSelectedPrinter(printer)}
                          variant="outline"
                          className="h-8 px-4 border-slate-200 text-slate-600 hover:text-mimaki-blue hover:border-mimaki-blue/30 rounded-xl"
                        >
                          <Settings2 className="w-3 h-3 mr-2" /> Valdyti Dažus
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Žurnalas */}
      <Card className="border-slate-200 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 rounded-t-xl pb-4 border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <History className="w-5 h-5" /> Dažų Naudojimo Žurnalas
          </CardTitle>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ieškoti žurnale..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-mimaki-blue/50 w-full md:w-64"
              />
            </div>
            
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-mimaki-blue focus:border-mimaki-blue block p-2 py-2 font-bold uppercase min-w-[140px]"
            />

            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-mimaki-blue focus:border-mimaki-blue block p-2 py-2 font-bold uppercase min-w-[130px]"
            >
              <option value="All">Visos</option>
              <option value="Dieninė">Dieninė (06-18)</option>
              <option value="Naktinė">Naktinė (18-06)</option>
            </select>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operatorius</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Spausdintuvas</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Spalva</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Veiksmas</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pokytis</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nuotrauka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic font-medium">Nėra įrašų</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('lt-LT')}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-700">{log.operatorName}</td>
                    <td className="p-4 text-sm text-slate-600">{log.printerName}</td>
                    <td className="p-4 text-sm font-bold text-mimaki-blue">{log.inkName || '—'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        log.action === 'NEW_BOTTLE' ? 'bg-mimaki-blue/10 text-mimaki-blue' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {log.action === 'NEW_BOTTLE' ? 'Naujas Butelis' : 'Pradėtas Butelis'}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.quantityChange !== 0 ? (
                        <span className="text-red-500 font-bold text-sm">{log.quantityChange}</span>
                      ) : (
                        <span className="text-slate-300 font-medium text-sm">0</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {log.photoUrl ? (
                        <a href={log.photoUrl} target="_blank" rel="noreferrer" className="inline-block relative group">
                          <img src={log.photoUrl} alt="Ink" className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-sm transition-transform group-hover:scale-150 group-hover:-translate-x-2 group-hover:-translate-y-2 group-hover:z-10 relative" />
                        </a>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
