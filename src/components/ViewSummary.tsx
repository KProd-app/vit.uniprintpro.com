
import React from 'react';
import { PrinterData, PrinterStatus } from '../types';
import { INITIAL_VIT_CHECKLIST } from '../constants';

interface ViewSummaryProps {
  printer: PrinterData;
  onBack: () => void;
}

export const ViewSummary: React.FC<ViewSummaryProps> = ({ printer, onBack }) => {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">{printer.name}</h2>
          <p className="text-slate-500 mt-1">Dienos būsenos peržiūra</p>
        </div>
        <button
          onClick={onBack}
          className="py-3 px-8 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all"
        >
          Grįžti į Dashboard
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <span className="w-2 h-2 bg-slate-900 rounded-full mr-3"></span>
              Sistemos Statusas
            </h3>
            <div className="flex items-center space-x-4">
              <span className={`px-6 py-2 rounded-full font-bold text-lg border ${
                printer.status === PrinterStatus.READY_TO_WORK ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {printer.status}
              </span>
              {printer.status === PrinterStatus.READY_TO_WORK && (
                <span className="text-emerald-600 font-bold">✓ Parengta gamybai</span>
              )}
            </div>
          </section>

          <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <span className="w-2 h-2 bg-slate-900 rounded-full mr-3"></span>
              Priežiūra & Nozzle Checks
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-50">
                <span className="text-slate-600">Maintenance:</span>
                <span className={printer.maintenanceDone ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                  {printer.maintenanceDone ? 'ATLIKTA' : 'neatlikta'}
                </span>
              </div>
              
              {printer.isMimaki && (
                <div className="py-3 border-b border-slate-50">
                   <p className="text-slate-600 mb-2">Pasirinkti Mimaki blokai:</p>
                   <div className="flex flex-wrap gap-2">
                     {printer.selectedMimakiUnits?.map(u => (
                       <span key={u} className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold">Blokas {u}</span>
                     ))}
                   </div>
                </div>
              )}

              {printer.isMimaki ? (
                <div className="mt-6 space-y-6">
                  {printer.selectedMimakiUnits?.map(u => (
                    <div key={u} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50">
                       <div className="p-3 bg-white border-b border-slate-100 flex justify-between items-center">
                          <span className="text-sm font-black uppercase">Blokas {u}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{printer.mimakiNozzleFiles?.[u]?.timestamp || 'Nėra'}</span>
                       </div>
                       {printer.mimakiNozzleFiles?.[u] ? (
                         <img src={printer.mimakiNozzleFiles[u].url} className="w-full h-auto" />
                       ) : (
                         <div className="p-10 text-center text-slate-300 font-bold uppercase text-xs">Nuotraukos nėra</div>
                       )}
                    </div>
                  ))}
                </div>
              ) : (
                printer.nozzleFile && (
                  <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col">
                    <img src={printer.nozzleFile.url} className="max-h-60 object-contain w-full" />
                    <div className="p-3 bg-white text-xs text-slate-500 flex justify-between">
                      <span>Nozzle Check</span>
                      <span>{printer.nozzleFile.timestamp}</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        </div>

        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <span className="w-2 h-2 bg-slate-900 rounded-full mr-3"></span>
            VIT Ataskaita
          </h3>
          {/* Rest of VIT form summary same as before */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500 uppercase font-bold">Pamaina:</span>
              <span className="font-bold text-slate-800">{printer.vit.shift || '—'}</span>
            </div>
            <div>
              <p className="text-sm text-slate-500 uppercase font-bold mb-4">Atlikti veiksmai:</p>
              <div className="grid grid-cols-1 gap-2">
                {INITIAL_VIT_CHECKLIST.map(item => (
                  <div key={item} className="flex items-center space-x-3">
                    {printer.vit.checklist[item] ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-200"></div>
                    )}
                    <span className={printer.vit.checklist[item] ? 'text-slate-800' : 'text-slate-300 line-through'}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {printer.vit.notes && (
              <div className="p-4 bg-slate-50 rounded-xl text-slate-700 italic">"{printer.vit.notes}"</div>
            )}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Parašas:</p>
                <p className="font-bold text-slate-900 text-lg">{printer.vit.signature || '—'}</p>
              </div>
              {printer.vit.confirmed && (
                <div className="px-4 py-2 bg-emerald-50 rounded-lg text-emerald-600 text-xs font-black border-4 border-emerald-100 transform -rotate-12">PATVIRTINTA</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
