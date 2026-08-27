import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyajwjrafudarccvcada.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkxODQ2MiwiZXhwIjoyMDk0NDk0NDYyfQ.9A9D9dPb_GoHJiREuIWML1PATN-es4MC9_DE8wvK76g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: invData } = await supabase
    .from('invoices')
    .select('*')
    .ilike('items', '%backup%');
    
  console.log("Invoices with backup in items:");
  invData?.forEach(i => console.log(`${i.invoice_no}: ${i.customer_name} - ${i.doc_type}`));

  const { data: invData2 } = await supabase
    .from('invoices')
    .select('*')
    .ilike('items', '%guru%');

  console.log("Invoices with guru in items:");
  invData2?.forEach(i => console.log(`${i.invoice_no}: ${i.customer_name} - ${i.doc_type}`));
}

check();
