import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyajwjrafudarccvcada.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTg0NjIsImV4cCI6MjA5NDQ5NDQ2Mn0.vQIGd5WdCfqhney2PKLImEDyF324lGmO2-3KaImIX04';

const supabase = createClient(supabaseUrl, anonKey);

async function testAnonFetch() {
  const { data, error } = await supabase.from('site_settings').select('*');
  console.log('Anon data keys:', data?.map(d => d.key));
}

testAnonFetch();
