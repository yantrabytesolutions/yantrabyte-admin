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
const NEW_INVOICE_HEADERS = ['Invoice No', 'Date', 'Customer', 'Phone', 'Email', 'Address', 'Items', 'Subtotal', 'Discount', 'Tax', 'Round Off', 'Grand Total', 'Amount Paid', 'Balance Due', 'Payment Status', 'Payment Mode', 'Due Date', 'PDF Link'];

function createAuth() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

function generateSimpleInvoicePdf(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Invoice ${invoice.invoice_no}`, Author: 'YantraByte Solutions' } });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).font('Helvetica-Bold').text('YantraByte Solutions', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica-Bold').text(`Invoice No: `, { continued: true }).font('Helvetica').text(String(invoice.invoice_no));
    doc.font('Helvetica-Bold').text(`Date: `, { continued: true }).font('Helvetica').text(String(invoice.date || ''));
    doc.font('Helvetica-Bold').text(`Customer: `, { continued: true }).font('Helvetica').text(String(invoice.customer_name || ''));
    doc.font('Helvetica-Bold').text(`Phone: `, { continued: true }).font('Helvetica').text(String(invoice.phone || ''));
    if (invoice.email) doc.font('Helvetica-Bold').text(`Email: `, { continued: true }).font('Helvetica').text(String(invoice.email));
    doc.moveDown();
    doc.font('Helvetica-Bold').text('Items:', { underline: true });
    doc.font('Helvetica').text(String(invoice.items || ''));
    doc.moveDown();
    doc.font('Helvetica-Bold').text(`Subtotal: `, { continued: true }).font('Helvetica').text(String(invoice.subtotal || 0));
    doc.font('Helvetica-Bold').text(`Discount: `, { continued: true }).font('Helvetica').text(String(invoice.discount || 0));
    doc.font('Helvetica-Bold').text(`Grand Total: `, { continued: true }).font('Helvetica').text(String(invoice.grand_total || 0));
    doc.font('Helvetica-Bold').text(`Amount Paid: `, { continued: true }).font('Helvetica').text(String(invoice.advance_paid || 0));
    doc.font('Helvetica-Bold').text(`Balance Due: `, { continued: true }).font('Helvetica').text(String(invoice.balance_due || 0));
    doc.moveDown();
    doc.fontSize(8).font('Helvetica').text(`Generated on: ${new Date().toLocaleString('en-GB')}`, { align: 'center' });

    doc.end();
  });
}

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

async function main() {
  console.log('Starting migration of old invoices and quotations...\n');

  const auth = createAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // 1) Clear test data from new sheets
  console.log('1) Clearing test data...');
  for (const sheet of ['Invoices', 'Quotations']) {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: NEW_SHEET_ID, range: `'${sheet}'!A1:R` });
    const rows = res.data.values || [];
    if (rows.length > 1) {
      await sheets.spreadsheets.values.clear({ spreadsheetId: NEW_SHEET_ID, range: `'${sheet}'!A2:R${rows.length}` });
      console.log(`   Cleared ${rows.length - 1} test rows from ${sheet}`);
    }
  }

  // 2) Read old invoices
  console.log('\n2) Migrating Invoices...');
  const invRes = await sheets.spreadsheets.values.get({
    spreadsheetId: OLD_SHEET_ID,
    range: "'Invoices'!A1:Z",
  });
  const invRows = invRes.data.values || [];
  let invMigrated = 0, invSkipped = 0, invErrors = 0;

  for (let i = 1; i < invRows.length; i++) {
    const r = invRows[i];
    if (!r || !r[1]) { invSkipped++; continue; }

    const invoiceNo = r[1] || '';
    const customerName = r[2] || '';
    let pdfLink = r[13] || '';

    console.log(`   [${invMigrated + 1}/${invRows.length - 1}] ${invoiceNo} - ${customerName}`);

    // Generate PDF if no existing link
    if (!pdfLink) {
      try {
        const pdfBuf = await generateSimpleInvoicePdf({
          invoice_no: invoiceNo,
          date: r[0] || '',
          customer_name: customerName,
          phone: r[3] || '',
          email: r[4] || '',
          items: r[6] || '',
          subtotal: r[7] || 0,
          discount: r[8] || 0,
          grand_total: r[10] || 0,
          advance_paid: r[11] || 0,
          balance_due: r[12] || 0,
        });
        const safeFilename = `${invoiceNo.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
        const driveFile = await uploadPdfToDrive({
          auth, pdfBuffer: pdfBuf, filename: safeFilename,
          customerName, invoiceNumber: invoiceNo, documentType: 'Invoice',
        });
        pdfLink = driveFile.webViewLink || '';
        console.log(`      PDF generated: ${pdfLink}`);
      } catch (err) {
        console.error(`      PDF generation FAILED: ${err.message}`);
        invErrors++;
      }
    } else {
      console.log(`      Existing PDF`);
    }

    // Append to new sheet
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: NEW_SHEET_ID,
        range: "'Invoices'!A2",
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            invoiceNo, r[0] || '', customerName, r[3] || '', r[4] || '', r[5] || '',
            r[6] || '', r[7] || 0, r[8] || 0, 0, r[9] || 0, r[10] || 0,
            r[11] || 0, r[12] || 0, '', '', '', pdfLink,
          ]],
        },
      });
      invMigrated++;
    } catch (err) {
      console.error(`      Sheet append FAILED: ${err.message}`);
      invErrors++;
    }
  }

  // 3) Read old quotations
  console.log('\n3) Migrating Quotations...');
  const quotRes = await sheets.spreadsheets.values.get({
    spreadsheetId: OLD_SHEET_ID,
    range: "'Quotations'!A1:Z",
  });
  const quotRows = quotRes.data.values || [];
  let quotMigrated = 0, quotSkipped = 0, quotErrors = 0;

  for (let i = 1; i < quotRows.length; i++) {
    const r = quotRows[i];
    if (!r || !r[1]) { quotSkipped++; continue; }

    const quoteNo = r[1] || '';
    const customerName = r[2] || '';
    let pdfLink = r[13] || '';

    console.log(`   [${i}] ${quoteNo} - ${customerName}`);

    if (!pdfLink) {
      try {
        const pdfBuf = await generateSimpleInvoicePdf({
          invoice_no: quoteNo,
          date: r[0] || '',
          customer_name: customerName,
          phone: r[3] || '',
          email: r[4] || '',
          address: r[5] || '',
          items: r[6] || '',
          subtotal: r[7] || 0,
          discount: r[8] || 0,
          tax: r[9] || 0,
          grand_total: r[11] || 0,
        });
        const safeFilename = `${quoteNo.replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
        const driveFile = await uploadPdfToDrive({
          auth, pdfBuffer: pdfBuf, filename: safeFilename,
          customerName, invoiceNumber: quoteNo, documentType: 'Quotation',
        });
        pdfLink = driveFile.webViewLink || '';
        console.log(`      PDF generated: ${pdfLink}`);
      } catch (err) {
        console.error(`      PDF generation FAILED: ${err.message}`);
        quotErrors++;
      }
    } else {
      console.log(`      Existing PDF`);
    }

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: NEW_SHEET_ID,
        range: "'Quotations'!A2",
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            quoteNo, r[0] || '', customerName, r[3] || '', r[4] || '', r[5] || '',
            r[6] || '', r[7] || 0, r[8] || 0, r[9] || 0, r[10] || 0, r[11] || 0,
            '', r[12] || '', '', '', '', pdfLink,
          ]],
        },
      });
      quotMigrated++;
    } catch (err) {
      console.error(`      Sheet append FAILED: ${err.message}`);
      quotErrors++;
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Invoices: ${invMigrated} migrated, ${invSkipped} skipped, ${invErrors} errors`);
  console.log(`   Quotations: ${quotMigrated} migrated, ${quotSkipped} skipped, ${quotErrors} errors`);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
