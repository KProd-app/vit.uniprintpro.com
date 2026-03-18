import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Truck, MessageSquare, AlertTriangle, AlertCircle, ArrowLeft, Camera, Image as ImageIcon, Play, Droplets } from 'lucide-react';

interface UserTVPanelProps {
    currentUser: User;
    onBack: () => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type FormView = 'MENU' | 'TRANSFERS' | 'PROPOSALS' | 'BREAKDOWN' | 'MATERIAL_SHORTAGE';

export function UserTVPanel({ currentUser, onBack, addToast }: UserTVPanelProps) {
    const [currentView, setCurrentView] = useState<FormView>('MENU');

    // Form states
    const [transferProduct, setTransferProduct] = useState('');
    const [proposalText, setProposalText] = useState('');
    const [breakdownText, setBreakdownText] = useState('');
    const [shortageText, setShortageText] = useState('');
    const [transferImage, setTransferImage] = useState<File | null>(null);
    const [transferImagePreview, setTransferImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setTransferImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setTransferImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferProduct.trim()) return;
        setIsSubmitting(true);
        try {
            let photoUrl = null;

            if (transferImage) {
                const fileExt = transferImage.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('transfers')
                    .upload(filePath, transferImage);

                if (uploadError) {
                    throw uploadError;
                }

                const { data: publicUrlData } = supabase.storage
                    .from('transfers')
                    .getPublicUrl(filePath);

                photoUrl = publicUrlData.publicUrl;
            }

            const { error: insertError } = await supabase.from('tv_transfers').insert({
                scanned_by: currentUser.name,
                product_info: transferProduct,
                photo_url: photoUrl
            });

            if (insertError) throw insertError;

            addToast('Pervežimas užregistruotas!', 'success');
            setTransferProduct('');
            setTransferImage(null);
            setTransferImagePreview(null);
            setCurrentView('MENU');
        } catch (e: any) {
            console.error('Upload Error:', e);
            const errorMsg = e?.message || e?.error_description || JSON.stringify(e);

            if (errorMsg.includes('row-level security') || errorMsg.includes('RLS')) {
                addToast('KLAIDA: Storage neleidžia įkelti! Pridėkite INSERT Policy (RLS) savo "transfers" bucket\'ui Supabase.', 'error');
            } else if (errorMsg.includes('photo_url') || errorMsg.includes('storage')) {
                addToast('Klaida su nuotrauka. Ar sukūrėte "transfers" Storage ir pridėjote "photo_url" lauką DB?', 'error');
            } else {
                addToast(`Klaida siunčiant duomenis: ${errorMsg}`, 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitProposal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proposalText.trim()) return;
        setIsSubmitting(true);
        try {
            await supabase.from('tv_proposals').insert({
                submitted_by: currentUser.name,
                proposal_text: proposalText
            });
            addToast('Pasiūlymas užregistruotas!', 'success');
            setProposalText('');
            setCurrentView('MENU');
        } catch (e) {
            addToast('Klaida siunčiant duomenis', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitProblem = async (e: React.FormEvent, type: 'BREAKDOWN' | 'MATERIAL_SHORTAGE') => {
        e.preventDefault();
        const text = type === 'BREAKDOWN' ? breakdownText : shortageText;
        if (!text.trim()) return;

        setIsSubmitting(true);
        const problemPrefix = type === 'BREAKDOWN' ? 'Gedimas: ' : 'Žaliavų trūkumas: ';

        try {
            await supabase.from('tv_problems').insert({
                date_reported: new Date().toLocaleDateString('lt-LT', { month: '2-digit', day: '2-digit' }),
                problem: problemPrefix + text,
                responsible: 'Gamyba', // Default or left empty
                status: 'OPEN'
            });
            addToast('Problema užregistruota!', 'success');
            if (type === 'BREAKDOWN') setBreakdownText('');
            else setShortageText('');
            setCurrentView('MENU');
        } catch (e) {
            addToast('Klaida siunčiant duomenis', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-6">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight text-center">
                        {currentView === 'MENU' && 'Lentos Pildymas'}
                        {currentView === 'TRANSFERS' && 'Sandėlio Pervežimas'}
                        {currentView === 'PROPOSALS' && 'Pasiūlymai'}
                        {currentView === 'BREAKDOWN' && 'Gedimai'}
                        {currentView === 'MATERIAL_SHORTAGE' && 'Žaliavų Trūkumas'}
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">Prisijungęs: {currentUser.name}</p>
                </div>

                {/* MENU VIEW */}
                {currentView === 'MENU' && (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setCurrentView('TRANSFERS')}
                            className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-mimaki-blue hover:shadow-md transition-all h-40 active:scale-95 group"
                        >
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Truck className="w-8 h-8" />
                            </div>
                            <span className="font-bold text-slate-700 text-sm uppercase text-center">Pervežimas</span>
                        </button>

                        <button
                            onClick={() => setCurrentView('PROPOSALS')}
                            className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all h-40 active:scale-95 group"
                        >
                            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <span className="font-bold text-slate-700 text-sm uppercase text-center">Pasiūlymai</span>
                        </button>

                        <button
                            onClick={() => setCurrentView('BREAKDOWN')}
                            className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-red-500 hover:shadow-md transition-all h-40 active:scale-95 group"
                        >
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-colors">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <span className="font-bold text-slate-700 text-sm uppercase text-center">Gedimai</span>
                        </button>

                        <button
                            onClick={() => setCurrentView('MATERIAL_SHORTAGE')}
                            className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md transition-all h-40 active:scale-95 group"
                        >
                            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <span className="font-bold text-slate-700 text-sm uppercase text-center leading-tight">Žaliavų<br />Trūkumas</span>
                        </button>

                        <a
                            href="https://vit.uniprintpro.com"
                            className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all h-40 active:scale-95 group"
                        >
                            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <Play className="w-8 h-8" />
                            </div>
                            <span className="font-bold text-slate-700 text-sm uppercase text-center leading-tight">Pradėti<br />Darbą</span>
                        </a>

                        <a
                            href="https://dis.uniprintpro.com"
                            className="flex flex-col items-center justify-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-pink-500 hover:shadow-md transition-all h-40 active:scale-95 group"
                        >
                            <div className="p-4 bg-pink-50 text-pink-600 rounded-2xl group-hover:bg-pink-500 group-hover:text-white transition-colors">
                                <Droplets className="w-8 h-8" />
                            </div>
                            <span className="font-bold text-slate-700 text-sm uppercase text-center leading-tight">Dažų<br />Inventorizacija</span>
                        </a>
                    </div>
                )}

                {/* TRANSFERS FORM */}
                {currentView === 'TRANSFERS' && (
                    <form onSubmit={handleSubmitTransfer} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Krovinio/Produkto Informacija</label>
                            <textarea
                                value={transferProduct}
                                onChange={(e) => setTransferProduct(e.target.value)}
                                placeholder="Pvz.: 2 paletės, Lipdukai..."
                                className="w-full h-32 rounded-2xl border-slate-200 bg-slate-50 p-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 resize-none"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nuotrauka (Privaloma)</label>

                            {transferImagePreview ? (
                                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-200">
                                    <img src={transferImagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <Button
                                        type="button"
                                        onClick={() => { setTransferImagePreview(null); setTransferImage(null); }}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 h-auto"
                                    >
                                        Ištrinti
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Camera className="w-8 h-8 text-slate-400 mb-2" />
                                        <p className="text-sm font-bold text-slate-600">Nufotografuoti Paletę</p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleImageCapture}
                                        required
                                    />
                                </label>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" onClick={() => setCurrentView('MENU')} variant="outline" className="h-14 rounded-xl px-4 text-slate-500">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider">
                                {isSubmitting ? 'Siunčiama...' : 'Registruoti Pervežimą'}
                            </Button>
                        </div>
                    </form>
                )}

                {/* PROPOSALS FORM */}
                {currentView === 'PROPOSALS' && (
                    <form onSubmit={handleSubmitProposal} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Jūsų Pasiūlymas/Idėja</label>
                            <textarea
                                value={proposalText}
                                onChange={(e) => setProposalText(e.target.value)}
                                placeholder="Aprašykite savo pasiūlymą..."
                                className="w-full h-40 rounded-2xl border-slate-200 bg-slate-50 p-4 font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 resize-none"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" onClick={() => setCurrentView('MENU')} variant="outline" className="h-14 rounded-xl px-4 text-slate-500">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-wider">
                                {isSubmitting ? 'Siunčiama...' : 'Pateikti Pasiūlymą'}
                            </Button>
                        </div>
                    </form>
                )}

                {/* BREAKDOWN FORM */}
                {currentView === 'BREAKDOWN' && (
                    <form onSubmit={(e) => handleSubmitProblem(e, 'BREAKDOWN')} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Gedimo Aprašymas</label>
                            <textarea
                                value={breakdownText}
                                onChange={(e) => setBreakdownText(e.target.value)}
                                placeholder="Kas sugedo? Koks įrenginys?"
                                className="w-full h-32 rounded-2xl border-slate-200 bg-slate-50 p-4 font-bold text-slate-700 focus:ring-2 focus:ring-red-500 resize-none"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" onClick={() => setCurrentView('MENU')} variant="outline" className="h-14 rounded-xl px-4 text-slate-500">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-wider">
                                {isSubmitting ? 'Siunčiama...' : 'Registruoti Gedimą'}
                            </Button>
                        </div>
                    </form>
                )}

                {/* SHORTAGE FORM */}
                {currentView === 'MATERIAL_SHORTAGE' && (
                    <form onSubmit={(e) => handleSubmitProblem(e, 'MATERIAL_SHORTAGE')} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Ko trūksta?</label>
                            <textarea
                                value={shortageText}
                                onChange={(e) => setShortageText(e.target.value)}
                                placeholder="Pvz.: Trūksta Magenos dažų, plėvelės..."
                                className="w-full h-32 rounded-2xl border-slate-200 bg-slate-50 p-4 font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 resize-none"
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" onClick={() => setCurrentView('MENU')} variant="outline" className="h-14 rounded-xl px-4 text-slate-500">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-wider">
                                {isSubmitting ? 'Siunčiama...' : 'Registruoti Trūkumą'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            {currentView === 'MENU' && (
                <Button onClick={onBack} variant="ghost" className="mt-8 text-slate-400 hover:text-slate-600">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Grįžti į Pradžią
                </Button>
            )}
        </div>
    );
}
