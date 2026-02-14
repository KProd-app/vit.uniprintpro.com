import { StorageRepository } from './StorageRepository';
import { PrinterData, PrinterStatus, ChecklistTemplate, PrinterLog, User } from '../../types';

export class LocalStorageRepository implements StorageRepository {
    private readonly STORAGE_KEY = 'uniprint_printers';
    private readonly CHECKLISTS_KEY = 'uniprint_checklists';

    async saveShiftLog(log: Omit<PrinterLog, 'id'>): Promise<void> {
        console.warn('Shift logs are not implemented for LocalStorage');
    }

    async getShiftLogs(filters?: { printerId?: string, date?: string }): Promise<PrinterLog[]> {
        console.warn('Shift logs are not implemented for LocalStorage');
        return [];
    }

    async uploadFile(file: Blob, path: string): Promise<string> {
        console.warn('File upload is not implemented for LocalStorage');
        return '';
    }

    // Users
    async getUsers(): Promise<User[]> {
        return [];
    }

    async updateUser(id: string, data: Partial<User>): Promise<void> { }
    async deleteUser(id: string): Promise<void> { }
    async createUser(user: { name: string; role: 'Admin' | 'Worker'; pin?: string }): Promise<void> { }

    async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
        return [];
    }

    async saveChecklistTemplate(template: ChecklistTemplate): Promise<void> {
        // No-op for now in local storage
    }

    async deleteChecklistTemplate(id: string): Promise<void> {
        // No-op
    }

    async getPrinters(): Promise<PrinterData[]> {
        return new Promise((resolve) => {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.error("Failed to parse printers", e);
                    resolve([]);
                }
            } else {
                resolve([]);
            }
        });
    }

    async updatePrinter(id: string, updates: Partial<PrinterData>): Promise<void> {
        return new Promise((resolve) => {
            const current = this.loadSync();
            const updated = current.map(p =>
                p.id === id ? { ...p, ...updates } : p
            );
            this.saveSync(updated);
            resolve();
        });
    }

    async resetPrinter(id: string): Promise<void> {
        return new Promise((resolve) => {
            const current = this.loadSync();
            // We need the original static config to reset correctly.
            // In a real DB, we would fetch the static record and generic empty state.
            // For now, we will just reset known dynamic fields.

            const updated = current.map(p => {
                if (p.id !== id) return p;

                return {
                    ...p,
                    status: PrinterStatus.NOT_STARTED,
                    maintenanceDone: false,
                    maintenanceComment: '',
                    nozzlePrintDone: false,
                    nozzleFile: null,
                    workStartedAt: undefined,
                    workFinishedAt: undefined,
                    productionAmount: undefined,
                    defectsAmount: undefined,
                    nextOperatorMessage: '',
                    endShiftChecklist: undefined,
                    vit: { shift: '' as any, checklist: {}, notes: '', signature: '', confirmed: false }
                };
            });

            this.saveSync(updated);
            resolve();
        });
    }

    async initialize(defaults: PrinterData[]): Promise<void> {
        const current = this.loadSync();
        if (current.length === 0) {
            this.saveSync(defaults);
        }
    }



    // Helper for synchronous localStorage access
    private loadSync(): PrinterData[] {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    private saveSync(data: PrinterData[]) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
}
