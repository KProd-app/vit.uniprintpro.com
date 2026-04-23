import React, { useState, useRef } from 'react';
import { PrinterData } from '../types';
import { usePrinters } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Camera, Droplet, Plus, Upload, CheckCircle } from 'lucide-react';

interface InkRefillToolProps {
  printers: PrinterData[];
  onClose: () => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const InkRefillTool: React.FC<InkRefillToolProps> = ({ printers, onClose, addToast }) => {
  const { user } = useAuth();
  const { updatePrinter, addInkLog, uploadInkPhoto } = usePrinters();
  
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterData | null>(null);
  const [actionType, setActionType] = useState<'STARTED_BOTTLE' | 'NEW_BOTTLE' | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPrinter = (printer: PrinterData) => {
    setSelectedPrinter(printer);
    setActionType(null);
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleActionSelect = (action: 'STARTED_BOTTLE' | 'NEW_BOTTLE') => {
    if (action === 'NEW_BOTTLE' && selectedPrinter && (selectedPrinter.inkInventory || 0) <= 0) {
      addToast("Klaida! Inventoriuje nėra naujų butelių (0). Praneškite pamainos meistrui.", "error");
      // Let them still take a photo? User said: "jei inventorius yra 0 turi išmesti klaidą kad reikia pranešti teamlead, o admin puslapyje klaida dingsta kai užkeliamas kiekis dazu."
      // So if inventory is 0, we allow logging but maybe leave inventory at 0 or -1? If -1, admin sees it.
      // Let's set it to -1 so admin sees the negative balance and fixes it. 
      // But user said: "turi mažėti -1 bet jei inventorius yra 0 turi išmesti klaidą kad reikia pranešti teamlead". 
      // I will allow them to continue but warn them, or block? "turi išmesti klaidą kad reikia pranešti teamlead".
      // I will block it. Let's see. If blocked, they can't log the new bottle. Or I show the error and still allow them to log so the physical bottle is accounted for. Let's allow and show error toast.
    }
    setActionType(action);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedPrinter || !actionType || !photo || !user) {
      addToast("Prašome užpildyti visus laukus ir įkelti nuotrauką.", "error");
      return;
    }

    const currentInventory = selectedPrinter.inkInventory || 0;
    if (actionType === 'NEW_BOTTLE' && currentInventory <= 0) {
      addToast("DĖMESIO: Naudojamas neregistruotas butelis! Praneškite meistrui.", "error");
    }

    setIsSubmitting(true);
    try {
      // 1. Upload photo
      const path = `${selectedPrinter.id}/${new Date().getTime()}_${photo.name}`;
      const photoUrl = await uploadInkPhoto(photo, path);

      // 2. Update inventory if NEW_BOTTLE
      const quantityChange = actionType === 'NEW_BOTTLE' ? -1 : 0;
      if (quantityChange !== 0) {
        await updatePrinter(selectedPrinter.id, {
          inkInventory: currentInventory + quantityChange
        });
      }

      // 3. Create log
      await addInkLog({
        printerId: selectedPrinter.id,
        printerName: selectedPrinter.name,
        operatorName: user.name,
        action: actionType,
        quantityChange,
        photoUrl
      });

      addToast("Dažų pildymas sėkmingai užregistruotas!", "success");
      onClose();
    } catch (error) {
      console.error("Error submitting ink refill:", error);
      addToast("Klaida išsaugant duomenis. Bandykite dar kartą.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 max-w-[800px] mx-auto animate-in fade-in duration-300">
      <header className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={selectedPrinter ? () => handleSelectPrinter(null as any) : onClose} className="rounded-full bg-white shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Dažų Pildymas</h1>
          <p className="text-slate-500 font-medium">{selectedPrinter ? selectedPrinter.name : 'Pasirinkite spausdintuvą'}</p>
        </div>
      </header>

      {!selectedPrinter ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {printers.map(p => (
            <Card key={p.id} className="hover:border-mimaki-blue cursor-pointer transition-all hover:shadow-lg" onClick={() => handleSelectPrinter(p)}>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{p.name}</h3>
                  <p className="text-sm text-slate-500">Likutis: <span className={(p.inkInventory || 0) <= 0 ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}>{p.inkInventory || 0} vnt.</span></p>
                </div>
                <Droplet className={`w-8 h-8 ${(p.inkInventory || 0) > 0 ? 'text-mimaki-blue' : 'text-slate-300'}`} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="uppercase tracking-widest text-slate-500 text-sm">Veiksmas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className={`h-24 flex flex-col items-center justify-center gap-2 border-2 ${actionType === 'STARTED_BOTTLE' ? 'border-mimaki-blue bg-blue-50 text-mimaki-blue' : 'border-slate-200 text-slate-600'}`}
                onClick={() => handleActionSelect('STARTED_BOTTLE')}
              >
                <Droplet className="w-6 h-6" />
                <span>Pradėtas butelis</span>
              </Button>
              <Button
                variant="outline"
                className={`h-24 flex flex-col items-center justify-center gap-2 border-2 ${actionType === 'NEW_BOTTLE' ? 'border-mimaki-blue bg-blue-50 text-mimaki-blue' : 'border-slate-200 text-slate-600'}`}
                onClick={() => handleActionSelect('NEW_BOTTLE')}
              >
                <Plus className="w-6 h-6" />
                <span>Imti naują butelį</span>
              </Button>
            </CardContent>
          </Card>

          {actionType && (
            <Card className="animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle className="uppercase tracking-widest text-slate-500 text-sm">Nuotrauka</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  {photoPreview ? (
                    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg group">
                      <img src={photoPreview} alt="Ink bottle" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                          <Camera className="w-4 h-4 mr-2" /> Perfokuoti
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-mimaki-blue hover:border-mimaki-blue hover:bg-blue-50 transition-all"
                    >
                      <Camera className="w-12 h-12 mb-4 opacity-50" />
                      <span className="font-bold">Nufotografuoti dažų butelį</span>
                      <span className="text-sm font-normal mt-1 opacity-70">Privaloma užfiksuoti etiketę</span>
                    </button>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full h-14 text-lg font-bold bg-emerald-500 hover:bg-emerald-600" 
                  disabled={!photo || isSubmitting}
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
                      Patvirtinti pildymą
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
