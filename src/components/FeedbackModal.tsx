import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { X, MessageSquare, AlertTriangle, Lightbulb, Send } from 'lucide-react';
import { usePrinters } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Feedback } from '../types';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, addToast }) => {
    const { user } = useAuth();
    const { saveFeedback } = usePrinters();

    const [type, setType] = useState<'BUG' | 'FEATURE' | 'OTHER'>('BUG');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        try {
            await saveFeedback({
                userId: user?.id || 'anonymous',
                userName: user?.name || 'Anonymous',
                type,
                message,
                url: window.location.href,
                userAgent: navigator.userAgent
            });
            addToast('Ačiū! Jūsų atsiliepimas išsiųstas.', 'success');
            setMessage('');
            onClose();
        } catch (error) {
            console.error(error);
            addToast('Nepavyko išsiųsti atsiliepimo.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-lg shadow-2xl bg-white border-0 overflow-hidden animate-in zoom-in-95 duration-200">
                <CardHeader className="bg-slate-900 text-white p-6 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-mimaki-blue" />
                            Pranešti apie problemą
                        </CardTitle>
                        <p className="text-xs text-slate-400 mt-1">Padėkite mums patobulinti sistemą</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider block">Tipas</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setType('BUG')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${type === 'BUG' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 hover:border-slate-300 text-slate-500'
                                        }`}
                                >
                                    <AlertTriangle className={`w-6 h-6 mb-2 ${type === 'BUG' ? 'fill-current' : ''}`} />
                                    <span className="text-xs font-bold uppercase">Klaida</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('FEATURE')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${type === 'FEATURE' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-slate-300 text-slate-500'
                                        }`}
                                >
                                    <Lightbulb className={`w-6 h-6 mb-2 ${type === 'FEATURE' ? 'fill-current' : ''}`} />
                                    <span className="text-xs font-bold uppercase">Idėja</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('OTHER')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${type === 'OTHER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-slate-300 text-slate-500'
                                        }`}
                                >
                                    <MessageSquare className={`w-6 h-6 mb-2 ${type === 'OTHER' ? 'fill-current' : ''}`} />
                                    <span className="text-xs font-bold uppercase">Kita</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider block">Aprašymas</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Aprašykite klaidą arba pasiūlymą..."
                                className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:border-mimaki-blue focus:ring-4 focus:ring-mimaki-blue/10 outline-none resize-none font-medium text-slate-700 placeholder:text-slate-400"
                                required
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="p-6 pt-0 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-auto">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-slate-500 hover:text-slate-800">Atšaukti</Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !message.trim()}
                            className="bg-mimaki-blue hover:bg-blue-600 text-white shadow-lg shadow-mimaki-blue/20"
                        >
                            {isSubmitting ? 'Siunčiama...' : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Siųsti
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};
