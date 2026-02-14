
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

// Static configuration that doesn't change during operation
export interface PrinterConfig {
  id: string;
  name: string;
  isMimaki?: boolean;
  hasWhiteInk?: boolean; // Future proofing
  hasVarnish?: boolean; // Future proofing
  checklistTemplateId?: string; // Link to specific checklist
}

// Dynamic state that changes during the shift
export interface PrinterState {
  status: PrinterStatus;
  operatorName?: string;

  // Start of Shift / Maintenance
  maintenanceDone: boolean;
  maintenanceComment: string;
  nozzlePrintDone: boolean;
  nozzleFile: NozzleFile | null;

  // Mimaki Specific State
  selectedMimakiUnits?: number[];
  mimakiNozzleFiles?: Record<number, NozzleFile>;

  // VIT Process
  vit: VITData;

  // Checklists (Dynamic)
  startShiftChecklist?: { [key: string]: boolean };

  // Shift Execution
  workStartedAt?: string;
  workFinishedAt?: string;

  // End of Shift
  productionAmount?: number;
  defectsAmount?: number;
  nextOperatorMessage?: string;
  endShiftChecklist?: { [key: string]: boolean };

  lastSync?: string;
}

// Combined type for backward compatibility and ease of use in UI
export type PrinterData = PrinterConfig & PrinterState;

// Checklist types
export interface ChecklistTemplate {
  id: string;
  name: string;
  items: string[];
}

export type ViewType = 'LOGIN' | 'DASHBOARD' | 'SETUP' | 'SUMMARY' | 'ADMIN' | 'END_SHIFT';

export interface PrinterLog {
  id: string;
  printerId: string;
  printerName: string;
  shift: string;
  operatorName: string;
  date: string;
  startedAt: string;
  finishedAt: string;
  productionAmount: number;
  defectsAmount: number;
  vitData: VITData;
  nozzleData: {
    url?: string;
    mimakiFiles?: Record<number, NozzleFile>;
  };
  nextOperatorMessage?: string;
}
