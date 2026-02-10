
import React, { useState } from 'react';
import { PrinterData, PrinterStatus } from '../types';

interface AdminViewProps {
  printers: PrinterData[];
  onBack: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ printers, onBack }) => {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {selectedImg && (
        <div 
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-10 cursor-zoom-out"
          onClick={() => setSelectedImg(null)}
        >
          <img src={selectedImg} className="max-w-full max-h-full rounded-2xl shadow-2xl" alt="Zoomed" />
        </div>
      )}

      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Gamybos Kontrolė</h1>
          <p className="text-slate-500 font-medium text-lg">Visų įrenginių vizualinė patikra</p>
        </div>
        <button
          onClick={onBack}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
        >
          Grįžti į Dashboard
        </button>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {printers.map((printer) => (
          <div key={printer.id} className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
            <div className="flex-1 p-10 border-r border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">{printer.name}</h3>
                <span className={`px-4 py-2 rounded-xl text-xs font-black border uppercase ${
                  printer.status === PrinterStatus.WORKING ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-400'
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
              {printer.nozzleFile ? (
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
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
