import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'; // anon
const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestCustomer() {
  const { data, error } = await supabase.from('Form Responses 1').insert([
    { full_name: 'Test Customer (From Table)', email: 'test@example.com', phone: '1234567890', address: '123 Test St' }
  ]).select();

  console.log('Result:', error ? error.message : data);
}

addTestCustomer();
