import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  console.log("Checking customers table...");
  const { data: custData, error: custErr } = await supabase.from('customers').select('*').limit(1);
  if (custErr) {
    console.error("Customers table error:", custErr);
  } else {
    console.log("Customers table is accessible. Keys:", custData.length > 0 ? Object.keys(custData[0]) : "No data but accessible");
  }

  console.log("Checking invoices table...");
  const { data: invData, error: invErr } = await supabase.from('invoices').select('*').limit(1);
  if (invErr) {
    console.error("Invoices table error:", invErr);
  } else {
    console.log("Invoices table is accessible. Keys:", invData.length > 0 ? Object.keys(invData[0]) : "No data but accessible");
  }

  console.log("Checking service_tickets table...");
  const { data: ticketData, error: ticketErr } = await supabase.from('service_tickets').select('*').limit(1);
  if (ticketErr) {
    console.error("Service_tickets table error:", ticketErr);
  } else {
    console.log("Service_tickets table is accessible. Keys:", ticketData.length > 0 ? Object.keys(ticketData[0]) : "No data but accessible");
  }

  console.log("Checking get_next_service_ticket_number RPC...");
  const { data: rpcData, error: rpcErr } = await supabase.rpc('get_next_service_ticket_number');
  if (rpcErr) {
    console.warn("RPC get_next_service_ticket_number error (expected if not created yet):", rpcErr.message);
  } else {
    console.log("RPC get_next_service_ticket_number is accessible. Result:", rpcData);
  }
}

checkSchema().catch(console.error);
