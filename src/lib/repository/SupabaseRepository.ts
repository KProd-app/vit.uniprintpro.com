import { StorageRepository } from './StorageRepository';
import { PrinterData, PrinterConfig, PrinterStatus, PrinterState, ChecklistTemplate, PrinterLog, User, UserRole } from '../../types';
import { supabase } from '../supabase';

export class SupabaseRepository implements StorageRepository {

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
            status: row.status as PrinterStatus,
            ...defaultState, // 1. Apply defaults
            ...row.config,   // 2. config overrides (if any name collision, though unlikely)
            ...row.state     // 3. DB state overrides defaults
        }));
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

        const configKeys = ['isMimaki', 'hasWhiteInk', 'hasVarnish', 'checklistTemplateId'];
        const topLevelKeys = ['name', 'status', 'type'];

        Object.entries(updates).forEach(([key, value]) => {
            if (key === 'id') return; // Don't update ID

            if (topLevelKeys.includes(key)) {
                topLevelUpdates[key] = value;
            } else if (configKeys.includes(key)) {
                configUpdates[key] = value;
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
        // Reset to initial state for the day
        const defaultState: Partial<PrinterState> = {
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

                const configKeys = ['isMimaki', 'hasWhiteInk', 'hasVarnish', 'checklistTemplateId'];
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
        const { error } = await supabase
            .from('checklist_templates')
            .upsert(template);

        if (error) {
            console.error('Error saving checklist:', error);
            throw error;
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
            defects_amount: log.defectsAmount,
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

    async getShiftLogs(filters?: { printerId?: string, date?: string }): Promise<PrinterLog[]> {
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
            defectsAmount: row.defects_amount,
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
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
}
