import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyajwjrafudarccvcada.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkxODQ2MiwiZXhwIjoyMDk0NDk0NDYyfQ.9A9D9dPb_GoHJiREuIWML1PATN-es4MC9_DE8wvK76g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('service_tickets')
    .select('*')
    .or('customer_name.ilike.%guru%,issue_description.ilike.%guru%,device_type.ilike.%guru%,customer_name.ilike.%mobile%,issue_description.ilike.%mobile%');
    
  if (error) {
    console.error(error);
  } else {
    console.log("Matched Tickets:");
    data.forEach(t => {
      console.log(`Ticket No: ${t.ticket_no}`);
      console.log(`Customer: ${t.customer_name}`);
      console.log(`Device: ${t.device_type} ${t.device_brand} ${t.device_model}`);
      console.log(`Issue: ${t.issue_description}`);
      console.log(`Status: ${t.status}`);
      console.log(`Actions Taken: ${t.actions_taken}`);
      console.log('-------------------------');
    });
  }
}

check();
