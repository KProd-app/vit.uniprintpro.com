import React, { useState, useEffect } from 'react';
import { ChecklistTemplate } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Trash2, Save, X } from 'lucide-react';

interface ChecklistEditorProps {
    template?: ChecklistTemplate; // If undefined, creating new
    onSave: (template: ChecklistTemplate | Omit<ChecklistTemplate, 'id'>) => Promise<void>;
    onCancel: () => void;
    onDelete?: (id: string) => Promise<void>;
}

export const ChecklistEditor: React.FC<ChecklistEditorProps> = ({ template, onSave, onCancel, onDelete }) => {
    const [name, setName] = useState(template?.name || '');
    const [items, setItems] = useState<string[]>(template?.items || ['']);
    const [isSaving, setIsSaving] = useState(false);

    const handleAddItem = () => {
        setItems([...items, '']);
    };

    const handleItemChange = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index] = value;
        setItems(newItems);
    };

    const handleDeleteItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);

        try {
            const cleanItems = items.filter(i => i.trim() !== '');

            const data = {
                ...(template?.id ? { id: template.id } : {}),
                name,
                items: cleanItems
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
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-2xl w-full mx-auto">
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
                        placeholder="Pvz: Ryto patikra"
                        className="text-lg font-bold bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:border-slate-200"
                    />
                </div>

                <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">Punktai</label>
                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    value={item}
                                    onChange={(e) => handleItemChange(index, e.target.value)}
                                    placeholder={`Punktas #${index + 1}`}
                                    className="bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-50 dark:text-slate-900 dark:border-slate-200"
                                />
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(index)} className="text-slate-400 hover:text-red-500">
                                    <X className="w-5 h-5" />
                                </Button>
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
