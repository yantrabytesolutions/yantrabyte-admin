import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyajwjrafudarccvcada.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkxODQ2MiwiZXhwIjoyMDk0NDk0NDYyfQ.9A9D9dPb_GoHJiREuIWML1PATN-es4MC9_DE8wvK76g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: invData } = await supabase
    .from('invoices')
    .select('*')
    .or('customer_name.ilike.%guru%,customer_name.ilike.%mobile%');
    
  console.log("Invoices:", invData?.map(i => ({ no: i.invoice_no, name: i.customer_name, status: i.doc_type })));

  const { data: purData } = await supabase
    .from('purchases')
    .select('*')
    .or('supplier_name.ilike.%guru%,supplier_name.ilike.%mobile%');

  console.log("Purchases:", purData?.map(p => ({ no: p.bill_no, name: p.supplier_name })));
}

check();
