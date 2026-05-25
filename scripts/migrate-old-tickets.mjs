import dotenv from 'dotenv';
import { google } from 'googleapis';
import { Readable } from 'stream';
import PDFDocument from 'pdfkit';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const OLD_SHEET_ID = '1y6dyRVn0seq5qZfVmThTXJHiEoyG9kgoLeOj9WZbBOc';
const NEW_SHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// --- Auth ---
function createAuth() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

// --- PDF Generation (matches server's generateTicketPdf) ---
function generateTicketPdf(ticket) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Service Ticket ${ticket.ticket_number}`, Author: 'YantraByte Solutions' } });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const cleanName = String(ticket.customer_name || 'Customer');
    const cleanTicket = String(ticket.ticket_number);
    const cleanDevice = String(ticket.device_type || 'Device');

    doc.fontSize(20).font('Helvetica-Bold').text('YantraByte Solutions', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Service Ticket', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica-Bold').text(`Ticket No: `, { continued: true }).font('Helvetica').text(cleanTicket);
    doc.font('Helvetica-Bold').text(`Customer: `, { continued: true }).font('Helvetica').text(cleanName);
    doc.font('Helvetica-Bold').text(`Phone: `, { continued: true }).font('Helvetica').text(String(ticket.customer_phone || ''));
    if (ticket.customer_email) doc.font('Helvetica-Bold').text(`Email: `, { continued: true }).font('Helvetica').text(String(ticket.customer_email));
    if (ticket.customer_address) doc.font('Helvetica-Bold').text(`Address: `, { continued: true }).font('Helvetica').text(String(ticket.customer_address));
    doc.moveDown();
    doc.font('Helvetica-Bold').text(`Device: `, { continued: true }).font('Helvetica').text(cleanDevice);
    doc.font('Helvetica-Bold').text(`Issue: `, { continued: true }).font('Helvetica').text(String(ticket.issue_description || ''));
    doc.font('Helvetica-Bold').text(`Priority: `, { continued: true }).font('Helvetica').text(String(ticket.priority || 'Normal'));
    doc.font('Helvetica-Bold').text(`Status: `, { continued: true }).font('Helvetica').text(String(ticket.status || 'Open'));
    if (ticket.notes) doc.font('Helvetica-Bold').text(`Notes: `, { continued: true }).font('Helvetica').text(String(ticket.notes));
    doc.moveDown();
    doc.fontSize(8).font('Helvetica').text(`Generated on: ${new Date().toLocaleString('en-GB')}`, { align: 'center' });

    doc.end();
  });
}

// --- Upload PDF to Drive ---
async function uploadPdfToDrive({ auth, pdfBuffer, filename, customerName, invoiceNumber, documentType }) {
  const drive = google.drive({ version: 'v3', auth });

  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: filename,
      parents: [DRIVE_FOLDER_ID],
      description: `${documentType} ${invoiceNumber} for ${customerName}`,
      mimeType: 'application/pdf',
    },
    media: { mimeType: 'application/pdf', body: Readable.from(pdfBuffer) },
    fields: 'id,name,webViewLink',
  });

  return file.data;
}

// --- Append row to sheet ---
async function appendRowToSheet({ auth, sheetName, headers, row }) {
  const sheets = google.sheets({ version: 'v4', auth });
  const quotedName = `'${String(sheetName).replace(/'/g, "''")}'`;

  // Check if headers exist
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: NEW_SHEET_ID,
    range: `${quotedName}!A1:ZZ1`,
  });

  if (!existing.data.values || existing.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: NEW_SHEET_ID,
      range: `${quotedName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
  }

  const result = await sheets.spreadsheets.values.append({
    spreadsheetId: NEW_SHEET_ID,
    range: `${quotedName}!A2`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  return result.data;
}

// Generate a ticket number if none exists
function makeTicketNumber(customerName, index) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear()).slice(-2);
  const seq = String(index + 1).padStart(3, '0');
  return `YBS-service-Ticket ${dd}${mm}${yyyy}-${seq}`;
}

function parseDate(val) {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB');
  } catch {}
  return String(val);
}

// --- Main ---
async function main() {
  console.log('Starting bulk migration of old tickets...\n');

  const auth = createAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // 1) Read old tickets
  console.log('1) Reading old tickets from YantraByte Records...');
  const oldRes = await sheets.spreadsheets.values.get({
    spreadsheetId: OLD_SHEET_ID,
    range: "'Form Responses 1'!A1:AA",
  });
  const oldRows = oldRes.data.values || [];
  console.log(`   Found ${oldRows.length - 1} tickets\n`);

  // 2) Clear existing test rows from new sheet (keep header)
  console.log('2) Clearing test data from new Service Tickets sheet...');
  const newRes = await sheets.spreadsheets.values.get({
    spreadsheetId: NEW_SHEET_ID,
    range: "'Service Tickets'!A1:L",
  });
  const newRows = newRes.data.values || [];
  if (newRows.length > 1) {
    const clearRange = `'Service Tickets'!A2:L${newRows.length}`;
    await sheets.spreadsheets.values.clear({
      spreadsheetId: NEW_SHEET_ID,
      range: clearRange,
    });
    console.log(`   Cleared ${newRows.length - 1} existing rows\n`);
  } else {
    console.log('   Sheet already clean\n');
  }

  // 3) Process each ticket
  console.log('3) Processing tickets...');
  const TICKET_HEADERS = ['Ticket No', 'Date', 'Customer', 'Phone', 'Email', 'Address', 'Device', 'Issue', 'Priority', 'Status', 'Notes', 'PDF Link'];
  let processed = 0, skipped = 0, errors = 0;

  for (let i = 1; i < oldRows.length; i++) {
    const r = oldRows[i];
    if (!r || !r[1]) { skipped++; continue; }

    const ticketNo = r[20] || makeTicketNumber(r[1], i);
    const dateStr = parseDate(r[22] || r[16] || r[0]);
    const customerName = r[1] || '';
    const phone = r[23] || r[2] || '';
    const email = r[3] || '';
    const address = r[9] || '';
    const device = r[5] || r[7] || r[8] || '';
    const issue = r[6] || '';
    const priority = '';
    const status = r[12] || 'open';
    const notes = r[10] || '';
    let pdfLink = r[13] || '';

    console.log(`   [${i}/${oldRows.length - 1}] ${ticketNo} - ${customerName}`);

    // Generate PDF if no existing link
    if (!pdfLink) {
      try {
        const pdfBuf = await generateTicketPdf({
          ticket_number: ticketNo,
          customer_name: customerName,
          customer_phone: phone,
          customer_email: email,
          customer_address: address,
          device_type: device,
          issue_description: issue,
          priority: priority || 'Normal',
          status,
          notes,
        });

        const safeFilename = `${ticketNo.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
        const driveFile = await uploadPdfToDrive({
          auth,
          pdfBuffer: pdfBuf,
          filename: safeFilename,
          customerName,
          invoiceNumber: ticketNo,
          documentType: 'Service Ticket',
        });
        pdfLink = driveFile.webViewLink || '';
        console.log(`      PDF uploaded: ${pdfLink}`);
      } catch (err) {
        console.error(`      PDF generation/upload FAILED: ${err.message}`);
        errors++;
      }
    } else {
      console.log(`      Existing PDF: ${pdfLink}`);
    }

    // Append to new sheet
    try {
      await appendRowToSheet({
        auth,
        sheetName: 'Service Tickets',
        headers: TICKET_HEADERS,
        row: [ticketNo, dateStr, customerName, phone, email, address, device, issue, priority || 'Normal', status, notes, pdfLink],
      });
      processed++;
    } catch (err) {
      console.error(`      Sheet append FAILED: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
