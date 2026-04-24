
import { PrinterStatus, PrinterData, User, UserRole } from './types';

export const INITIAL_VIT_CHECKLIST = [
  "Nuvalyti paviršiai",
  "Patikrinti atliekų talpos",
  "Patikrinti UV lempų zoną",
  "Patikrinti ventiliaciją",
  "Nuvalyti stalą",
  "Patikrinti rašalo likučius"
];

export const END_SHIFT_CHECKLIST = [
  "Nuvalytas darbo stalas",
  "Išvalytos spausdinimo galvutės (jei reikalinga)",
  "Atliekų talpos patikrintos/ištuštintos",
  "UV lempos išjungtos",
  "Įrankiai sudėti į vietas",
  "Šiukšlės išneštos"
];

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Jonas Pavardenis', role: UserRole.WORKER, pin: '1111' },
  { id: '2', name: 'Mantas Spausdintojas', role: UserRole.WORKER, pin: '2222' },
  { id: '3', name: 'Administratorius', role: UserRole.ADMIN, pin: '0000' },
  { id: '4', name: 'Maxmenas', role: UserRole.WORKER, pin: '4444' }
];

export const MOCK_PRINTERS: PrinterData[] = [
  { id: 'kingt', name: 'Kingt', status: PrinterStatus.NOT_STARTED, maintenanceDone: false, maintenanceComment: '', nozzlePrintDone: false, nozzleFile: null, vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false } },
  { id: 'dlican', name: 'Dlican', status: PrinterStatus.NOT_STARTED, maintenanceDone: false, maintenanceComment: '', nozzlePrintDone: false, nozzleFile: null, vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false } },
  { id: 'dlican360', name: 'Dlican360', status: PrinterStatus.NOT_STARTED, maintenanceDone: false, maintenanceComment: '', nozzlePrintDone: false, nozzleFile: null, vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false } },
  { id: 'flora1', name: 'Flora1', status: PrinterStatus.NOT_STARTED, maintenanceDone: false, maintenanceComment: '', nozzlePrintDone: false, nozzleFile: null, vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false } },
  { id: 'flora2', name: 'Flora2', status: PrinterStatus.NOT_STARTED, maintenanceDone: false, maintenanceComment: '', nozzlePrintDone: false, nozzleFile: null, vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false } },
  { id: 'dacen-thumbler', name: 'Dacen(Thumbler)', status: PrinterStatus.NOT_STARTED, maintenanceDone: false, maintenanceComment: '', nozzlePrintDone: false, nozzleFile: null, vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false } },
  { id: 'dacen-bottle', name: 'Dacen(Bottle)', status: PrinterStatus.NOT_STARTED, maintenanceDone: false, maintenanceComment: '', nozzlePrintDone: false, nozzleFile: null, vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false } },
  { id: 'amica', name: 'Amica', status: PrinterStatus.NOT_STARTED, maintenanceDone: false, maintenanceComment: '', nozzlePrintDone: false, nozzleFile: null, vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false } },
  {
    id: 'mimaki-powerbank',
    name: 'Mimaki Powerbank',
    status: PrinterStatus.NOT_STARTED,
    isMimaki: true,
    assignedMimakiUnits: [1, 2, 3],
    selectedMimakiUnits: [],
    mimakiNozzleFiles: {},
    maintenanceDone: false,
    maintenanceComment: '',
    nozzlePrintDone: false,
    nozzleFile: null,
    vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false }
  },
  {
    id: 'mimaki-mirror',
    name: 'Mimaki Mirror',
    status: PrinterStatus.NOT_STARTED,
    isMimaki: true,
    assignedMimakiUnits: [4, 5],
    selectedMimakiUnits: [],
    mimakiNozzleFiles: {},
    maintenanceDone: false,
    maintenanceComment: '',
    nozzlePrintDone: false,
    nozzleFile: null,
    vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false }
  },
  {
    id: 'mimaki-podbase',
    name: 'Mimaki Podbase',
    status: PrinterStatus.NOT_STARTED,
    isMimaki: true,
    assignedMimakiUnits: [6, 7, 8],
    selectedMimakiUnits: [],
    mimakiNozzleFiles: {},
    maintenanceDone: false,
    maintenanceComment: '',
    nozzlePrintDone: false,
    nozzleFile: null,
    vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false }
  },
];
export const DEFAULT_TEMPLATES = [
  // Klijų robotas
  {
    name: "Klijų robotas (Pradžia)",
    type: "START",
    items: [
      "Patikrinti darbo vietos švarą",
      "Papildyti apsaugines darbo priemones",
      "Susipažinti su dokumentacija darbo vietoje",
      "Įjungti ventiliaciją",
      "Papildyti pirmines pakuotes",
      "Papildyti antrines pakuotes",
      "Papildyti oro pagalvėles",
      "Papildyti pagalbinėmis priemonėmis",
      "Perklijuoti stalo plėvelę (mėnesio pradžioje)"
    ]
  },
  {
    name: "Klijų robotas (Pabaiga)",
    type: "END",
    items: [
      "Nuvalyti darbo stalą",
      "Iššluoti grindis",
      "Išnešti šiukšles",
      "Išnešti broką",
      "Chemines atliekas išnešti į konteinerį",
      "Sudėti priemones į vietas",
      "Papildyti pakuočių dėžutes"
    ]
  },

  // UV Lakavimas
  {
    name: "UV lakavimas (Pradžia)",
    type: "START",
    items: [
      "Patikrinti darbo vietos švarą",
      "Papildyti apsaugines priemones",
      "Susipažinti su dokumentacija",
      "Įjungti ventiliaciją",
      "Patikrinti lako kiekį",
      "Paruošti darbo priemones"
    ]
  },
  {
    name: "UV lakavimas (Pabaiga)",
    type: "END",
    items: [
      "Nuvalyti darbo paviršius",
      "Nepalikti lako indelyje",
      "Išvalyti darbo vietą",
      "Išnešti atliekas",
      "Sudėti priemones į vietas"
    ]
  },

  // FLORA1
  {
    name: "FLORA1 (Pradžia)",
    type: "START",
    items: [
      "Patikrinti dažų kiekį bakeliuose",
      "Nuvalyti spausdinimo galvą",
      "Nusivalyti UV lempas",
      "Patikrinti enkoderio juostą",
      "Patikrinti apsaugos barjerus",
      "Atlikti nozzle check",
      "Patikrinti temperatūrą",
      "Patikrinti UV nustatymus",
      "Nuvalyti optinius daviklius",
      "Atlikti testinį spausdinimą"
    ]
  },
  {
    name: "FLORA1 (Pabaiga)",
    type: "END",
    items: [
      "Pašalinti susikaupusį rašalą",
      "Nusivalyti UV lempas",
      "Išvalyti įrenginio vidų IPA",
      "Ištuštinti atliekų bakelį",
      "Nuvalyti galvos dalis",
      "Nuvalyti rėmus",
      "Užpildyti žurnalą"
    ]
  },

  // FLORA2 (Identical to Flora1)
  {
    name: "FLORA2 (Pradžia)",
    type: "START",
    items: [
      "Patikrinti dažų kiekį",
      "Nuvalyti spausdinimo galvą",
      "Nusivalyti UV lempas",
      "Patikrinti enkoderį",
      "Nozzle check",
      "Testinis spausdinimas"
    ]
  },
  {
    name: "FLORA2 (Pabaiga)",
    type: "END",
    items: [
      "Pašalinti rašalą",
      "Išvalyti vidų IPA",
      "Ištuštinti atliekų bakelį",
      "Nuvalyti galvos dalis",
      "Užpildyti žurnalą"
    ]
  },

  // KINGT
  {
    name: "KINGT (Pradžia)",
    type: "START",
    items: [
      "Patikrinti dažus",
      "Nuvalyti galvą",
      "Patikrinti UV lempas",
      "Nozzle check",
      "Patikrinti temperatūrą",
      "Patikrinti atstumus",
      "Atlikti test print"
    ]
  },
  {
    name: "KINGT (Pabaiga)",
    type: "END",
    items: [
      "Nuvalyti UV lempas",
      "Išvalyti įrenginio vidų",
      "Nuleisti galvą",
      "Išvalyti galvos dalis",
      "Užpildyti žurnalą"
    ]
  },

  // DLICAN FLATBED
  {
    name: "DLICAN FLATBED (Pradžia)",
    type: "START",
    items: [
      "Patikrinti dažų lygį",
      "Nuvalyti galvą",
      "Nozzle check",
      "Patikrinti vandens lygį",
      "Nuvalyti jig’us"
    ]
  },
  {
    name: "DLICAN FLATBED (Pabaiga)",
    type: "END",
    items: [
      "Išvalyti įrenginio vidų",
      "Ištuštinti atliekų bakelį",
      "Nuvalyti galvos dalis"
    ]
  },

  // DACEN tumbler
  {
    name: "DACEN tumbler (Pradžia)",
    type: "START",
    items: [
      "Patikrinti darbo vietos švarą",
      "Patikrinti įrenginio būklę",
      "Paruošti jig’us"
    ]
  },
  {
    name: "DACEN tumbler (Pabaiga)",
    type: "END",
    items: [
      "Nuvalyti įrenginį",
      "Išvalyti darbo zoną",
      "Sudėti priemones"
    ]
  },

  // Amika
  {
    name: "Amika (Pradžia)",
    type: "START",
    items: [
      "Patikrinti darbo vietą",
      "Patikrinti įrenginio būklę"
    ]
  },
  {
    name: "Amika (Pabaiga)",
    type: "END",
    items: [
      "Nuvalyti įrenginį",
      "Išvalyti darbo zoną"
    ]
  },

  // DLICAN 360
  {
    name: "DLICAN 360 (Pradžia)",
    type: "START",
    items: [
      "Patikrinti dažus",
      "Nuvalyti galvą",
      "Nozzle check",
      "Patikrinti atstumus"
    ]
  },
  {
    name: "DLICAN 360 (Pabaiga)",
    type: "END",
    items: [
      "Išvalyti įrenginį",
      "Nuvalyti galvos dalis"
    ]
  },

  // Klijų robotas
  {
    name: "Klijų robotas (Pradžia)",
    type: "START",
    items: [
      "Patikrinti dispenserio slėgį",
      "Pakeisti klijų adatą",
      "Nuvalyti padelius",
      "Patikrinti nustatymus"
    ]
  },
  {
    name: "Klijų robotas (Pabaiga)",
    type: "END",
    items: [
      "Roboto vidų nuvalyti",
      "Sudėti padelius į vietą"
    ]
  },

  // Suvirinimo robotas
  {
    name: "Suvirinimo robotas (Pradžia)",
    type: "START",
    items: [
      "Nuvalyti elektrodus",
      "Nuvalyti džigą",
      "Patikrinti nustatymus"
    ]
  },
  {
    name: "Suvirinimo robotas (Pabaiga)",
    type: "END",
    items: [
      "Roboto vidų nuvalyti",
      "Pakeisti filtrus"
    ]
  },

  // Mimaki bendra
  {
    name: "Mimaki bendra (Pradžia)",
    type: "START",
    items: [
      "Patikrinti dažus",
      "Nozzle check",
      "Nusivalyti UV lempas",
      "Autocleaning"
    ]
  },
  {
    name: "Mimaki bendra (Pabaiga)",
    type: "END",
    items: [
      "Nuvalyti UV lempas",
      "Išvalyti vidų",
      "Užpildyti žurnalą"
    ]
  }
];
