import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function testGas() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data } = await supabase.from('site_settings').select('value').eq('key', 'google_apps_script_url').single();
  
  if (!data || !data.value) {
    console.log("No GAS URL found in Supabase.");
    return;
  }

  const gasUrl = data.value;
  console.log("Testing GAS URL:", gasUrl);

  const payload = {
    action: 'syncDocument',
    invoiceNo: 'INV-TEST-001',
    customerName: 'Test User',
    phone: '1234567890',
    email: 'test@example.com',
    address: 'Test Address',
    items: [{ description: 'Test Item', qty: 1, rate: 100 }],
    discount: 0,
    tax: 0,
    advance: 0,
    recordType: 'INVOICE'
  };

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    
    const text = await response.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

testGas();
