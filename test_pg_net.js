import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyajwjrafudarccvcada.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkxODQ2MiwiZXhwIjoyMDk0NDk0NDYyfQ.9A9D9dPb_GoHJiREuIWML1PATN-es4MC9_DE8wvK76g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPgNet() {
  const { data, error } = await supabase.rpc('test_pg_net_exists');
  console.log('Error:', error);
  
  // Actually, we can just run a generic query if we had pg extension. We'll just create the function and see if it compiles.
}

async function installTrigger() {
  const { error } = await supabase.rpc('exec_sql', { sql: `
    CREATE EXTENSION IF NOT EXISTS pg_net;
  `});
  console.log('Extension pg_net install error:', error);
}

installTrigger();
