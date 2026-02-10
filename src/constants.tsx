
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
    id: 'mimaki', 
    name: 'Mimaki', 
    status: PrinterStatus.NOT_STARTED, 
    isMimaki: true,
    selectedMimakiUnits: [],
    mimakiNozzleFiles: {},
    maintenanceDone: false, 
    maintenanceComment: '', 
    nozzlePrintDone: false, 
    nozzleFile: null, 
    vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false } 
  },
];
