import { StorageRepository } from './StorageRepository';
import { PrinterData, PrinterConfig, PrinterStatus, PrinterState, ChecklistTemplate, PrinterLog, User, UserRole, Feedback } from '../../types';
import { supabase } from '../supabase';

export class SupabaseRepository implements StorageRepository {

    async createPrinter(printer: Partial<PrinterConfig>): Promise<string> {
        const { data, error } = await supabase
            .from('printers')
            .insert([{
                name: printer.name,
                type: printer.isMimaki ? 'MIMAKI' : 'VIT',
                status: PrinterStatus.NOT_STARTED, // Default
                config: {
                    isMimaki: !!printer.isMimaki,
                    assigned_mimaki_units: printer.assignedMimakiUnits || [],
                    hasWhiteInk: !!printer.hasWhiteInk,
                    hasVarnish: !!printer.hasVarnish,
                    has_nozzle_check: !!printer.hasNozzleCheck,
                    checklist_template_id: printer.checklistTemplateId || null,
                    end_shift_checklist_id: printer.endShiftChecklistId || null,
                    qr_code: printer.qrCode || null,
                    require_date_on_nozzle: !!printer.requireDateOnNozzle,
                },
                state: {
                    // Initial empty state
                    vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false },
                    selectedMimakiUnits: [],
                    mimakiNozzleFiles: {}
                }
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating printer:', error);
            throw error;
        }

        return data.id;
    }

    async deletePrinter(id: string): Promise<void> {
        const { error } = await supabase
            .from('printers')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting printer:', error);
            throw error;
        }
    }

    async getPrinters(): Promise<PrinterData[]> {
        const { data, error } = await supabase
            .from('printers')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching printers:', error);
            return [];
        }

        // Default state to fallback on if DB is missing fields
        const defaultState: PrinterState = {
            // status: PrinterStatus.NOT_STARTED, // Removed to avoid overwriting top-level status
            maintenanceDone: false,
            maintenanceComment: '',
            nozzlePrintDone: false,
            nozzleFile: null,
            vit: { shift: '' as any, checklist: {}, notes: '', signature: '', confirmed: false } as any,
            selectedMimakiUnits: [],
            mimakiNozzleFiles: {}
        } as unknown as PrinterState;

        return data.map((row: any) => ({
            id: row.id,
            name: row.name,
            status: this.normalizeStatus(row.status),
            ...defaultState, // 1. Apply defaults
            ...row.config,   // 2. config overrides (if any name collision, though unlikely)
            assignedMimakiUnits: row.config?.assigned_mimaki_units || row.config?.assignedMimakiUnits || [],
            hasNozzleCheck: row.config?.has_nozzle_check ?? row.config?.hasNozzleCheck ?? false,
            checklistTemplateId: row.config?.checklist_template_id || row.config?.checklistTemplateId || undefined,
            endShiftChecklistId: row.config?.end_shift_checklist_id || row.config?.endShiftChecklistId || undefined,
            qrCode: row.config?.qr_code || row.config?.qrCode || undefined,
            requireDateOnNozzle: row.config?.require_date_on_nozzle || false,
            ...row.state     // 3. DB state overrides defaults
        }));
    }

    private normalizeStatus(status: string): PrinterStatus {
        switch (status) {
            case 'NOT_STARTED': return PrinterStatus.NOT_STARTED;
            case 'IN_PROGRESS': return PrinterStatus.IN_PROGRESS;
            case 'READY_TO_WORK': return PrinterStatus.READY_TO_WORK;
            case 'WORKING': return PrinterStatus.WORKING;
            case 'ENDING_SHIFT': return PrinterStatus.ENDING_SHIFT;
            default: return status as PrinterStatus;
        }
    }

    async updatePrinter(id: string, updates: Partial<PrinterData>): Promise<void> {
        // 1. Fetch current data to ensure we don't overwrite JSON fields incorrectly
        const { data: current, error: fetchError } = await supabase
            .from('printers')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !current) {
            console.error('Error fetching printer for update:', fetchError);
            return;
        }

        // 2. Separate updates into columns
        const topLevelUpdates: any = {};
        const configUpdates: any = { ...current.config };
        const stateUpdates: any = { ...current.state };

        const configKeys = ['isMimaki', 'assignedMimakiUnits', 'hasWhiteInk', 'hasVarnish', 'checklistTemplateId', 'endShiftChecklistId', 'hasNozzleCheck', 'qrCode', 'requireDateOnNozzle'];
        const topLevelKeys = ['name', 'status', 'type'];

        Object.entries(updates).forEach(([key, value]) => {
            if (key === 'id') return; // Don't update ID

            if (topLevelKeys.includes(key)) {
                topLevelUpdates[key] = value;
            } else if (configKeys.includes(key)) {
                // Map camelCase to snake_case where necessary
                if (key === 'requireDateOnNozzle') {
                    configUpdates['require_date_on_nozzle'] = value;
                } else if (key === 'hasNozzleCheck') {
                    configUpdates['has_nozzle_check'] = value;
                } else if (key === 'checklistTemplateId') {
                    configUpdates['checklist_template_id'] = value;
                } else if (key === 'endShiftChecklistId') {
                    configUpdates['end_shift_checklist_id'] = value;
                } else if (key === 'qrCode') {
                    configUpdates['qr_code'] = value;
                } else if (key === 'assignedMimakiUnits') {
                    configUpdates['assigned_mimaki_units'] = value;
                } else {
                    configUpdates[key] = value;
                }
            } else {
                // Assume everything else is state
                stateUpdates[key] = value;
            }
        });

        // 3. Perform Update
        const { error: updateError } = await supabase
            .from('printers')
            .update({
                ...topLevelUpdates,
                config: configUpdates,
                state: stateUpdates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating printer:', updateError);
            throw updateError;
        }
    }

    async resetPrinter(id: string): Promise<void> {
        // Fetch current state first to preserve critical handover data
        const { data: current, error: fetchError } = await supabase
            .from('printers')
            .select('state')
            .eq('id', id)
            .single();

        if (fetchError || !current) {
            console.error('Error fetching printer for reset:', fetchError);
            return;
        }

        // Reset to initial state for the day, but preserve handover info
        const defaultState: Partial<PrinterState> = {
            maintenanceDone: false,
            maintenanceComment: '',
            nozzlePrintDone: false,
            nozzleFile: null,
            workStartedAt: undefined,
            workFinishedAt: undefined,
            productionAmount: 0, // Reset to 0
            defectsAmount: 0, // Reset to 0

            // PRESERVE Handover Data
            nextOperatorMessage: current.state.nextOperatorMessage || '',
            remainingAmount: current.state.remainingAmount,

            // Require verification again
            handoverVerified: false,

            endShiftChecklist: undefined,
            vit: { shift: '' as any, checklist: {}, notes: '', signature: '', confirmed: false } as any,
            // Keep persistent things if any (none for now)
            // Mimaki specific resets
            selectedMimakiUnits: [],
            mimakiNozzleFiles: {}
        };

        const { error } = await supabase
            .from('printers')
            .update({
                status: PrinterStatus.NOT_STARTED,
                state: defaultState as any, // Replacing the whole state object
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error resetting printer:', error);
        }
    }

    async initialize(defaults: PrinterData[]): Promise<void> {
        // Check if printers exist
        const { count, error } = await supabase
            .from('printers')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('Error checking initialization:', error);
            return;
        }

        if (count === 0) {
            // Insert defaults
            // We need to map PrinterData back to DB structure
            const rows = defaults.map(p => {
                const config: any = {};
                const state: any = {};

                const configKeys = ['isMimaki', 'hasWhiteInk', 'hasVarnish', 'checklistTemplateId', 'requireDateOnNozzle'];
                Object.entries(p).forEach(([key, value]) => {
                    if (['id', 'name', 'status', 'type'].includes(key)) return;
                    if (configKeys.includes(key)) config[key] = value;
                    else state[key] = value;
                });

                return {
                    name: p.name,
                    type: p.isMimaki ? 'MIMAKI' : 'VIT',
                    status: p.status,
                    config,
                    state
                };
            });

            const { error: insertError } = await supabase
                .from('printers')
                .insert(rows);

            if (insertError) {
                console.error('Error initializing printers:', insertError);
            }
        }
    }

    async getChecklistTemplates(): Promise<ChecklistTemplate[]> {
        const { data, error } = await supabase
            .from('checklist_templates')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching checklists:', error);
            return [];
        }

        return data as ChecklistTemplate[];
    }

    async saveChecklistTemplate(template: ChecklistTemplate | Omit<ChecklistTemplate, 'id'>): Promise<void> {
        if ('id' in template && template.id) {
            // Update
            const { error } = await supabase
                .from('checklist_templates')
                .update(template)
                .eq('id', template.id);

            if (error) {
                console.error('Error updating checklist:', error);
                throw error;
            }
        } else {
            // Insert
            const { error } = await supabase
                .from('checklist_templates')
                .insert(template);

            if (error) {
                console.error('Error creating checklist:', error);
                throw error;
            }
        }
    }

    async deleteChecklistTemplate(id: string): Promise<void> {
        const { error } = await supabase
            .from('checklist_templates')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting checklist:', error);
            throw error;
        }
    }

    async uploadFile(file: Blob, path: string): Promise<string> {
        const { data, error } = await supabase.storage
            .from('nozzle-checks')
            .upload(path, file, {
                upsert: true
            });

        if (error) {
            console.error('Error uploading file:', error);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('nozzle-checks')
            .getPublicUrl(data.path);

        return publicUrl;
    }

    async saveShiftLog(log: Omit<PrinterLog, 'id'>): Promise<void> {
        // Map TS object to DB columns (snake_case)
        const dbLog = {
            printer_id: log.printerId,
            printer_name: log.printerName,
            shift: log.shift,
            operator_name: log.operatorName,
            date: log.date,
            started_at: log.startedAt,
            finished_at: log.finishedAt,
            production_amount: log.productionAmount,
            remaining_amount: log.remainingAmount || null,
            backlog: log.backlog || null,               // Naujas atsilikimas
            defects_amount: log.defectsAmount,
            defects_reason: log.defectsReason || null,  // Nauja broko priežastis
            robot_defects: log.robotDefects || 0,
            printing_defects: log.printingDefects || 0,
            vit_data: log.vitData,
            nozzle_data: log.nozzleData,
            next_operator_message: log.nextOperatorMessage
        };

        const { error } = await supabase
            .from('printer_logs')
            .insert(dbLog);

        if (error) {
            console.error('Error saving shift log:', error);
            throw error;
        }
    }

    async updateShiftLog(id: string, updates: Partial<PrinterLog>): Promise<void> {
        // Map TS object to DB columns (snake_case)
        const dbUpdates: any = {};
        if (updates.productionAmount !== undefined) dbUpdates.production_amount = updates.productionAmount;
        if (updates.defectsAmount !== undefined) dbUpdates.defects_amount = updates.defectsAmount;
        if (updates.remainingAmount !== undefined) dbUpdates.remaining_amount = updates.remainingAmount;
        if (updates.backlog !== undefined) dbUpdates.backlog = updates.backlog;
        if (updates.defectsReason !== undefined) dbUpdates.defects_reason = updates.defectsReason;
        if (updates.shift !== undefined) dbUpdates.shift = updates.shift;
        if (updates.date !== undefined) dbUpdates.date = updates.date;
        if (updates.robotDefects !== undefined) dbUpdates.robot_defects = updates.robotDefects;
        if (updates.printingDefects !== undefined) dbUpdates.printing_defects = updates.printingDefects;

        const { error } = await supabase
            .from('printer_logs')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Error updating shift log:', error);
            throw error;
        }
    }

    async deleteShiftLog(id: string): Promise<void> {
        const { error } = await supabase
            .from('printer_logs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting shift log:', error);
            throw error;
        }
    }

    async getShiftLogs(filters?: { printerId?: string, date?: string, shift?: string }): Promise<PrinterLog[]> {
        let query = supabase
            .from('printer_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.printerId) {
            query = query.eq('printer_id', filters.printerId);
        }
        if (filters?.date) {
            query = query.eq('date', filters.date);
        }
        if (filters?.shift) {
            query = query.eq('shift', filters.shift);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching logs:', error);
            return [];
        }

        return data.map((row: any) => ({
            id: row.id,
            printerId: row.printer_id,
            printerName: row.printer_name,
            shift: row.shift,
            operatorName: row.operator_name,
            date: row.date,
            startedAt: row.started_at,
            finishedAt: row.finished_at,
            productionAmount: row.production_amount,
            remainingAmount: row.remaining_amount,
            backlog: row.backlog,                   // Naujas atsilikimas
            defectsAmount: row.defects_amount,
            defectsReason: row.defects_reason,      // Nauja broko priežastis
            robotDefects: row.robot_defects,
            printingDefects: row.printing_defects,
            vitData: row.vit_data,
            nozzleData: row.nozzle_data,
            nextOperatorMessage: row.next_operator_message
        }));
    }

    // Users
    async getUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }

        return data.map((row: any) => {
            const rawRole = row.role || 'worker';
            const role = (rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase()) as UserRole;

            return {
                id: row.id,
                email: row.email, // Add email mapping
                name: row.name || row.email?.split('@')[0] || 'User',
                role: role,
                pin: row.pin_code || ''
            };
        });
    }

    async updateUser(id: string, data: Partial<User>): Promise<void> {
        const updates: any = {};
        if (data.name) updates.name = data.name;
        if (data.role) updates.role = data.role.toLowerCase(); // 'Admin' -> 'admin'
        if (data.pin) updates.pin_code = data.pin;

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async deleteUser(id: string): Promise<void> {
        // Note: This only deletes the profile. Auth user remains but cannot log in without profile.
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    async createUser(user: { name: string; role: 'Admin' | 'Worker'; pin?: string; password?: string }): Promise<void> {
        // Import normalizeString locally or duplicate logic if necessary, but better to import
        // Since this file is in lib/repository, we can import from ../../lib/utils
        const { normalizeString } = await import('../../lib/utils'); // Dynaic import to avoid cycles if any, or just top level

        const email = `${normalizeString(user.name).replace(/\s+/g, '.')}@vit.uniprintpro.com`;
        const password = user.password || 'uniprint'; // Use provided password or default

        console.log(`Creating user: ${user.name} (${email}) as ${user.role}`);

        // Using a secondary client to sign up the user without logging out the admin
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
        const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL or Anon Key missing in environment.');
        }

        const tempClient = createClient(supabaseUrl, supabaseKey);

        const { data: authData, error: authError } = await tempClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: user.name,
                    role: user.role.toLowerCase() // 'admin' or 'worker'
                }
            }
        });

        if (authError) {
            console.error('Error creating user auth:', authError);
            throw authError;
        }

        if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
            throw new Error('Vartotojas su tokiu el. paštu jau egzistuoja / User already exists');
        }

        console.log('User created successfully:', authData.user?.id);
    }

    async saveFeedback(feedback: Omit<Feedback, 'id' | 'createdAt'>): Promise<void> {
        const { error } = await supabase
            .from('feedback')
            .insert({
                user_id: feedback.userId,
                user_name: feedback.userName,
                type: feedback.type,
                message: feedback.message,
                url: feedback.url,
                user_agent: feedback.userAgent
            });

        if (error) {
            console.error('Error saving feedback:', error);
            throw error;
        }
    }

    async getFeedback(): Promise<Feedback[]> {
        const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching feedback:', error);
            return [];
        }

        return data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            userName: row.user_name,
            type: row.type as any,
            message: row.message,
            url: row.url,
            createdAt: row.created_at,
            userAgent: row.user_agent,
            resolved: row.resolved
        }));
    }

    async resolveFeedback(id: string): Promise<void> {
        const { error } = await supabase
            .from('feedback')
            .update({ resolved: true })
            .eq('id', id);

        if (error) {
            console.error('Error resolving feedback:', error);
            throw error;
        }
    }

    async clearAllData(): Promise<void> {
        console.log("Starting Factory Reset...");

        // 1. Delete all logs
        // Using 'not.is.null' on ID is the standard way to bypass "delete without filter" protection
        const { error: logsError, count } = await supabase
            .from('printer_logs')
            .delete({ count: 'exact' })
            .not('id', 'is', null);

        if (logsError) {
            console.error('Error clearing logs:', logsError);
            throw logsError;
        }
        console.log(`Deleted ${count} log entries.`);

        // 2. Clear Storage (Nozzle Check Images)
        // We need to list files first, then delete them
        try {
            const { data: files, error: listError } = await supabase
                .storage
                .from('nozzle-checks')
                .list();

            if (listError) {
                console.error("Error listing files:", listError);
            } else if (files && files.length > 0) {
                const filesToRemove = files.map(x => x.name);
                const { error: removeError } = await supabase
                    .storage
                    .from('nozzle-checks')
                    .remove(filesToRemove);

                if (removeError) console.error("Error removing files:", removeError);
                else console.log(`Deleted ${files.length} nozzle check files.`);
            }
        } catch (e) {
            console.error("Storage cleanup failed (non-critical):", e);
        }

        // 3. Reset all printers to default state
        const { data: printers, error: fetchError } = await supabase
            .from('printers')
            .select('id');

        if (fetchError) {
            console.error('Error fetching printers for reset:', fetchError);
            throw fetchError;
        }

        if (printers) {
            const defaultState: any = {
                maintenanceDone: false,
                maintenanceComment: '',
                nozzlePrintDone: false,
                nozzleFile: null,
                workStartedAt: undefined,
                workFinishedAt: undefined,
                productionAmount: 0,
                defectsAmount: 0,
                nextOperatorMessage: '',
                remainingAmount: 0,
                handoverVerified: false,
                endShiftChecklist: undefined,
                vit: { shift: '', checklist: {}, notes: '', signature: '', confirmed: false },
                selectedMimakiUnits: [],
                mimakiNozzleFiles: {}
            };

            for (const printer of printers) {
                const { error: updateError } = await supabase
                    .from('printers')
                    .update({
                        status: PrinterStatus.NOT_STARTED,
                        state: defaultState,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', printer.id);

                if (updateError) {
                    console.error(`Error resetting printer ${printer.id}:`, updateError);
                }
            }
        }
    }
}
