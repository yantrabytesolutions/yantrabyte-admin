import dotenv from 'dotenv';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { Readable } from 'stream';
import PDFDocument from 'pdfkit';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const NEW_SHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

function createAuth() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

function generateTicketPdf(ticket) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Service Ticket ${ticket.ticket_number}`, Author: 'YantraByte Solutions' } });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).font('Helvetica-Bold').text('YantraByte Solutions', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Service Ticket', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica-Bold').text('Ticket No: ', { continued: true }).font('Helvetica').text(String(ticket.ticket_number));
    doc.font('Helvetica-Bold').text('Customer: ', { continued: true }).font('Helvetica').text(String(ticket.customer_name));
    doc.font('Helvetica-Bold').text('Phone: ', { continued: true }).font('Helvetica').text(String(ticket.customer_phone));
    if (ticket.customer_email) doc.font('Helvetica-Bold').text('Email: ', { continued: true }).font('Helvetica').text(String(ticket.customer_email));
    if (ticket.customer_address) doc.font('Helvetica-Bold').text('Address: ', { continued: true }).font('Helvetica').text(String(ticket.customer_address));
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Device: ', { continued: true }).font('Helvetica').text(String(ticket.device_type || ''));
    doc.font('Helvetica-Bold').text('Issue: ', { continued: true }).font('Helvetica').text(String(ticket.issue_description));
    doc.font('Helvetica-Bold').text('Priority: ', { continued: true }).font('Helvetica').text(String(ticket.priority || 'Normal'));
    doc.font('Helvetica-Bold').text('Status: ', { continued: true }).font('Helvetica').text(String(ticket.status || 'Open'));
    if (ticket.notes) doc.font('Helvetica-Bold').text('Notes: ', { continued: true }).font('Helvetica').text(String(ticket.notes));
    doc.moveDown();
    doc.fontSize(8).font('Helvetica').text(`Generated on: ${new Date().toLocaleString('en-GB')}`, { align: 'center' });
    doc.end();
  });
}

async function uploadPdfToDrive(auth, pdfBuffer, filename, customerName, invoiceNumber, documentType) {
  const drive = google.drive({ version: 'v3', auth });
  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: { name: filename, parents: [DRIVE_FOLDER_ID], description: `${documentType} ${invoiceNumber} for ${customerName}`, mimeType: 'application/pdf' },
    media: { mimeType: 'application/pdf', body: Readable.from(pdfBuffer) },
    fields: 'id,name,webViewLink',
  });
  return file.data;
}

async function main() {
  const auth = createAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // 1) Get all tickets from Supabase
  console.log('1) Fetching all tickets from Supabase...');
  const { data: allTickets, error } = await supabase
    .from('service_tickets')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('Supabase error:', error.message); process.exit(1); }
  console.log(`   ${allTickets.length} tickets found\n`);

  // 2) Get existing ticket numbers from the sheet
  console.log('2) Reading existing tickets from sheet...');
  const sheetRes = await sheets.spreadsheets.values.get({
    spreadsheetId: NEW_SHEET_ID,
    range: "'Service Tickets'!A:A",
  });
  const existingNumbers = new Set((sheetRes.data.values || []).slice(1).map(r => r[0]?.trim()).filter(Boolean));
  console.log(`   ${existingNumbers.size} tickets already in sheet\n`);

  // 3) Find missing tickets
  const missing = allTickets.filter(t => !existingNumbers.has(t.ticket_number));
  console.log(`3) ${missing.length} tickets need backup:\n`);
  missing.forEach(t => console.log(`   ${t.ticket_number} - ${t.customer_name}`));

  if (missing.length === 0) {
    console.log('\n✅ All tickets already in sheet!');
    return;
  }

  // 4) Generate PDFs + upload + append
  console.log('\n4) Processing missing tickets...\n');
  let success = 0, errors = 0;

  for (const ticket of missing) {
    process.stdout.write(`   ${ticket.ticket_number} - ${ticket.customer_name}... `);
    try {
      const pdfBuf = await generateTicketPdf(ticket);
      const safeFilename = `${ticket.ticket_number.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
      const driveFile = await uploadPdfToDrive(auth, pdfBuf, safeFilename, ticket.customer_name, ticket.ticket_number, 'Service Ticket');
      const pdfLink = driveFile.webViewLink || '';

      await sheets.spreadsheets.values.append({
        spreadsheetId: NEW_SHEET_ID,
        range: "'Service Tickets'!A2",
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            ticket.ticket_number || '',
            ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-GB') : '',
            ticket.customer_name || '',
            ticket.customer_phone || '',
            ticket.customer_email || '',
            ticket.customer_address || '',
            ticket.device_type || '',
            ticket.issue_description || '',
            ticket.priority || 'medium',
            ticket.status || 'open',
            ticket.notes || '',
            pdfLink,
          ]],
        },
      });
      console.log('✅');
      success++;
    } catch (err) {
      console.log('❌', err.message);
      errors++;
    }
  }

  console.log(`\n✅ Done! ${success} backed up, ${errors} errors`);
}

main().catch(console.error);
