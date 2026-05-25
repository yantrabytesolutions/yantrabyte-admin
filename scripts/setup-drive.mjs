import dotenv from 'dotenv';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const SHEET_NAMES = {
  tickets: 'Service Tickets',
  invoices: 'Invoices',
  quotations: 'Quotations',
};

const TICKET_HEADERS = [
  'Ticket No', 'Date', 'Customer', 'Phone', 'Email', 'Address',
  'Device', 'Issue', 'Priority', 'Status', 'Notes', 'PDF Link',
];

const INVOICE_HEADERS = [
  'Invoice No', 'Date', 'Customer', 'Phone', 'Email', 'Address',
  'Items', 'Subtotal', 'Discount', 'Tax', 'Round Off', 'Grand Total',
  'Amount Paid', 'Balance Due', 'Payment Status', 'Payment Mode', 'Due Date', 'PDF Link',
];

function createAuth() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );
    oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return oauth2;
  }

  const keyFile = resolve(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (keyFile && existsSync(keyFile)) {
    return new google.auth.GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  throw new Error('No Google auth configured.');
}

async function main() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!folderId || !supabaseUrl || !supabaseKey) {
    console.error('Missing env vars. Check .env file.');
    process.exit(1);
  }

  const auth = createAuth();
  const drive = google.drive({ version: 'v3', auth });
  const sheets = google.sheets({ version: 'v4', auth });
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  console.log('Creating fresh spreadsheet...');

  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: { properties: { title: 'YBS BILLING Backup' } },
  });
  const spreadsheetId = spreadsheet.data.spreadsheetId;
  const spreadsheetUrl = spreadsheet.data.spreadsheetUrl;
  console.log(`Spreadsheet created: ${spreadsheetUrl}`);

  // Try to move into Drive folder
  try {
    const file = await drive.files.get({ fileId: spreadsheetId, fields: 'parents' });
    const prevParents = file.data.parents?.join(',') || '';
    await drive.files.update({
      fileId: spreadsheetId,
      addParents: folderId,
      removeParents: prevParents,
      fields: 'id',
    });
    console.log('Moved spreadsheet into YBS BILLING folder.');
  } catch (err) {
    console.log('Note: Could not move to folder (Drive API may not be ready yet).');
    console.log('You can manually move it later:');
    console.log(`1. Open: ${spreadsheetUrl}`);
    console.log('2. File → Move → select "YBS BILLING" folder');
  }

  // Setup sheets
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        { updateSheetProperties: { properties: { sheetId: 0, title: SHEET_NAMES.tickets }, fields: 'title' } },
        { addSheet: { properties: { title: SHEET_NAMES.invoices } } },
        { addSheet: { properties: { title: SHEET_NAMES.quotations } } },
      ],
    },
  });

  // Write headers
  await sheets.spreadsheets.values.update({
    spreadsheetId, range: `'${SHEET_NAMES.tickets}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [TICKET_HEADERS] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId, range: `'${SHEET_NAMES.invoices}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [INVOICE_HEADERS] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId, range: `'${SHEET_NAMES.quotations}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [INVOICE_HEADERS] },
  });

  // Write data
  console.log('Fetching existing data from Supabase...');

  const { data: tickets } = await supabase.from('service_tickets').select('*').order('created_at', { ascending: true });
  if (tickets && tickets.length > 0) {
    const rows = tickets.map(t => [
      t.ticket_number || '',
      t.created_at ? new Date(t.created_at).toLocaleDateString('en-GB') : '',
      t.customer_name || '', t.customer_phone || '', t.customer_email || '',
      t.customer_address || '', t.device_type || '', t.issue_description || '',
      t.priority || '', t.status || '', t.notes || '', '',
    ]);
    await sheets.spreadsheets.values.update({
      spreadsheetId, range: `'${SHEET_NAMES.tickets}'!A2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });
    console.log(`  ${rows.length} tickets written.`);
  }

  const { data: invoices } = await supabase.from('invoices').select('*').order('created_at', { ascending: true });
  if (invoices && invoices.length > 0) {
    const invRows = [];
    const quotRows = [];
    for (const inv of invoices) {
      const itemsStr = (inv.items || []).map(i => `${i.description} x${i.qty} @ ${i.rate}`).join(', ');
      const row = [
        inv.invoice_no || '', inv.date || '', inv.customer_name || '',
        inv.phone || '', inv.email || '', inv.address || '', itemsStr,
        inv.subtotal || 0, inv.discount || 0, inv.tax || 0,
        inv.round_off || 0, inv.grand_total || 0, inv.advance_paid || 0,
        inv.balance_due || 0, inv.payment_status || '', inv.payment_mode || '',
        inv.due_date || '', '',
      ];
      if (inv.doc_type === 'Quotation') quotRows.push(row);
      else invRows.push(row);
    }
    if (invRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId, range: `'${SHEET_NAMES.invoices}'!A2`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: invRows },
      });
      console.log(`  ${invRows.length} invoices written.`);
    }
    if (quotRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId, range: `'${SHEET_NAMES.quotations}'!A2`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: quotRows },
      });
      console.log(`  ${quotRows.length} quotations written.`);
    }
  }

  console.log('\n✅ Setup complete!');
  console.log(`Spreadsheet URL: ${spreadsheetUrl}`);
}

main().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
