
import React, { useState } from 'react';
import { PrinterData, PrinterStatus, User } from '../types';
import { END_SHIFT_CHECKLIST } from '../constants';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Check, X, ClipboardList, PenTool, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EndShiftProcessProps {
  printer: PrinterData;
  currentUser: User;
  onFinish: (message: string, checklist: { [key: string]: boolean }, production: number, defects: number) => void;
  onCancel: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const EndShiftProcess: React.FC<EndShiftProcessProps> = ({ printer, currentUser, onFinish, onCancel, addToast }) => {
  const [step, setStep] = useState(1);
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({});
  const [message, setMessage] = useState('');
  const [productionAmount, setProductionAmount] = useState<string>('');
  const [defectsAmount, setDefectsAmount] = useState<string>('');
  const [confirmed, setConfirmed] = useState(false);

  const toggleCheck = (item: string) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const allChecked = END_SHIFT_CHECKLIST.every(item => checklist[item]);

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
    <div className="min-h-screen bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
      <Card className="w-full max-w-3xl border-0 shadow-2xl flex flex-col max-h-[90vh] bg-white rounded-[40px]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
              {step === 1 ? 'Darbo Pabaiga' : 'Gamybos Ataskaita'}
            </h2>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
              {printer.name} • {step === 1 ? '1 žingsnis' : '2 žingsnis'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full h-12 w-12 hover:bg-slate-100">
            <X className="w-8 h-8 text-slate-400" />
          </Button>
        </div>

        <div className="p-8 overflow-y-auto space-y-10 flex-1">
          {step === 1 && (
            <div className="animate-in slide-in-from-right-8 duration-500 space-y-10">
              {/* Checklist */}
              <div>
                <Label className="uppercase tracking-widest mb-6 block text-slate-400">Sutvarkymo punktų žymėjimas</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {END_SHIFT_CHECKLIST.map(item => (
                    <div
                      key={item}
                      onClick={() => toggleCheck(item)}
                      className={cn(
                        "flex items-center p-5 rounded-2xl border-2 transition-all cursor-pointer select-none",
                        checklist[item] ? "bg-emerald-50 border-emerald-500" : "bg-slate-50 border-transparent hover:border-slate-200"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors", checklist[item] ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white")}>
                        {checklist[item] && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className={cn("ml-4 font-bold transition-colors", checklist[item] ? "text-emerald-700" : "text-slate-600")}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message for next operator */}
              <div>
                <Label className="uppercase tracking-widest mb-6 block text-slate-400">Žinutė kitam operatoriui</Label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl font-medium focus:ring-2 focus:ring-slate-900 outline-none h-32 resize-none"
                  placeholder="Pvz.: Viskas veikia puikiai, palikau pilnas talpas!"
                />
              </div>

              {/* Confirmation */}
              <div
                onClick={() => setConfirmed(!confirmed)}
                className={cn(
                  "flex items-center p-8 text-white rounded-3xl shadow-xl cursor-pointer active:scale-[0.98] transition-all select-none",
                  confirmed ? "bg-slate-900" : "bg-slate-700 hover:bg-slate-800"
                )}
              >
                <div className={cn("w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-colors", confirmed ? "bg-emerald-500 border-emerald-500" : "border-white/30 bg-white/10")}>
                  {confirmed && <Check className="w-5 h-5 text-white" />}
                </div>
                <div className="ml-6">
                  <p className="text-xl font-black uppercase tracking-tight">Patvirtinu darbo pabaigą</p>
                  <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Aš, {currentUser.name}, palieku stotį tvarkingą</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-8 duration-500 space-y-12 py-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ClipboardList className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Pamainos Rezultatai</h3>
                <p className="text-slate-500 mt-2">Suveskite šiandienos gamybos duomenis</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Production Amount */}
                <div className="bg-emerald-50 p-8 rounded-[32px] border-2 border-emerald-100 flex flex-col focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4">Pagamintas kiekis</h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      autoFocus
                      value={productionAmount}
                      onChange={(e) => setProductionAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent border-none p-0 font-black text-5xl text-emerald-900 focus:ring-0 outline-none text-center placeholder-emerald-900/20"
                    />
                  </div>
                  <p className="text-emerald-600/60 text-[10px] font-black uppercase tracking-widest mt-4 text-center">vnt. / m²</p>
                </div>

                {/* Defects Amount */}
                <div className="bg-red-50 p-8 rounded-[32px] border-2 border-red-100 flex flex-col focus-within:ring-2 focus-within:ring-red-500 transition-all">
                  <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-4">Broko kiekis</h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      value={defectsAmount}
                      onChange={(e) => setDefectsAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent border-none p-0 font-black text-5xl text-red-900 focus:ring-0 outline-none text-center placeholder-red-900/20"
                    />
                  </div>
                  <p className="text-red-600/60 text-[10px] font-black uppercase tracking-widest mt-4 text-center">vnt. / m²</p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl text-center text-slate-500 text-sm font-medium border border-slate-100">
                Svarbu: Suvedus duomenis jie bus automatiškai išsaugoti administratoriaus ataskaitoje.
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-200 flex space-x-4 flex-shrink-0">
          {step === 1 ? (
            <>
              <Button variant="outline" size="lg" onClick={onCancel} className="flex-1 uppercase tracking-widest text-slate-400">Atšaukti</Button>
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!allChecked || !confirmed}
                className="flex-[2] uppercase tracking-widest font-black text-lg bg-slate-900 shadow-xl"
              >
                TOLIAU
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1 uppercase tracking-widest">Atgal</Button>
              <Button
                size="lg"
                onClick={handleComplete}
                disabled={productionAmount === '' || defectsAmount === ''}
                className="flex-[2] uppercase tracking-widest font-black text-lg bg-emerald-600 hover:bg-emerald-500 shadow-xl"
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
