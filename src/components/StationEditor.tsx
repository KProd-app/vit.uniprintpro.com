import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Save, Trash2, Printer } from 'lucide-react';
import { Station, PrinterData } from '../types';

interface StationEditorProps {
    station?: Station; // If undefined, we are creating new
    allPrinters: PrinterData[];
    onSave: (data: Partial<Station>, assignedPrinterIds: string[]) => void;
    onDelete?: (id: string) => void;
    onCancel: () => void;
}

export const StationEditor: React.FC<StationEditorProps> = ({ station, allPrinters, onSave, onDelete, onCancel }) => {
    const [name, setName] = useState(station?.name || '');
    const [qrLink, setQrLink] = useState(station?.stationQrLink || '');
    const [assignedPrinters, setAssignedPrinters] = useState<string[]>([]);

    useEffect(() => {
        if (station) {
            // Find printers assigned to this station
            const assigned = allPrinters
                .filter(p => p.stationId === station.id)
                .map(p => p.id);
            setAssignedPrinters(assigned);
        }
    }, [station, allPrinters]);

    const handleSave = () => {
        if (!name.trim()) return;

        const data: Partial<Station> = {
            name,
            stationQrLink: qrLink || undefined
        };
        onSave(data, assignedPrinters);
    };

    const togglePrinter = (printerId: string) => {
        setAssignedPrinters(prev =>
            prev.includes(printerId)
                ? prev.filter(id => id !== printerId)
                : [...prev, printerId]
        );
    };

    return (
        <Card className="w-full max-w-lg bg-white shadow-2xl border-0 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    {station ? 'Redaguoti Stationą' : 'Naujas Stationas'}
                </h3>
                <div className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-400">
                    STATION
                </div>
            </div>

            <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Pavadinimas</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="pvz. Mimaki Powerbank"
                        className="font-bold text-lg"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Instrukcijų QR Link (URL)</Label>
                    <Input
                        value={qrLink}
                        onChange={(e) => setQrLink(e.target.value)}
                        placeholder="https://..."
                        className="font-mono text-sm"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Priskirti įrenginiai</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50">
                        {allPrinters.map(printer => (
                            <div
                                key={printer.id}
                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${assignedPrinters.includes(printer.id) ? 'bg-white border-mimaki-blue shadow-sm' : 'border-transparent hover:bg-white hover:shadow-sm'}`}
                                onClick={() => togglePrinter(printer.id)}
                            >
                                <Checkbox
                                    checked={assignedPrinters.includes(printer.id)}
                                    onCheckedChange={() => togglePrinter(printer.id)}
                                    className="mr-3"
                                />
                                <div className="flex-1">
                                    <span className={`text-sm font-bold ${assignedPrinters.includes(printer.id) ? 'text-slate-800' : 'text-slate-500'}`}>{printer.name}</span>
                                    {printer.stationId && printer.stationId !== station?.id && (
                                        <span className="block text-[10px] text-amber-500 font-bold uppercase">
                                            (Jau priskirtas kitur)
                                        </span>
                                    )}
                                </div>
                                <Printer className={`w-4 h-4 ${assignedPrinters.includes(printer.id) ? 'text-mimaki-blue' : 'text-slate-300'}`} />
                            </div>
                        ))}
                        {allPrinters.length === 0 && (
                            <p className="text-center text-xs text-slate-400 italic py-4">Nėra įrenginių</p>
                        )}
                    </div>
                </div>

                <div className="pt-6 flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="flex-1 h-12 rounded-xl text-slate-500 font-bold uppercase"
                    >
                        Atšaukti
                    </Button>

                    {station && onDelete && (
                        /* Only show delete if strictly necessary, but maybe disable if printers assigned? */
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
