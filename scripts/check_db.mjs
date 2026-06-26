import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyajwjrafudarccvcada.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkxODQ2MiwiZXhwIjoyMDk0NDk0NDYyfQ.9A9D9dPb_GoHJiREuIWML1PATN-es4MC9_DE8wvK76g';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  const { data: ticket } = await supabase.from('service_tickets').select('*').eq('ticket_number', 'YBS-2026-2027-036');
  console.log('Ticket YBS-2026-2027-036:', ticket);

  const { count } = await supabase.from('service_tickets').select('*', { count: 'exact', head: true });
  console.log('Total tickets:', count);

  const { data: cust } = await supabase.from('customers').select('*').ilike('name', '%Drakshayni%');
  console.log('Customer Drakshayni:', cust);
  
  const { count: custCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  console.log('Total customers:', custCount);
}

check().catch(console.error);
