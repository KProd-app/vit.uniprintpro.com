import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Save, Trash2 } from 'lucide-react';
import { PrinterData } from '../types';

interface PrinterEditorProps {
    printer?: PrinterData; // If undefined, we are creating new
    onSave: (data: Partial<PrinterData>) => void;
    onDelete?: (id: string) => void;
    onCancel: () => void;
}

export const PrinterEditor: React.FC<PrinterEditorProps> = ({ printer, onSave, onDelete, onCancel }) => {
    const [name, setName] = useState(printer?.name || '');
    const [type, setType] = useState<'MIMAKI' | 'VIT'>(printer?.isMimaki ? 'MIMAKI' : 'VIT');
    const [templateId, setTemplateId] = useState(printer?.checklistTemplateId || '');
    const [qrCode, setQrCode] = useState(printer?.qrCode || '');
    const [hasNozzleCheck, setHasNozzleCheck] = useState(printer?.hasNozzleCheck ?? false);

    const handleSave = () => {
        if (!name.trim()) return;

        const data: Partial<PrinterData> = {
            name,
            isMimaki: type === 'MIMAKI',
            hasNozzleCheck,
            checklistTemplateId: templateId || undefined,
            qrCode: qrCode || undefined
        };
        onSave(data);
    };

    return (
        <Card className="w-full max-w-lg bg-white shadow-2xl border-0 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    {printer ? 'Redaguoti Įrenginį' : 'Naujas Įrenginys'}
                </h3>
                <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-400">
                    {type}
                </div>
            </div>

            <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Pavadinimas</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="pvz. Mimaki UJF-1"
                        className="font-bold text-lg"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">QR Kodas (Nebūtina)</Label>
                    <Input
                        value={qrCode}
                        onChange={(e) => setQrCode(e.target.value)}
                        placeholder="Nuskaičiuotas QR kodo turinys"
                        className="font-mono text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Tipas</Label>
                    <div className="flex gap-4">
                        <div
                            onClick={() => setType('MIMAKI')}
                            className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all text-center font-bold ${type === 'MIMAKI' ? 'border-mimaki-blue bg-blue-50 text-mimaki-blue' : 'border-slate-100 hover:border-slate-300 text-slate-400'}`}
                        >
                            MIMAKI
                        </div>
                        <div
                            onClick={() => setType('VIT')}
                            className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all text-center font-bold ${type === 'VIT' ? 'border-mimaki-blue bg-blue-50 text-mimaki-blue' : 'border-slate-100 hover:border-slate-300 text-slate-400'}`}
                        >
                            STANDARD (VIT)
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <Checkbox
                        id="nozzleCheck"
                        checked={hasNozzleCheck}
                        onCheckedChange={(checked) => setHasNozzleCheck(checked === true)}
                    />
                    <Label htmlFor="nozzleCheck" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                        Reikalauti Nozzle Check (Testinio spausdinimo)
                    </Label>
                </div>

                <div className="pt-6 flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="flex-1 h-12 rounded-xl text-slate-500 font-bold uppercase"
                    >
                        Atšaukti
                    </Button>

                    {printer && onDelete && (
                        <Button
                            variant="destructive"
                            className="flex-1 h-12 rounded-xl font-bold uppercase"
                            onClick={() => {
                                if (confirm('Ar tikrai norite ištrinti šį įrenginį?')) {
                                    onDelete(printer.id);
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Ištrinti
                        </Button>
                    )}
                    <Button
                        className="flex-[2] h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase shadow-lg shadow-emerald-200"
                        onClick={handleSave}
                        disabled={!name.trim()}
                    >
                        <Save className="w-4 h-4 mr-2" /> Išsaugoti
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
