import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeSpecificTickets() {
  console.log("Searching for tickets to remove...");
  
  const { data: fuzzyData } = await supabase
    .from('service_tickets')
    .select('id, ticket_number')
    .ilike('ticket_number', '%039%');
    
  const { data: fuzzyData2 } = await supabase
    .from('service_tickets')
    .select('id, ticket_number')
    .ilike('ticket_number', '%040%');
    
  const combined = [...(fuzzyData || []), ...(fuzzyData2 || [])];
  
  if (combined.length === 0) {
    console.log("No tickets found containing 039 or 040.");
    return;
  }
  
  console.log("Found matching tickets via fuzzy search:", combined);
  
  const idsToDelete = combined.map(t => t.id);
  const { error: delError } = await supabase
    .from('service_tickets')
    .delete()
    .in('id', idsToDelete);
    
  if (delError) {
    console.error("Error deleting tickets:", delError);
  } else {
    console.log(`Successfully deleted ${idsToDelete.length} tickets.`);
  }
}

removeSpecificTickets();
