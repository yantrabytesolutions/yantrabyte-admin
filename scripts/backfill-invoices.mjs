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

function generateInvoicePdf(inv) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    const label = inv.doc_type === 'Quotation' ? 'Quotation' : 'Invoice';
    doc.fontSize(20).font('Helvetica-Bold').text('YantraByte Solutions', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text(label, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica-Bold').text(`${label} No: `, { continued: true }).font('Helvetica').text(String(inv.invoice_no));
    doc.font('Helvetica-Bold').text('Date: ', { continued: true }).font('Helvetica').text(String(inv.date || ''));
    doc.font('Helvetica-Bold').text('Customer: ', { continued: true }).font('Helvetica').text(String(inv.customer_name));
    doc.font('Helvetica-Bold').text('Phone: ', { continued: true }).font('Helvetica').text(String(inv.phone || ''));
    if (inv.email) doc.font('Helvetica-Bold').text('Email: ', { continued: true }).font('Helvetica').text(String(inv.email));
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Items:', { underline: true });
    doc.font('Helvetica').text(String(inv.items || ''));
    doc.moveDown();
    doc.font('Helvetica-Bold').text(`Grand Total: ₹`, { continued: true }).font('Helvetica').text(String(inv.grand_total || 0));
    doc.font('Helvetica-Bold').text(`Status: `, { continued: true }).font('Helvetica').text(String(inv.payment_status || ''));
    doc.moveDown();
    doc.fontSize(8).font('Helvetica').text(`Generated on: ${new Date().toLocaleString('en-GB')}`, { align: 'center' });
    doc.end();
  });
}

async function main() {
  const auth = createAuth();
  const drive = google.drive({ version: 'v3', auth });
  const sheets = google.sheets({ version: 'v4', auth });
  const sheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  // Get Supabase invoices
  const { data: allInvs } = await supabase.from('invoices').select('*').order('created_at', { ascending: true });
  if (!allInvs) { console.error('No invoices found'); return; }
  console.log(`Supabase: ${allInvs.length} invoices/quotations`);

  // Get sheet invoice numbers
  const sRes = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "'Invoices'!A:A" });
  const existing = new Set((sRes.data.values || []).slice(1).map(r => r[0]?.trim()).filter(Boolean));
  console.log(`Sheet: ${existing.size} existing invoice numbers`);

  const missing = allInvs.filter(inv => !existing.has(inv.invoice_no));
  console.log(`Missing: ${missing.length} (${missing.filter(i => i.doc_type === 'Quotation').length} quotations)\n`);

  if (missing.length === 0) { console.log('✅ All invoices already in sheet!'); return; }

  let success = 0, errors = 0;
  for (const inv of missing) {
    process.stdout.write(`  ${inv.invoice_no} - ${inv.customer_name}... `);
    try {
      const itemsStr = (inv.items || []).map(i => `${i.description} x${i.qty} @ ${i.rate}`).join(', ');
      let pdfLink = '';

      // Generate PDF
      const pdfBuf = await generateInvoicePdf(inv);
      const fname = `${inv.invoice_no.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
      const file = await drive.files.create({
        supportsAllDrives: true,
        requestBody: { name: fname, parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], description: `${inv.doc_type || 'Invoice'} ${inv.invoice_no} for ${inv.customer_name}`, mimeType: 'application/pdf' },
        media: { mimeType: 'application/pdf', body: Readable.from(pdfBuf) },
        fields: 'id,name,webViewLink',
      });
      pdfLink = file.data.webViewLink || '';

      const sheetName = inv.doc_type === 'Quotation' ? 'Quotations' : 'Invoices';
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `'${sheetName}'!A2`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            inv.invoice_no, inv.date || '', inv.customer_name || '', inv.phone || '', inv.email || '', inv.address || '',
            itemsStr, inv.subtotal || 0, inv.discount || 0, inv.tax || 0, inv.round_off || 0, inv.grand_total || 0,
            inv.advance_paid || 0, inv.balance_due || 0, inv.payment_status || '', inv.payment_mode || '',
            inv.due_date || '', pdfLink,
          ]],
        },
      });

      const label = inv.doc_type === 'Quotation' ? 'Quotation' : 'Invoice';
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: Number(process.env.TELEGRAM_CHAT_ID),
          text: `💰 <b>${label} Backfill</b>\n${label}: ${inv.invoice_no}\nCustomer: ${inv.customer_name}\nAmount: ₹${inv.grand_total || 0}`,
          parse_mode: 'HTML',
        }),
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
