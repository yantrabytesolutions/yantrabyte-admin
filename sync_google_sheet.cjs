require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY); // Using ANON key first to see if it works

async function sync() {
  console.log('Fetching tickets...');
  const { data: tickets, error } = await supabase
    .from('service_tickets')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching tickets:', error);
    return;
  }
  
  console.log(`Found ${tickets.length} tickets. Syncing to Google Sheets...`);
  
  const SERVICE_TICKET_HEADERS = [
    'Ticket No', 'Created At', 'Customer', 'Phone', 'Email',
    'Address', 'Device / Service', 'Issue', 'Priority', 'Status',
    'Assigned To', 'Notes', 'Link', 'Make/Model', 'Service Method', 'Budget'
  ];

  let success = 0;
  for (const ticket of tickets) {
    const row = [
      ticket.ticket_number || '',
      ticket.created_at || '',
      ticket.customer_name || '',
      ticket.customer_phone || '',
      ticket.customer_email || '',
      ticket.customer_address || '',
      ticket.device_type || '',
      ticket.issue_description || '',
      ticket.priority || '',
      ticket.status || 'open',
      ticket.assigned_to || '',
      ticket.notes || '',
      `https://yantrabyte.anantatechcare.com/admin`,
      ticket.device_make_model || '',
      ticket.service_method === 'home_pickup' ? 'Home Pickup' : 'Drop-off',
      ticket.pre_approved_budget || ''
    ];

    const { data, error: invokeErr } = await supabase.functions.invoke('backup-to-sheets', {
      body: {
        sheetName: 'Service Tickets',
        headers: SERVICE_TICKET_HEADERS,
        row,
        keyColumnIndex: 0,
        keyValue: ticket.ticket_number || ''
      }
    });

    if (invokeErr) {
      console.error(`Failed to sync ticket ${ticket.ticket_number}:`, invokeErr);
    } else {
      success++;
    }
  }
  
  console.log(`Successfully synced ${success} / ${tickets.length} tickets.`);
}

sync();
