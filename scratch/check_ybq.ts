import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.from('invoices').select('invoice_no,doc_type').in('invoice_no', ['YBQ-20260519-004', 'YBS-20260621-012']);
  console.log('Query result:', data, error);
}

main();
