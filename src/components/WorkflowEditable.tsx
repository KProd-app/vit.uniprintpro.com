import React, { useState, useEffect, useRef } from 'react';
import { Save, RefreshCcw } from 'lucide-react';

export const WorkflowEditable: React.FC = () => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isSaved, setIsSaved] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('workflow_content');
        if (saved && contentRef.current) {
            contentRef.current.innerHTML = saved;
        }
    }, []);

    const handleInput = () => {
        setIsSaved(false);
    };

    const handleSave = () => {
        if (contentRef.current) {
            localStorage.setItem('workflow_content', contentRef.current.innerHTML);
            setIsSaved(true);
        }
    };

    const handleReset = () => {
        if (window.confirm("Ar tikrai norite atstatyti į pradinį tekstą? Visi jūsų pakeitimai bus prarasti.")) {
            localStorage.removeItem('workflow_content');
            window.location.reload();
        }
    };

    const defaultHTML = `
        <h1 class="text-4xl font-black mb-6 text-slate-900 border-b pb-4 focus:outline-none focus:bg-slate-100 rounded-lg transition-colors p-2 -mx-2" contentEditable suppressContentEditableWarning>Sistemos „UniprintPro“ Veikimo Logika ir Architektūra (Workflow)</h1>
        <p class="text-xl mb-8 text-slate-600 font-medium focus:outline-none focus:bg-slate-100 rounded-lg transition-colors p-2 -mx-2" contentEditable suppressContentEditableWarning>Šis dokumentas aprašo esamos aplikacijos (React/Vite/Supabase) veikimo procesus, skirtas komandai, kuri planuoja šią sistemą perdaryti arba integruoti į savo esamą sistemą.</p>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue focus:outline-none focus:bg-blue-50 rounded-lg transition-colors p-2 -mx-2" contentEditable suppressContentEditableWarning>1. Techninė Architektūra (Programinė Pusė)</h2>
        <ul class="list-disc pl-6 space-y-2 text-slate-700 mb-8 focus:outline-none focus:bg-slate-100 rounded-lg transition-colors p-2 -ml-2" contentEditable suppressContentEditableWarning>
            <li><strong>Frontend:</strong> React 19, TypeScript, Vite, Tailwind CSS.</li>
            <li><strong>Backend / DB:</strong> Supabase (PostgreSQL duomenų bazė, Authentication, Storage failams/nuotraukoms).</li>
            <li><strong>Būsenų valdymas (State):</strong> Realaus laiko (Realtime) sinchronizacija per Supabase prenumeratas (Realtime channels). Naudojami React Context API (<code>DataContext</code>, <code>AuthContext</code>). Visur atnaujinama iškart, be puslapio perkrovimo.</li>
            <li><strong>Prieigos (Routes):</strong> Valdomos per URL parametrus ir <code>App.tsx</code> (pvz. <code>/live</code>, <code>/admin</code>, <code>/dazaiop</code>).</li>
        </ul>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue focus:outline-none focus:bg-blue-50 rounded-lg transition-colors p-2 -mx-2" contentEditable suppressContentEditableWarning>2. Duomenų Modelis (Data Model)</h2>
        <ul class="list-disc pl-6 space-y-2 text-slate-700 mb-8 focus:outline-none focus:bg-slate-100 rounded-lg transition-colors p-2 -ml-2" contentEditable suppressContentEditableWarning>
            <li><strong>Printers (Spausdintuvai/Stotys):</strong> Pagrindinis objektas. Turi ID, pavadinimą, priskirtą darbuotoją, dabartinę pamainą (Dieninė/Naktinė), statusą (NOT_STARTED, SETUP, WORKING). Taip pat saugo <code>vit</code> (checklist) duomenis.</li>
            <li><strong>Shift Logs (Pamainų istorija):</strong> Ataskaitų lentelė. Sukuriama kaskart, kai operatorius paspaudžia "Baigti darbą". Saugo pradžios/pabaigos laiką, pagamintą kiekį, broko kiekį, broko priežastį ir operatoriaus paliktą žinutę.</li>
            <li><strong>Users (Vartotojai):</strong> Supabase Auth vartotojai. Prisijungimas gali būti per PIN kodą (Role: operatorius) arba el. paštą/slaptažodį (Role: admin).</li>
        </ul>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue focus:outline-none focus:bg-blue-50 rounded-lg transition-colors p-2 -mx-2" contentEditable suppressContentEditableWarning>3. Naudotojo Kelias (Operator Workflow)</h2>
        <ol class="list-decimal pl-6 space-y-4 text-slate-700 mb-8 font-medium focus:outline-none focus:bg-slate-100 rounded-lg transition-colors p-2 -ml-2" contentEditable suppressContentEditableWarning>
            <li>
                <strong>Prisijungimas (Login):</strong> 
                Operatorius ateina į pamainą. Planšetėje prie spausdintuvo mato prisijungimo langą. Suveda savo unikalų PIN kodą arba pasirenka savo vardą iš sąrašo ir suveda kodą.
            </li>
            <li>
                <strong>Įrenginio pasirinkimas (Dashboard):</strong> 
                Prisijungęs mato visų cecho spausdintuvų sąrašą (laukelius). Jei spausdintuvas raudonas - jis laukia darbo (NOT_STARTED). Žalias - jau dirbamas kito žmogaus.
            </li>
            <li>
                <strong>Rytinė patikra ir Darbo Pradžia (Setup):</strong> 
                Operatorius paspaudžia ant savo spausdintuvo. Atsidaro klausimynas (Checklist), priklausomai nuo spausdintuvo tipo. Reikia atžymėti varneles (pvz., "Stalas nuvalytas", "Dažų lygis patikrintas"). Paspaudus "Pradėti", spausdintuvo statusas tampa <code>WORKING</code>, prie jo atsiranda operatoriaus vardas.
            </li>
            <li>
                <strong>Darbo procesas (Working):</strong> 
                Visi didieji ekranai gamykloje (TV Dashboard - <code>/live</code>) atsinaujina realiu laiku – užsidega žaliai, rodo, kas dirba.
            </li>
            <li>
                <strong>Darbo Pabaiga (End Shift):</strong> 
                Pamainos pabaigoje operatorius paspaudžia "Baigti darbą".
                <ul class="list-disc pl-6 mt-2 space-y-1 text-sm text-slate-600 font-normal">
                    <li>Įveda kiek vienetų pagamino.</li>
                    <li>Įveda kiek buvo broko (išskirsto į Robot/Print/Glue broką, pasirenka pagrindinę priežastį iš sąrašo).</li>
                    <li>Prisega purkštukų testo (Nozzle test) nuotrauką iš telefono/planšetės kameros.</li>
                    <li>Gali palikti tekstinę žinutę sekančios pamainos operatoriui (pvz. "Baigiasi baltas dažas").</li>
                </ul>
                Paspaudus išsaugoti, informacija nukeliauja į ataskaitų duomenų bazę, o spausdintuvas vėl tampa raudonas (NOT_STARTED), laukiantis kito žmogaus.
            </li>
        </ol>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue focus:outline-none focus:bg-blue-50 rounded-lg transition-colors p-2 -mx-2" contentEditable suppressContentEditableWarning>4. Administratoriaus / Vadovo Kelias (Admin Workflow)</h2>
        <ul class="list-disc pl-6 space-y-2 text-slate-700 mb-8 focus:outline-none focus:bg-slate-100 rounded-lg transition-colors p-2 -ml-2" contentEditable suppressContentEditableWarning>
            <li><strong>Admin Panelė (<code>/admin</code>):</strong> Vadovas mato istorijos skirtuką. Ten yra visų pamainų detalūs įrašai, lentelės, kurias galima filtruoti pagal datas ar spausdintuvus. Galima eksportuoti duomenis.</li>
            <li><strong>Būsenų atstatymas:</strong> Vadovas vienu paspaudimu gali „nuresetinti“ užstrigusį spausdintuvą atgal į pradinę būseną, jei operatorius pamiršo išsiregistruoti.</li>
            <li><strong>Klausimynų valdymas:</strong> Leidžia pritaikyti checklist'o klausimus pagal konkrečius įrenginius.</li>
            <li><strong>Dažų valdymas (Ink Tool):</strong> Administratorius ar atsakingas asmuo per atskirą įrankį skenuoja brūkšninius kodus, fotografuoja dažų butelius ir priskiria juos spausdintuvams inventoriaus stebėjimui.</li>
        </ul>

        <h2 class="text-2xl font-bold mt-10 mb-4 text-mimaki-blue focus:outline-none focus:bg-blue-50 rounded-lg transition-colors p-2 -mx-2" contentEditable suppressContentEditableWarning>5. Pagrindiniai Sėkmės Kriterijai (Iššūkiai migruojant)</h2>
        <ul class="list-disc pl-6 space-y-2 text-slate-700 mb-8 focus:outline-none focus:bg-slate-100 rounded-lg transition-colors p-2 -ml-2" contentEditable suppressContentEditableWarning>
            <li><strong>Realaus laiko greitis:</strong> Dabartinė sistema sukurta taip, kad TV ekranai gamykloje atsinaujintų tą pačią sekundę. Tai kritiškai svarbu, kad vadovai matytų tikrąjį statusą.</li>
            <li><strong>UX paprastumas:</strong> Operatorių planšetėse mygtukai turi būti dideli, aiškūs, o "Setup" ar "End Shift" procesas užtrukti iki 30 sekundžių, kad netrukdytų gamybai.</li>
            <li><strong>"Offline" tolerancija:</strong> (Nors dabar tiesiog rodomas error, ateityje svarbu), kad dingus internetui duomenys nepasimestų.</li>
            <li><strong>Ataskaitų tikslumas:</strong> Broko ir gamybos kiekių surinkimas turi būti griežtai validuojamas (nepraleisti nulių ar neigiamų skaičių), kad ataskaitos būtų teisingos.</li>
        </ul>
        
        <p class="text-sm text-slate-400 mt-10 focus:outline-none focus:bg-slate-100 rounded-lg transition-colors p-2 -mx-2" contentEditable suppressContentEditableWarning>Dokumentas sugeneruotas sistemoje. Spauskite ant bet kurio teksto, kad jį redaguotumėte. Visi pakeitimai išsisaugos naršyklėje.</p>
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
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-sm text-sm"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Atstatyti
                    </button>
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold uppercase tracking-wider transition-all shadow-md text-sm ${isSaved ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-mimaki-blue hover:bg-blue-600 text-white animate-pulse'}`}
                    >
                        <Save className="w-4 h-4" />
                        {isSaved ? 'Išsaugota' : 'Išsaugoti pakeitimus'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl max-w-4xl w-full mx-auto border border-slate-200">
                <div 
                    ref={contentRef}
                    onInput={handleInput}
                    dangerouslySetInnerHTML={{ __html: defaultHTML }}
                />
            </div>
        </div>
    );
};
