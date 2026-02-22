import React, { useState, useEffect } from 'react';
import { PrinterData, PrinterStatus, VITData, User, NozzleFile, ChecklistTemplate } from '../types';
import { INITIAL_VIT_CHECKLIST } from '../constants';
import { CameraCapture } from './CameraCapture';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Stepper } from './ui/stepper';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { ArrowLeft, ArrowRight, Camera, Check, AlertTriangle, Printer, Info, CheckCircle2, ChevronRight, X, Play } from 'lucide-react';
import { cn, base64ToBlob } from '@/lib/utils';
import { canStartWork } from '@/lib/validation';

interface SetupProcessProps {
  printer: PrinterData;
  currentUser: User;
  checklistTemplates: ChecklistTemplate[];
  onSave: (data: Partial<PrinterData>, silent?: boolean) => void;
  onFinish: () => void;
  onCancel: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  uploadFile: (file: Blob, path: string) => Promise<string>;
}

export const SetupProcess: React.FC<SetupProcessProps> = ({ printer, currentUser, checklistTemplates, onSave, onFinish, onCancel, addToast, uploadFile }) => {
  const [step, setStep] = useState(0); // Start at 0 (Intro)
  const [localPrinter, setLocalPrinter] = useState<PrinterData>(printer);
  const [showCamera, setShowCamera] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tempRemaining, setTempRemaining] = useState<string>(printer.remainingAmount?.toString() || '0');

  useEffect(() => {
    const currentHour = new Date().getHours();
    const currentShift: 'Dieninė' | 'Naktinė' = (currentHour >= 6 && currentHour < 18) ? 'Dieninė' : 'Naktinė';

    let updates: Partial<PrinterData> = {};
    let hasUpdates = false;

    const needsShiftInit = !localPrinter.vit.shift;
    const needsSignatureInit = !localPrinter.vit.signature;

    if (needsShiftInit || needsSignatureInit) {
      updates.vit = {
        ...localPrinter.vit,
        shift: localPrinter.vit.shift || currentShift,
        signature: localPrinter.vit.signature || currentUser.name
      };
      hasUpdates = true;
    }

    if (localPrinter.isMimaki && (!localPrinter.selectedMimakiUnits || localPrinter.selectedMimakiUnits.length === 0) && localPrinter.assignedMimakiUnits && localPrinter.assignedMimakiUnits.length > 0) {
      updates.selectedMimakiUnits = localPrinter.assignedMimakiUnits;
      hasUpdates = true;
    }

    if (hasUpdates) {
      setLocalPrinter(prev => ({ ...prev, ...updates }));
      onSave(updates);
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Helper functions
  const updateVIT = (updates: Partial<VITData>) => {
    const newVit = { ...localPrinter.vit, ...updates };
    const newData = { vit: newVit };
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

  const getStepsList = () => {
    const steps = [
      { id: 'intro', label: 'Priminimai', description: 'Perdavimas' },
    ];

    if (localPrinter.isMimaki) {
      steps.push({ id: 'mimaki-select', label: 'Blokai', description: 'Pasirinkimas' });
    }

    steps.push({ id: 'vit', label: 'VIT Forma', description: 'Valymas' });

    // Conditional Nozzle Check and Photo
    if (localPrinter.hasNozzleCheck !== false) {
      steps.push({ id: 'nozzle', label: 'Spausdinimas', description: 'Nozzle Check' });
      steps.push({ id: 'photo', label: 'Nuotrauka', description: 'Užfiksavimas' });
    }

    return steps;
  };

  const stepsList = getStepsList();
  const currentStepId = stepsList[step]?.id;

  const getCurrentStepIndex = () => step;

  const handleCapture = async (imageData: string) => {
    setIsUploading(true);
    try {
      const timestamp = new Date().toISOString();
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

  const canFinish = canStartWork(localPrinter, checklistTemplates);

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, stepsList.length - 1));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 0));
  };

  // 3. Shortcuts if already done
  const isShiftDone = localPrinter.vit.confirmed &&
    (localPrinter.hasNozzleCheck === false ? true : (localPrinter.isMimaki ? areNozzlesReady() : localPrinter.nozzleFile));

  if (showConfirmModal) {
    return (
      <div className="fixed inset-0 bg-mimaki-dark/80 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
        <Card className="max-w-xl w-full text-center shadow-2xl border-white/10 bg-mimaki-surface text-white">
          <CardContent className="p-12">
            <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in spin-in-180 duration-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Check className="w-12 h-12" strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Sveiki, {localPrinter.vit.signature?.split(' ')[0] || currentUser.name.split(' ')[0]}!</h2>
            <p className="text-slate-400 text-xl mb-10 leading-relaxed font-medium">
              VIT formos pildymas sėkmingai baigtas.<br />Galite pradėti darbą.
            </p>
            <Button
              size="lg"
              onClick={onFinish}
              className="w-full py-8 text-2xl font-black bg-mimaki-blue hover:bg-blue-600 shadow-xl shadow-mimaki-blue/30 rounded-3xl uppercase tracking-widest"
            >
              PRADĖTI DARBĄ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showErrorModal) {
    return (
      <div className="fixed inset-0 bg-mimaki-dark/80 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
        <Card className="max-w-xl w-full text-center shadow-2xl border-red-500/20 bg-white">
          <CardContent className="p-10">
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 uppercase">Nepilni Duomenys</h2>
            <div className="text-slate-600 text-lg mb-8 text-left bg-slate-50 p-6 rounded-2xl whitespace-pre-line border border-slate-100 font-medium">
              {showErrorModal}
            </div>
            <Button
              size="lg"
              onClick={() => setShowErrorModal(null)}
              className="w-full py-6 text-xl font-black bg-slate-800 hover:bg-black text-white rounded-2xl uppercase"
            >
              Supratau
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if work is already done for this shift
  if (isShiftDone && localPrinter.vit.shift === ((new Date().getHours() >= 6 && new Date().getHours() < 18) ? 'Dieninė' : 'Naktinė')) {
    return (
      <div className="fixed inset-0 bg-mimaki-gray flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
        <Card className="max-w-xl w-full text-center shadow-2xl border-white/50 bg-white/80 backdrop-blur-md">
          <CardHeader>
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <CardTitle className="text-3xl font-black text-mimaki-dark">Sveiki, {localPrinter.vit.signature?.split(' ')[0] || currentUser.name.split(' ')[0]}!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-slate-500 font-medium text-lg">
              Šios ({localPrinter.vit.shift}) pamainos VIT formos pildymas jau atliktas.
              <br />
              Galite pradėti darbą.
            </p>
            <div className="flex flex-col gap-4">
              <Button
                size="lg"
                onClick={onFinish}
                className="w-full h-16 text-xl font-black uppercase bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 rounded-2xl"
              >
                <Play className="w-6 h-6 mr-3" />
                PRADĖTI DARBĄ
              </Button>

              <Button
                variant="ghost"
                onClick={onCancel}
                className="text-slate-400 hover:bg-slate-100"
              >
                Grįžti
              </Button>

            </div>
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

      <main className="flex-1 p-0 md:p-8 max-w-5xl mx-auto w-full flex flex-col justify-center">
        <Card className="shadow-none md:shadow-2xl border-0 md:border md:border-white/50 bg-white/80 backdrop-blur-sm rounded-none md:rounded-xl overflow-hidden min-h-[calc(100vh-130px)] md:min-h-0">

          {/* STEP: Handover Messages (Intro) */}
          {currentStepId === 'intro' && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-3xl">Likutis ir Pranešimai</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {/* Handover Verification */}
                {!localPrinter.handoverVerified && (
                  <div className="bg-blue-50/50 rounded-[2rem] p-8 border border-blue-100 mb-8 shadow-inner relative overflow-hidden group focus-within:ring-4 focus-within:ring-blue-500/20 transition-all">
                    <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-3 relative z-10">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Info className="w-4 h-4" />
                      </div>
                      Liko gaminti (Patvirtinkite arba Pataisykite)
                    </h3>
                    <div className="relative w-full max-w-sm mx-auto z-10">
                      <input
                        type="number"
                        value={tempRemaining}
                        onChange={(e) => setTempRemaining(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => {
                          const val = parseFloat(tempRemaining);
                          if (!isNaN(val) && val >= 0) {
                            const newData = { remainingAmount: val, handoverVerified: true };
                            setLocalPrinter(prev => ({ ...prev, ...newData }));
                            onSave(newData);
                          }
                        }}
                        className="w-full bg-white border-2 border-blue-100 p-6 rounded-[2rem] font-black text-5xl text-blue-900 focus:ring-0 outline-none text-center transition-all focus:border-blue-400 shadow-lg shadow-blue-900/5 placeholder-blue-200"
                        placeholder="0"
                      />
                      <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-4 text-center">vnt. / m²</p>
                    </div>
                  </div>
                )}

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
                    Patikrinkite "Liko gaminti" kiekį, jei reikia, pataisykite. Toliau turėsite pažymėti valymo varneles ir patvirtinti VIT formą.
                  </p>
                </div>
              </CardContent>
            </div>
          )}

          {/* STEP: Mimaki Unit Selection */}
          {currentStepId === 'mimaki-select' && (
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



          {/* STEP: VIT FORM */}
          {currentStepId === 'vit' && (
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
                  <Label className="uppercase tracking-widest text-[10px] font-black text-slate-400 pl-2">Jūsų parašas</Label>
                  <div className="p-8 bg-slate-50/50 rounded-[3rem] border border-slate-100 flex flex-col justify-center shadow-inner">
                    <Input
                      type="text"
                      value={localPrinter.vit.signature}
                      onChange={(e) => updateVIT({ signature: e.target.value, confirmed: false })}
                      className="h-16 text-xl font-black border-slate-200 text-center bg-white"
                      placeholder="Vardas Pavardė"
                    />
                  </div>
                </div>
              </CardContent>
            </div>
          )}

          {/* STEP: Nozzle Print */}
          {currentStepId === 'nozzle' && (
            <div className="animate-in slide-in-from-right-8 duration-300 text-center">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-3xl">3. Nozzle Check</CardTitle></CardHeader>
              <CardContent className="p-8 flex flex-col items-center">
                <div className="w-48 h-48 bg-slate-50 rounded-full flex items-center justify-center mb-10 border-[6px] border-dashed border-slate-200">
                  <Printer className="w-20 h-20 text-slate-300" />
                </div>
                <p className="text-xl text-slate-600 mb-12 font-bold max-w-lg leading-relaxed">
                  Paleiskite purkštukų patikros spausdinimą {localPrinter.isMimaki ? `pasirinktiems blokams (${localPrinter.selectedMimakiUnits?.join(', ') || 'niekas nepasirinkta'})` : 'įrenginiui'}.
                </p>
                <div className="bg-blue-50/50 p-6 rounded-3xl text-center text-blue-700 text-sm font-medium border border-blue-100 max-w-md w-full">
                  Spauskite <span className="font-black">„Patvirtinti“</span> apačioje, pagrindiniame meniu, kai spausdinimas bus atliktas.
                </div>
              </CardContent>
            </div>
          )}

          {/* STEP: Nozzle Photo */}
          {currentStepId === 'photo' && (
            <div className="animate-in slide-in-from-right-8 duration-300">
              <CardHeader className="p-8 pb-0"><CardTitle className="text-3xl">4. Nuotrauka (Privaloma)</CardTitle></CardHeader>
              <CardContent className="p-8">
                {showCamera === null ? (
                  <div className="space-y-6">
                    {localPrinter.requireDateOnNozzle && (
                      <div className="bg-red-50 border-2 border-red-500 text-red-700 p-6 rounded-3xl animate-pulse">
                        <div className="flex items-center gap-4 mb-2">
                          <AlertTriangle className="w-8 h-8 text-red-500" />
                          <span className="text-xl font-black uppercase tracking-widest">Dėmesio!</span>
                        </div>
                        <p className="text-lg font-bold">Jei nėra datos prie Nozzle, turi parašyti <span className="underline decoration-4 decoration-red-300">Šiandienos datą</span> matomai šalia nozzle check.</p>
                      </div>
                    )}
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
                                <div className="absolute bottom-2 right-2">
                                  <Button onClick={() => setShowCamera(unit)} variant="secondary" size="sm" className="rounded-xl shadow-lg bg-white/90 text-slate-800 hover:bg-white font-bold opacity-100">
                                    <Camera className="mr-2 h-4 w-4" /> Iš naujo
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
                          <div className="absolute bottom-4 right-4">
                            <Button size="sm" onClick={() => setShowCamera(0)} className="bg-white/90 text-slate-900 hover:bg-white rounded-xl shadow-lg font-bold">
                              <Camera className="mr-2 h-4 w-4" /> Iš naujo
                            </Button>
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
                  const currentStepId = stepsList[step]?.id;
                  if (localPrinter.isMimaki && currentStepId === 'mimaki-select' && (localPrinter.selectedMimakiUnits?.length || 0) === 0) {
                    return addToast("Pasirinkite bent vieną bloką!", "error");
                  }
                  if (currentStepId === 'intro' && !localPrinter.handoverVerified) {
                    const val = parseFloat(tempRemaining);
                    if (isNaN(val) || val < 0) {
                      return addToast("Pataisykite likutį!", "error");
                    }
                    const newData = { remainingAmount: val, handoverVerified: true };
                    setLocalPrinter(prev => ({ ...prev, ...newData }));
                    onSave(newData);
                  }
                  if (currentStepId === 'vit') {
                    if (localPrinter.vit.signature.length < 3) return addToast("Įrašykite pilną vardą", "error");
                    const assignedTemplate = checklistTemplates.find(t => t.id === localPrinter.checklistTemplateId);
                    const itemsToShow = assignedTemplate ? assignedTemplate.items : INITIAL_VIT_CHECKLIST;
                    const allChecked = itemsToShow.every(item => localPrinter.vit.checklist[item]);
                    if (!allChecked) return addToast("Pažymėkite visas varneles!", "error");
                    updateVIT({ confirmed: true });
                  }
                  if (currentStepId === 'nozzle') {
                    const newData = { nozzlePrintDone: true };
                    setLocalPrinter(prev => ({ ...prev, ...newData }));
                    onSave(newData);
                  }
                  nextStep();
                }}
                className="px-12 h-16 text-lg font-black uppercase tracking-widest bg-mimaki-blue hover:bg-blue-600 shadow-xl shadow-mimaki-blue/30 rounded-2xl flex items-center justify-center gap-2"
              >
                {(stepsList[step]?.id === 'vit' || stepsList[step]?.id === 'nozzle') ? 'Patvirtinti' : 'Toliau'} <ChevronRight className="ml-1 w-5 h-5" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => {
                  if (canFinish) setShowConfirmModal(true);
                  else {
                    let errorMessage = "Trūksta šių patvirtinimų:\n\n";
                    if (!localPrinter.vit.confirmed) errorMessage += "• Nepatvirtinta VIT forma\n";
                    if (localPrinter.hasNozzleCheck !== false && !localPrinter.nozzlePrintDone) errorMessage += "• Nepatvirtintas purkštukų spausdinimas\n";
                    if (!areNozzlesReady()) errorMessage += "• Trūksta purkštukų nuotraukos\n";

                    setShowErrorModal(errorMessage);
                  }
                }}
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
