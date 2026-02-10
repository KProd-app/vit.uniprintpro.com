
import React, { useState, useEffect } from 'react';
import { PrinterData, PrinterStatus, VITData, User, NozzleFile } from '../types';
import { INITIAL_VIT_CHECKLIST } from '../constants';
import { CameraCapture } from './CameraCapture';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Stepper } from './ui/stepper';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { ArrowLeft, ArrowRight, Camera, Check, AlertTriangle, Printer, Info, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Keep this usage or use standard clsx if preferred

interface SetupProcessProps {
  printer: PrinterData;
  currentUser: User;
  onSave: (data: Partial<PrinterData>) => void;
  onFinish: () => void;
  onCancel: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SetupProcess: React.FC<SetupProcessProps> = ({ printer, currentUser, onSave, onFinish, onCancel, addToast }) => {
  // Start at step -1 for the Handover Message
  const [step, setStep] = useState(-1);
  const [localPrinter, setLocalPrinter] = useState<PrinterData>(printer);
  const [showCamera, setShowCamera] = useState<number | null>(null); // null or unit index (0 for normal, 1-8 for Mimaki)
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!localPrinter.vit.signature) {
      const newVit = { ...localPrinter.vit, signature: currentUser.name };
      setLocalPrinter(prev => ({ ...prev, vit: newVit }));
    }
  }, [currentUser, localPrinter.vit.signature]);

  // Define steps for the Stepper component
  const getStepsList = () => {
    const baseSteps = [
      { label: 'Priminimai', description: 'Perdavimas' },
      ...(localPrinter.isMimaki ? [{ label: 'Blokai', description: 'Pasirinkimas' }] : []),
      { label: 'Priežiūra', description: 'Checklist' },
      { label: 'VIT Forma', description: 'Valymas' },
      { label: 'Spausdinimas', description: 'Nozzle Check' },
      { label: 'Nuotrauka', description: 'Užfiksavimas' }
    ];
    return baseSteps;
  };

  const stepsList = getStepsList();

  // Calculate current visual step index for Stepper
  const getCurrentStepIndex = () => {
    if (step === -1) return 0;
    if (localPrinter.isMimaki) {
      return step + 1; // -1 -> 0, 0 -> 1, 1 -> 2 ...
    } else {
      return step; // -1 -> 0, 1 -> 1 (skip 0 index in logic but stepper needs tweaks? No wait)
      // If not mimaki: steps are -1, 1, 2, 3, 4.
      // List is: Priminimai (0), Priežiūra (1), VIT (2)...
      // So if step is -1 -> index 0.
      // If step is 1 -> index 1.
      return step === -1 ? 0 : step;
    }
  };

  const handleCapture = (imageData: string) => {
    const timestamp = new Date().toLocaleString('lt-LT');
    const newFile: NozzleFile = { url: imageData, timestamp };

    if (localPrinter.isMimaki && showCamera !== null) {
      const newMimakiFiles = { ...(localPrinter.mimakiNozzleFiles || {}), [showCamera]: newFile };
      const newData = { mimakiNozzleFiles: newMimakiFiles, status: PrinterStatus.IN_PROGRESS };
      setLocalPrinter(prev => ({ ...prev, ...newData }));
      onSave(newData);
    } else {
      const newData = { nozzleFile: newFile, status: PrinterStatus.IN_PROGRESS };
      setLocalPrinter(prev => ({ ...prev, ...newData }));
      onSave(newData);
    }

    setShowCamera(null);
    addToast("Nuotrauka užfiksuota su laiko žyma", "success");
  };

  const updateVIT = (updates: Partial<VITData>) => {
    const newVit = { ...localPrinter.vit, ...updates };
    const newData = { vit: newVit };
    setLocalPrinter(prev => ({ ...prev, ...newData }));
    onSave(newData);
  };

  const toggleVITCheck = (item: string) => {
    const newChecklist = { ...localPrinter.vit.checklist, [item]: !localPrinter.vit.checklist[item] };
    updateVIT({ checklist: newChecklist });
  };

  const toggleMimakiUnit = (unit: number) => {
    const current = localPrinter.selectedMimakiUnits || [];
    const next = current.includes(unit) ? current.filter(u => u !== unit) : [...current, unit].sort();
    const newData = { selectedMimakiUnits: next };
    setLocalPrinter(prev => ({ ...prev, ...newData }));
    onSave(newData);
  };

  const areNozzlesReady = () => {
    if (localPrinter.isMimaki) {
      const selected = localPrinter.selectedMimakiUnits || [];
      if (selected.length === 0) return false;
      return selected.every(u => !!localPrinter.mimakiNozzleFiles?.[u]);
    }
    return localPrinter.nozzleFile !== null;
  };

  const canFinish = areNozzlesReady() && localPrinter.vit.shift !== '' && localPrinter.vit.confirmed && localPrinter.maintenanceDone;

  const nextStep = () => {
    if (step === -1) {
      setStep(localPrinter.isMimaki ? 0 : 1);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (step === (localPrinter.isMimaki ? 0 : 1)) {
      setStep(-1);
    } else {
      setStep(prev => prev - 1);
    }
  };

  if (showConfirmModal) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
        <Card className="max-w-xl w-full text-center shadow-2xl border-slate-800">
          <CardContent className="p-12">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in spin-in-180 duration-500">
              <Check className="w-12 h-12" strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Viskas tvarkoje!</h2>
            <p className="text-slate-500 text-xl mb-10 leading-relaxed font-medium">
              Paruošimas baigtas. Galite pradėti gamybą.
            </p>
            <Button
              size="lg"
              onClick={onFinish}
              className="w-full py-8 text-2xl font-black bg-slate-900 hover:bg-slate-800 shadow-xl"
            >
              PRADĖTI GAMYBĄ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center max-w-[1600px] mx-auto w-full">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-slate-800 leading-none">{localPrinter.name}</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Paruošimo procesas</p>
            </div>
          </div>

          <div className="hidden lg:block w-1/2">
            <Stepper steps={stepsList} currentStep={getCurrentStepIndex()} />
          </div>
        </div>
        {/* Mobile Stepper (simplified) */}
        <div className="lg:hidden px-6 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <span className="text-xs font-bold uppercase text-slate-400">Žingsnis {getCurrentStepIndex() + 1} iš {stepsList.length}</span>
          <span className="text-xs font-bold uppercase text-slate-900">{stepsList[getCurrentStepIndex()].label}</span>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col justify-center">
        <Card className="shadow-lg border-slate-200 overflow-hidden">

          {/* STEP -1: Handover Messages */}
          {step === -1 && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <CardTitle className="text-2xl uppercase">Pranešimai</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="bg-slate-50 border-2 border-slate-100 rounded-[32px] p-8 md:p-10 mb-8">
                  {localPrinter.nextOperatorMessage ? (
                    <div className="space-y-4">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Svarbi informacija:</p>
                      <p className="text-2xl font-bold text-slate-800 leading-relaxed italic">
                        "{localPrinter.nextOperatorMessage}"
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <p className="text-xl font-bold text-slate-600">Jokių problemų užfiksuota nebuvo.</p>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start space-x-4">
                  <Info className="w-6 h-6 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-blue-700 text-sm font-medium leading-relaxed">
                    Susipažinkite su informacija prieš tęsdami. Kitame žingsnyje turėsite pažymėti valymo varneles ir patvirtinti VIT formą.
                  </p>
                </div>
              </CardContent>
            </div>
          )}

          {/* STEP 0: Mimaki Unit Selection */}
          {localPrinter.isMimaki && step === 0 && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-2xl uppercase">Pasirinkite Mimaki blokus</CardTitle></CardHeader>
              <CardContent className="p-8">
                <p className="text-slate-500 mb-8 font-medium">Pažymėkite, su kuriais iš 8 blokų dirbsite šiandien:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(u => (
                    <button
                      key={u}
                      onClick={() => toggleMimakiUnit(u)}
                      className={cn(
                        "py-6 rounded-2xl font-black text-2xl transition-all border-4 flex items-center justify-center",
                        localPrinter.selectedMimakiUnits?.includes(u)
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg scale-105"
                          : "bg-white border-slate-100 text-slate-300 hover:border-slate-200"
                      )}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </CardContent>
            </div>
          )}

          {/* STEP 1: Maintenance */}
          {step === 1 && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-2xl uppercase">1. Priežiūros Check</CardTitle></CardHeader>
              <CardContent className="p-8">
                <label className={cn(
                  "flex items-center p-8 rounded-3xl border-2 transition-all cursor-pointer mb-8",
                  localPrinter.maintenanceDone ? "bg-emerald-50 border-emerald-500" : "bg-slate-50 border-transparent hover:border-slate-200"
                )}>
                  <input
                    type="checkbox"
                    checked={localPrinter.maintenanceDone}
                    onChange={(e) => {
                      const newData = { maintenanceDone: e.target.checked, status: PrinterStatus.IN_PROGRESS };
                      setLocalPrinter(prev => ({ ...prev, ...newData }));
                      onSave(newData);
                    }}
                    className="w-8 h-8 rounded-lg border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900"
                  />
                  <span className={cn("ml-6 text-xl font-bold", localPrinter.maintenanceDone ? "text-slate-900" : "text-slate-700")}>
                    Profilaktinė priežiūra atlikta
                  </span>
                </label>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">Komentaras (Nebūtina)</label>
                <textarea
                  value={localPrinter.maintenanceComment}
                  onChange={(e) => {
                    const newData = { maintenanceComment: e.target.value };
                    setLocalPrinter(prev => ({ ...prev, ...newData }));
                    onSave(newData);
                  }}
                  className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-slate-300 focus:ring-0 outline-none h-40 font-medium resize-none transition-all"
                  placeholder="Papildomos pastabos apie būklę..."
                />
              </CardContent>
            </div>
          )}

          {/* STEP 2: VIT FORM */}
          {step === 2 && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-2xl uppercase">2. VIT Forma</CardTitle></CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <Label className="uppercase tracking-widest text-slate-400">Pamaina</Label>
                    <div className="flex space-x-4">
                      {['Ryto', 'Vakaro'].map(s => (
                        <button
                          key={s}
                          onClick={() => updateVIT({ shift: s as any })}
                          className={cn(
                            "flex-1 py-5 rounded-3xl font-black transition-all border-2",
                            localPrinter.vit.shift === s ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                          )}
                        >
                          {s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {INITIAL_VIT_CHECKLIST.map(item => (
                        <label key={item} className={cn(
                          "flex items-center p-5 rounded-2xl border transition-all cursor-pointer",
                          localPrinter.vit.checklist[item] ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-transparent hover:border-slate-200"
                        )}>
                          <input
                            type="checkbox"
                            checked={localPrinter.vit.checklist[item] || false}
                            onChange={() => toggleVITCheck(item)}
                            className="w-6 h-6 rounded-lg accent-emerald-600"
                          />
                          <span className={cn("ml-4 font-bold", localPrinter.vit.checklist[item] ? "text-emerald-900" : "text-slate-700")}>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <Label className="uppercase tracking-widest text-slate-400">Patvirtinimas</Label>
                    <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-200 h-full flex flex-col justify-center">
                      <Input
                        type="text"
                        value={localPrinter.vit.signature}
                        onChange={(e) => updateVIT({ signature: e.target.value, confirmed: false })}
                        className="h-16 text-xl font-bold border-2 border-slate-200 mb-6 text-center"
                        placeholder="Vardas Pavardė"
                      />
                      <Button
                        size="lg"
                        onClick={() => {
                          if (localPrinter.vit.signature.length < 3) return addToast("Įrašykite pilną vardą", "error");
                          updateVIT({ confirmed: true });
                          addToast("Patvirtinta", "success");
                        }}
                        className={cn(
                          "w-full py-8 text-xl font-black uppercase tracking-widest transition-all shadow-lg",
                          localPrinter.vit.confirmed ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
                        )}
                      >
                        {localPrinter.vit.confirmed ? (
                          <>
                            <Check className="w-6 h-6 mr-2" /> PATVIRTINTA
                          </>
                        ) : 'PATVIRTINTI'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          )}

          {/* STEP 3: Nozzle Print */}
          {step === 3 && (
            <div className="animate-in slide-in-from-right-8 duration-300 text-center">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-2xl uppercase">3. Nozzle Check</CardTitle></CardHeader>
              <CardContent className="p-8 flex flex-col items-center">
                <div className="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center mb-8 border-4 border-dashed border-slate-200">
                  <Printer className="w-16 h-16 text-slate-300" />
                </div>
                <p className="text-xl text-slate-600 mb-10 font-medium max-w-lg">
                  Paleiskite purkštukų patikros spausdinimą {localPrinter.isMimaki ? `pasirinktiems blokams (${localPrinter.selectedMimakiUnits?.join(', ') || 'niekas nepasirinkta'})` : 'įrenginiui'}.
                </p>
                <label className={cn(
                  "inline-flex items-center p-10 rounded-[40px] cursor-pointer shadow-xl active:scale-95 transition-all text-left",
                  localPrinter.nozzlePrintDone ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
                )}>
                  <input
                    type="checkbox"
                    checked={localPrinter.nozzlePrintDone}
                    onChange={(e) => {
                      const newData = { nozzlePrintDone: e.target.checked };
                      setLocalPrinter(prev => ({ ...prev, ...newData }));
                      onSave(newData);
                    }}
                    className="w-10 h-10 rounded-xl border-white/30 text-emerald-500 bg-black/20 focus:ring-transparent accent-white"
                  />
                  <div className="ml-6">
                    <span className="block text-2xl font-black uppercase tracking-tighter">Patvirtinu spausdinimą</span>
                    <span className="text-white/60 text-sm font-bold uppercase tracking-widest">Atlikta fiziškai</span>
                  </div>
                </label>
              </CardContent>
            </div>
          )}

          {/* STEP 4: Nozzle Photo */}
          {step === 4 && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-2xl uppercase">4. Nuotrauka (Privaloma)</CardTitle></CardHeader>
              <CardContent className="p-8">
                {showCamera === null ? (
                  <div className="space-y-6">
                    {localPrinter.isMimaki ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(localPrinter.selectedMimakiUnits || []).map(unit => (
                          <div key={unit} className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-lg font-black uppercase">Blokas {unit}</span>
                              {localPrinter.mimakiNozzleFiles?.[unit] && <span className="text-emerald-500 font-bold flex items-center"><CheckCircle2 className="w-5 h-5 mr-1" /> ĮKelta</span>}
                            </div>
                            {localPrinter.mimakiNozzleFiles?.[unit] ? (
                              <div className="relative rounded-2xl overflow-hidden group aspect-video">
                                <img src={localPrinter.mimakiNozzleFiles[unit].url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button onClick={() => setShowCamera(unit)} variant="secondary">
                                    <Camera className="mr-2 h-4 w-4" /> Perfotografuoti
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowCamera(unit)}
                                className="w-full aspect-video border-4 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:bg-slate-100 transition-all flex flex-col items-center justify-center gap-2"
                              >
                                <Camera className="w-8 h-8" />
                                + FOTOGRAFUOTI
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      localPrinter.nozzleFile ? (
                        <div className="relative rounded-[40px] overflow-hidden group max-w-lg mx-auto aspect-[4/3]">
                          <img src={localPrinter.nozzleFile.url} alt="Captured" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="lg" onClick={() => setShowCamera(0)} className="bg-white text-slate-900 hover:bg-slate-200">Perfotografuoti</Button>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => setShowCamera(0)} className="border-4 border-dashed border-slate-200 rounded-[40px] p-20 text-center flex flex-col items-center justify-center hover:bg-slate-50 transition-all cursor-pointer group">
                          <div className="w-24 h-24 bg-slate-900 text-white rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                            <Camera className="w-10 h-10" />
                          </div>
                          <p className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Atidaryti Kamerą</p>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-3xl overflow-hidden bg-black">
                    <CameraCapture
                      userName={`${currentUser.name}${showCamera > 0 ? ` (B${showCamera})` : ''}`}
                      onCapture={handleCapture}
                      onCancel={() => setShowCamera(null)}
                    />
                  </div>
                )}
              </CardContent>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={prevStep}
              disabled={step === -1}
              className={cn("px-8 h-16 text-lg uppercase tracking-widest", step === -1 ? 'opacity-0' : '')}
            >
              Atgal
            </Button>

            {step < 4 ? (
              <Button
                size="lg"
                onClick={() => {
                  if (localPrinter.isMimaki && step === 0 && (localPrinter.selectedMimakiUnits?.length || 0) === 0) {
                    return addToast("Pasirinkite bent vieną bloką!", "error");
                  }
                  nextStep();
                }}
                className="px-12 h-16 text-lg font-black uppercase tracking-widest bg-slate-900 shadow-xl"
              >
                Toliau <ChevronRight className="ml-2" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => {
                  if (canFinish) setShowConfirmModal(true);
                  else {
                    if (!localPrinter.maintenanceDone) addToast("Patvirtinkite priežiūrą!", "error");
                    else if (!localPrinter.vit.confirmed) addToast("Patvirtinkite VIT formą!", "error");
                    else if (!areNozzlesReady()) addToast("Trūksta purkštukų nuotraukų!", "error");
                  }
                }}
                disabled={!canFinish}
                className={cn(
                  "px-10 h-16 text-lg font-black uppercase tracking-widest shadow-2xl transition-all",
                  canFinish ? "bg-emerald-600 hover:bg-emerald-500 scale-105" : "bg-slate-200 text-slate-400"
                )}
              >
                UŽBAIGTI RUOŠIMĄ
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
};
