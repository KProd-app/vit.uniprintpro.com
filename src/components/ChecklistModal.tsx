import React, { useState } from 'react';
import { ChecklistTemplate } from '../types';
import { Button } from './ui/button';
import { CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistModalProps {
    template: ChecklistTemplate;
    onComplete: (items: { [key: string]: boolean }) => void;
    onCancel: () => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({ template, onComplete, onCancel }) => {
    const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

    const toggleItem = (item: string) => {
        setCheckedItems(prev => ({
            ...prev,
            [item]: !prev[item]
        }));
    };

    const allChecked = template.items.length > 0 && template.items.every(item => checkedItems[item]);

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 pb-4 border-b border-slate-100">
                    <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tight mb-1">
                        {template.name}
                    </h2>
                    <p className="text-slate-500 font-medium">Būtina atlikti prieš pradedant darbą</p>
                </div>

                <div className="p-8 overflow-y-auto flex-1 space-y-4">
                    {template.items.map((item, index) => {
                        const isChecked = !!checkedItems[item];
                        return (
                            <div
                                key={index}
                                onClick={() => toggleItem(item)}
                                className={cn(
                                    "flex items-start p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 select-none",
                                    isChecked
                                        ? "bg-emerald-50 border-emerald-500"
                                        : "bg-slate-50 border-slate-200 hover:border-mimaki-blue"
                                )}
                            >
                                <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-0.5 transition-colors",
                                    isChecked
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : "bg-white border-slate-300"
                                )}>
                                    {isChecked && <CheckCircle className="w-4 h-4" />}
                                </div>
                                <span className={cn(
                                    "text-lg font-bold leading-tight",
                                    isChecked ? "text-emerald-900" : "text-slate-700"
                                )}>
                                    {item}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                    <Button variant="outline" onClick={onCancel} className="flex-1 h-14 text-slate-500 font-bold uppercase rounded-2xl hover:bg-white">
                        Atšaukti
                    </Button>
                    <Button
                        onClick={() => onComplete(checkedItems)}
                        disabled={!allChecked}
                        className={cn(
                            "flex-[2] h-14 font-black uppercase rounded-2xl text-lg transition-all shadow-lg",
                            allChecked
                                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 text-white"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        )}
                    >
                        Patvirtinti ir Pradėti
                    </Button>
                </div>
            </div>
        </div>
    );
};
