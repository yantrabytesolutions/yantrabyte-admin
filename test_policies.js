import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyajwjrafudarccvcada.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkxODQ2MiwiZXhwIjoyMDk0NDk0NDYyfQ.9A9D9dPb_GoHJiREuIWML1PATN-es4MC9_DE8wvK76g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPolicies() {
  const { data, error } = await supabase.from('site_settings').select('*');
  console.log('Total rows (Service Role):', data?.length);
  const tb = data?.find(d => d.key === 'telegram_bot_token');
  console.log('Bot token row:', tb);
}

testPolicies();
