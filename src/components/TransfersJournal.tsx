import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Search, Truck, X } from 'lucide-react';

interface TVTransfer {
    id: string;
    created_at: string;
    scanned_by: string;
    product_info: string;
    photo_url?: string;
}

export function TransfersJournal() {
    const [transfers, setTransfers] = useState<TVTransfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    useEffect(() => {
        fetchTransfers();
    }, [dateFilter]);

    const fetchTransfers = async () => {
        setLoading(true);
        try {
            const startOfDay = new Date(dateFilter);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(dateFilter);
            endOfDay.setHours(23, 59, 59, 999);

            const { data, error } = await supabase
                .from('tv_transfers')
                .select('*')
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString())
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            setTransfers(data || []);
        } catch (e) {
            console.error('Failed to fetch transfers for journal', e);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransfers = transfers.filter(t =>
        t.product_info.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.scanned_by.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">

            {/* Image Modal */}
            {selectedImg && (
                <div
                    className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
                    onClick={() => setSelectedImg(null)}
                >
                    <img
                        src={selectedImg}
                        alt="Pervežimas Pilnas"
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                    />
                    <button
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-10 h-10" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl">
                        <Truck className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pervežimų Žurnalas</h3>
                        <p className="text-sm font-medium text-slate-500">Istorinė pervežimų laiko paieška</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* Search Box */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Ieškoti produkto, asmens..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                        />
                    </div>

                    {/* Date Picker */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="pl-10 pr-4 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold uppercase rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all w-full sm:w-auto appearance-none"
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-slate-500 font-bold uppercase text-sm tracking-widest">Kraunama...</p>
                        </div>
                    ) : filteredTransfers.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-100 rounded-[32px]">
                            <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-black uppercase text-lg">Pervežimų Šiai Dienai Nėra</p>
                            <p className="text-slate-400 font-medium mt-1">Pabandykite pasirinkti kitą datą arba pakeisti paieškos žodį</p>
                        </div>
                    ) : (
                        filteredTransfers.map((t) => {
                            const timeString = new Date(t.created_at).toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' });
                            return (
                                <div key={t.id} className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{timeString}</div>
                                            <div className="text-sm font-bold text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-lg">{t.scanned_by}</div>
                                        </div>
                                    </div>

                                    <div className="flex-1 mb-4">
                                        <p className="font-bold text-slate-700 text-base leading-snug">{t.product_info}</p>
                                    </div>

                                    {t.photo_url ? (
                                        <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-video w-full mt-auto cursor-zoom-in" onClick={() => setSelectedImg(t.photo_url!)}>
                                            <img src={t.photo_url} alt="Pervežimas" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border-2 border-dashed border-slate-200 aspect-video w-full mt-auto flex items-center justify-center bg-slate-50">
                                            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Nuotraukos Nėra</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
