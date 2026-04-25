import React, { useState, useRef } from 'react';
import { PrinterData, PrinterInk } from '../types';
import { usePrinters } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Camera, Droplet, Plus, CheckCircle, QrCode as QrIcon, X, Check } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { getVilniusShiftBoundaries } from '../lib/utils';
import { getUserInkPrinters, MIMAKI_GROUP_ID } from '../lib/inkGrouping';

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
  const { updatePrinter, addInkLog, uploadInkPhoto, printers: rawPrinters } = usePrinters();
  
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterData | null>(null);
  const [inkStates, setInkStates] = useState<Record<string, InkActionState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectingMimakiUnit, setSelectingMimakiUnit] = useState<PrinterData | null>(null);
  
  const [completedActions, setCompletedActions] = useState<Record<string, Record<string, string>>>(() => {
     try {
         if (!user?.id) return {};
         const saved = localStorage.getItem(`ink_completed_v2_${user.id}`);
         if (saved) {
             const parsed = JSON.parse(saved);
             // Keep state if less than 14 hours old
             if (Date.now() - parsed.timestamp < 14 * 60 * 60 * 1000) {
                 return parsed.actions || {};
             }
         }
     } catch (e) {}
     return {};
  });
  
  // Scanner Modal State
  const [scanningInk, setScanningInk] = useState<PrinterInk | null>(null);

  // Hidden file inputs refs
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleSelectPrinter = (printer: PrinterData) => {
    if (printer.id === MIMAKI_GROUP_ID && !printer.name.includes('Mimaki ')) {
       setSelectingMimakiUnit(printer);
       return;
    }

    setSelectedPrinter(printer);
    const initialStates: Record<string, InkActionState> = {};
    const previousActions = completedActions[printer.id] || {};
    
    (printer.inks || []).forEach(ink => {
      initialStates[ink.id] = { action: 'NONE' };
    });
    setInkStates(initialStates);
  };

  const handleMimakiUnitSelect = (unit: number) => {
     if (!selectingMimakiUnit) return;
     const newPrinter: PrinterData = {
        ...selectingMimakiUnit,
        id: `${MIMAKI_GROUP_ID}-${unit}`,
        name: `Mimaki ${unit}`
     };
     setSelectingMimakiUnit(null);
     handleSelectPrinter(newPrinter);
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
      // Remove addToast to avoid blocking the bottom of the screen on mobile
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

    // Validate: only look at inks that are active
    const newActiveInks = selectedPrinter.inks?.filter(i => {
       const state = inkStates[i.id];
       return state.action !== 'NONE';
    }) || [];

    if (newActiveInks.length === 0) {
      // If they are just viewing and clicked "Uždaryti", just close
      const hasAnyNewAction = selectedPrinter.inks?.some(i => inkStates[i.id].action !== 'NONE');
      if (!hasAnyNewAction) {
         setSelectedPrinter(null);
         return;
      }
      addToast("Pasirinkite bent vieną naują dažą pildymui.", "error");
      return;
    }

    for (const ink of newActiveInks) {
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
      let newCompletedActions = { ...(completedActions[selectedPrinter.id] || {}) };
      const { currentShiftName, logicalDateString } = getVilniusShiftBoundaries();

      for (const ink of newActiveInks) {
        const state = inkStates[ink.id];
        
        // 1. Upload photo
        const path = `${selectedPrinter.id}/${ink.id}_${new Date().getTime()}_${state.photo!.name}`;
        const photoUrl = await uploadInkPhoto(state.photo!, path);

        // 2. Adjust inventory
        const quantityChange = state.action === 'NEW_BOTTLE' ? -1 : 0;
        const currentInv = currentInks.find(i => i.id === ink.id)?.inventory || 0;
        if (state.action === 'NEW_BOTTLE') {
           currentInks = currentInks.map(i => i.id === ink.id ? { ...i, inventory: Math.max(0, currentInv - 1) } : i);
        }

        const actualPrinterId = selectedPrinter.id.startsWith(MIMAKI_GROUP_ID) 
           ? rawPrinters.find(p => p.isMimaki)?.id || selectedPrinter.id 
           : selectedPrinter.id;

        // 3. Create log
        await addInkLog({
          printerId: actualPrinterId,
          printerName: selectedPrinter.name,
          inkId: ink.id,
          inkName: ink.name,
          operatorName: user.name,
          action: state.action as 'STARTED_BOTTLE' | 'NEW_BOTTLE',
          quantityChange,
          photoUrl,
          shift: currentShiftName,
          logicalDate: logicalDateString
        });
        
        newCompletedActions[ink.id] = state.action;
      }

      // Update printer config once with all inventory changes
      // If it's a virtual unit like mimaki-group-3, we need to update the base mimaki group
      const basePrinterId = selectedPrinter.id.startsWith(MIMAKI_GROUP_ID) ? MIMAKI_GROUP_ID : selectedPrinter.id;
      // We don't have syncGroupedInks here easily, but wait, updatePrinter on Mimaki will only update one?
      // Wait, InkRefillTool shouldn't update inventory on virtual IDs. 
      // We'll dispatch updatePrinter. Let's just find the original Mimaki printers and update them.
      if (selectedPrinter.id.startsWith(MIMAKI_GROUP_ID)) {
         const mimakiIds = printers.filter(p => p.isMimaki).map(p => p.id);
         await Promise.all(mimakiIds.map(id => updatePrinter(id, { inks: currentInks })));
      } else if (selectedPrinter.name.toLowerCase().includes('dacen')) {
         const dacenIds = printers.filter(p => p.name.toLowerCase().includes('dacen')).map(p => p.id);
         await Promise.all(dacenIds.map(id => updatePrinter(id, { inks: currentInks })));
      } else {
         await updatePrinter(basePrinterId, { inks: currentInks });
      }

      // Mark printer as completed for this shift
      const newActions = {
         ...completedActions,
         [selectedPrinter.id]: newCompletedActions
      };
      setCompletedActions(newActions);
      if (user?.id) {
         localStorage.setItem(`ink_completed_v2_${user.id}`, JSON.stringify({
            timestamp: Date.now(),
            actions: newActions
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
    <div className="min-h-screen bg-slate-50/50 pb-28 md:p-10 max-w-[800px] mx-auto animate-in fade-in duration-300 relative">
      
      {/* Scanner Modal */}
      {scanningInk && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-slate-900/95 backdrop-blur-sm animate-in fade-in">
          <div className="flex justify-between items-center p-6 border-b border-white/10 mt-safe">
            <h3 className="font-bold text-xl text-white tracking-tight flex items-center gap-2">
              <QrIcon className="w-6 h-6 text-emerald-400" /> Skenuoti: {scanningInk.name}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setScanningInk(null)} className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full h-12 w-12">
               <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6">
             <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] ring-1 ring-white/10">
                {/* Viewfinder overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border-2 border-emerald-500/50 rounded-2xl">
                     <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-2xl"></div>
                     <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-2xl"></div>
                     <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-2xl"></div>
                     <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-2xl"></div>
                   </div>
                   <div className="absolute top-0 left-0 w-full h-[12.5%] bg-black/40 backdrop-blur-sm"></div>
                   <div className="absolute bottom-0 left-0 w-full h-[12.5%] bg-black/40 backdrop-blur-sm"></div>
                   <div className="absolute top-[12.5%] left-0 w-[12.5%] h-[75%] bg-black/40 backdrop-blur-sm"></div>
                   <div className="absolute top-[12.5%] right-0 w-[12.5%] h-[75%] bg-black/40 backdrop-blur-sm"></div>
                </div>
                <Scanner onScan={(result) => handleScanSuccess(result[0].rawValue)} />
             </div>
             <div className="mt-10 bg-white/5 p-6 rounded-3xl border border-white/10 max-w-sm w-full text-center">
               <p className="text-slate-300 text-sm font-medium leading-relaxed">
                 Nukreipkite kamerą į <strong className="text-white bg-white/10 px-2 py-0.5 rounded-md">{scanningInk.name}</strong> butelio barkodą.
               </p>
               <p className="text-emerald-400 font-mono text-xs mt-3 bg-emerald-500/10 inline-block px-3 py-1.5 rounded-lg border border-emerald-500/20">
                 Laukiamas: {scanningInk.qrCode}
               </p>
             </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="pt-6 pb-4 px-6 md:px-0 flex items-center gap-4 bg-white/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none sticky top-0 z-40 border-b border-slate-200 md:border-none shadow-sm md:shadow-none">
        <Button variant="ghost" size="icon" onClick={selectedPrinter ? () => handleSelectPrinter(null as any) : (selectingMimakiUnit ? () => setSelectingMimakiUnit(null) : onClose)} className="rounded-2xl bg-white shadow-sm border border-slate-100 h-12 w-12 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-700" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">Dažų Pildymas</h1>
          <p className="text-sm text-slate-500 font-medium mt-1 truncate">{selectedPrinter ? selectedPrinter.name : (selectingMimakiUnit ? 'Pasirinkite įrenginį' : 'Pasirinkite spausdintuvą')}</p>
        </div>
      </header>

      <main className="p-4 md:p-0 mt-2">
        {selectingMimakiUnit ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(unit => {
               const unitId = `${MIMAKI_GROUP_ID}-${unit}`;
               const isCompleted = !!completedActions[unitId] && Object.keys(completedActions[unitId]).length > 0;
               return (
                 <button 
                   key={unit} 
                   onClick={() => handleMimakiUnitSelect(unit)} 
                   className={`h-32 flex flex-col items-center justify-center rounded-[32px] border-2 transition-all active:scale-95 shadow-sm hover:shadow-md relative overflow-hidden ${isCompleted ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:border-mimaki-blue'}`}
                 >
                   <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isCompleted ? 'text-emerald-500' : 'text-slate-400'}`}>MIMAKI</span>
                   <span className={`text-4xl font-black ${isCompleted ? 'text-emerald-600' : 'text-slate-800'}`}>{unit}</span>
                   {isCompleted && (
                     <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-600 p-1.5 rounded-full">
                       <Check className="w-4 h-4" />
                     </div>
                   )}
                 </button>
               );
            })}
          </div>
        ) : !selectedPrinter ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {getUserInkPrinters(printers).map(p => {
              let isCompleted = false;
              if (p.id === MIMAKI_GROUP_ID) {
                 isCompleted = [1,2,3,4,5,6,7,8].some(u => !!completedActions[`${MIMAKI_GROUP_ID}-${u}`] && Object.keys(completedActions[`${MIMAKI_GROUP_ID}-${u}`]).length > 0);
              } else {
                 isCompleted = !!completedActions[p.id] && Object.keys(completedActions[p.id]).length > 0;
              }
              return (
                <div 
                  key={p.id} 
                  className={`bg-white rounded-[32px] p-6 border-2 transition-all active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md ${isCompleted ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 hover:border-mimaki-blue/50'}`} 
                  onClick={() => handleSelectPrinter(p)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-mimaki-blue'}`}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Droplet className="w-6 h-6" />}
                    </div>
                    {(p.inks?.length || 0) > 0 && (
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                        {p.inks?.length} Rūšys
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-xl text-slate-800 tracking-tight">{p.name}</h3>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
             {(!selectedPrinter.inks || selectedPrinter.inks.length === 0) ? (
                <div className="bg-white p-10 rounded-[32px] text-center shadow-sm border border-slate-200 border-dashed">
                  <Droplet className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-slate-700 tracking-tight mb-2">Dažų Neaptikta</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">Šiam įrenginiui nėra priskirtų dažų. Administratorius turi juos pridėti sistemoje.</p>
                </div>
             ) : (
                selectedPrinter.inks.map(ink => {
                   const previousActions = completedActions[selectedPrinter.id] || {};
                   const isPreviouslyCompleted = !!previousActions[ink.id];
                   const state = inkStates[ink.id] || { action: 'NONE' };
                   const isTakingAction = state.action !== 'NONE';

                   // Soft Pastel Color detection based on ink name
                   const lowerName = ink.name.toLowerCase();
                   let pastelBg = 'bg-white';
                   let pastelBorder = 'border-slate-200';
                   let accentText = 'text-slate-700';
                   let accentBg = 'bg-slate-100';
                   
                   if (lowerName.includes('cyan') || lowerName.includes('c')) {
                      pastelBg = 'bg-[#f0f9ff]'; pastelBorder = 'border-[#bae6fd]'; accentText = 'text-[#0369a1]'; accentBg = 'bg-[#e0f2fe]';
                   } else if (lowerName.includes('magenta') || lowerName.includes('m')) {
                      pastelBg = 'bg-[#fdf4ff]'; pastelBorder = 'border-[#f5d0fe]'; accentText = 'text-[#a21caf]'; accentBg = 'bg-[#fae8ff]';
                   } else if (lowerName.includes('yellow') || lowerName.includes('y')) {
                      pastelBg = 'bg-[#fefce8]'; pastelBorder = 'border-[#fef08a]'; accentText = 'text-[#a16207]'; accentBg = 'bg-[#fef9c3]';
                   } else if (lowerName.includes('black') || lowerName.includes('k')) {
                      pastelBg = 'bg-[#f8fafc]'; pastelBorder = 'border-[#cbd5e1]'; accentText = 'text-[#334155]'; accentBg = 'bg-[#e2e8f0]';
                   } else if (lowerName.includes('white') || lowerName.includes('w')) {
                      pastelBg = 'bg-white'; pastelBorder = 'border-slate-200'; accentText = 'text-slate-500'; accentBg = 'bg-slate-50';
                   } else if (lowerName.includes('varnish') || lowerName.includes('v')) {
                      pastelBg = 'bg-[#fffbeb]'; pastelBorder = 'border-[#fde68a]'; accentText = 'text-[#b45309]'; accentBg = 'bg-[#fef3c7]';
                   }

                   // If it's previously completed and not being touched, fade it out slightly
                   const fadeClass = (isPreviouslyCompleted && !isTakingAction) ? 'opacity-60 saturate-50' : '';
                   const activeBorderClass = isTakingAction ? 'ring-2 ring-emerald-400 border-transparent shadow-md' : pastelBorder;

                   return (
                      <div key={ink.id} className={`rounded-[32px] border-2 transition-all duration-300 overflow-hidden ${pastelBg} ${activeBorderClass} ${fadeClass}`}>
                         
                         <div className="p-5 md:p-6 pb-0">
                            <div className="flex justify-between items-start mb-4">
                               <div>
                                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ${accentBg} ${accentText}`}>
                                    {ink.name}
                                  </span>
                                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{ink.name}</h3>
                                  <div className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                                     Likutis sandėlyje: <span className={`font-black ${ink.inventory <= 0 ? 'text-red-500' : accentText}`}>{ink.inventory} vnt.</span>
                                  </div>
                               </div>
                               
                               <div className="flex flex-col items-end gap-2">
                                 {state.qrVerified && (
                                    <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full flex items-center text-xs font-bold shadow-sm animate-in zoom-in">
                                       <Check className="w-4 h-4 mr-1" /> QR OK
                                    </div>
                                 )}
                                 {isPreviouslyCompleted && !isTakingAction && (
                                    <div className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                                       Jau Pildyta
                                    </div>
                                 )}
                               </div>
                            </div>

                            {/* Segmented Control - Modern Apple-like design */}
                            <div className="bg-white/60 backdrop-blur-sm p-1.5 rounded-2xl flex relative shadow-inner border border-white/40">
                               <button
                                  className={`flex-1 py-3.5 relative z-10 flex flex-col items-center justify-center gap-1 transition-all rounded-xl ${state.action === 'NONE' ? 'text-slate-800 font-black' : 'text-slate-400 font-bold hover:text-slate-600'}`}
                                  onClick={() => handleActionSelect(ink, 'NONE')}
                               >
                                  {state.action === 'NONE' && <div className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] -z-10" />}
                                  <span className="text-[11px] uppercase tracking-wider relative z-10">Nepildoma</span>
                               </button>
                               <button
                                  className={`flex-1 py-3.5 relative z-10 flex flex-col items-center justify-center gap-1 transition-all rounded-xl ${state.action === 'STARTED_BOTTLE' ? 'text-blue-700 font-black' : 'text-slate-400 font-bold hover:text-slate-600'}`}
                                  onClick={() => handleActionSelect(ink, 'STARTED_BOTTLE')}
                               >
                                  {state.action === 'STARTED_BOTTLE' && <div className="absolute inset-0 bg-white border-b-2 border-blue-500 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] -z-10" />}
                                  <span className="text-[11px] uppercase tracking-wider flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5" /> Pradėtas</span>
                               </button>
                               <button
                                  className={`flex-1 py-3.5 relative z-10 flex flex-col items-center justify-center gap-1 transition-all rounded-xl ${state.action === 'NEW_BOTTLE' ? 'text-emerald-700 font-black' : 'text-slate-400 font-bold hover:text-slate-600'}`}
                                  onClick={() => handleActionSelect(ink, 'NEW_BOTTLE')}
                               >
                                  {state.action === 'NEW_BOTTLE' && <div className="absolute inset-0 bg-white border-b-2 border-emerald-500 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] -z-10" />}
                                  <span className="text-[11px] uppercase tracking-wider flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Naujas</span>
                               </button>
                            </div>
                         </div>

                         {/* Action Verification & Photo Area */}
                         <div className={`transition-all duration-300 ease-in-out origin-top ${isTakingAction ? 'opacity-100 max-h-[500px] mt-4' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                            <div className="px-5 md:px-6 pb-5 md:pb-6">
                               {state.action === 'NEW_BOTTLE' && !state.qrVerified ? (
                                  <Button 
                                    onClick={() => setScanningInk(ink)} 
                                    className="w-full h-16 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-sm flex gap-3 shadow-lg shadow-slate-800/20 active:scale-[0.98] transition-all"
                                  >
                                     <div className="bg-white/20 p-2 rounded-lg"><QrIcon className="w-5 h-5" /></div>
                                     Skenuoti Barkodą
                                  </Button>
                               ) : (
                                  <div className="flex flex-col items-center justify-center w-full">
                                     <input
                                       type="file"
                                       accept="image/*"
                                       capture="environment"
                                       className="hidden"
                                       ref={(el) => fileInputRefs.current[ink.id] = el}
                                       onChange={(e) => handleFileChange(ink.id, e)}
                                     />
                                     {state.preview ? (
                                       <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-md group">
                                         <img src={state.preview} alt="Ink bottle" className="w-full h-full object-cover" />
                                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                           <Button onClick={() => fileInputRefs.current[ink.id]?.click()} variant="secondary" className="rounded-xl h-12 font-bold">
                                             <Camera className="w-5 h-5 mr-2" /> Perfokuoti
                                           </Button>
                                         </div>
                                         <div className="absolute bottom-3 right-3">
                                            <Button size="icon" onClick={() => fileInputRefs.current[ink.id]?.click()} className="rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40">
                                               <Camera className="w-4 h-4" />
                                            </Button>
                                         </div>
                                       </div>
                                     ) : (
                                       <button
                                         onClick={() => fileInputRefs.current[ink.id]?.click()}
                                         className="w-full py-10 bg-white/60 backdrop-blur-sm border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-emerald-600 transition-all active:scale-[0.98]"
                                       >
                                         <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                                            <Camera className="w-8 h-8" />
                                         </div>
                                         <span className="font-black uppercase text-xs tracking-widest">Fotografuoti Butelį</span>
                                         <span className="text-[10px] font-medium text-slate-400 mt-1">Būtina aiški nuotrauka</span>
                                       </button>
                                     )}
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>
                   )
                })
             )}
          </div>
        )}

        {/* STICKY BOTTOM BAR */}
        {selectedPrinter && selectedPrinter.inks && selectedPrinter.inks.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe-bottom bg-white/80 backdrop-blur-xl border-t border-slate-200/50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex justify-center z-50">
            <div className="w-full max-w-[800px]">
              {(() => {
                 const hasAnyNewAction = selectedPrinter.inks.some(i => inkStates[i.id]?.action !== 'NONE');

                 if (!hasAnyNewAction) {
                    return (
                       <Button 
                          className="w-full h-16 text-sm font-black bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl uppercase tracking-widest border border-slate-200" 
                          onClick={() => setSelectedPrinter(null)}
                       >
                          Grįžti atgal
                       </Button>
                    );
                 }

                 return (
                    <Button 
                       className="w-full h-16 text-sm font-black bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white rounded-2xl uppercase tracking-widest active:scale-[0.98] transition-all" 
                       disabled={isSubmitting}
                       onClick={handleSubmit}
                    >
                       {isSubmitting ? (
                         <div className="flex items-center gap-3">
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           Išsaugoma...
                         </div>
                       ) : (
                         <>
                           <CheckCircle className="w-5 h-5 mr-2" />
                           Patvirtinti Pildymą
                         </>
                       )}
                    </Button>
                 );
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
