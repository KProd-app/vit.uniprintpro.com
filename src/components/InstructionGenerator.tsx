import React, { useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { PrinterData } from '../types';
import { Download, XCircle, Info } from 'lucide-react';

interface InstructionGeneratorProps {
    printers: PrinterData[];
    onClose: () => void;
}

export const InstructionGenerator: React.FC<InstructionGeneratorProps> = ({ printers, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [mountTime] = useState(Date.now());

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
            const fileName = printers.length > 1 
                ? 'uniprintpro-visos-instrukcijos' 
                : `uniprintpro-instrukcija-${printers[0].name.replace(/\s+/g, '-').toLowerCase()}`;
            link.download = `${fileName}.png`;
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
        <div className="fixed inset-0 bg-slate-900/90 z-[200] overflow-y-auto flex flex-col items-center py-10 px-4 backdrop-blur-sm print-modal-wrapper">

            {/* Top Controls */}
            <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 no-print">
                <h2 className="text-white text-2xl font-black uppercase tracking-widest">Instrukcijos Peržiūra</h2>
                <div className="flex gap-4 border border-slate-700 bg-slate-800/80 p-2 rounded-2xl shadow-xl no-print">
                    <button
                        onClick={() => handleDownloadFormat('pdf')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg"
                    >
                        Spausdinti (PDF)
                    </button>
                    {printers.length === 1 && (
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
                    )}
                    <button
                        onClick={onClose}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg"
                    >
                        <XCircle className="w-5 h-5" /> Uždaryti
                    </button>
                </div>
            </div>

            {/* A4 Container Wrapper for centering and shadow */}
            <div className="shadow-2xl ring-1 ring-slate-900/5 bg-white relative print-modal-centerer">
                <div ref={printRef} id="print-root" className="bg-white">
                    {printers.map((printer, index) => {
                        const loginUrl = 'https://vit.uniprintpro.com';
                        const stationIdentifier = printer.qrCode?.trim() || printer.name.toLowerCase().replace(/\s+/g, '');
                        const stationUrl = `https://vit.uniprintpro.com/${encodeURIComponent(stationIdentifier)}`;
                        const qrLoginSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(loginUrl)}&t=${mountTime}`;
                        const qrStationSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(stationUrl)}&t=${mountTime}`;

                        return (
                            <div
                                key={printer.id}
                                className={`bg-white text-slate-900 flex flex-col justify-between relative ${index < printers.length - 1 ? 'page-break' : ''}`}
                                style={{ width: '210mm', height: '297mm', padding: '15mm', boxSizing: 'border-box' }}
                            >
                                {/* Header */}
                                <header className="text-center border-b-2 border-slate-900 pb-4 mb-4">
                                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-1 text-slate-900">
                                        UniPrintPro <span className="text-mimaki-blue">VIT</span>
                                    </h1>
                                    <p className="text-xl text-slate-500 uppercase tracking-widest font-bold">
                                        Stoties Instrukcija
                                    </p>
                                    <div className="mt-3 inline-block bg-slate-100 border-2 border-slate-300 px-5 py-2 rounded-2xl">
                                        <span className="text-2xl font-black text-slate-800 uppercase tracking-tight">{printer.name}</span>
                                    </div>
                                </header>

                                {/* Main Content */}
                                <main className="flex-grow flex flex-col gap-5">

                                    {/* Step 1: Login */}
                                    <section className="flex items-center gap-6 bg-slate-50 p-5 rounded-3xl border-2 border-slate-900 relative">
                                        <div className="absolute -top-3 -left-3 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center text-xl font-black uppercase shadow-lg z-10">1</div>
                                        <div className="bg-white p-2 rounded-xl flex-shrink-0 border border-slate-200 shadow-md">
                                            <img src={qrLoginSrc} alt="Login QR Code" className="w-[120px] h-[120px]" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black mb-1 text-slate-900 uppercase tracking-tight">Pirmas Prisijungimas</h2>
                                            <p className="text-slate-600 text-lg leading-relaxed font-medium">
                                                Nuskenuokite QR kodą kameros pagalba.<br />
                                                Atsidariusiame lange suveskite savo <strong>Vardą</strong> ir <strong>Pavardę</strong>.
                                            </p>
                                            <div className="mt-2 text-xs text-slate-400 font-bold uppercase tracking-widest bg-slate-200 inline-block px-3 py-1 rounded-lg">
                                                {loginUrl}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Step 2: Station Selection */}
                                    <section className="flex items-center justify-between gap-6 bg-blue-50/50 p-5 rounded-3xl border-2 border-mimaki-blue relative">
                                        <div className="absolute -top-3 -left-3 w-10 h-10 bg-mimaki-blue text-white rounded-full flex items-center justify-center text-xl font-black uppercase shadow-lg shadow-mimaki-blue/30 z-10">2</div>
                                        <div>
                                            <h2 className="text-2xl font-black mb-1 text-slate-900 uppercase tracking-tight">Atidaryti Stotį</h2>
                                            <p className="text-slate-600 text-lg leading-relaxed font-medium">
                                                Nuskenuokite stoties QR kodą ir <strong>automatiškai</strong> pradėkite paruošimą.<br />
                                                <span className="text-slate-500 text-sm">(Arba pasirinkite "{printer.name}" iš "Mano Stotys" sąrašo)</span>
                                            </p>
                                        </div>
                                        <div className="bg-white p-2 rounded-xl flex-shrink-0 border border-blue-200 shadow-md">
                                            <img src={qrStationSrc} alt="Station QR Code" className="w-[120px] h-[120px]" />
                                        </div>
                                    </section>

                                    {/* Step 3: Preparation details */}
                                    <section className="pl-4 border-l-4 border-slate-300 ml-4 py-1">
                                        <h2 className="text-xl font-black mb-3 uppercase text-slate-800 tracking-tight flex items-center gap-3">
                                            <div className="w-7 h-7 bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center text-base">3</div>
                                            VIT Paruošimas
                                        </h2>
                                        <ul className="text-slate-600 text-lg space-y-2 font-medium ml-10">
                                            <li className="flex items-center"><span className="mr-3 font-bold text-xl text-mimaki-blue">□</span> Pažymėkite varneles atlikus valymą.</li>
                                            <li className="flex items-center"><span className="mr-3 font-bold text-xl text-mimaki-blue">□</span> Įkelkite <strong>Nozzle Check</strong> nuotrauką.</li>
                                            <li className="flex items-center"><span className="mr-3 font-bold text-xl text-emerald-500">►</span> Spauskite <strong>„UŽBAIGTI RUOŠIMĄ“</strong>.</li>
                                        </ul>
                                    </section>

                                    {/* Step 4: Finish Work */}
                                    <section className="bg-slate-100 border-2 border-slate-900 p-6 rounded-3xl mt-auto relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-200 rounded-bl-[80px] -z-0 opacity-50"></div>
                                        <div className="flex items-start gap-5 relative z-10">
                                            <div className="bg-slate-900 p-3 rounded-2xl shrink-0 text-white shadow-lg">
                                                <Info className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black uppercase text-slate-900 mb-2 tracking-tight">Svarbu: Darbo Pabaiga</h2>
                                                <p className="text-slate-700 text-lg mb-3 font-semibold">
                                                    Pamainos pabaigoje BŪTINA užbaigti gamybos logą:
                                                </p>
                                                <ol className="list-decimal list-inside text-slate-800 space-y-2 font-bold text-lg ml-1">
                                                    <li>Paspauskite <span className="bg-purple-600/10 text-purple-700 border border-purple-200 px-2 py-1 rounded-lg text-sm uppercase tracking-wider ml-1 shadow-sm">Baigti Darbą / Pamainą</span></li>
                                                    <li>Įveskite <strong>pagamintą kiekį</strong></li>
                                                    <li>Įveskite <strong>broką</strong> (jei buvo)</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </section>

                                </main>

                                {/* Footer */}
                                <footer className="text-center text-sm border-t-2 border-slate-200 pt-4 mt-4 flex justify-between items-center text-slate-500 font-medium h-auto">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        <span>Klaidų atveju naudokite <strong>pranešimo ikoną.</strong></span>
                                    </div>
                                    <p className="font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{loginUrl}</p>
                                </footer>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
