import React from 'react';
import { BookOpen, Settings, LayoutGrid, RotateCcw, AlertTriangle, MonitorPlay, Users } from 'lucide-react';

export const AdminInstructions: React.FC = () => {
    return (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Admin Naudojimo Instrukcija</h3>
                    <p className="text-slate-500 font-medium">Greitas gidas kaip naudotis UniPrintPro administratoriaus aplinka.</p>
                </div>
            </div>

            <div className="p-8 space-y-12">
                {/* 1. Stationai */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <LayoutGrid className="w-6 h-6 text-slate-400" />
                        <h4 className="text-xl font-bold text-slate-800">1. Stationai (Gamybos Kontrolė)</h4>
                    </div>
                    <div className="pl-9 space-y-3 text-slate-600 text-sm leading-relaxed">
                        <p>
                            Pagrindinis langas skirtas stebėti įrenginių gyvą eigą pamainos metu.
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong className="text-slate-800">Gyvas rodiklių redagavimas:</strong> Skaičiai (Pagamino, Brokas, Iš viso ir t.t.) yra aktyvūs laukeliai. Spustelėję ir įvedę kitą skaičių iškart atnaujinsite informaciją, kurią visi mato ekrane.
                            </li>
                            <li>
                                <strong className="text-slate-800">Checklistų priskyrimas:</strong> Iš išskleidžiamojo meniu galite pasirinkti, kurį pradžios / pabaigos checklistą darbuotojas turės atlikti telefone.
                            </li>
                            <li>
                                <strong className="text-slate-800">Greitieji veiksmai (užvedus pelytę kortelės kampe):</strong>
                                <br />- 🔄 <strong>Nunulinti:</strong> Jei darbuotojas per klaidą pradėjo pamainą, atšaukite visus veiksmus.
                                <br />- 📷 <strong>QR Kodas:</strong> Atsisiųsite to įrenginio instrukcijas atspausdinimui (PDF formatu).
                                <br />- ✏️ <strong>Redaguoti:</strong> Pakeisite pačio įrenginio pavadinimą ir tipą (spauda/pakavimas/kita).
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 2. Checklistai */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <Settings className="w-6 h-6 text-slate-400" />
                        <h4 className="text-xl font-bold text-slate-800">2. Checklistai</h4>
                    </div>
                    <div className="pl-9 space-y-3 text-slate-600 text-sm leading-relaxed">
                        <p>
                            Prižiūrėkite kontrolinius klausimynus (PVZ: Ar švari darbo vieta?). Darbuotojai privalės juos užpildyti telefone, todėl turėsite kontrolę kiek tvarkingai pabaigiama pamaina.
                        </p>
                        <p>Sukūrę checklistą, būtinai eikite į "Stationai" langą ir priskirkite tą sąrašą prie atitinkamo printerio!</p>
                    </div>
                </section>

                {/* 3. Žurnalas */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <RotateCcw className="w-6 h-6 text-slate-400" />
                        <h4 className="text-xl font-bold text-slate-800">3. Žurnalas</h4>
                    </div>
                    <div className="pl-9 space-y-3 text-slate-600 text-sm leading-relaxed">
                        <p>Visų uždarytų (istorinių) pamainų biblioteka.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Lentelė visada sugrupuoja rodiklius idealiai pagal Lietuvišką 12-valandų rėžimą (Dieninė baigiasi 18:00, Naktinė – 06:00).</li>
                            <li>Prie kiekvieno įrašo matysite padidintą "Nozzle" nuotrauką arba VIT sistemos statusą.</li>
                            <li>Broko procentas paskaičiuojamas automatiškai, o jeigu jis aukštas, pamatysite ir raudoną "Priežasties" žymę, užvedę pelę pažiūrėsite paliktą tekstą.</li>
                        </ul>
                    </div>
                </section>

                {/* 4. Pranešimai */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-slate-400" />
                        <h4 className="text-xl font-bold text-slate-800">4. Pranešimai ir Vartotojai</h4>
                    </div>
                    <div className="pl-9 space-y-3 text-slate-600 text-sm leading-relaxed">
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong className="text-slate-800">Pasiūlymai / Sandėlio Pervežimai:</strong> Tai standartiniai pranešimai, kurie kaupiasi lentelėse po atskirais mygtukais.
                            </li>
                            <li>
                                <strong className="text-slate-800">Vartotojai:</strong> Čia galite sukurti naują darbuotoją. Atkreipkite dėmesį, jog prie įrenginio **nereikia jokio slaptažodžio ar PIN kodo** – darbuotojas tiesiog suveda savo vardą telefone ir sistema pati patikrina ar toks vartotojas egzistuoja.
                                <br /><br />
                                <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded">SVARBU:</span> Jei norite ištrinti esamą darbuotoją, susisiekite su <strong>Lukas Kuprys</strong> per <em>Slack</em> arba <em>Mattermost</em> programėlę.
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 5. TV Ekranas */}
                <section>
                    <div className="flex items-center gap-3 mb-4">
                        <MonitorPlay className="w-6 h-6 text-slate-400" />
                        <h4 className="text-xl font-bold text-slate-800">5. TV Ekranas (Problemos)</h4>
                    </div>
                    <div className="pl-9 space-y-4 text-slate-600 text-sm leading-relaxed">
                        <p>
                            Viskas, kas rodoma didžiajame cecho TV ekrane yra kontroliuojama čia.
                        </p>
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                            <strong className="text-amber-800 flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4" /> Greitasis Brokų Valymo Mygtukas
                            </strong>
                            <p className="text-amber-700/80">
                                TV lentoje virš 5% broko priežastys atsiranda automatiškai ir šviečia lygiai 24-valandas, po kurių pačios pradingsta. Jei išsprendėte problemą greičiau – paspauskite lentelėje esantį „Išvalyti visus“ mygtuką ir TV ekranas tuoj pat atsinaujins!
                            </p>
                        </div>
                        <ul className="list-disc pl-5 space-y-2 mt-4">
                            <li>
                                <strong className="text-slate-800">Gedimai ir Žaliavų trūkumas:</strong> Darbuotojams padavus signalą iš telefono, jis automatiškai įkris į šiuos sąrašus ir pradės mirksėti TV lentoje.
                            </li>
                            <li>
                                <strong className="text-slate-800">Redaguoti ("EDIT"):</strong> Pridėkite atsakymą / sprendimą (žaliai TV lange), priskirkite inžinieriaus vardą arba duokite terminą spręsti („Iki:...“).
                            </li>
                            <li>
                                Tuo atveju jeigu prisikaups per daug pranešimų TV lentoje – problemos lėtai viena po kitos animuosis ir kelsis iš viršaus į apačią (slenkantis sąrašas). Viza informacija bus visada pasiekiama visiems per 10 sekundžių mirksnio intervalą!
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
};
