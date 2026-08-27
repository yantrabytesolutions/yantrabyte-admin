import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('invoices').update({ doc_type: 'Cancelled' }).eq('invoice_no', 'YBS-20260529-004').select();
  console.log('Update result:', data, error);
}

main();
