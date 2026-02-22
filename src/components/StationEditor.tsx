import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { X, Save, Trash2 } from 'lucide-react';
import { PrinterData } from '../types';

interface StationEditorProps {
    station?: PrinterData; // If undefined, we are creating new
    onSave: (data: Partial<PrinterData>) => void;
    onDelete?: (id: string) => void;
    onCancel: () => void;
}

export const StationEditor: React.FC<StationEditorProps> = ({ station, onSave, onDelete, onCancel }) => {
    const [name, setName] = useState(station?.name || '');
    const [type, setType] = useState<'MIMAKI' | 'VIT'>(station?.isMimaki ? 'MIMAKI' : 'VIT');
    const [templateId, setTemplateId] = useState(station?.checklistTemplateId || '');
    const [qrCode, setQrCode] = useState(station?.qrCode || '');
    const [hasNozzleCheck, setHasNozzleCheck] = useState(station?.hasNozzleCheck ?? false);
    const [requireDateOnNozzle, setRequireDateOnNozzle] = useState(station?.requireDateOnNozzle ?? false);
    const [assignedMimakiUnits, setAssignedMimakiUnits] = useState<number[]>(station?.assignedMimakiUnits || []);

    const handleSave = () => {
        if (!name.trim()) return;

        const data: Partial<PrinterData> = {
            name,
            isMimaki: type === 'MIMAKI',
            assignedMimakiUnits: type === 'MIMAKI' ? assignedMimakiUnits : undefined,
            hasNozzleCheck,
            requireDateOnNozzle,
            checklistTemplateId: templateId || undefined,
            qrCode: qrCode || undefined
        };
        onSave(data);
    };

    return (
        <Card className="w-full max-w-lg bg-white shadow-2xl border-0 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* ... (existing header) */}
            <CardContent className="p-8 space-y-6">
                {/* ... (existing Name input) */}
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

                <div className="flex flex-col space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="nozzleCheck"
                            checked={hasNozzleCheck}
                            onCheckedChange={(checked) => setHasNozzleCheck(checked === true)}
                        />
                        <Label htmlFor="nozzleCheck" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                            Reikalauti Nozzle Check (Testinio spausdinimo)
                        </Label>
                    </div>
                    {hasNozzleCheck && (
                        <div className="flex items-center space-x-3 pl-7 animate-in slide-in-from-top-2">
                            <Checkbox
                                id="requireDate"
                                checked={requireDateOnNozzle}
                                onCheckedChange={(checked) => setRequireDateOnNozzle(checked === true)}
                            />
                            <Label htmlFor="requireDate" className="text-sm font-bold text-slate-700 cursor-pointer select-none text-emerald-600">
                                Reikalauti užrašytos datos ant Nozzle Check
                            </Label>
                        </div>
                    )}
                </div>

                {type === 'MIMAKI' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase">Numatytieji Blokai (Neprivaloma)</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(unit => (
                                <div
                                    key={unit}
                                    onClick={() => {
                                        setAssignedMimakiUnits(prev =>
                                            prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit].sort()
                                        );
                                    }}
                                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center font-bold ${assignedMimakiUnits.includes(unit)
                                        ? 'border-mimaki-blue bg-mimaki-blue text-white shadow-md'
                                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300'
                                        }`}
                                >
                                    {unit}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-6 flex gap-4">
                    {/* ... (existing buttons) */}
                    {station && onDelete && (
                        <Button
                            variant="destructive"
                            className="flex-1 h-12 rounded-xl font-bold uppercase"
                            onClick={() => {
                                if (confirm('Ar tikrai norite ištrinti šį stationą?')) {
                                    onDelete(station.id);
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
