import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyajwjrafudarccvcada.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkxODQ2MiwiZXhwIjoyMDk0NDk0NDYyfQ.9A9D9dPb_GoHJiREuIWML1PATN-es4MC9_DE8wvK76g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('service_tickets')
    .select('*')
    .or('issue_description.ilike.%backup%,notes.ilike.%backup%,technician_notes.ilike.%backup%,device_type.ilike.%backup%,customer_name.ilike.%backup%,device_make_model.ilike.%backup%');
    
  if (error) {
    console.error(error);
  } else {
    console.log("Matched Tickets:");
    data.forEach(t => {
      console.log(JSON.stringify(t, null, 2));
    });
  }
}

check();
