import React, { useState, useEffect } from 'react';
import { PrinterData, PrinterStatus, VITData, User, NozzleFile, ChecklistTemplate } from '../types';
import { INITIAL_VIT_CHECKLIST } from '../constants';
import { CameraCapture } from './CameraCapture';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Stepper } from './ui/stepper';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { ArrowLeft, ArrowRight, Camera, Check, AlertTriangle, Printer, Info, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { cn, base64ToBlob } from '@/lib/utils';
import { canStartWork } from '@/lib/validation';

interface SetupProcessProps {
  printer: PrinterData;
  currentUser: User;
  checklistTemplates: ChecklistTemplate[];
  onSave: (data: Partial<PrinterData>) => void;
  onFinish: () => void;
  onCancel: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  uploadFile: (file: Blob, path: string) => Promise<string>;
}

export const SetupProcess: React.FC<SetupProcessProps> = ({ printer, currentUser, checklistTemplates, onSave, onFinish, onCancel, addToast, uploadFile }) => {
  const [step, setStep] = useState(-1);
  const [localPrinter, setLocalPrinter] = useState<PrinterData>(printer);
  const [showCamera, setShowCamera] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // 1. Set Auto Signature
    if (!localPrinter.vit.signature) {
      const newVit = { ...localPrinter.vit, signature: currentUser.name };
      setLocalPrinter(prev => ({ ...prev, vit: newVit }));
    }

    // 2. Auto-detect Shift (06:00 - 18:00 = Ryto, else Vakaro)
    if (!localPrinter.vit.shift) {
      const currentHour = new Date().getHours();
      const detectedShift = (currentHour >= 6 && currentHour < 18) ? 'Ryto' : 'Vakaro';

      const newVit = { ...localPrinter.vit, shift: detectedShift };
      setLocalPrinter(prev => ({ ...prev, vit: newVit }));
      // We don't save immediately to avoid writing to DB before user starts interacting, 
      // but for state consistency it's fine.

      // Actually, let's just set it in local state.
    }
  }, [currentUser, localPrinter.vit.signature, localPrinter.vit.shift]);

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

  const getCurrentStepIndex = () => {
    if (step === -1) return 0;
    if (localPrinter.isMimaki) {
      return step + 1;
    } else {
      return step === -1 ? 0 : step;
    }
  };

  const handleCapture = async (imageData: string) => {
    setIsUploading(true);
    try {
      const timestamp = new Date().toLocaleString('lt-LT');
      const blob = base64ToBlob(imageData);
      const fileName = `${localPrinter.id}_${Date.now()}.jpg`;
      const path = `${localPrinter.id}/${fileName}`;

      const publicUrl = await uploadFile(blob, path);

      const newFile: NozzleFile = { url: publicUrl, timestamp };

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
      addToast("Nuotrauka sėkmingai įkelta", "success");
    } catch (error) {
      console.error(error);
      addToast("Nepavyko įkelti nuotraukos", "error");
    } finally {
      setIsUploading(false);
    }
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

  const canFinish = canStartWork(localPrinter, checklistTemplates);

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
      <div className="fixed inset-0 bg-mimaki-dark/80 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
        <Card className="max-w-xl w-full text-center shadow-2xl border-white/10 bg-mimaki-surface text-white">
          <CardContent className="p-12">
            <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in spin-in-180 duration-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Check className="w-12 h-12" strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Viskas tvarkoje!</h2>
            <p className="text-slate-400 text-xl mb-10 leading-relaxed font-medium">
              Paruošimas baigtas. Galite pradėti gamybą.
            </p>
            <Button
              size="lg"
              onClick={onFinish}
              className="w-full py-8 text-2xl font-black bg-mimaki-blue hover:bg-blue-600 shadow-xl shadow-mimaki-blue/30 rounded-3xl uppercase tracking-widest"
            >
              PRADĖTI GAMYBĄ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mimaki-gray flex flex-col">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20">
        <div className="px-6 py-4 flex justify-between items-center max-w-[1600px] mx-auto w-full">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-2xl hover:bg-black/5">
              <ArrowLeft className="w-6 h-6 text-mimaki-dark" />
            </Button>
            <div>
              <h2 className="text-xl font-black text-mimaki-dark leading-none uppercase tracking-tight">{localPrinter.name}</h2>
              <p className="text-[10px] text-mimaki-blue font-black uppercase tracking-[0.2em] mt-1">Paruošimo procesas</p>
            </div>
          </div>

          <div className="hidden lg:block w-1/2">
            <Stepper steps={stepsList} currentStep={getCurrentStepIndex()} />
          </div>
        </div>

        {/* Mobile Stepper */}
        <div className="lg:hidden px-6 py-2 bg-white/50 border-t border-slate-100 flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Žingsnis {getCurrentStepIndex() + 1} / {stepsList.length}</span>
          <span className="text-[10px] font-black uppercase text-mimaki-dark tracking-widest">{stepsList[getCurrentStepIndex()].label}</span>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col justify-center">
        <Card className="shadow-2xl shadow-slate-200/50 border-white/50 overflow-hidden bg-white/80 backdrop-blur-sm">

          {/* STEP -1: Handover Messages */}
          {step === -1 && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-3xl">Pranešimai</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 md:p-10 mb-8 shadow-inner">
                  {localPrinter.nextOperatorMessage ? (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Svarbi informacija:</p>
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

                <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl flex items-start space-x-4">
                  <Info className="w-6 h-6 text-mimaki-blue mt-0.5 shrink-0" />
                  <p className="text-mimaki-blue text-sm font-medium leading-relaxed">
                    Susipažinkite su informacija prieš tęsdami. Kitame žingsnyje turėsite pažymėti valymo varneles ir patvirtinti VIT formą.
                  </p>
                </div>
              </CardContent>
            </div>
          )}

          {/* STEP 0: Mimaki Unit Selection */}
          {localPrinter.isMimaki && step === 0 && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-3xl">Pasirinkite Mimaki blokus</CardTitle></CardHeader>
              <CardContent className="p-8">
                <p className="text-slate-500 mb-8 font-medium">Pažymėkite, su kuriais iš 8 blokų dirbsite šiandien:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(u => (
                    <button
                      key={u}
                      onClick={() => toggleMimakiUnit(u)}
                      className={cn(
                        "py-6 rounded-3xl font-black text-2xl transition-all border-4 flex items-center justify-center shadow-sm",
                        localPrinter.selectedMimakiUnits?.includes(u)
                          ? "bg-mimaki-blue border-mimaki-blue text-white shadow-xl shadow-mimaki-blue/30 scale-105"
                          : "bg-white border-slate-100 text-slate-300 hover:border-slate-200 hover:text-slate-400"
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
              <CardHeader className="p-8 pb-0"><CardTitle className="text-3xl">1. Priežiūra</CardTitle></CardHeader>
              <CardContent className="p-8">
                <label className={cn(
                  "flex items-center p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer mb-8 shadow-sm",
                  localPrinter.maintenanceDone ? "bg-emerald-50/50 border-emerald-500" : "bg-slate-50 border-transparent hover:border-slate-200"
                )}>
                  <input
                    type="checkbox"
                    checked={localPrinter.maintenanceDone}
                    onChange={(e) => {
                      const newData = { maintenanceDone: e.target.checked, status: PrinterStatus.IN_PROGRESS };
                      setLocalPrinter(prev => ({ ...prev, ...newData }));
                      onSave(newData);
                    }}
                    className="w-8 h-8 rounded-xl border-slate-300 text-mimaki-dark focus:ring-mimaki-dark accent-mimaki-dark"
                  />
                  <span className={cn("ml-6 text-xl font-black tracking-tight", localPrinter.maintenanceDone ? "text-mimaki-dark" : "text-slate-500")}>
                    Profilaktinė priežiūra atlikta
                  </span>
                </label>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-4">Komentaras (Nebūtina)</label>
                <textarea
                  value={localPrinter.maintenanceComment}
                  onChange={(e) => {
                    const newData = { maintenanceComment: e.target.value };
                    setLocalPrinter(prev => ({ ...prev, ...newData }));
                    onSave(newData);
                  }}
                  className="w-full p-6 bg-slate-50 border-0 rounded-[2rem] focus:ring-2 focus:ring-mimaki-blue/20 outline-none h-40 font-bold text-slate-700 resize-none transition-all placeholder:text-slate-300"
                  placeholder="Papildomos pastabos apie būklę..."
                />
              </CardContent>
            </div>
          )}

          {/* STEP 2: VIT FORM */}
          {step === 2 && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-3xl">2. VIT Forma</CardTitle></CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <Label className="uppercase tracking-widest text-[10px] font-black text-slate-400 pl-2">Pamaina (Automatiškai parinkta)</Label>
                    <div className="p-5 bg-slate-100 rounded-[2rem] border border-slate-200">
                      <p className="text-xl font-black text-slate-800 uppercase tracking-widest text-center">
                        {localPrinter.vit.shift || 'Nustatoma...'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(() => {
                      // Determine which items to show
                      const assignedTemplate = checklistTemplates.find(t => t.id === localPrinter.checklistTemplateId);
                      const itemsToShow = assignedTemplate ? assignedTemplate.items : INITIAL_VIT_CHECKLIST;

                      return itemsToShow.map(item => (
                        <label key={item} className={cn(
                          "flex items-center p-5 rounded-3xl border transition-all cursor-pointer",
                          localPrinter.vit.checklist[item] ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50/50 border-transparent hover:border-slate-200"
                        )}>
                          <input
                            type="checkbox"
                            checked={localPrinter.vit.checklist[item] || false}
                            onChange={() => toggleVITCheck(item)}
                            className="w-6 h-6 rounded-lg accent-emerald-600"
                          />
                          <span className={cn("ml-4 font-bold text-sm", localPrinter.vit.checklist[item] ? "text-emerald-900" : "text-slate-600")}>{item}</span>
                        </label>
                      ));
                    })()}
                  </div>
                </div>
                <div className="space-y-8">
                  <Label className="uppercase tracking-widest text-[10px] font-black text-slate-400 pl-2">Patvirtinimas</Label>
                  <div className="p-8 bg-slate-50/50 rounded-[3rem] border border-slate-100 h-full flex flex-col justify-center shadow-inner">
                    <Input
                      type="text"
                      value={localPrinter.vit.signature}
                      onChange={(e) => updateVIT({ signature: e.target.value, confirmed: false })}
                      className="h-16 text-xl font-black border-slate-200 mb-6 text-center bg-white"
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
                        "w-full py-8 text-xl font-black uppercase tracking-widest transition-all shadow-xl rounded-[2rem]",
                        localPrinter.vit.confirmed ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" : "bg-mimaki-dark text-white hover:bg-black shadow-mimaki-dark/20"
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
              </CardContent>
            </div>
          )}

          {/* STEP 3: Nozzle Print */}
          {step === 3 && (
            <div className="animate-in slide-in-from-right-8 duration-300 text-center">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-3xl">3. Nozzle Check</CardTitle></CardHeader>
              <CardContent className="p-8 flex flex-col items-center">
                <div className="w-48 h-48 bg-slate-50 rounded-full flex items-center justify-center mb-10 border-[6px] border-dashed border-slate-200">
                  <Printer className="w-20 h-20 text-slate-300" />
                </div>
                <p className="text-2xl text-slate-600 mb-12 font-bold max-w-lg leading-relaxed">
                  Paleiskite purkštukų patikros spausdinimą {localPrinter.isMimaki ? `pasirinktiems blokams (${localPrinter.selectedMimakiUnits?.join(', ') || 'niekas nepasirinkta'})` : 'įrenginiui'}.
                </p>
                <label className={cn(
                  "inline-flex items-center p-8 rounded-[3rem] cursor-pointer shadow-2xl active:scale-95 transition-all text-left min-w-[300px]",
                  localPrinter.nozzlePrintDone ? "bg-emerald-600 text-white shadow-emerald-600/30" : "bg-mimaki-dark text-white hover:bg-black shadow-mimaki-dark/30"
                )}>
                  <input
                    type="checkbox"
                    checked={localPrinter.nozzlePrintDone}
                    onChange={(e) => {
                      const newData = { nozzlePrintDone: e.target.checked };
                      setLocalPrinter(prev => ({ ...prev, ...newData }));
                      onSave(newData);
                    }}
                    className="w-12 h-12 rounded-2xl border-white/20 text-emerald-500 bg-white/10 focus:ring-offset-0 focus:ring-0 accent-white"
                  />
                  <div className="ml-6">
                    <span className="block text-2xl font-black uppercase tracking-tighter">Patvirtinu</span>
                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Spausdinimas atliktas</span>
                  </div>
                </label>
              </CardContent>
            </div>
          )}

          {/* STEP 4: Nozzle Photo */}
          {step === 4 && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-3xl">4. Nuotrauka (Privaloma)</CardTitle></CardHeader>
              <CardContent className="p-8">
                {showCamera === null ? (
                  <div className="space-y-6">
                    {localPrinter.isMimaki ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(localPrinter.selectedMimakiUnits || []).map(unit => (
                          <div key={unit} className="p-6 bg-slate-50 rounded-[3rem] border border-slate-200">
                            <div className="flex justify-between items-center mb-6 px-2">
                              <span className="text-lg font-black uppercase tracking-tight text-slate-700">Blokas {unit}</span>
                              {localPrinter.mimakiNozzleFiles?.[unit] && <span className="text-emerald-500 font-bold flex items-center bg-emerald-50 px-3 py-1 rounded-full text-xs uppercase tracking-widest"><CheckCircle2 className="w-4 h-4 mr-1" /> ĮKelta</span>}
                            </div>
                            {localPrinter.mimakiNozzleFiles?.[unit] ? (
                              <div className="relative rounded-[2rem] overflow-hidden group aspect-video shadow-lg">
                                <img src={localPrinter.mimakiNozzleFiles[unit].url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                  <Button onClick={() => setShowCamera(unit)} variant="secondary" className="rounded-2xl">
                                    <Camera className="mr-2 h-4 w-4" /> Perfotografuoti
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowCamera(unit)}
                                className="w-full aspect-video border-4 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold hover:bg-white hover:border-mimaki-blue hover:text-mimaki-blue transition-all flex flex-col items-center justify-center gap-2 group"
                              >
                                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center group-hover:bg-mimaki-blue group-hover:text-white transition-colors">
                                  <Camera className="w-8 h-8" />
                                </div>
                                <span className="uppercase tracking-widest text-xs font-black">+ FOTOGRAFUOTI</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      localPrinter.nozzleFile ? (
                        <div className="relative rounded-[3rem] overflow-hidden group max-w-lg mx-auto aspect-[4/3] shadow-2xl">
                          <img src={localPrinter.nozzleFile.url} alt="Captured" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-mimaki-dark/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                            <Button size="lg" onClick={() => setShowCamera(0)} className="bg-white text-slate-900 hover:bg-slate-200 rounded-2xl">Perfotografuoti</Button>
                          </div>
                        </div>
                      ) : (
                        <div onClick={() => setShowCamera(0)} className="border-4 border-dashed border-slate-200 rounded-[3rem] p-24 text-center flex flex-col items-center justify-center hover:bg-white hover:border-mimaki-blue transition-all cursor-pointer group bg-slate-50/50">
                          <div className="w-24 h-24 bg-mimaki-dark text-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-mimaki-dark/20 group-hover:scale-110 transition-transform group-hover:bg-mimaki-blue group-hover:shadow-mimaki-blue/30">
                            <Camera className="w-10 h-10" />
                          </div>
                          <p className="text-2xl font-black text-slate-800 uppercase tracking-tighter group-hover:text-mimaki-blue">Atidaryti Kamerą</p>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-[3rem] overflow-hidden bg-black shadow-2xl relative">
                    {isUploading && (
                      <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-4"></div>
                        <p className="text-white font-bold uppercase tracking-widest">Keliama nuotrauka...</p>
                      </div>
                    )}
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
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={prevStep}
              disabled={step === -1}
              className={cn("px-8 h-16 text-lg uppercase tracking-widest rounded-2xl", step === -1 ? 'opacity-0' : '')}
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
                className="px-12 h-16 text-lg font-black uppercase tracking-widest bg-mimaki-blue hover:bg-blue-600 shadow-xl shadow-mimaki-blue/30 rounded-2xl"
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
                    else if (!localPrinter.nozzlePrintDone) addToast("Patvirtinkite purkštukų spausdinimą!", "error");
                    else if (!areNozzlesReady()) addToast("Trūksta purkštukų nuotraukų!", "error");
                  }
                }}
                disabled={!canFinish}
                className={cn(
                  "px-10 h-16 text-lg font-black uppercase tracking-widest shadow-2xl transition-all rounded-2xl",
                  canFinish ? "bg-emerald-600 hover:bg-emerald-500 scale-105 shadow-emerald-600/30" : "bg-slate-200 text-slate-400"
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
