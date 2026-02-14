
import React, { useState, useEffect } from 'react';
import { PrinterData, PrinterStatus, User, ChecklistTemplate } from '../types';
import { END_SHIFT_CHECKLIST as DEFAULT_END_SHIFT_CHECKLIST } from '../constants';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Check, X, ClipboardList, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EndShiftProcessProps {
  printer: PrinterData;
  currentUser: User;
  checklistTemplates: ChecklistTemplate[];
  onFinish: (message: string, checklist: { [key: string]: boolean }, production: number, defects: number) => void;
  onCancel: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const EndShiftProcess: React.FC<EndShiftProcessProps> = ({ printer, currentUser, checklistTemplates, onFinish, onCancel, addToast }) => {
  // If checklist exists, skip to step 2
  const [step, setStep] = useState(() => {
    return (printer.endShiftChecklist && Object.keys(printer.endShiftChecklist).length > 0) ? 2 : 1;
  });

  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>(printer.endShiftChecklist || {});
  const [message, setMessage] = useState(printer.nextOperatorMessage || '');
  const [productionAmount, setProductionAmount] = useState<string>(printer.productionAmount?.toString() || '');
  const [defectsAmount, setDefectsAmount] = useState<string>(printer.defectsAmount?.toString() || '');
  const [confirmed, setConfirmed] = useState(false);

  // Determine which checklist items to use
  const activeChecklistItems = React.useMemo(() => {
    if (printer.endShiftChecklistId) {
      const template = checklistTemplates.find(t => t.id === printer.endShiftChecklistId);
      if (template) return template.items;
    }
    return DEFAULT_END_SHIFT_CHECKLIST;
  }, [printer.endShiftChecklistId, checklistTemplates]);

  const toggleCheck = (item: string) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const allChecked = activeChecklistItems.every(item => checklist[item]);

  const handleNext = () => {
    if (!allChecked) {
      addToast("Pažymėkite visus tvarkymo punktus!", "error");
      return;
    }
    if (!confirmed) {
      addToast("Turite patvirtinti darbo pabaigą!", "error");
      return;
    }
    setStep(2);
  };

  const handleComplete = () => {
    const prod = parseFloat(productionAmount);
    const def = parseFloat(defectsAmount);

    if (isNaN(prod) || prod < 0) {
      addToast("Įveskite korektišką pagamintą kiekį!", "error");
      return;
    }
    if (isNaN(def) || def < 0) {
      addToast("Įveskite korektišką brokų kiekį!", "error");
      return;
    }

    onFinish(message, checklist, prod, def);
  };

  return (
    <div className="min-h-screen bg-mimaki-dark/95 backdrop-blur-xl flex items-center justify-center p-0 md:p-6 z-[100] animate-in fade-in duration-300">
      <Card className="w-full max-w-3xl border-0 shadow-none md:shadow-2xl flex flex-col h-full min-h-screen md:min-h-0 md:max-h-[90vh] bg-white rounded-none md:rounded-[3rem] overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex justify-between items-center flex-shrink-0 bg-white/50 backdrop-blur-md">
          <div>
            <h2 className="text-3xl font-black text-mimaki-dark tracking-tighter uppercase relative">
              {step === 1 ? 'Darbo Pabaiga' : 'Gamybos Ataskaita'}
              <div className="absolute -bottom-2 left-0 w-12 h-1 bg-mimaki-blue rounded-full"></div>
            </h2>
            <p className="text-mimaki-blue font-black uppercase text-[10px] tracking-[0.2em] mt-3">
              {printer.name} • {step === 1 ? '1 žingsnis' : '2 žingsnis'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-2xl h-12 w-12 hover:bg-slate-100">
            <X className="w-8 h-8 text-slate-400" />
          </Button>
        </div>

        <div className="p-10 overflow-y-auto space-y-10 flex-1">
          {step === 1 && (
            <div className="animate-in slide-in-from-right-8 duration-500 space-y-12">
              {/* Checklist */}
              <div>
                <Label className="uppercase tracking-widest mb-6 block text-[10px] font-black text-slate-400 pl-2">Sutvarkymo punktų žymėjimas</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeChecklistItems.map(item => (
                    <div
                      key={item}
                      onClick={() => toggleCheck(item)}
                      className={cn(
                        "flex items-center p-5 rounded-3xl border transition-all cursor-pointer select-none group",
                        checklist[item] ? "bg-emerald-50/50 border-emerald-500 shadow-md" : "bg-slate-50 border-transparent hover:border-slate-200"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center transition-colors", checklist[item] ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white group-hover:border-mimaki-blue")}>
                        {checklist[item] && <Check className="w-5 h-5 text-white" />}
                      </div>
                      <span className={cn("ml-4 font-bold transition-colors", checklist[item] ? "text-emerald-900" : "text-slate-600 group-hover:text-mimaki-dark")}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message for next operator */}
              <div>
                <Label className="uppercase tracking-widest mb-6 block text-[10px] font-black text-slate-400 pl-2">Žinutė kitam operatoriui</Label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] font-bold text-slate-900 focus:ring-2 focus:ring-mimaki-blue/20 outline-none h-32 resize-none placeholder:text-slate-400 transition-all shadow-inner"
                  placeholder="Pvz.: Viskas veikia puikiai, palikau pilnas talpas!"
                />
              </div>

              {/* Confirmation */}
              <div
                onClick={() => setConfirmed(!confirmed)}
                className={cn(
                  "flex items-center p-8 text-white rounded-[2.5rem] shadow-2xl cursor-pointer active:scale-[0.98] transition-all select-none border-4",
                  confirmed ? "bg-mimaki-dark border-mimaki-dark" : "bg-slate-800 border-transparent hover:bg-slate-700"
                )}
              >
                <div className={cn("w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-colors shadow-lg", confirmed ? "bg-emerald-500 border-emerald-500" : "border-white/20 bg-white/10")}>
                  {confirmed && <Check className="w-6 h-6 text-white" />}
                </div>
                <div className="ml-6">
                  <p className="text-xl font-black uppercase tracking-tight">Patvirtinu darbo pabaigą</p>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1">Aš, {currentUser.name}, palieku stotį tvarkingą</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-8 duration-500 space-y-12 py-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-emerald-100/50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <ClipboardList className="w-12 h-12" />
                </div>
                <h3 className="text-4xl font-black text-mimaki-dark uppercase tracking-tighter">Pamainos Rezultatai</h3>
                <p className="text-slate-500 mt-3 font-medium text-lg">Suveskite šiandienos gamybos duomenis</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Production Amount */}
                <div className="bg-emerald-50/50 p-10 rounded-[3rem] border border-emerald-100 flex flex-col focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all shadow-inner">
                  <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Pagamintas kiekis</h3>
                  <div className="flex items-center justify-center">
                    <input
                      type="number"
                      autoFocus
                      value={productionAmount}
                      onChange={(e) => setProductionAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent border-none p-0 font-black text-6xl text-emerald-900 focus:ring-0 outline-none text-center placeholder-emerald-900/20"
                    />
                  </div>
                  <p className="text-emerald-600/60 text-[10px] font-black uppercase tracking-widest mt-6 text-center">vnt. / m²</p>
                </div>

                {/* Defects Amount */}
                <div className="bg-red-50/50 p-10 rounded-[3rem] border border-red-100 flex flex-col focus-within:ring-4 focus-within:ring-red-500/20 transition-all shadow-inner">
                  <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-4">Broko kiekis</h3>
                  <div className="flex items-center justify-center">
                    <input
                      type="number"
                      value={defectsAmount}
                      onChange={(e) => setDefectsAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent border-none p-0 font-black text-6xl text-red-900 focus:ring-0 outline-none text-center placeholder-red-900/20"
                    />
                  </div>
                  <p className="text-red-600/60 text-[10px] font-black uppercase tracking-widest mt-6 text-center">vnt. / m²</p>
                </div>
              </div>

              <div className="bg-blue-50/50 p-6 rounded-3xl text-center text-blue-700 text-sm font-medium border border-blue-100">
                Svarbu: Suvedus duomenis jie bus automatiškai išsaugoti administratoriaus ataskaitoje.
              </div>
            </div>
          )}
        </div>

        <div className="p-10 bg-slate-50 border-t border-slate-200 flex space-x-4 flex-shrink-0">
          {step === 1 ? (
            <>
              <Button variant="outline" size="lg" onClick={onCancel} className="flex-1 uppercase tracking-widest text-slate-400 rounded-3xl h-16 text-lg">Atšaukti</Button>
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!allChecked || !confirmed}
                className="flex-[2] uppercase tracking-widest font-black text-lg bg-mimaki-dark shadow-xl shadow-mimaki-dark/30 rounded-3xl h-16"
              >
                TOLIAU <ChevronRight className="ml-2" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1 uppercase tracking-widest rounded-3xl h-16 text-lg">Atgal</Button>
              <Button
                size="lg"
                onClick={handleComplete}
                disabled={productionAmount === '' || defectsAmount === ''}
                className="flex-[2] uppercase tracking-widest font-black text-lg bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-500/30 rounded-3xl h-16"
              >
                BAIGTI PAMAINĄ
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
