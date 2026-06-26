import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyajwjrafudarccvcada.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkxODQ2MiwiZXhwIjoyMDk0NDk0NDYyfQ.9A9D9dPb_GoHJiREuIWML1PATN-es4MC9_DE8wvK76g';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  const { data: tickets } = await supabase.from('service_tickets').select('ticket_number').order('ticket_number', { ascending: false }).limit(10);
  console.log('Top 10 tickets by ticket_number descending:', tickets.map(t => t.ticket_number));
  
  const { data: ticketsCreatedAt } = await supabase.from('service_tickets').select('ticket_number').order('created_at', { ascending: false }).limit(10);
  console.log('Top 10 tickets by created_at descending:', ticketsCreatedAt.map(t => t.ticket_number));
}

check().catch(console.error);
