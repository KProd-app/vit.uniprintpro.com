import React, { useState, useRef } from 'react';
import { PrinterData, PrinterInk } from '../types';
import { usePrinters } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Camera, Droplet, Plus, CheckCircle, QrCode as QrIcon, X, Check } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface InkRefillToolProps {
  printers: PrinterData[];
  onClose: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface InkActionState {
  action: 'STARTED_BOTTLE' | 'NEW_BOTTLE' | 'NONE';
  photo?: File;
  preview?: string;
  qrVerified?: boolean;
}

export const InkRefillTool: React.FC<InkRefillToolProps> = ({ printers, onClose, addToast }) => {
  const { user } = useAuth();
  const { updatePrinter, addInkLog, uploadInkPhoto } = usePrinters();
  
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterData | null>(null);
  const [inkStates, setInkStates] = useState<Record<string, InkActionState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [completedPrinters, setCompletedPrinters] = useState<string[]>(() => {
     try {
         if (!user?.id) return [];
         const saved = localStorage.getItem(`ink_completed_v1_${user.id}`);
         if (saved) {
             const parsed = JSON.parse(saved);
             // Keep state if less than 14 hours old (typical max shift)
             if (Date.now() - parsed.timestamp < 14 * 60 * 60 * 1000) {
                 return parsed.printers || [];
             }
         }
     } catch (e) {}
     return [];
  });
  
  // Scanner Modal State
  const [scanningInk, setScanningInk] = useState<PrinterInk | null>(null);

  // Hidden file inputs refs
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleSelectPrinter = (printer: PrinterData) => {
    setSelectedPrinter(printer);
    const initialStates: Record<string, InkActionState> = {};
    (printer.inks || []).forEach(ink => {
      initialStates[ink.id] = { action: 'NONE' };
    });
    setInkStates(initialStates);
  };

  const handleActionSelect = (ink: PrinterInk, action: 'STARTED_BOTTLE' | 'NEW_BOTTLE' | 'NONE') => {
    const currentState = inkStates[ink.id];
    
    // If selecting new bottle, reset verified state
    if (action === 'NEW_BOTTLE') {
       if (ink.inventory <= 0) {
           addToast(`Klaida! Dažų "${ink.name}" likutis yra 0. Pirmiausia adminas turi pridėti inventorių.`, 'error');
           return;
       }
       setInkStates(prev => ({ ...prev, [ink.id]: { ...prev[ink.id], action, qrVerified: false }}));
       setScanningInk(ink);
    } else {
       setInkStates(prev => ({ ...prev, [ink.id]: { ...prev[ink.id], action, qrVerified: false }}));
    }
  };

  const handleScanSuccess = (text: string) => {
    if (!scanningInk) return;
    
    if (text === scanningInk.qrCode) {
      addToast(`Barkodas atpažintas: ${scanningInk.name}`, 'success');
      setInkStates(prev => ({ ...prev, [scanningInk.id]: { ...prev[scanningInk.id], qrVerified: true }}));
      setScanningInk(null);
    } else {
      addToast(`Neteisingas barkodas! Laukiamas: ${scanningInk.qrCode}, Gautas: ${text}`, 'error');
    }
  };

  const handleFileChange = (inkId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setInkStates(prev => ({ 
          ...prev, 
          [inkId]: { ...prev[inkId], photo: file, preview: URL.createObjectURL(file) }
      }));
    }
  };

  const handleSubmit = async () => {
    if (!selectedPrinter || !user) return;

    // Validate
    const activeInks = selectedPrinter.inks?.filter(i => inkStates[i.id].action !== 'NONE') || [];
    if (activeInks.length === 0) {
      addToast("Pasirinkite bent vieną dažą pildymui.", "error");
      return;
    }

    for (const ink of activeInks) {
      const state = inkStates[ink.id];
      if (state.action === 'NEW_BOTTLE' && !state.qrVerified) {
         addToast(`Būtina nuskenuoti "${ink.name}" dažų barkodą!`, "error");
         return;
      }
      if (!state.photo) {
         addToast(`Būtina nufotografuoti "${ink.name}" dažų butelį!`, "error");
         return;
      }
    }

    setIsSubmitting(true);
    try {
      let currentInks = [...(selectedPrinter.inks || [])];

      for (const ink of activeInks) {
        const state = inkStates[ink.id];
        
        // 1. Upload photo
        const path = `${selectedPrinter.id}/${ink.id}_${new Date().getTime()}_${state.photo!.name}`;
        const photoUrl = await uploadInkPhoto(state.photo!, path);

        // 2. Adjust inventory
        const quantityChange = state.action === 'NEW_BOTTLE' ? -1 : 0;
        if (quantityChange !== 0) {
           currentInks = currentInks.map(i => i.id === ink.id ? { ...i, inventory: i.inventory + quantityChange } : i);
        }

        // 3. Create log
        await addInkLog({
          printerId: selectedPrinter.id,
          printerName: selectedPrinter.name,
          inkId: ink.id,
          inkName: ink.name,
          operatorName: user.name,
          action: state.action as 'STARTED_BOTTLE' | 'NEW_BOTTLE',
          quantityChange,
          photoUrl
        });
      }

      // Update printer config once with all inventory changes
      await updatePrinter(selectedPrinter.id, { inks: currentInks });

      // Mark printer as completed for this shift
      const newCompleted = Array.from(new Set([...completedPrinters, selectedPrinter.id]));
      setCompletedPrinters(newCompleted);
      if (user?.id) {
         localStorage.setItem(`ink_completed_v1_${user.id}`, JSON.stringify({
            timestamp: Date.now(),
            printers: newCompleted
         }));
      }

      addToast("Visi dažų pildymai sėkmingai užregistruoti!", "success");
      setSelectedPrinter(null);
    } catch (error) {
      console.error("Error submitting ink refill batch:", error);
      addToast("Klaida išsaugant duomenis. Bandykite dar kartą.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 max-w-[800px] mx-auto animate-in fade-in duration-300 relative">
      
      {/* Scanner Modal */}
      {scanningInk && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex flex-col">
          <div className="flex justify-between items-center p-4 bg-black/50 text-white">
            <h3 className="font-bold text-lg">Skenuoti: {scanningInk.name}</h3>
            <Button variant="ghost" size="icon" onClick={() => setScanningInk(null)} className="text-white hover:bg-white/20">
               <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden border-2 border-mimaki-blue shadow-[0_0_30px_rgba(30,136,229,0.3)]">
                <Scanner onScan={(result) => handleScanSuccess(result[0].rawValue)} />
             </div>
             <p className="text-white/60 mt-8 text-center text-sm font-medium">
               Paimkite naują <strong className="text-white">{scanningInk.name}</strong> butelį ir nukreipkite kamerą į jo barkodą. Laukiamas kodas: {scanningInk.qrCode}
             </p>
          </div>
        </div>
      )}

      <header className="mb-6 md:mb-8 flex items-center gap-3 md:gap-4">
        <Button variant="ghost" size="icon" onClick={selectedPrinter ? () => handleSelectPrinter(null as any) : onClose} className="rounded-full bg-white shadow-sm h-10 w-10">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Dažų Pildymas</h1>
          <p className="text-sm md:text-base text-slate-500 font-medium mt-1">{selectedPrinter ? selectedPrinter.name : 'Pasirinkite spausdintuvą'}</p>
        </div>
      </header>

      {!selectedPrinter ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {printers.map(p => {
            const isCompleted = completedPrinters.includes(p.id);
            return (
              <Card key={p.id} className="bg-white dark:bg-white hover:border-mimaki-blue cursor-pointer transition-all hover:shadow-lg" onClick={() => handleSelectPrinter(p)}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{p.name}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                       Dažų rūšys: <span className="font-bold text-slate-700">{p.inks?.length || 0}</span>
                    </p>
                  </div>
                  <Droplet className={`w-8 h-8 transition-colors ${isCompleted ? 'text-emerald-500 fill-emerald-500/20' : ((p.inks?.length || 0) > 0 ? 'text-mimaki-blue' : 'text-slate-300')}`} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6 pb-24">
           {(!selectedPrinter.inks || selectedPrinter.inks.length === 0) ? (
              <div className="bg-white p-8 rounded-2xl text-center shadow-sm border border-slate-100">
                <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Dažų nėra</h3>
                <p className="text-slate-500">Šiam spausdintuvui nėra priskirtų dažų. Administratorius turi juos pridėti per "DAŽAI" skiltį.</p>
              </div>
           ) : (
              selectedPrinter.inks.map(ink => {
                 const state = inkStates[ink.id] || { action: 'NONE' };
                 const isTakingAction = state.action !== 'NONE';

                 return (
                    <Card key={ink.id} className={`bg-white dark:bg-white border-2 transition-all ${isTakingAction ? 'border-mimaki-blue shadow-md' : 'border-slate-200'}`}>
                       <CardHeader className={`p-4 md:p-5 border-b ${isTakingAction ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex justify-between items-center">
                             <div>
                                <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">{ink.name}</h3>
                                <div className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">Likutis: <strong className={ink.inventory <= 0 ? 'text-red-500' : 'text-emerald-600'}>{ink.inventory} vnt.</strong></div>
                             </div>
                             {state.qrVerified && (
                                <div className="bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full flex items-center text-[10px] md:text-xs font-bold uppercase shadow-sm">
                                   <Check className="w-3 h-3 mr-1" /> Patvirtinta
                                </div>
                             )}
                          </div>
                       </CardHeader>
                       <CardContent className="p-4 md:p-5 space-y-4">
                          {/* Action Selection Segmented Control */}
                          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner overflow-hidden">
                             <button
                                className={`flex-1 py-3 px-1 flex flex-col items-center justify-center gap-1 rounded-lg transition-all ${state.action === 'NONE' ? 'bg-white text-slate-800 shadow-sm font-black' : 'text-slate-400 font-semibold hover:text-slate-600'}`}
                                onClick={() => handleActionSelect(ink, 'NONE')}
                             >
                                <span className="text-[10px] md:text-xs uppercase tracking-wider">Nepildoma</span>
                             </button>
                             <button
                                className={`flex-1 py-3 px-1 flex flex-col items-center justify-center gap-1 rounded-lg transition-all ${state.action === 'STARTED_BOTTLE' ? 'bg-mimaki-blue text-white shadow-md font-black' : 'text-slate-400 font-semibold hover:text-slate-600'}`}
                                onClick={() => handleActionSelect(ink, 'STARTED_BOTTLE')}
                             >
                                <Droplet className={`w-4 h-4 ${state.action === 'STARTED_BOTTLE' ? 'opacity-100' : 'opacity-70'}`} />
                                <span className="text-[10px] md:text-xs uppercase tracking-wider">Pradėtas</span>
                             </button>
                             <button
                                className={`flex-1 py-3 px-1 flex flex-col items-center justify-center gap-1 rounded-lg transition-all ${state.action === 'NEW_BOTTLE' ? 'bg-emerald-500 text-white shadow-md font-black' : 'text-slate-400 font-semibold hover:text-slate-600'}`}
                                onClick={() => handleActionSelect(ink, 'NEW_BOTTLE')}
                             >
                                <Plus className={`w-4 h-4 ${state.action === 'NEW_BOTTLE' ? 'opacity-100' : 'opacity-70'}`} />
                                <span className="text-[10px] md:text-xs uppercase tracking-wider">Naujas</span>
                             </button>
                          </div>

                          {/* Action Verification & Photo */}
                          {isTakingAction && (
                             <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 animate-in fade-in slide-in-from-top-2">
                                {state.action === 'NEW_BOTTLE' && !state.qrVerified ? (
                                   <Button onClick={() => setScanningInk(ink)} className="w-full h-14 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold uppercase tracking-widest text-[11px] md:text-sm flex gap-2 shadow-lg mb-2 animate-pulse">
                                      <QrIcon className="w-4 h-4" /> Nuskenuokite Barkodą
                                   </Button>
                                ) : (
                                   <div className="flex flex-col items-center justify-center">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        ref={(el) => fileInputRefs.current[ink.id] = el}
                                        onChange={(e) => handleFileChange(ink.id, e)}
                                      />
                                      {state.preview ? (
                                        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-md group">
                                          <img src={state.preview} alt="Ink bottle" className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button onClick={() => fileInputRefs.current[ink.id]?.click()} variant="secondary">
                                              <Camera className="w-4 h-4 mr-2" /> Perfokuoti
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => fileInputRefs.current[ink.id]?.click()}
                                          className="w-full py-6 md:py-8 border-2 border-dashed border-mimaki-blue/50 bg-blue-50/50 rounded-xl flex flex-col items-center justify-center text-mimaki-blue hover:bg-blue-100 transition-all"
                                        >
                                          <Camera className="w-6 h-6 md:w-8 md:h-8 mb-2" />
                                          <span className="font-bold uppercase text-[10px] md:text-xs tracking-wider">Nufotografuoti Butelį</span>
                                        </button>
                                      )}
                                   </div>
                                )}
                             </div>
                          )}
                       </CardContent>
                    </Card>
                 )
              })
           )}

           {selectedPrinter.inks && selectedPrinter.inks.length > 0 && (
             <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-center z-50">
               <div className="w-full max-w-[800px]">
                 <Button 
                    className="w-full h-14 text-lg font-bold bg-emerald-500 hover:bg-emerald-600 shadow-xl uppercase tracking-widest" 
                    disabled={isSubmitting || !selectedPrinter.inks.some(i => inkStates[i.id]?.action !== 'NONE')}
                    onClick={handleSubmit}
                 >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Išsaugoma...
                      </div>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Patvirtinti ir Išsaugoti
                      </>
                    )}
                 </Button>
               </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};
