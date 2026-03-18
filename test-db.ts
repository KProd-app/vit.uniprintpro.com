import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const url = "https://hljqmgmwjrtowpfsnokr.supabase.co";
const key = "sb_publishable_8JLf1MPUFX2c06nab_aWvQ_dlpeCmpI";

const supabase = createClient(url, key);

async function main() {
    const { data, error } = await supabase.from('printer_logs').select('id, printer_name, shift, date, finished_at').order('created_at', { ascending: false }).limit(20);
    if (error) {
        console.error("DB ERROR", error);
    } else {
        console.log("LOGS:");
        console.log(JSON.stringify(data, null, 2));
    }
}
main();
