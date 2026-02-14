import { PrinterData, ChecklistTemplate, PrinterLog, User } from '../../types';

export interface StorageRepository {
    /**
     * Get all printers
     */
    getPrinters(): Promise<PrinterData[]>;

    /**
     * Update specific printer
     */
    updatePrinter(id: string, data: Partial<PrinterData>): Promise<void>;

    /**
     * Reset printer to default state
     */
    resetPrinter(id: string): Promise<void>;

    /**
     * Upload a file and return the public URL
     */
    uploadFile(file: Blob, path: string): Promise<string>;

    // Checklists
    getChecklistTemplates(): Promise<ChecklistTemplate[]>;
    saveChecklistTemplate(template: ChecklistTemplate): Promise<void>;
    deleteChecklistTemplate(id: string): Promise<void>;

    // Logs
    saveShiftLog(log: Omit<PrinterLog, 'id'>): Promise<void>;
    getShiftLogs(filters?: { printerId?: string, date?: string }): Promise<PrinterLog[]>;

    // Users
    getUsers(): Promise<User[]>;
    updateUser(id: string, data: Partial<User>): Promise<void>;
    deleteUser(id: string): Promise<void>;
    createUser(user: { name: string; role: 'Admin' | 'Worker'; pin?: string; password?: string }): Promise<void>;

    /**
     * Initialize DB with defaults if empty
     */
    initialize(defaults: PrinterData[]): Promise<void>;
}
