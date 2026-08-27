import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupInvoices() {
  const keepIds = [
    'YBS-20260516-001',
    'YBS-20260517-002',
    'YBS-20260517-003',
    'YBQ-20260519-004'
  ];

  console.log(`Keeping invoices: ${keepIds.join(', ')}`);
  
  // Get all invoices
  const { data: allInvoices, error: fetchError } = await supabase
    .from('invoices')
    .select('invoice_no');
    
  if (fetchError) {
    console.error('Error fetching invoices:', fetchError);
    return;
  }
  
  console.log(`Currently there are ${allInvoices.length} invoices in the database:`);
  console.log(allInvoices.map(i => i.invoice_no).join(', '));
  
  const toDelete = allInvoices.filter(inv => !keepIds.includes(inv.invoice_no)).map(inv => inv.invoice_no);
  console.log(`Found ${toDelete.length} invoices to delete:`, toDelete);

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .not('invoice_no', 'in', `(${keepIds.map(id => `"${id}"`).join(',')})`);
      
    if (deleteError) {
      console.error('Error deleting invoices:', deleteError);
    } else {
      console.log('Successfully deleted the other invoices from the database.');
    }
  } else {
    console.log('No invoices needed to be deleted.');
  }
}

cleanupInvoices();
