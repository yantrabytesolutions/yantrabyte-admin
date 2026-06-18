import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyajwjrafudarccvcada.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkxODQ2MiwiZXhwIjoyMDk0NDk0NDYyfQ.9A9D9dPb_GoHJiREuIWML1PATN-es4MC9_DE8wvK76g';

const supabase = createClient(supabaseUrl, supabaseKey);

const ticketsToDelete = [
  'YBS-TKT-040626-038',
  'YBS-TKT-040626-039',
  'YBS-TKT-050626-040',
  'YBS-2026-2027-010',
  'YBS-2026-2027-012',
  'YBS-2026-2027-013',
  'YBS-2026-2027-015'
];

async function deleteTickets() {
  for (const tkt of ticketsToDelete) {
    const { error } = await supabase
      .from('service_tickets')
      .delete()
      .eq('ticket_number', tkt);
      
    if (error) {
      console.error(`Failed to delete ${tkt}:`, error.message);
    } else {
      console.log(`Deleted ${tkt}`);
    }
  }
}

deleteTickets();
