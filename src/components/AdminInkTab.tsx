import React, { useEffect, useState } from 'react';
import { PrinterData, InkLog, AppSetting } from '../types';
import { usePrinters } from '../contexts/DataContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Droplet, Plus, Save, QrCode, Search, History } from 'lucide-react';

export const AdminInkTab: React.FC<{ printers: PrinterData[], addToast?: (m: string, t: 'success'|'error') => void }> = ({ printers, addToast }) => {
  const { getSettings, updateSetting, getInkLogs, updatePrinter } = usePrinters();
  const [logs, setLogs] = useState<InkLog[]>([]);
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [isSavingQr, setIsSavingQr] = useState(false);
  const [inventoryToAdd, setInventoryToAdd] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const fetchedLogs = await getInkLogs();
      setLogs(fetchedLogs || []);

      const fetchedSettings = await getSettings();
      setSettings(fetchedSettings || []);
      const qrSetting = fetchedSettings?.find(s => s.key === 'inkToolQrCode');
      if (qrSetting) {
        setQrCode(qrSetting.value);
      }
    } catch (error) {
      console.error("Error loading ink tab data:", error);
    }
  };

  const handleSaveQr = async () => {
    setIsSavingQr(true);
    try {
      await updateSetting('inkToolQrCode', qrCode);
      addToast?.('QR Kodas išsaugotas!', 'success');
    } catch (e) {
      addToast?.('Klaida išsaugant QR kodą', 'error');
    } finally {
      setIsSavingQr(false);
    }
  };

  const handleAddInventory = async (printerId: string, currentInventory: number) => {
    const toAdd = inventoryToAdd[printerId] || 0;
    if (toAdd <= 0) return;

    try {
      await updatePrinter(printerId, {
        inkInventory: (currentInventory || 0) + toAdd
      });
      addToast?.('Inventorius atnaujintas!', 'success');
      setInventoryToAdd({ ...inventoryToAdd, [printerId]: 0 });
    } catch (e) {
      addToast?.('Klaida atnaujinant inventorių', 'error');
    }
  };

  const filteredLogs = logs.filter(l => 
    l.printerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.operatorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nustatymai */}
        <Card className="col-span-1 border-mimaki-blue/20 shadow-md">
          <CardHeader className="bg-blue-50/50 rounded-t-xl pb-4 border-b border-blue-100">
            <CardTitle className="flex items-center gap-2 text-mimaki-blue">
              <QrCode className="w-5 h-5" /> Nustatymai
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Įrankio QR Kodas</label>
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
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">Šis kodas bus naudojamas skenuojant per "Dashboard" skanerį, norint atidaryti Dažų pildymo įrankį.</p>
          </CardContent>
        </Card>

        {/* Likučiai */}
        <Card className="col-span-1 lg:col-span-2 border-emerald-500/20 shadow-md overflow-hidden">
          <CardHeader className="bg-emerald-50/50 rounded-t-xl pb-4 border-b border-emerald-100">
            <CardTitle className="flex items-center gap-2 text-emerald-600">
              <Droplet className="w-5 h-5" /> Spausdintuvų Dažų Inventorius
            </CardTitle>
          </CardHeader>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Spausdintuvas</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Likutis</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Veiksmai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {printers.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-700 text-sm">{p.name}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        (p.inkInventory || 0) <= 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {p.inkInventory || 0} vnt.
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="+ Skaičius"
                          value={inventoryToAdd[p.id] || ''}
                          onChange={(e) => setInventoryToAdd({ ...inventoryToAdd, [p.id]: parseInt(e.target.value) || 0 })}
                          className="w-24 rounded-lg border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <Button 
                          onClick={() => handleAddInventory(p.id, p.inkInventory || 0)} 
                          disabled={!inventoryToAdd[p.id]}
                          className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-[10px]"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Pridėti
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ieškoti žurnale..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-mimaki-blue/50 w-64"
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white border-b border-slate-100">
              <tr>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operatorius</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Spausdintuvas</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Veiksmas</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventoriaus Pokytis</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Nuotrauka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic font-medium">Nėra įrašų</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('lt-LT')}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-700">{log.operatorName}</td>
                    <td className="p-4 text-sm text-slate-600">{log.printerName}</td>
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
