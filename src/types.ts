
export enum PrinterStatus {
  NOT_STARTED = "Laukia paruošimo",
  IN_PROGRESS = "Ruošiamas",
  READY_TO_WORK = "Paruoštas (Laukia starto)",
  WORKING = "Vykdoma gamyba",
  ENDING_SHIFT = "Darbo pabaiga"
}

export enum UserRole {
  WORKER = "Worker",
  ADMIN = "Admin"
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
}

export interface VITData {
  shift: 'Ryto' | 'Vakaro' | '';
  checklist: { [key: string]: boolean };
  notes: string;
  signature: string;
  confirmed: boolean;
}

export interface NozzleFile {
  url: string;
  timestamp: string;
}

export interface PrinterData {
  id: string;
  name: string;
  status: PrinterStatus;
  maintenanceDone: boolean;
  maintenanceComment: string;
  nozzlePrintDone: boolean;
  nozzleFile: NozzleFile | null;
  // Mimaki specific
  isMimaki?: boolean;
  selectedMimakiUnits?: number[]; // indices 1-8
  mimakiNozzleFiles?: Record<number, NozzleFile>; // index -> file
  vit: VITData;
  lastSync?: string;
  operatorName?: string;
  workStartedAt?: string;
  workFinishedAt?: string;
  productionAmount?: number;
  defectsAmount?: number;
  nextOperatorMessage?: string;
  endShiftChecklist?: { [key: string]: boolean };
}

export type ViewType = 'LOGIN' | 'DASHBOARD' | 'SETUP' | 'SUMMARY' | 'ADMIN' | 'END_SHIFT';
