
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {} as Record<string, string>);

const supabaseUrl = envConfig['VITE_SUPABASE_URL'];
const supabaseKey = envConfig['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedStations() {
    console.log('Seeding stations...');

    // 1. Create 'stations' table if not exists (using RPC or just insert check)
    // Since we don't have direct SQL access easily, we'll assume we can use the 'stations' table if we create it via dashboard or if we can run a query.
    // Actually, the user asked for DB changes. I should probably use a migration file or SQL execution if possible.
    // But wait, I can't run SQL directly easily without the password or local connection which failed.
    // I will try to use the standard 'printers' table updates first, but I need a 'stations' table.

    // Checking if 'stations' table exists by selecting from it
    const { error: checkError } = await supabase.from('stations').select('id').limit(1);

    if (checkError && checkError.code === '42P01') {
        console.error('Table "stations" does not exist. Please create it first via Supabase Dashboard SQL Editor:');
        console.log(`
    CREATE TABLE IF NOT EXISTS stations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        station_qr_link TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
    
    ALTER TABLE printers ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES stations(id);
    `);
        return;
    }

    const stations = [
        { name: 'Mimaki Powerbank' },
        { name: 'Mimaki Mirror' },
        { name: 'Mimaki Podbase' }
    ];

    for (const s of stations) {
        const { data, error } = await supabase.from('stations').select('id').eq('name', s.name).single();

        if (!data) {
            const { error: insertError } = await supabase.from('stations').insert(s);
            if (insertError) console.error('Error inserting station:', s.name, insertError);
            else console.log('Created station:', s.name);
        } else {
            console.log('Station already exists:', s.name);
        }
    }
}

seedStations();
