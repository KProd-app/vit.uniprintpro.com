import React, { useRef, useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import { Download, Info, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import { usePrinters } from '../contexts/DataContext';

export const InkInstructionsEditable: React.FC = () => {
    const printRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const { getSettings } = usePrinters();
    const [qrValue, setQrValue] = useState('INK_TOOL_123');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const fetchedSettings = await getSettings();
            const qrSetting = fetchedSettings?.find(s => s.key === 'inkToolQrCode');
            if (qrSetting) {
                setQrValue(qrSetting.value);
            }
        } catch (e) {}
    };

    const handleDownloadFormat = async (format: 'png' | 'pdf') => {
        if (!printRef.current) return;
        
        if (format === 'pdf') {
            window.print();
            return;
        }

        setIsDownloading(true);
        try {
            const dataUrl = await htmlToImage.toPng(printRef.current, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                cacheBust: true,
                imagePlaceholder: '',
                skipFonts: true
            });

            const link = document.createElement('a');
            link.download = `dazu-instrukcija.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Failed to generate image", err);
            alert("Klaida generuojant paveikslėlį.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 overflow-y-auto flex flex-col items-center py-10 px-4 print-modal-wrapper">
            
            {/* Top Controls */}
            <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 no-print">
                <div className="flex flex-col gap-2">
                    <h2 className="text-white text-2xl font-black uppercase tracking-widest">Dažų Instrukcija</h2>
                    <a href="/" className="text-slate-400 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors flex items-center gap-1">
                        ← Atgal
                    </a>
                </div>
                <div className="flex gap-4 border border-slate-700 bg-slate-800/80 p-2 rounded-2xl shadow-xl no-print">
                    <button
                        onClick={() => handleDownloadFormat('pdf')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg"
                    >
                        Spausdinti
                    </button>
                    <button
                        onClick={() => handleDownloadFormat('png')}
                        disabled={isDownloading}
                        className="bg-mimaki-blue hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg"
                    >
                        {isDownloading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        ) : (
                            <Download className="w-5 h-5" />
                        )}
                        Atsisiųsti PNG
                    </button>
                </div>
            </div>

            {/* Hint */}
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest no-print mb-6">
                Patarimas: Paspauskite ant bet kurio teksto lape, kad jį paredaguotumėte.
            </p>

            {/* A4 Container Wrapper */}
            <div className="shadow-2xl ring-1 ring-slate-900/5 bg-white relative print-modal-centerer" style={{ width: '210mm', minHeight: '297mm' }}>
                <div ref={printRef} id="print-root" className="bg-white text-slate-900 flex flex-col h-full" style={{ width: '210mm', height: '297mm', padding: '15mm', boxSizing: 'border-box' }}>
                    
                    {/* Header */}
                    <header className="text-center border-b-2 border-slate-900 pb-4 mb-4">
                        <h1 className="text-4xl font-black uppercase tracking-tighter mb-1 text-slate-900 focus:outline-none focus:bg-slate-100 rounded-lg p-1 transition-colors" contentEditable suppressContentEditableWarning>
                            Dažų Papildymas
                        </h1>
                        <p className="text-xl text-slate-500 uppercase tracking-widest font-bold focus:outline-none focus:bg-slate-100 rounded-lg p-1 transition-colors" contentEditable suppressContentEditableWarning>
                            Naudojimosi Instrukcija
                        </p>
                    </header>

                    {/* Main Content */}
                    <main className="flex-grow flex flex-col gap-6">

                        {/* Step 1: Open Tool */}
                        <section className="flex items-center gap-6 bg-slate-50 p-5 rounded-3xl border-2 border-slate-900 relative">
                            <div className="absolute -top-3 -left-3 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-black uppercase shadow-lg z-10">1</div>
                            <div className="bg-white p-2 rounded-xl flex-shrink-0 border border-slate-200 shadow-md">
                                <div className="w-[120px] h-[120px]">
                                    <QRCode value={qrValue} size={120} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black mb-1 text-slate-900 uppercase tracking-tight focus:outline-none focus:bg-slate-200 rounded-lg px-2 -ml-2 transition-colors inline-block" contentEditable suppressContentEditableWarning>Atidaryti Įrankį</h2>
                                <p className="text-slate-600 text-lg leading-relaxed font-medium focus:outline-none focus:bg-slate-200 rounded-lg px-2 -ml-2 transition-colors" contentEditable suppressContentEditableWarning>
                                    Nuskenuokite šį QR kodą su planšete arba telefonu, kad atidarytumėte dažų papildymo langą.
                                </p>
                            </div>
                        </section>

                        {/* Step 2: Select Printer */}
                        <section className="flex items-center justify-between gap-6 bg-blue-50/50 p-5 rounded-3xl border-2 border-mimaki-blue relative">
                            <div className="absolute -top-3 -left-3 w-10 h-10 bg-mimaki-blue text-white rounded-full flex items-center justify-center text-xl font-black uppercase shadow-lg shadow-mimaki-blue/30 z-10">2</div>
                            <div>
                                <h2 className="text-2xl font-black mb-1 text-slate-900 uppercase tracking-tight focus:outline-none focus:bg-blue-200/50 rounded-lg px-2 -ml-2 transition-colors inline-block" contentEditable suppressContentEditableWarning>Pasirinkti Įrenginį</h2>
                                <p className="text-slate-600 text-lg leading-relaxed font-medium focus:outline-none focus:bg-blue-200/50 rounded-lg px-2 -ml-2 transition-colors" contentEditable suppressContentEditableWarning>
                                    Atsidariusiame ekrane paspauskite ant įrenginio, kuriam norite papildyti dažus.
                                </p>
                            </div>
                        </section>

                        {/* Step 3: Scan Bottle */}
                        <section className="pl-4 border-l-4 border-slate-300 ml-4 py-1">
                            <h2 className="text-xl font-black mb-3 uppercase text-slate-800 tracking-tight flex items-center gap-3 focus:outline-none focus:bg-slate-100 rounded-lg px-2 -ml-2 transition-colors" contentEditable suppressContentEditableWarning>
                                <div className="w-7 h-7 bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center text-base" contentEditable={false}>3</div>
                                Registruoti Dažų Butelį
                            </h2>
                            <ul className="text-slate-600 text-lg space-y-2 font-medium ml-10 focus:outline-none focus:bg-slate-100 rounded-lg p-2 -ml-2 transition-colors" contentEditable suppressContentEditableWarning>
                                <li className="flex items-center"><span className="mr-3 font-bold text-xl text-mimaki-blue">□</span> Sąraše suraskite dažą, kurį norite papildyti.</li>
                                <li className="flex items-center"><span className="mr-3 font-bold text-xl text-mimaki-blue">□</span> Paspauskite „NAUJAS“ ir skenuokite butelio barkodą.</li>
                                <li className="flex items-center"><span className="mr-3 font-bold text-xl text-mimaki-blue">□</span> Nufotografuokite butelį paspausdami kameros ikoną.</li>
                            </ul>
                        </section>

                        {/* Step 4: Finish */}
                        <section className="bg-slate-100 border-2 border-slate-900 p-6 rounded-3xl mt-auto relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-200 rounded-bl-[80px] -z-0 opacity-50"></div>
                            <div className="flex items-start gap-5 relative z-10">
                                <div className="bg-slate-900 p-3 rounded-2xl shrink-0 text-white shadow-lg">
                                    <Info className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase text-slate-900 mb-2 tracking-tight focus:outline-none focus:bg-slate-200 rounded-lg px-2 -ml-2 transition-colors inline-block" contentEditable suppressContentEditableWarning>Svarbu: Patvirtinimas</h2>
                                    <p className="text-slate-700 text-lg mb-3 font-semibold focus:outline-none focus:bg-slate-200 rounded-lg px-2 -ml-2 transition-colors" contentEditable suppressContentEditableWarning>
                                        Norint užbaigti procesą ir išsaugoti duomenis:
                                    </p>
                                    <ol className="list-decimal list-inside text-slate-800 space-y-2 font-bold text-lg ml-1 focus:outline-none focus:bg-slate-200 rounded-lg p-2 -ml-2 transition-colors" contentEditable suppressContentEditableWarning>
                                        <li>Įsitikinkite, kad priskirti visi reikalingi dažai.</li>
                                        <li>Spauskite žalią mygtuką: <strong>PATVIRTINTI PILDYMĄ</strong>.</li>
                                    </ol>
                                </div>
                            </div>
                        </section>

                    </main>

                    {/* Footer */}
                    <footer className="text-center text-sm border-t-2 border-slate-200 pt-4 mt-4 flex justify-between items-center text-slate-500 font-medium h-auto">
                        <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4" />
                            <span className="focus:outline-none focus:bg-slate-100 rounded-lg px-2 -ml-2 transition-colors" contentEditable suppressContentEditableWarning>Skenuojamas unikalus QR kodas atidaro tiesioginį dažų pildymo langą.</span>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
};
