import React, { useState, useEffect, useRef } from 'react';
import { Save, RefreshCcw, Download } from 'lucide-react';
import { usePrinters } from '../contexts/DataContext';

export const WorkflowEditable: React.FC = () => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isSaved, setIsSaved] = useState(true);

    const { getSettings, updateSetting } = usePrinters();
    const [isSaving, setIsSaving] = useState(false);

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
        <h1 class="text-4xl font-black mb-6 text-slate-900 border-b pb-4">Sistemos „UniprintPro“ Veikimo Logika ir Architektūra (Workflow)</h1>
        <p class="text-xl mb-8 text-slate-600 font-medium">Šis dokumentas aprašo esamos aplikacijos (React/Vite/Supabase) veikimo procesus, skirtas komandai, kuri planuoja šią sistemą perdaryti arba integruoti į savo esamą sistemą.</p>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue">1. Techninė Architektūra (Programinė Pusė)</h2>
        <ul class="list-disc pl-6 space-y-2 text-slate-700 mb-8">
            <li><strong>Frontend:</strong> React 19, TypeScript, Vite, Tailwind CSS.</li>
            <li><strong>Backend / DB:</strong> Supabase (PostgreSQL duomenų bazė, Authentication, Storage failams/nuotraukoms).</li>
            <li><strong>Būsenų valdymas (State):</strong> Realaus laiko (Realtime) sinchronizacija per Supabase prenumeratas (Realtime channels). Naudojami React Context API (<code>DataContext</code>, <code>AuthContext</code>). Visur atnaujinama iškart, be puslapio perkrovimo.</li>
        </ul>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue">2. Duomenų Modelis (Esminės JSON/DB struktūros)</h2>
        <ul class="list-disc pl-6 space-y-2 text-slate-700 mb-8">
            <li><strong>Printers (Stotys):</strong>
<pre class="bg-slate-800 text-green-400 p-4 rounded-lg text-sm overflow-x-auto mt-2 font-mono">
{
  "id": "kingt", // Unikalus stoties ID: kingt, dlican, flora1 ir t.t.
  "name": "Kingt",
  "status": "NOT_STARTED | SETUP | WORKING",
  "isMimaki": false, // Jei tiesa, stotis naudoja specifinę Mimaki logiką (padėklai/units)
  "operatorName": "Jonas",
  "workStartedAt": "2026-05-07T06:00:00Z",
  "vit": {
     "shift": "Dieninė",
     "checklist": { "q1": true, "q2": true },
     "notes": "Viskas tvarkoje"
  }
}
</pre>
            </li>
            <li><strong>Pamainų Ataskaitos (Shift Logs):</strong> Saugomi duomenys po <em>End Shift</em>. Laukai: <code>productionAmount</code>, <code>defectsAmount</code>, atskirai išskaidyta <code>robotDefects</code>, <code>printingDefects</code>, <code>glueDefects</code> bei prisegamos purkštukų nuotraukos.</li>
        </ul>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue">3. Naudotojo Kelias (Operator Workflow)</h2>
        <ol class="list-decimal pl-6 space-y-4 text-slate-700 mb-8 font-medium">
            <li><strong>Prisijungimas:</strong> Vartotojas pasirenka savo vardą ir suveda PIN kodą. (Role: <code>WORKER</code> arba <code>ADMIN</code>).</li>
            <li><strong>Įrenginio pasirinkimas:</strong> Pasirenkama laisva stotis. Statusas pasikeičia į <code>SETUP</code>.</li>
            <li><strong>Start Shift Checklist:</strong> Privaloma užpildyti rytinę patikrą (kiekvienai stočiai skirtinga – žr. žemiau).</li>
            <li><strong>Darbas:</strong> Statusas <code>WORKING</code>. Gyvai matoma visuose cecho ekranuose.</li>
            <li><strong>End Shift:</strong> Įvedamas pagamintas kiekis, brokas, paliekamas komentaras, užpildomas pabaigos checklist'as ir padaroma nuotrauka. Statusas grįžta į <code>NOT_STARTED</code>.</li>
        </ol>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue">4. Stotys (Stations) ir priskirti Checklist'ai</h2>
        <p class="text-slate-700 mb-4">Sistemoje yra šios pagrindinės darbo stotys bei joms priskirti privalomi klausimynai (Checklists) pamainos pradžiai (START) ir pabaigai (END):</p>
        
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
                    <li><strong>FLORA1 / FLORA2:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti dažų kiekį bakeliuose, nuvalyti spausdinimo galvą, nusivalyti UV lempas, patikrinti enkoderio juostą, patikrinti apsaugos barjerus, atlikti nozzle check, patikrinti temperatūrą, patikrinti UV nustatymus, nuvalyti optinius daviklius, atlikti testinį spausdinimą.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Pašalinti susikaupusį rašalą, nusivalyti UV lempas, išvalyti įrenginio vidų IPA, ištuštinti atliekų bakelį, nuvalyti galvos dalis, nuvalyti rėmus, užpildyti žurnalą.</li>
                    <li class="mt-2"><strong>KINGT:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti dažus, nuvalyti galvą, patikrinti UV lempas, Nozzle check, patikrinti temperatūrą, patikrinti atstumus, atlikti test print.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Nuvalyti UV lempas, išvalyti įrenginio vidų, nuleisti galvą, išvalyti galvos dalis, užpildyti žurnalą.</li>
                </ul>
            </div>

            <div class="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <h3 class="font-bold text-lg mb-2">3. DLICAN Stotys (Flatbed, 360)</h3>
                <ul class="list-disc pl-6 text-sm text-slate-600 space-y-1 mb-3">
                    <li><strong>DLICAN FLATBED:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti dažų lygį, nuvalyti galvą, Nozzle check, patikrinti vandens lygį, nuvalyti jig’us.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Išvalyti įrenginio vidų, ištuštinti atliekų bakelį, nuvalyti galvos dalis.</li>
                    <li class="mt-2"><strong>DLICAN 360:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti dažus, nuvalyti galvą, Nozzle check, patikrinti atstumus.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Išvalyti įrenginį, nuvalyti galvos dalis.</li>
                </ul>
            </div>

            <div class="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <h3 class="font-bold text-lg mb-2">4. DACEN Tumbler/Bottle ir Amica</h3>
                <ul class="list-disc pl-6 text-sm text-slate-600 space-y-1 mb-3">
                    <li><strong>DACEN tumbler / DACEN bottle / Amika:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti darbo vietos švarą, patikrinti įrenginio būklę, paruošti jig’us.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Nuvalyti įrenginį, išvalyti darbo zoną, sudėti priemones.</li>
                </ul>
            </div>

            <div class="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <h3 class="font-bold text-lg mb-2">5. Robotai (Klijų ir Suvirinimo)</h3>
                <ul class="list-disc pl-6 text-sm text-slate-600 space-y-1 mb-3">
                    <li><strong>Klijų robotas:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti dispenserio slėgį, pakeisti klijų adatą, nuvalyti padelius, patikrinti nustatymus.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Roboto vidų nuvalyti, sudėti padelius į vietą.</li>
                    <li class="mt-2"><strong>Suvirinimo robotas:</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Nuvalyti elektrodus, nuvalyti džigą, patikrinti nustatymus.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Roboto vidų nuvalyti, pakeisti filtrus.</li>
                </ul>
            </div>

            <div class="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <h3 class="font-bold text-lg mb-2">6. Mimaki Stotys (Powerbank, Mirror, Podbase)</h3>
                <ul class="list-disc pl-6 text-sm text-slate-600 space-y-1 mb-3">
                    <li><strong>Sistemos specifika:</strong> Skirtingai nei kiti, Mimaki spausdintuvai turi "Units" (padėklus/stalčius pvz. Unit 1, Unit 2). Operatorius prieš pradėdamas darbą privalo pasirinkti, su kuriais unit'ais jis dirbs. Pabaigus darbą, kiekvienam "unit'ui" galima atskirai prisegti "nozzle check" nuotrauką.</li>
                    <li class="mt-2"><strong>Checklist (Mimaki bendra):</strong><br/><span class="text-mimaki-blue font-semibold">Pradžia:</span> Patikrinti dažus, Nozzle check, nusivalyti UV lempas, Autocleaning.<br/><span class="text-mimaki-blue font-semibold">Pabaiga:</span> Nuvalyti UV lempas, išvalyti vidų, užpildyti žurnalą.</li>
                </ul>
            </div>
        </div>

        <p class="text-sm text-slate-400 mt-10 border-t pt-4">Dokumentas sugeneruotas sistemoje. Spauskite ant bet kurios vietos dokumente ir galėsite laisvai redaguoti tekstą.</p>
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
                    className="focus:outline-none"
                    style={{ minHeight: '500px' }}
                />
            </div>
        </div>
    );
};
