import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load variables from .env if running locally
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Fetching existing customers...');
  const { data: existingCustomers, error: custError } = await supabase.from('customers').select('*');
  if (custError) {
    console.error('Error fetching customers:', custError);
    return;
  }
  
  // Use a map to track unique customers by phone number
  const customersMap = new Map();
  existingCustomers.forEach(c => {
    if (c.phone) customersMap.set(c.phone.trim(), c);
  });

  let addedCount = 0;

  console.log('Fetching service tickets...');
  const { data: tickets, error: ticketError } = await supabase.from('service_tickets').select('customer_name, customer_phone, customer_email, customer_address');
  if (ticketError) {
    console.error('Error fetching tickets:', ticketError);
  } else {
    for (const t of tickets) {
      if (!t.customer_phone || !t.customer_name) continue;
      const phone = t.customer_phone.trim();
      if (!customersMap.has(phone)) {
        customersMap.set(phone, {
          name: t.customer_name.trim(),
          phone: phone,
          email: t.customer_email?.trim() || null,
          address: t.customer_address?.trim() || null
        });
        addedCount++;
      }
    }
  }

  console.log('Fetching invoices...');
  const { data: invoices, error: invError } = await supabase.from('invoices').select('customer_name, phone, email, address');
  if (invError) {
    console.error('Error fetching invoices:', invError);
  } else {
    for (const inv of invoices) {
      if (!inv.phone || !inv.customer_name) continue;
      const phone = inv.phone.trim();
      if (!customersMap.has(phone)) {
        customersMap.set(phone, {
          name: inv.customer_name.trim(),
          phone: phone,
          email: inv.email?.trim() || null,
          address: inv.address?.trim() || null
        });
        addedCount++;
      }
    }
  }

  if (addedCount === 0) {
    console.log('No new unique customers found to backfill.');
    return;
  }

  console.log(`Found ${addedCount} new unique customers to insert. Proceeding with insert...`);

  // We only want to insert the ones that are NOT already in existingCustomers.
  const existingPhones = new Set(existingCustomers.map(c => c.phone?.trim()));
  const newCustomers = Array.from(customersMap.values()).filter(c => !existingPhones.has(c.phone));

  // Insert in batches of 100 to avoid limits
  for (let i = 0; i < newCustomers.length; i += 100) {
    const batch = newCustomers.slice(i, i + 100);
    const { error: insertError } = await supabase.from('customers').insert(batch);
    if (insertError) {
      console.error(`Error inserting batch ${i}:`, insertError);
    } else {
      console.log(`Inserted batch ${i} to ${i + batch.length}`);
    }
  }

  console.log('Backfill complete!');
}

main().catch(console.error);
