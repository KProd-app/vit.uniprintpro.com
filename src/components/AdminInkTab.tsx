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
  const [newInkMinInv, setNewInkMinInv] = useState<number | ''>('');

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
      inventory: Number(newInkInv) || 0,
      minQuantity: Number(newInkMinInv) || 0
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
      setNewInkMinInv('');
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

  const handleUpdateInkMinInv = async (inkId: string, newValue: number) => {
     if (!selectedPrinter) return;
     const currentInks = selectedPrinter.inks || [];
     const updatedInks = currentInks.map(i => i.id === inkId ? { ...i, minQuantity: newValue } : i);

     try {
       await syncGroupedInks(selectedPrinter.id, updatedInks, printers, updatePrinter);
       setSelectedPrinter({ ...selectedPrinter, inks: updatedInks });
     } catch(e) {
       addToast?.('Klaida atnaujinant minimalų likutį', 'error');
     }
  };

  const filteredLogs = logs.filter(l => 
    l.printerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.inkName && l.inkName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      
      {/* INK EDITOR MODAL */}
      {selectedPrinter && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 md:p-8 w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6 shrink-0">
               <div>
                 <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                   <Droplet className="w-6 h-6 text-emerald-500" />
                   {selectedPrinter.name}
                 </h3>
                 <p className="text-sm font-medium text-slate-500 mt-1">Pridėkite arba redaguokite priskirtas dažų rūšis</p>
               </div>
               <Button variant="ghost" onClick={() => setSelectedPrinter(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full h-12 w-12 p-0">
                  ✕
               </Button>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl p-5 mb-6 border border-emerald-100 shrink-0">
               <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Plus className="w-4 h-4" /> Pridėti Naują Dažą
               </h4>
               <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                     <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Pavadinimas (pvz. Cyan)</label>
                     <input type="text" value={newInkName} onChange={e => setNewInkName(e.target.value)} placeholder="Įveskite pavadinimą" className="w-full h-11 rounded-xl border border-slate-200 px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow bg-white" />
                  </div>
                  <div className="flex-1 w-full">
                     <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">QR Kodas / Barkodas</label>
                     <input type="text" value={newInkQr} onChange={e => setNewInkQr(e.target.value)} placeholder="Skenuokite kodą" className="w-full h-11 rounded-xl border border-slate-200 px-4 font-mono font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow bg-white" />
                  </div>
                  <div className="w-full md:w-24">
                     <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Min. Likutis</label>
                     <input type="number" value={newInkMinInv} onChange={e => setNewInkMinInv(e.target.value ? Number(e.target.value) : '')} placeholder="0" className="w-full h-11 rounded-xl border border-slate-200 px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow bg-white" />
                  </div>
                  <div className="w-full md:w-28">
                     <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Likutis (Vnt.)</label>
                     <input type="number" value={newInkInv} onChange={e => setNewInkInv(e.target.value ? Number(e.target.value) : '')} placeholder="0" className="w-full h-11 rounded-xl border border-slate-200 px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow bg-white" />
                  </div>
                  <Button onClick={handleAddInk} disabled={!newInkName} className="w-full md:w-auto h-11 bg-emerald-500 hover:bg-emerald-600 px-8 rounded-xl font-bold uppercase text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95">
                     Pridėti
                  </Button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
              <div className="space-y-3">
                {(!selectedPrinter.inks || selectedPrinter.inks.length === 0) ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                    <Droplet className="w-8 h-8 mb-3 opacity-20" />
                    <span className="text-sm font-bold uppercase tracking-wider">Nėra priskirtų dažų</span>
                  </div>
                ) : (
                  selectedPrinter.inks.map(ink => {
                    const isLow = ink.inventory <= (ink.minQuantity || 0);
                    return (
                    <div key={ink.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border ${isLow ? 'border-red-300 shadow-sm' : 'border-slate-200'} rounded-2xl hover:border-emerald-300 hover:shadow-sm transition-all gap-4`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`font-black text-lg ${isLow ? 'text-red-600' : 'text-slate-800'}`}>{ink.name}</div>
                          {isLow && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Trūksta</span>}
                        </div>
                        <div className="text-slate-400 text-xs font-mono bg-slate-100 inline-block px-2 py-0.5 rounded-md">{ink.qrCode || 'Barkodas nepriskirtas'}</div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                           <label className="text-[10px] font-bold uppercase text-slate-400 mb-1" title="Minimalus leistinas kiekis">Min. Likutis</label>
                           <input 
                             type="number" 
                             value={ink.minQuantity || 0} 
                             onChange={(e) => handleUpdateInkMinInv(ink.id, Number(e.target.value))}
                             className="w-20 h-10 rounded-xl px-3 font-bold text-sm outline-none border text-center transition-all bg-slate-50 text-slate-600 border-slate-200 focus:ring-2 focus:ring-emerald-500/50"
                           />
                        </div>
                        <div className="flex flex-col items-end">
                           <label className="text-[10px] font-bold uppercase text-slate-400 mb-1">Likutis</label>
                           <input 
                             type="number" 
                             value={ink.inventory} 
                             onChange={(e) => handleUpdateInkInv(ink.id, Number(e.target.value))}
                             className={`w-24 h-10 rounded-xl px-3 font-black text-lg outline-none border text-center transition-all ${isLow ? 'bg-red-50 text-red-600 border-red-200 focus:ring-red-500/50 ring-2 ring-red-500/20' : 'bg-slate-50 text-emerald-700 border-slate-200 focus:ring-2 focus:ring-emerald-500/50'}`}
                           />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteInk(ink.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl h-10 w-10 mt-5">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )})
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER & SETTINGS */}
      <div className="flex flex-col xl:flex-row gap-6 items-start justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex-1">
           <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 mb-2">
             <Droplet className="w-8 h-8 text-emerald-500" /> Dažų Valdymas
           </h2>
           <p className="text-sm font-medium text-slate-500 max-w-xl leading-relaxed">
             Priskirkite dažų rūšis įrenginiams, priskirkite barkodus nuskaitymui ir stebėkite likučius.
           </p>
        </div>

        <div className="w-full xl:w-auto flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-2 pl-4 rounded-2xl border border-slate-200">
           <div className="flex items-center gap-2 text-slate-600 font-bold text-sm uppercase tracking-wide">
             <QrCode className="w-4 h-4 text-mimaki-blue" /> Įrankio QR
           </div>
           <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={qrCode}
              onChange={e => setQrCode(e.target.value)}
              placeholder="Kodas..."
              className="w-full sm:w-48 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono font-bold text-slate-700 outline-none focus:ring-2 focus:ring-mimaki-blue/50 text-sm shadow-sm"
            />
            <Button onClick={handleSaveQr} disabled={isSavingQr} className="bg-mimaki-blue hover:bg-blue-600 px-4 h-[38px] rounded-xl shadow-md shadow-blue-500/20">
              IŠSAUGOTI
            </Button>
           </div>
        </div>
      </div>

      {/* PRINTER GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {groupedPrinters.map(printer => {
          const inksCount = printer.inks?.length || 0;
          const hasZeroInventory = printer.inks?.some(i => i.inventory <= 0);

          return (
            <div 
              key={printer.id} 
              onClick={() => setSelectedPrinter(printer)}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between h-36 relative overflow-hidden"
            >
               {/* Decorative background element */}
               <div className="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500 ease-out z-0" />
               
               <div className="flex justify-between items-start relative z-10">
                  <h3 className="font-black text-slate-800 text-xl group-hover:text-emerald-600 transition-colors line-clamp-1 pr-4">{printer.name}</h3>
                  <div className={`w-3 h-3 rounded-full mt-2 shrink-0 shadow-inner ${inksCount > 0 ? (hasZeroInventory ? 'bg-red-500 shadow-red-500/50' : 'bg-emerald-500 shadow-emerald-500/50') : 'bg-slate-300'}`} />
               </div>
               
               <div className="flex justify-between items-end mt-auto relative z-10">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dažų rūšys</span>
                   <span className={`font-black text-sm px-3 py-1 rounded-lg ${inksCount > 0 ? (hasZeroInventory ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700') : 'bg-slate-100 text-slate-500'}`}>
                     {inksCount > 0 ? `${inksCount} VNT.` : 'NEPRISKIRTA'}
                   </span>
                 </div>
                 <div className="text-emerald-500 bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                    <Settings2 className="w-5 h-5" />
                 </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* ŽURNALAS */}
      <Card className="border-slate-200 shadow-sm rounded-[32px] overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-50/80 pb-5 border-b border-slate-100 gap-4">
          <CardTitle className="flex items-center gap-3 text-slate-800 font-black text-xl">
            <History className="w-6 h-6 text-slate-400" /> Dažų Žurnalas
          </CardTitle>
          
          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ieškoti pagal operatorių, dažą..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full rounded-xl bg-transparent text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-mimaki-blue/20 transition-shadow"
              />
            </div>
            
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-slate-700 text-sm px-3 py-2 font-bold uppercase outline-none focus:ring-2 focus:ring-mimaki-blue/20 rounded-xl cursor-pointer"
            />

            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="bg-transparent text-slate-700 text-sm px-3 py-2 pr-8 font-bold uppercase outline-none focus:ring-2 focus:ring-mimaki-blue/20 rounded-xl cursor-pointer"
            >
              <option value="All">Visos Pamainos</option>
              <option value="Dieninė">Dieninė (06-18)</option>
              <option value="Naktinė">Naktinė (18-06)</option>
            </select>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Data / Laikas</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operatorius</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Įrenginys</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dažas</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Veiksmas</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Pokytis</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nuotrauka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                     <div className="flex flex-col items-center justify-center opacity-50">
                        <History className="w-10 h-10 mb-4 text-slate-300" />
                        <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Nėra įrašų pagal filtrus</span>
                     </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  // Generate a subtle color based on ink name (e.g. Cyan -> cyan, Magenta -> fuchsia, Yellow -> yellow, Black -> slate)
                  const lowerName = (log.inkName || '').toLowerCase();
                  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (lowerName.includes('cyan') || lowerName.includes('c')) badgeColor = 'bg-cyan-50 text-cyan-700 border-cyan-200';
                  if (lowerName.includes('magenta') || lowerName.includes('m')) badgeColor = 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
                  if (lowerName.includes('yellow') || lowerName.includes('y')) badgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                  if (lowerName.includes('black') || lowerName.includes('k')) badgeColor = 'bg-slate-800 text-white border-slate-900';
                  if (lowerName.includes('white') || lowerName.includes('w')) badgeColor = 'bg-white text-slate-800 border-slate-300 shadow-sm';
                  if (lowerName.includes('varnish') || lowerName.includes('v')) badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-5 text-xs font-bold text-slate-500 whitespace-nowrap">
                        <div className="flex flex-col">
                           <span className="text-slate-700">{new Date(log.createdAt).toLocaleDateString('lt-LT')}</span>
                           <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleTimeString('lt-LT')}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                          {log.operatorName}
                        </div>
                      </td>
                      <td className="p-5 text-sm font-bold text-slate-600">{log.printerName}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${badgeColor}`}>
                          {log.inkName || 'N/A'}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          log.action === 'NEW_BOTTLE' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {log.action === 'NEW_BOTTLE' ? 'Naujas Butelis' : 'Pradėtas'}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        {log.quantityChange !== 0 ? (
                          <span className={`font-black text-sm px-2 py-1 rounded-md ${log.quantityChange < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                             {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-medium text-sm">—</span>
                        )}
                      </td>
                      <td className="p-5 text-right">
                        {log.photoUrl ? (
                          <div className="flex justify-end">
                            <a href={log.photoUrl} target="_blank" rel="noreferrer" className="inline-block relative">
                              <img src={log.photoUrl} alt="Ink" className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm transition-all hover:scale-150 hover:-translate-x-4 hover:z-20 relative" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs font-bold">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
