import React, { useState, useEffect, useRef } from 'react';
import { Save, RefreshCcw, Download, ImagePlus, Loader2 } from 'lucide-react';
import { usePrinters } from '../contexts/DataContext';

export const WorkflowEditable: React.FC = () => {
    const contentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaved, setIsSaved] = useState(true);

    const { getSettings, updateSetting, uploadFile } = usePrinters();
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [savedRange, setSavedRange] = useState<Range | null>(null);

    useEffect(() => {
        const loadContent = async () => {
            try {
                const settings = await getSettings();
                const dbContent = settings.find(s => s.key === 'workflow_content');
                if (contentRef.current) {
                    contentRef.current.innerHTML = dbContent?.value || defaultHTML;
                }
            } catch (error) {
                console.error("Failed to load from DB:", error);
                const local = localStorage.getItem('workflow_content');
                if (contentRef.current) {
                    contentRef.current.innerHTML = local || defaultHTML;
                }
            }
        };
        loadContent();
    }, [getSettings]);

    const handleInput = () => {
        setIsSaved(false);
    };

    const handleSave = async () => {
        if (contentRef.current) {
            setIsSaving(true);
            const html = contentRef.current.innerHTML;
            try {
                await updateSetting('workflow_content', html);
                localStorage.setItem('workflow_content', html);
                setIsSaved(true);
            } catch (error) {
                console.error("Failed to save to DB:", error);
                alert("Nepavyko išsaugoti į duombazę! Patikrinkite ryšį.");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleReset = async () => {
        if (window.confirm("Ar tikrai norite atstatyti į pradinį tekstą? Visi jūsų pakeitimai bus prarasti.")) {
            setIsSaving(true);
            try {
                await updateSetting('workflow_content', defaultHTML);
                localStorage.removeItem('workflow_content');
                if (contentRef.current) {
                    contentRef.current.innerHTML = defaultHTML;
                }
                setIsSaved(true);
            } catch (error) {
                console.error("Failed to reset in DB:", error);
                alert("Nepavyko atstatyti duombazėje!");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const saveSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            setSavedRange(selection.getRangeAt(0));
        }
    };

    const triggerImageUpload = () => {
        saveSelection();
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadFile(file, `workflow/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`);
            
            // Restore selection
            if (contentRef.current) {
                contentRef.current.focus();
                const selection = window.getSelection();
                if (selection && savedRange) {
                    selection.removeAllRanges();
                    selection.addRange(savedRange);
                }
            }

            // Create image with Tailwind classes
            const imgHTML = `<img src="${url}" alt="Workflow Image" class="max-w-full rounded-xl shadow-md my-6" />`;
            document.execCommand('insertHTML', false, imgHTML);
            setIsSaved(false);
        } catch (error) {
            console.error("Failed to upload image:", error);
            alert("Nepavyko įkelti nuotraukos.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const exportToWord = () => {
        if (!contentRef.current) return;
        
        const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Workflow</title></head><body>";
        const postHtml = "</body></html>";
        const html = preHtml + contentRef.current.innerHTML + postHtml;

        const blob = new Blob(['\uFEFF', html], {
            type: 'application/msword'
        });
        
        const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
        const downloadLink = document.createElement("a");
        document.body.appendChild(downloadLink);
        
        // @ts-ignore
        if (navigator.msSaveOrOpenBlob) {
            // @ts-ignore
            navigator.msSaveOrOpenBlob(blob, 'UniprintPro_Workflow.doc');
        } else {
            downloadLink.href = url;
            downloadLink.download = 'UniprintPro_Workflow.doc';
            downloadLink.click();
        }
        
        document.body.removeChild(downloadLink);
    };


    const defaultHTML = `
        <h1 class="text-4xl font-black mb-6 text-slate-900 border-b pb-4">Gamybos Proceso Valdymas: „UniprintPro“ Naudotojo Kelias</h1>
        <p class="text-xl mb-8 text-slate-600 font-medium">Šis dokumentas detaliai aprašo, kaip gamykloje vyksta realus operatorių ir administracijos darbas naudojantis „UniprintPro“ sistema (be jokių programinių ar duomenų bazių pavyzdžių).</p>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue">1. Prisijungimas prie sistemos (Login)</h2>
        <p class="text-slate-700 mb-4">
            Darbo dieną ar naktinę pamainą operatorius pradeda prie savo darbo vietos priskirtos planšetės arba kompiuterio.
            Prisijungimo lange jis mato visų darbuotojų sąrašą. Pasirinkęs savo vardą, operatorius privalo suvesti jam priskirtą asmeninį 4 skaitmenų PIN kodą.
            Sėkmingai prisijungus, sistema atpažįsta darbuotoją ir nukreipia į pagrindinį valdymo ekraną.
        </p>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue">2. Darbo vietos (Stoties) Pasirinkimas</h2>
        <p class="text-slate-700 mb-4">
            Pagrindiniame ekrane operatorius mato visus gamyklos įrenginius (stotis), atvaizduotus kvadratėliais. 
            Kiekvienas įrenginys turi spalvinį indikatorių:
        </p>
        <ul class="list-disc pl-6 space-y-2 text-slate-700 mb-8">
            <li><strong>Raudona spalva:</strong> Įrenginys laisvas, niekas su juo nedirba.</li>
            <li><strong>Žalia spalva:</strong> Įrenginys užimtas, prie jo rodomas kito dirbančio operatoriaus vardas.</li>
        </ul>
        <p class="text-slate-700 mb-4">
            Operatorius paspaudžia ant jam priskirto laisvo (raudono) įrenginio, kurį ruošiasi aptarnauti.
        </p>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue">3. Darbo Pradžia ir Rytinė Patikra (Start Shift)</h2>
        <p class="text-slate-700 mb-4">
            Pasirinkus įrenginį, prieš pradedant gamybą, operatoriui atidaromas privalomas „Pradžios klausimynas“ (Start Shift Checklist).
            Šis klausimynas yra unikalus ir priklauso nuo pasirinkto įrenginio tipo (skirtingas spausdintuvams, robotams ar pakavimo stotims).
            Operatorius privalo fiziškai patikrinti kiekvieną punktą ir sistemoje uždėti varnelę, patvirtindamas, kad:
        </p>
        <ul class="list-disc pl-6 space-y-2 text-slate-700 mb-4">
            <li>Įrenginys yra švarus ir paruoštas darbui.</li>
            <li>Yra pakankamas dažų, lako ar kitų eksploatacinių medžiagų kiekis.</li>
            <li>Atliktas purkštukų testas (Nozzle check) ar kiti būtini įrenginio testai.</li>
        </ul>
        <p class="text-slate-700 mb-8">
            Tik pažymėjęs visus punktus, operatorius gali paspausti mygtuką <strong>„Pradėti darbą“</strong>. Tuo momentu įrenginys planšetėje ir visuose gamyklos TV ekranuose užsidega žaliai, o laikas pradedamas skaičiuoti.
        </p>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue">4. Darbo Procesas ir Stebėsena</h2>
        <p class="text-slate-700 mb-8">
            Viso darbo metu operatorius atlieka gamybos užduotis, o administracija ar kiti darbuotojai gamykloje pakabintuose ekranuose (Live TV Dashboard) realiu laiku mato, kokie įrenginiai veikia, kas prie jų dirba ir kiek laiko trunka jų pamaina. 
            Jei operatoriui reikia trumpam atsitraukti, sistema lieka aktyvi, priskirta jam.
        </p>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue">5. Darbo Pabaiga ir Duomenų Įvedimas (End Shift)</h2>
        <p class="text-slate-700 mb-4">
            Pamainos ar gamybos užduoties pabaigoje operatorius planšetėje spaudžia mygtuką <strong>„Baigti darbą“</strong>.
            Prieš atlaisvinant įrenginį, sistema reikalauja užpildyti ataskaitą apie atliktą darbą:
        </p>
        <ol class="list-decimal pl-6 space-y-3 text-slate-700 mb-8">
            <li><strong>Pagamintas kiekis:</strong> Operatorius įveda tikslų kokybiškai pagamintų vienetų skaičių.</li>
            <li><strong>Brokas:</strong> Įvedamas broko kiekis. Brokas išskaidomas į tris kategorijas (Roboto klaida, Spausdinimo klaida, Klijų/lako klaida), kad vadovai žinotų problemos šaltinį.</li>
            <li><strong>Pabaigos patikra:</strong> Operatorius atžymi „Pabaigos klausimyną“ (pvz., kad įrenginys išvalytas, atliekos išneštos, UV lempos nuvalytos).</li>
            <li><strong>Nuotrauka:</strong> Spausdintuvų atveju, operatorius turi planšete nufotografuoti baigiamąjį „Nozzle check“ testą ir įkelti jį į sistemą kaip įrodymą, kad įrenginys paliekamas tvarkingas.</li>
            <li><strong>Žinutė kitai pamainai:</strong> Paliekamas tekstinis komentaras sekančiam žmogui (pvz., „Liko mažai balto dažo“ arba „Stringa kairysis laikiklis“).</li>
        </ol>
        <p class="text-slate-700 mb-8">
            Patvirtinus šiuos duomenis, ataskaita išsiunčiama administracijai, o įrenginys vėl užsidega raudonai – jis paruoštas kitam darbuotojui.
        </p>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue">6. Darbo Vietų Tipai ir Jų Patikros (Checklists)</h2>
        <p class="text-slate-700 mb-6">Siekiant užtikrinti kokybę, kiekvienas įrenginių tipas turi griežtai apibrėžtus ir unikalius klausimynus:</p>
        
        <div class="space-y-6">
            <div class="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <h3 class="font-bold text-lg mb-2">1. Pakavimo ir Lakavimo Stotys</h3>
                <ul class="list-disc pl-6 text-sm text-slate-600 space-y-1 mb-3">
                    <li><strong>UV Pakavimas:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti darbo vietos švarą, papildyti apsaugines darbo priemones, susipažinti su dokumentacija darbo vietoje, įjungti ventiliaciją, papildyti pirmines pakuotes, papildyti antrines pakuotes, papildyti oro pagalvėles, papildyti pagalbinėmis priemonėmis, perklijuoti stalo plėvelę (mėnesio pradžioje).<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Nuvalyti darbo stalą, iššluoti grindis, išnešti šiukšles, išnešti broką, chemines atliekas išnešti į konteinerį, sudėti priemones į vietas, papildyti pakuočių dėžutes.</li>
                    <li class="mt-2"><strong>UV Lakavimas:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti darbo vietos švarą, papildyti apsaugines priemones, susipažinti su dokumentacija, įjungti ventiliaciją, patikrinti lako kiekį, paruošti darbo priemones.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Nuvalyti darbo paviršius, nepalikti lako indelyje, išvalyti darbo vietą, išnešti atliekas, sudėti priemones į vietas.</li>
                </ul>
            </div>

            <div class="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <h3 class="font-bold text-lg mb-2">2. Didieji Spausdintuvai (FLORA1, FLORA2, KINGT)</h3>
                <ul class="list-disc pl-6 text-sm text-slate-600 space-y-1 mb-3">
                    <li><strong>FLORA1 / FLORA2:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti dažų kiekį bakeliuose, nuvalyti spausdinimo galvą, nusivalyti UV lempas, patikrinti enkoderio juostą, patikrinti apsaugos barjerus, atlikti nozzle check, patikrinti temperatūrą, patikrinti UV nustatymus, nuvalyti optinius daviklius, atlikti testinį spausdinimą.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Pašalinti susikaupusį rašalą, nusivalyti UV lempas, išvalyti įrenginio vidų (su IPA), ištuštinti atliekų bakelį, nuvalyti galvos dalis, nuvalyti rėmus, užpildyti fizinį žurnalą.</li>
                    <li class="mt-2"><strong>KINGT:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti dažus, nuvalyti galvą, patikrinti UV lempas, Nozzle check, patikrinti temperatūrą, patikrinti atstumus, atlikti test print.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Nuvalyti UV lempas, išvalyti įrenginio vidų, nuleisti galvą, išvalyti galvos dalis, užpildyti žurnalą.</li>
                </ul>
            </div>

            <div class="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <h3 class="font-bold text-lg mb-2">3. DLICAN Stotys (Flatbed, 360)</h3>
                <ul class="list-disc pl-6 text-sm text-slate-600 space-y-1 mb-3">
                    <li><strong>DLICAN FLATBED:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti dažų lygį, nuvalyti galvą, Nozzle check, patikrinti vandens lygį, nuvalyti padėklus (jig’us).<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Išvalyti įrenginio vidų, ištuštinti atliekų bakelį, nuvalyti galvos dalis.</li>
                    <li class="mt-2"><strong>DLICAN 360:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti dažus, nuvalyti galvą, Nozzle check, patikrinti atstumus.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Išvalyti įrenginį, nuvalyti galvos dalis.</li>
                </ul>
            </div>

            <div class="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <h3 class="font-bold text-lg mb-2">4. Grotelinės Stotys (DACEN Tumbler/Bottle ir Amica)</h3>
                <ul class="list-disc pl-6 text-sm text-slate-600 space-y-1 mb-3">
                    <li><strong>DACEN tumbler / DACEN bottle / Amika:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti darbo vietos švarą, patikrinti įrenginio būklę, paruošti padėklus (jig’us).<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Nuvalyti įrenginį, išvalyti darbo zoną, sudėti priemones.</li>
                </ul>
            </div>

            <div class="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <h3 class="font-bold text-lg mb-2">5. Robotizuotos Stotys (Klijų ir Suvirinimo)</h3>
                <ul class="list-disc pl-6 text-sm text-slate-600 space-y-1 mb-3">
                    <li><strong>Klijų robotas:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti klijų slėgį, pakeisti adatą, nuvalyti padelius, patikrinti veikimo nustatymus.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Išvalyti roboto vidų, sudėti padelius į jų vietas.</li>
                    <li class="mt-2"><strong>Suvirinimo robotas:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Nuvalyti elektrodus, nuvalyti džigą, patikrinti nustatymus.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Roboto vidų nuvalyti, pakeisti filtrus.</li>
                </ul>
            </div>

            <div class="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <h3 class="font-bold text-lg mb-2">6. Mimaki Stotys (Powerbank, Mirror, Podbase)</h3>
                <ul class="list-disc pl-6 text-sm text-slate-600 space-y-1 mb-3">
                    <li><strong>Sistemos specifika:</strong> Mimaki spausdintuvai dirba atskirais blokais/padėklais (Units). Operatorius prieš pradėdamas darbą planšetėje pažymi, su kuriais konkrečiais blokais jis šiuo metu dirbs. Užbaigiant darbą, sistema reikalauja prisegti "nozzle check" testo nuotrauką kiekvienam atskiram blokui.</li>
                    <li class="mt-2"><strong>Klausimynas:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti dažus, Nozzle check, nusivalyti UV lempas, atlikti automatinį galvos valymą (Autocleaning).<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Nuvalyti UV lempas, išvalyti įrenginio vidų, užpildyti fizinį žurnalą.</li>
                </ul>
            </div>
        </div>

        <p class="text-sm text-slate-400 mt-10 border-t pt-4">Šis procesų aprašas skirtas sistemų projektuotojams. Jį galite bet kada redaguoti spustelėję bet kurioje vietoje.</p>
    `;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col py-8 px-4 sm:px-8">
            <div className="max-w-4xl w-full mx-auto flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Sistemos Aprašas</h1>
                    <a href="/" className="text-mimaki-blue hover:text-blue-700 text-sm font-bold tracking-widest uppercase transition-colors">
                        ← Atgal į pagrindinį
                    </a>
                </div>
                <div className="flex gap-3">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <button
                        onClick={triggerImageUpload}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-sm text-sm"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                        {isUploading ? 'Keliama...' : 'Pridėti Nuotrauką'}
                    </button>
                    <button
                        onClick={exportToWord}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-sm text-sm"
                    >
                        <Download className="w-4 h-4" />
                        Atsiųsti WORD
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-sm text-sm"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Atstatyti
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold uppercase tracking-wider transition-all shadow-md text-sm ${isSaving ? 'bg-slate-400 cursor-not-allowed' : isSaved ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-mimaki-blue hover:bg-blue-600 text-white animate-pulse'}`}
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saugoma...' : isSaved ? 'Išsaugota' : 'Išsaugoti'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl max-w-4xl w-full mx-auto border border-slate-200">
                <div 
                    ref={contentRef}
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={handleInput}
                    onBlur={saveSelection}
                    onKeyUp={saveSelection}
                    onMouseUp={saveSelection}
                    className="focus:outline-none prose max-w-none prose-slate"
                    style={{ minHeight: '500px' }}
                />
            </div>
        </div>
    );
};
