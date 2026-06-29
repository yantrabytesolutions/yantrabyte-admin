import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eyajwjrafudarccvcada.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTg0NjIsImV4cCI6MjA5NDQ5NDQ2Mn0.vQIGd5WdCfqhney2PKLImEDyF324lGmO2-3KaImIX04';
const supabase = createClient(supabaseUrl, anonKey);

async function testEdgeFuncInvoke() {
  const ticketPayload = {
    ticket_number: 'TEST-1234',
    customer_name: 'Test Customer',
    customer_phone: '1234567890',
    device_type: 'Test Device',
    issue_description: 'This is a test issue',
    priority: 'high'
  };

  try {
    console.log('Invoking function...');
    const { data, error } = await supabase.functions.invoke('send-ticket-email', {
      body: ticketPayload
    });
    console.log('Data:', data);
    console.log('Error:', error);
  } catch (err) {
    console.error('Exception:', err);
  }
}
testEdgeFuncInvoke();
