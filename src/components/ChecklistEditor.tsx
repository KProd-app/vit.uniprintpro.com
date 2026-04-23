import React, { useState, useEffect } from 'react';
import { ChecklistTemplate } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Trash2, Save, X, Clock } from 'lucide-react';
import { parseChecklistItem, formatChecklistItem, ParsedChecklistItem } from '../lib/checklistUtils';


interface ChecklistEditorProps {
    template?: ChecklistTemplate; // If undefined, creating new
    onSave: (template: ChecklistTemplate | Omit<ChecklistTemplate, 'id'>) => Promise<void>;
    onCancel: () => void;
    onDelete?: (id: string) => Promise<void>;
}

export const ChecklistEditor: React.FC<ChecklistEditorProps> = ({ template, onSave, onCancel, onDelete }) => {
    const [name, setName] = useState(template?.name || '');
    const [type, setType] = useState<'START' | 'END'>(template?.type || 'START');
    const [items, setItems] = useState<ParsedChecklistItem[]>(
        template?.items ? template.items.map(parseChecklistItem) : [{ original: '', text: '' }]
    );
    const [openScheduleIndex, setOpenScheduleIndex] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddItem = () => {
        setItems([...items, { original: '', text: '' }]);
    };

    const handleTextChange = (index: number, text: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], text };
        setItems(newItems);
    };

    const handleToggleDay = (index: number, day: number) => {
        const newItems = [...items];
        const currentDays = newItems[index].days || [];
        if (currentDays.includes(day)) {
            newItems[index].days = currentDays.filter(d => d !== day);
            if (newItems[index].days?.length === 0) newItems[index].days = undefined;
        } else {
            newItems[index].days = [...currentDays, day].sort((a, b) => a - b);
        }
        setItems(newItems);
    };

    const handleToggleShift = (index: number, shift: string) => {
        const newItems = [...items];
        const currentShifts = newItems[index].shifts || [];
        if (currentShifts.includes(shift)) {
            newItems[index].shifts = currentShifts.filter(s => s !== shift);
            if (newItems[index].shifts?.length === 0) newItems[index].shifts = undefined;
        } else {
            newItems[index].shifts = [...currentShifts, shift];
        }
        setItems(newItems);
    };

    const handleDeleteItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
        if (openScheduleIndex === index) setOpenScheduleIndex(null);
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);

        try {
            const cleanItems = items.filter(i => i.text.trim() !== '');
            const formattedItems = cleanItems.map(i => formatChecklistItem(i.text.trim(), i.days, i.shifts));

            const data = {
                ...(template?.id ? { id: template.id } : {}),
                name,
                type,
                items: formattedItems
            };

            await onSave(data);
            onCancel();
        } catch (error: any) {
            console.error(error);
            alert('Nepavyko išsaugoti: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black uppercase text-slate-800">
                    {template ? 'Redaguoti šabloną' : 'Naujas šablonas'}
                </h3>
                {template && onDelete && (
                    <Button variant="destructive" onClick={() => {
                        if (confirm('Ar tikrai ištrinti?')) {
                            onDelete(template.id);
                            onCancel();
                        }
                    }}>
                        <Trash2 className="w-5 h-5" />
                    </Button>
                )}
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">Pavadinimas</label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Pvz: Dieninė patikra"
                        className="text-lg font-bold bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:border-slate-200"
                    />
                </div>

                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">Tipas</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setType('START')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold uppercase transition-all ${type === 'START' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Pradžios (Start)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('END')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold uppercase transition-all ${type === 'END' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Pabaigos (End)
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">Punktai</label>
                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="flex flex-col gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
                                <div className="flex gap-2">
                                    <Input
                                        value={item.text}
                                        onChange={(e) => handleTextChange(index, e.target.value)}
                                        placeholder={`Punktas #${index + 1}`}
                                        className="bg-white border-slate-200 text-slate-900 shadow-sm"
                                    />
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        onClick={() => setOpenScheduleIndex(openScheduleIndex === index ? null : index)}
                                        className={`${item.days?.length || item.shifts?.length ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}
                                    >
                                        <Clock className={`w-5 h-5 ${item.days?.length || item.shifts?.length ? 'text-blue-500' : 'text-slate-400'}`} />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(index)} className="text-slate-400 hover:text-red-500 hover:bg-slate-100">
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                                {openScheduleIndex === index && (
                                    <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm mt-1 animate-in slide-in-from-top-2">
                                        <div className="mb-3">
                                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Savaitės dienos (jei tuščia - kasdien)</label>
                                            <div className="flex flex-wrap gap-1">
                                                {[
                                                    { id: 1, label: 'Pr' },
                                                    { id: 2, label: 'An' },
                                                    { id: 3, label: 'Tr' },
                                                    { id: 4, label: 'Kt' },
                                                    { id: 5, label: 'Pn' },
                                                    { id: 6, label: 'Št' },
                                                    { id: 7, label: 'Sk' },
                                                ].map(day => (
                                                    <button
                                                        key={day.id}
                                                        onClick={() => handleToggleDay(index, day.id)}
                                                        className={`w-9 h-9 rounded-md text-sm font-bold transition-colors ${item.days?.includes(day.id) ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                    >
                                                        {day.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Pamaina (jei tuščia - abi)</label>
                                            <div className="flex gap-2">
                                                {['Dieninė', 'Naktinė'].map(shift => (
                                                    <button
                                                        key={shift}
                                                        onClick={() => handleToggleShift(index, shift)}
                                                        className={`px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${item.shifts?.includes(shift) ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                    >
                                                        {shift}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" onClick={handleAddItem} className="mt-4 w-full border-dashed border-2">
                        <Plus className="w-4 h-4 mr-2" /> Pridėti punktą
                    </Button>
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100">
                    <Button variant="secondary" onClick={onCancel} className="flex-1">Atšaukti</Button>
                    <Button onClick={handleSave} disabled={isSaving || !name.trim()} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white">
                        <Save className="w-5 h-5 mr-2" /> Išsaugoti
                    </Button>
                </div>
            </div>
        </div>
    );
};
