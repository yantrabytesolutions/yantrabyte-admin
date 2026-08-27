import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeTickets() {
  const ticketsToRemove = [
    'YBS-2026-2027-028',
    'YBS-TKT-160526-036',
    'YBS-2026-2027-032',
    'YBS-2026-2027-033',
    'YBS-2026-2027-034',
    'YBS-TKT-210526-037',
    'YBS-TKT-230526-199',
    'YBS-TKT-230526-295',
    'YBS-TKT-230526-572',
    'YBS-TKT-230526-068',
    'YBS-TKT-240526-993',
    'YBS-TKT-240526-809',
    'YBS-TKT-240526-810',
    'YBS-TKT-240526-483',
    'YBS-TKT-240526-791',
    'YBS-TKT-240526-900',
    'YBS-TKT-240526-901',
    'YBS-TKT-240526-902',
    'YBS-TKT-240526-903',
    'YBS-TKT-250526-904',
    'YBS-TKT-250526-905',
    'YBS-TKT-250526-906',
    'YBS-TKT-250526-907',
    'YBS-TKT-250526-908',
    'YBS-TKT-250526-909',
    'YBS-service-Ticket 2378',
    'YBS-service-Ticket 26052026-994'
  ];

  console.log(`Attempting to remove ${ticketsToRemove.length} tickets from the database...`);

  const { data, error } = await supabase
    .from('service_tickets')
    .delete()
    .in('ticket_number', ticketsToRemove)
    .select('ticket_number');

  if (error) {
    console.error('Error deleting tickets:', error);
  } else {
    console.log(`Successfully deleted ${data.length} tickets from the database.`);
    const deletedIds = data.map(t => t.ticket_number);
    const notFound = ticketsToRemove.filter(t => !deletedIds.includes(t));
    if (notFound.length > 0) {
      console.log(`Could not find these tickets in the DB: ${notFound.join(', ')}`);
    }
  }
}

removeTickets();
