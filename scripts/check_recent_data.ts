import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env manualy from CWD
const envPath = path.resolve(process.cwd(), '.env');
try {
    console.log('Reading .env from:', envPath);
    if (!fs.existsSync(envPath)) {
        console.error('.env file not found at', envPath);
        process.exit(1);
    }
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars: Record<string, string> = {};

    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envVars[key.trim()] = value.trim();
        }
    });

    const supabaseUrl = envVars['VITE_SUPABASE_URL'];
    const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase URL or Key in .env');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function checkRecentData() {
        console.log('Using Supabase URL:', supabaseUrl);
        console.log('Checking recent logs...');
        const { data: logs, error } = await supabase
            .from('printer_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching logs:', error);
        } else {
            console.log('Latest 10 Printer Logs:');
            if (logs.length === 0) {
                console.log('No logs found.');
            }
            logs.forEach(log => {
                console.log(`- [${log.created_at}] Printer: ${log.printer_id}, Action: ${log.action}, User: ${log.user_id}`);
            });
        }

        console.log('\nChecking active printers...');
        const { data: printers, error: pError } = await supabase
            .from('printers')
            .select('id, name, status, work_started_at, station_id')
            .eq('status', 'WORKING');

        if (pError) {
            console.error('Error fetching printers:', pError);
        } else {
            console.log('Table: printers (Working status)');
            if (printers.length === 0) {
                console.log('No printers currently working.');
            }
            printers.forEach(p => {
                console.log(`- ${p.name} (${p.id}): Started at ${p.work_started_at} (Station: ${p.station_id})`);
            });
        }
    }

    checkRecentData();

} catch (err) {
    console.error('Error reading .env file:', err);
}
