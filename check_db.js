import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMTQxODYwNSwiZXhwIjoyMDQ2OTk0NjA1fQ.Xo2';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('Form Responses 1').select('*');
  console.log('Form Responses 1:', error ? error.message : data?.length + ' rows');
  
  const { data: d2, error: e2 } = await supabase.from('service_tickets').select('*');
  console.log('service_tickets:', e2 ? e2.message : d2?.length + ' rows');

  const { data: d3, error: e3 } = await supabase.from('contact_submissions').select('*');
  console.log('contact_submissions:', e3 ? e3.message : d3?.length + ' rows');
}
check();
