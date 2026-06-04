import dotenv from 'dotenv';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { Readable } from 'stream';
import PDFDocument from 'pdfkit';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function createAuth() {
  const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, 'https://developers.google.com/oauthplayground');
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

function generateTicketPdf(ticket) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
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
    doc.moveDown();
    doc.fontSize(8).font('Helvetica').text(`Generated on: ${new Date().toLocaleString('en-GB')}`, { align: 'center' });
    doc.end();
  });
}

async function main() {
  const auth = createAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  // Get all Supabase tickets
  const { data: allTickets } = await supabase.from('service_tickets').select('*').order('created_at', { ascending: true });
  if (!allTickets) { console.error('No tickets found'); return; }

  // Get sheet ticket numbers
  const sheetRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: "'Service Tickets'!A:A",
  });
  const existing = new Set((sheetRes.data.values || []).slice(1).map(r => r[0]?.trim()).filter(Boolean));

  // Find missing
  const missing = allTickets.filter(t => !existing.has(t.ticket_number));
  
  if (missing.length === 0) {
    console.log('✅ All tickets already in the sheet. Nothing to do.');
    return;
  }

  console.log(`Found ${missing.length} missing tickets:\n`);
  
  for (const ticket of missing) {
    process.stdout.write(`  ${ticket.ticket_number} - ${ticket.customer_name}... `);
    try {
      const pdfBuf = await generateTicketPdf(ticket);
      const fname = `${ticket.ticket_number.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
      const file = await drive.files.create({
        supportsAllDrives: true,
        requestBody: { name: fname, parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], description: `Service Ticket ${ticket.ticket_number} for ${ticket.customer_name}`, mimeType: 'application/pdf' },
        media: { mimeType: 'application/pdf', body: Readable.from(pdfBuf) },
        fields: 'id,name,webViewLink',
      });
      const link = file.data.webViewLink || '';

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        range: "'Service Tickets'!A2",
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            ticket.ticket_number, ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-GB') : '',
            ticket.customer_name, ticket.customer_phone, ticket.customer_email || '', ticket.customer_address || '',
            ticket.device_type || '', ticket.issue_description, ticket.priority || 'medium', ticket.status || 'open',
            ticket.notes || '', link,
          ]],
        },
      });

      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: Number(process.env.TELEGRAM_CHAT_ID),
          text: `🛠 <b>Backfilled Ticket</b>\nTicket: ${ticket.ticket_number}\nCustomer: ${ticket.customer_name}\nPhone: ${ticket.customer_phone}\nDevice: ${ticket.device_type || 'N/A'}\nIssue: ${(ticket.issue_description || '').slice(0, 100)}`,
          parse_mode: 'HTML',
        }),
      });

      console.log('✅');
    } catch (err) {
      console.log('❌', err.message);
    }
  }

  console.log(`\n✅ Done! ${missing.length} tickets backfilled.`);
}
main().catch(console.error);
