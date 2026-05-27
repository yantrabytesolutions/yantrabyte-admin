import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Readable } from 'stream';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';

dotenv.config();

const app = express();
const port = Number(process.env.INVOICE_API_PORT || process.env.PORT || 4000);
const maxPdfSize = process.env.INVOICE_MAX_JSON_SIZE || '15mb';

app.use(cors());
app.use(express.json({ limit: maxPdfSize }));

const requiredEnv = ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const driveEnv = ['GOOGLE_DRIVE_FOLDER_ID'];
const sheetsEnv = ['GOOGLE_SHEETS_SPREADSHEET_ID'];
const UNIFIED_SHEET_NAME = 'YantraByte Records';
const UNIFIED_HEADERS = [
  'Type',
  'No',
  'Date',
  'Customer',
  'Phone',
  'Email',
  'Address',
  'Device / Service',
  'Description',
  'Amount',
  'Payment Status',
  'Status',
  'Assigned To',
  'Link',
];

const TICKET_SHEET = 'Service Tickets';

function getMissingEnv() {
  return requiredEnv.filter((key) => !process.env[key]);
}

function sanitizeFilename(name) {
  return String(name || 'invoice.pdf')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .slice(0, 120);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function serviceTicketRowFromPayload(ticket) {
  return [
    'Service Ticket',
    ticket.ticket_number || '',
    ticket.created_at || new Date().toISOString(),
    ticket.customer_name || '',
    ticket.customer_phone || '',
    ticket.customer_email || '',
    ticket.customer_address || '',
    ticket.device_type || '',
    ticket.issue_description || '',
    '',
    '',
    ticket.status || '',
    ticket.assigned_to || '',
    ticket.ticket_number ? `https://yantrabyte.com/admin` : '',
  ];
}

async function sendTelegramNotification(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(chatId), text: message, parse_mode: 'HTML' }),
    });
  } catch (err) {
    console.error('Telegram notify failed:', err.message);
  }
}

function getDeliveryErrorMessage(error) {
  const parts = [
    error?.code,
    error?.command,
    error?.responseCode,
    error?.response,
    error?.message,
  ].filter(Boolean);

  return parts.length ? parts.join(' - ') : 'Unknown delivery error';
}

async function logAudit({ action, entity, entityId, details, userId }) {
  try {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { error } = await supabase.from('audit_log').insert({
      action,
      entity,
      entity_id: entityId,
      details: details || {},
      user_id: userId || null,
    });
    if (error) throw error;
  } catch (err) {
    console.error('Audit log insert failed (table may not exist):', err.message);
  }
}

function getDriveAuthConfig() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return { authClient: oauth2Client };
  }

  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    const credentials = JSON.parse(rawJson);
    return { credentials };
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return { keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS };
  }

  return null;
}

function getMissingDriveEnv() {
  const missing = driveEnv.filter((key) => !process.env[key]);
  if (!getDriveAuthConfig()) {
    missing.push('Google Drive auth: use GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN, or GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_APPLICATION_CREDENTIALS');
  }
  return missing;
}

function getSpreadsheetId() {
  return process.env.GOOGLE_SHEETS_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID || '';
}

function getMissingSheetsEnv() {
  const missing = sheetsEnv.filter((key) => !process.env[key] && !process.env.GOOGLE_SHEET_ID);
  if (!getDriveAuthConfig()) {
    missing.push('Google Sheets auth: use GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET + GOOGLE_REFRESH_TOKEN, or GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_APPLICATION_CREDENTIALS');
  }
  return missing;
}

function createGoogleAuth(scopes) {
  const authConfig = getDriveAuthConfig();
  if (!authConfig) return null;
  return authConfig.authClient || new google.auth.GoogleAuth({
    ...authConfig,
    scopes,
  });
}

function quoteSheetName(name) {
  return `'${String(name || 'Sheet1').replace(/'/g, "''")}'`;
}

async function uploadPdfToDrive({ pdfBuffer, filename, customerName, invoiceNumber, documentType }) {
  const missing = getMissingDriveEnv();
  if (missing.length > 0) {
    return {
      ok: false,
      skipped: true,
      error: `Missing Google Drive configuration: ${missing.join(', ')}`,
    };
  }

  const auth = createGoogleAuth(['https://www.googleapis.com/auth/drive.file']);
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      description: `${documentType} ${invoiceNumber} for ${customerName}`,
      mimeType: 'application/pdf',
    },
    media: {
      mimeType: 'application/pdf',
      body: Readable.from(pdfBuffer),
    },
    fields: 'id,name,webViewLink',
  });

  return {
    ok: true,
    file: response.data,
  };
}

async function ensureSheetExists(sheets, spreadsheetId, sheetName) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });
  const exists = (spreadsheet.data.sheets || []).some(sheet => sheet.properties?.title === sheetName);
  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  });
}

async function appendRowToGoogleSheet({ sheetName, headers, row }) {
  const missing = getMissingSheetsEnv();
  if (missing.length > 0) {
    return {
      ok: false,
      skipped: true,
      error: `Missing Google Sheets configuration: ${missing.join(', ')}`,
    };
  }

  const spreadsheetId = getSpreadsheetId();
  const auth = createGoogleAuth(['https://www.googleapis.com/auth/spreadsheets']);
  const sheets = google.sheets({ version: 'v4', auth });
  const safeSheetName = String(sheetName || 'Backups').slice(0, 80);
  const quotedSheetName = quoteSheetName(safeSheetName);

  await ensureSheetExists(sheets, spreadsheetId, safeSheetName);

  const headerRange = `${quotedSheetName}!A1:ZZ1`;
  const existingHeader = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange,
  });

  if (!existingHeader.data.values || existingHeader.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${quotedSheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers] },
    });
  }

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${quotedSheetName}!A2`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });

  return {
    ok: true,
    updatedRange: response.data.updates?.updatedRange,
  };
}

async function requireSupabaseUser(req, res, next) {
  // Only check Supabase connectivity — Gmail being absent should not block
  // Drive backups, Telegram notifications, exports, etc.
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Missing Supabase configuration (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)' });
  }

  const authHeader = req.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Missing Supabase session token' });
  }

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired Supabase session' });
  }

  req.user = data.user;
  return next();
}

function healthResponse(_req, res) {
  const missing = getMissingEnv();
  res.status(missing.length ? 500 : 200).json({
    ok: missing.length === 0,
    missing,
  });
}

app.get('/health', healthResponse);
app.get('/api/health', healthResponse);
app.get('/api/drive-health', (_req, res) => {
  const missing = getMissingDriveEnv();
  res.status(missing.length ? 500 : 200).json({
    ok: missing.length === 0,
    missing,
  });
});
app.get('/api/sheets-health', (_req, res) => {
  const missing = getMissingSheetsEnv();
  res.status(missing.length ? 500 : 200).json({
    ok: missing.length === 0,
    missing,
  });
});

app.post('/api/backups/sheet-row', requireSupabaseUser, async (req, res) => {
  const { sheetName, headers, row } = req.body || {};

  if (!sheetName || !Array.isArray(headers) || !Array.isArray(row)) {
    return res.status(400).json({ error: 'sheetName, headers, and row are required' });
  }

  try {
    const result = await appendRowToGoogleSheet({ sheetName, headers, row });
    return res.json(result);
  } catch (error) {
    console.error('Google Sheets backup failed:', getDeliveryErrorMessage(error));
    return res.status(502).json({
      ok: false,
      skipped: false,
      error: getDeliveryErrorMessage(error),
    });
  }
});

function generateTicketPdf(ticket) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 36,
      info: {
        Title: `Service Ticket ${ticket.ticket_number}`,
        Author: 'YantraByte Solutions',
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = 525;
    const margin = 36;
    const col1 = 110;
    const col2 = 200;
    const blue = '#0B5394';
    const dark = '#111111';
    const gray = '#444444';
    const lightGray = '#666666';
    const headerBg = '#D9EAF7';

    const cleanName = String(ticket.customer_name || 'Customer');
    const cleanTicket = String(ticket.ticket_number);
    const cleanDevice = String(ticket.device_type || 'Device');
    const dateStr = ticket.created_at
      ? new Date(ticket.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // --- Header ---
    doc.fontSize(20).font('Helvetica-Bold').fillColor(blue).text('YantraByte Solutions', { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor(gray).text('IT Service, Repair & Network Management', { align: 'center' });
    doc.fontSize(8).fillColor(lightGray).text('47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post | Phone: 09986742525', { align: 'center' });
    doc.moveDown(0.5);

    // Divider
    doc.moveTo(margin, doc.y).lineTo(pageWidth, doc.y).strokeColor('#000').lineWidth(1.5).stroke();
    doc.moveDown(0.3);

    // Title + Ticket Info
    doc.fontSize(13).font('Helvetica-Bold').fillColor(dark);
    const titleY = doc.y;
    doc.text('SERVICE TICKET RECEIPT', { align: 'left' });

    doc.fontSize(9).font('Helvetica').fillColor(gray);
    const ticketY = doc.y;
    doc.text(`Ticket: `, { continued: true });
    doc.font('Helvetica-Bold').fillColor('#c2410c').text(cleanTicket, { continued: false });
    doc.text(`Date: ${dateStr}`, { align: 'left' });

    doc.moveDown(0.3);
    doc.moveTo(margin, doc.y).lineTo(pageWidth, doc.y).strokeColor('#000').lineWidth(0.5).stroke();
    doc.moveDown(0.4);

    // --- Helper: draw a table cell ---
    function drawField(label, value, x, y, w, h) {
      const rowH = h || 18;
      doc.rect(x, y, w, rowH).strokeColor('#000').lineWidth(0.5).stroke();
      const midY = y + rowH / 2;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(dark);
      doc.text(label, x + 4, midY - 4, { width: w - 8 });
      doc.font('Helvetica').fillColor(gray);
      doc.text(String(value || '—'), x + w / 2, midY - 4, { width: w / 2 - 4 });
    }

    // --- Ticket Details Table (4 columns) ---
    const tableX = margin;
    let yPos = doc.y;
    const rowH = 18;
    const cw = (pageWidth - margin) / 4;

    function tRow(label1, val1, label2, val2) {
      const sectionW = cw * 2;
      // cell 1
      doc.rect(tableX, yPos, sectionW, rowH).strokeColor('#000').lineWidth(0.5).stroke();
      doc.rect(tableX, yPos, sectionW, rowH).fillAndStroke(headerBg, '#000').fillOpacity(1);
      doc.fillColor(dark).fontSize(7.5).font('Helvetica-Bold').text(label1, tableX + 4, yPos + 5);
      doc.rect(tableX + sectionW, yPos, sectionW, rowH).strokeColor('#000').lineWidth(0.5).stroke();
      doc.fillColor(gray).fontSize(7.5).font('Helvetica').text(String(val1 || '—'), tableX + sectionW + 4, yPos + 5);
      yPos += rowH;
    }

    tRow('Ticket ID', cleanTicket, 'Date', dateStr);
    tRow('Customer Name', cleanName, 'Phone', String(ticket.customer_phone || '—'));
    const emailVal = ticket.customer_email || '—';
    doc.rect(tableX, yPos, cw * 4, rowH).strokeColor('#000').lineWidth(0.5).stroke();
    doc.rect(tableX, yPos, cw, rowH).fillAndStroke(headerBg, '#000').fillOpacity(1);
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(7.5).text('Email', tableX + 4, yPos + 5);
    doc.fillColor(gray).font('Helvetica').text(emailVal, tableX + cw + 4, yPos + 5, { width: cw * 3 - 8 });
    yPos += rowH;

    const addrVal = ticket.customer_address || '—';
    doc.rect(tableX, yPos, cw * 4, rowH + 6).strokeColor('#000').lineWidth(0.5).stroke();
    doc.rect(tableX, yPos, cw, rowH + 6).fillAndStroke(headerBg, '#000').fillOpacity(1);
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(7.5).text('Address', tableX + 4, yPos + 5);
    doc.fillColor(gray).font('Helvetica').fontSize(7.5).text(addrVal, tableX + cw + 4, yPos + 3, { width: cw * 3 - 8 });
    yPos += rowH + 6;

    tRow('Device', cleanDevice, 'Device Type', String(ticket.device_type || '—'));

    const priVal = String(ticket.priority || 'Medium');
    const stVal = String(ticket.status || 'Open');
    doc.rect(tableX, yPos, cw * 4, rowH).strokeColor('#000').lineWidth(0.5).stroke();
    doc.rect(tableX, yPos, cw, rowH).fillAndStroke(headerBg, '#000').fillOpacity(1);
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(7.5).text('Priority', tableX + 4, yPos + 5);
    doc.fillColor('#b91c1c').font('Helvetica-Bold').fontSize(7.5).text(priVal, tableX + cw + 4, yPos + 5);
    doc.rect(tableX + cw * 2, yPos, cw, rowH).fillAndStroke(headerBg, '#000').fillOpacity(1);
    doc.fillColor(dark).font('Helvetica-Bold').fontSize(7.5).text('Status', tableX + cw * 2 + 4, yPos + 5);
    doc.fillColor('#0f766e').font('Helvetica-Bold').fontSize(7.5).text(stVal.toUpperCase(), tableX + cw * 3 + 4, yPos + 5);
    yPos += rowH;

    yPos += 6;
    doc.y = yPos;

    // --- Customer & Device Details side by side ---
    const boxW = (pageWidth - margin - 4) / 2;
    function infoBox(title, linesData, x) {
      const boxH = 7 + linesData.length * 14 + 6;
      doc.rect(x, doc.y, boxW, boxH).strokeColor('#000').lineWidth(0.5).stroke();
      doc.rect(x, doc.y, boxW, 14).fillAndStroke(headerBg, '#000').fillOpacity(1);
      doc.fillColor(dark).fontSize(7.5).font('Helvetica-Bold').text(title, x + 4, doc.y + 3);
      let ly = doc.y + 16;
      linesData.forEach(([l, v]) => {
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(dark).text(l, x + 4, ly);
        doc.font('Helvetica').fillColor(gray).text(String(v), x + boxW / 3 + 4, ly, { width: boxW * 2 / 3 - 8 });
        ly += 14;
      });
      return boxH;
    }

    const custH = infoBox('CUSTOMER DETAILS', [
      ['Name:', cleanName],
      ['Phone:', String(ticket.customer_phone || '—')],
      ['Email:', String(ticket.customer_email || '—')],
    ], tableX);

    const devStartY = doc.y;
    infoBox('DEVICE & SERVICE DETAILS', [
      ['Device/Type:', cleanDevice],
      ['Priority:', priVal],
      ['Status:', stVal.toUpperCase()],
    ], tableX + boxW + 4);

    doc.y = devStartY + Math.max(custH, doc.y - devStartY) + 6;

    // --- Reported Issue ---
    doc.rect(tableX, doc.y, pageWidth - margin, 14).fillAndStroke(headerBg, '#000').fillOpacity(1);
    doc.fillColor(dark).fontSize(8).font('Helvetica-Bold').text('REPORTED CUSTOMER COMPLAINT / ISSUE', tableX + 4, doc.y + 3);
    doc.y += 15;
    const issueText = ticket.issue_description || 'No complaints specified.';
    doc.rect(tableX, doc.y, pageWidth - margin, 40).strokeColor('#000').lineWidth(0.5).stroke();
    doc.fillColor(dark).fontSize(8).font('Helvetica').text(String(issueText), tableX + 6, doc.y + 4, { width: pageWidth - margin - 12 });
    doc.y += 44;

    // --- Diagnostics & Notes ---
    doc.rect(tableX, doc.y, pageWidth - margin, 14).fillAndStroke(headerBg, '#000').fillOpacity(1);
    doc.fillColor(dark).fontSize(8).font('Helvetica-Bold').text('DIAGNOSTICS & INTERNAL WORKSHOP NOTES', tableX + 4, doc.y + 3);
    doc.y += 15;
    const notesText = ticket.notes || 'Awaiting diagnostic feedback from the support team.';
    doc.rect(tableX, doc.y, pageWidth - margin, 40).strokeColor('#000').lineWidth(0.5).stroke();
    doc.fillColor('#333333').fontSize(8).font('Helvetica-Oblique').text(String(notesText), tableX + 6, doc.y + 4, { width: pageWidth - margin - 12 });
    doc.y += 44;

    // --- Terms & Conditions ---
    doc.rect(tableX, doc.y, pageWidth - margin, 14).fillAndStroke(headerBg, '#000').fillOpacity(1);
    doc.fillColor(dark).fontSize(8).font('Helvetica-Bold').text('TERMS & CONDITIONS OF SERVICE', tableX + 4, doc.y + 3);
    doc.y += 15;
    const terms = [
      'Diagnostic Fee: A non-refundable diagnostic charge applies to all devices brought in for inspection, regardless of whether the repair estimate is approved or declined.',
      'Data Backup: Customer is solely responsible for backing up all data, files, and personal information prior to service. Yantrabyte Solutions shall not be held liable for any data loss, corruption, or damage during diagnosis, repair, or handling.',
      'Parts Warranty: All replacement parts carry a standard 6-month warranty from the date of installation unless otherwise specified. Warranty covers manufacturing defects only.',
      'Service Warranty: Labor and service work are warranted for 30 days from the date of return. Any recurring issue caused by the same fault will be rectified free of charge within this period.',
      'Collection Period: Devices not collected within 30 days of completion notification will incur a storage fee of ₹50/day. Devices unclaimed beyond 90 days will be disposed of at the company\'s discretion without further notice.',
      'Estimate Approval: Repairs will commence only after the customer approves the written estimate. Any additional repairs required during the process will be communicated for prior approval.',
      'E-waste Disposal: Unclaimed or obsolete electronic components will be recycled or disposed of as per environmental regulations after the notice period.',
      'Limitation of Liability: Yantrabyte Solutions\' total liability shall not exceed the total invoice value of the service. We are not responsible for any consequential or incidental damages arising from the service provided.',
    ];

    doc.rect(tableX, doc.y, pageWidth - margin, 4 + terms.length * 11 + 4).strokeColor('#000').lineWidth(0.5).stroke();
    terms.forEach((t, i) => {
      doc.fillColor(gray).fontSize(7).font('Helvetica').text(`${i + 1}. ${t}`, tableX + 6, doc.y + 3 + i * 11, { width: pageWidth - margin - 12 });
    });
    doc.y += 4 + terms.length * 11 + 6;

    // --- Signature Section ---
    const sigY = doc.y;
    // Customer side
    doc.fontSize(8).font('Helvetica-Bold').fillColor(dark).text('Customer Acknowledgement', tableX, sigY);
    const custLines = sigY + 12;
    doc.moveTo(tableX, custLines).lineTo(tableX + 180, custLines).strokeColor('#555').lineWidth(0.5).stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor(lightGray).text('Signature', tableX, custLines + 3);
    const custLines2 = custLines + 16;
    doc.moveTo(tableX, custLines2).lineTo(tableX + 180, custLines2).strokeColor('#555').lineWidth(0.5).stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor(lightGray).text('Printed Name', tableX, custLines2 + 3);
    const custLines3 = custLines2 + 16;
    doc.moveTo(tableX, custLines3).lineTo(tableX + 180, custLines3).strokeColor('#555').lineWidth(0.5).stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor(lightGray).text('Date', tableX, custLines3 + 3);

    // Company Seal + Signature (right side)
    const sealX = pageWidth - 130;
    // Draw round seal
    const sealCx = sealX + 60;
    const sealCy = sigY + 50;
    doc.circle(sealCx, sealCy, 56).strokeColor(blue).lineWidth(2.5).stroke();
    doc.circle(sealCx, sealCy, 50).strokeColor(blue).lineWidth(1).stroke();
    doc.fontSize(8).font('Helvetica-Bold').fillColor(blue).text('YANTABYTE', sealCx, sealCy - 22, { align: 'center' });
    doc.fontSize(7).text('SOLUTIONS', sealCx, sealCy - 14, { align: 'center' });
    doc.fontSize(5).text('AUTHORIZED SERVICE', sealCx, sealCy - 4, { align: 'center' });
    doc.fontSize(5).text('BENGALURU', sealCx, sealCy + 4, { align: 'center' });
    doc.circle(sealCx, sealCy + 18, 12).strokeColor(blue).lineWidth(0.8).stroke();
    doc.fontSize(7).font('Helvetica-Bold').text('Ramesh A s', sealCx, sealCy + 12, { align: 'center' });


    // Signature line below seal
    const signLineY = sealCy + 38;
    doc.moveTo(sealX, signLineY).lineTo(sealX + 120, signLineY).strokeColor('#555').lineWidth(0.5).stroke();
    doc.fontSize(8).font('Helvetica-Bold').fillColor(blue).text('For Yantrabyte Solutions', sealX, signLineY + 4, { align: 'center' });
    doc.fontSize(7).font('Helvetica').fillColor(lightGray).text('Authorized Signatory', sealX, signLineY + 14, { align: 'center' });

    doc.end();
  });
}

app.post('/api/backups/public-service-ticket', async (req, res) => {
  const ticket = req.body || {};
  if (!ticket.ticket_number || !ticket.customer_name || !ticket.customer_phone || !ticket.issue_description) {
    return res.status(400).json({ error: 'ticket_number, customer_name, customer_phone, and issue_description are required' });
  }

  // Upload ticket PDF to Drive FIRST to get the link
  let driveResult = null;
  let pdfLink = '';
  try {
    let pdfBuffer;
    if (ticket.pdfBase64) {
      pdfBuffer = Buffer.from(ticket.pdfBase64, 'base64');
    } else {
      pdfBuffer = await generateTicketPdf(ticket);
    }
    const safeFilename = sanitizeFilename(ticket.pdfFilename || `${ticket.ticket_number}.pdf`);
    driveResult = await uploadPdfToDrive({
      pdfBuffer,
      filename: safeFilename,
      customerName: ticket.customer_name || 'Customer',
      invoiceNumber: ticket.ticket_number || '',
      documentType: 'Service Ticket',
    });
    if (driveResult.ok && driveResult.file) {
      pdfLink = driveResult.file.webViewLink || '';
    }
  } catch (error) {
    console.error('Service ticket Drive upload failed:', getDeliveryErrorMessage(error));
  }

  // Then append to Service Tickets sheet WITH the PDF link
  let sheetResult = null;
  try {
    sheetResult = await appendRowToGoogleSheet({
      sheetName: TICKET_SHEET,
      headers: TICKET_SHEET_HEADERS,
      row: [
        ticket.ticket_number || '',
        ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
        ticket.customer_name || '',
        ticket.customer_phone || '',
        ticket.customer_email || '',
        ticket.customer_address || '',
        ticket.device_type || '',
        ticket.issue_description || '',
        ticket.priority || '',
        ticket.status || '',
        ticket.notes || '',
        pdfLink,
      ],
    });
  } catch (error) {
    console.error('Public service ticket sheet backup failed:', getDeliveryErrorMessage(error));
    // Don't return error — still try email
  }

  let mailResult = null;
  if (ticket.customer_email && isValidEmail(ticket.customer_email) && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      const cleanCustomerName = String(ticket.customer_name || 'Customer');
      const cleanTicketNumber = String(ticket.ticket_number);
      const cleanDeviceType = String(ticket.device_type || 'Device');

      const mailPayload = {
        from: `"YantraByte Solutions" <${process.env.GMAIL_USER}>`,
        to: ticket.customer_email,
        replyTo: process.env.GMAIL_REPLY_TO || process.env.GMAIL_USER,
        subject: `Service Ticket ${cleanTicketNumber} Created - YantraByte Solutions`,
        text: [
          `Dear ${cleanCustomerName},`,
          '',
          `Your service ticket (${cleanTicketNumber}) for your ${cleanDeviceType} has been successfully created.`,
          `Our team is reviewing the issue: "${ticket.issue_description}"`,
          '',
          'We will keep you updated on the progress.',
          '',
          'Regards,',
          'YantraByte Solutions',
        ].join('\n'),
        html: `
          <p>Dear ${cleanCustomerName},</p>
          <p>Your service ticket (<strong>${cleanTicketNumber}</strong>) for your <strong>${cleanDeviceType}</strong> has been successfully created.</p>
          <p>Our team is reviewing the issue: <em>"${ticket.issue_description}"</em></p>
          <p>We will keep you updated on the progress.</p>
          <p>Regards,<br/>YantraByte Solutions</p>
        `,
      };

      if (ticket.pdfBase64 && ticket.pdfFilename) {
        const pdfBuffer = Buffer.from(ticket.pdfBase64, 'base64');
        mailPayload.attachments = [
          {
            filename: String(ticket.pdfFilename).replace(/[/\\?%*:|"<>]/g, '-').slice(0, 120),
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ];
      } else {
        try {
          const serverPdf = await generateTicketPdf(ticket);
          mailPayload.attachments = [
            {
              filename: `${cleanTicketNumber}.pdf`,
              content: serverPdf,
              contentType: 'application/pdf',
            },
          ];
        } catch (pdfErr) {
          console.error('Server PDF generation failed:', pdfErr);
        }
      }

      mailResult = await transporter.sendMail(mailPayload);
    } catch (error) {
      console.error('Service ticket email failed:', getDeliveryErrorMessage(error));
    }
  }

  sendTelegramNotification(
    `🛠 <b>New Service Ticket</b>\n` +
    `Ticket: ${ticket.ticket_number || 'N/A'}\n` +
    `Customer: ${ticket.customer_name || 'N/A'}\n` +
    `Phone: ${ticket.customer_phone || 'N/A'}\n` +
    `Device: ${ticket.device_type || 'N/A'}\n` +
    `Issue: ${(ticket.issue_description || '').slice(0, 100)}`
  );

  logAudit({
    action: 'create',
    entity: 'service_ticket',
    entityId: ticket.ticket_number,
    details: { customer_name: ticket.customer_name, device_type: ticket.device_type },
    userId: null,
  });

  return res.json({
    ok: true,
    sheet: sheetResult,
    drive: driveResult,
    email: mailResult ? { ok: true, messageId: mailResult.messageId } : { ok: false, skipped: true }
  });
});

app.post('/api/invoices/email', requireSupabaseUser, async (req, res) => {
  // Gmail credentials are required specifically for this email-sending route
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return res.status(503).json({
      error: 'Email service not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to the server .env file.',
    });
  }

  const {
    to,
    customerName,
    invoiceNumber,
    documentType = 'Invoice',
    filename,
    pdfBase64,
    grandTotal,
  } = req.body || {};

  if (!isValidEmail(to)) {
    return res.status(400).json({ error: 'Customer email address is missing or invalid' });
  }
  if (!pdfBase64) {
    return res.status(400).json({ error: 'PDF attachment is missing' });
  }

  const cleanInvoiceNumber = String(invoiceNumber || 'invoice');
  const cleanDocumentType = String(documentType || 'Invoice');
  const cleanCustomerName = String(customerName || 'Customer');
  const safeFilename = sanitizeFilename(filename || `${cleanInvoiceNumber}.pdf`);
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  const cleanGrandTotal = grandTotal != null ? Number(grandTotal).toLocaleString('en-IN') : '';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  let mailResult;
  let mailError;

  try {
    mailResult = await transporter.sendMail({
      from: `"YantraByte Solutions" <${process.env.GMAIL_USER}>`,
      to,
      replyTo: process.env.GMAIL_REPLY_TO || process.env.GMAIL_USER,
      subject: `${cleanDocumentType} ${cleanInvoiceNumber} - YantraByte Solutions`,
      text: [
        `Dear ${cleanCustomerName},`,
        '',
        `Please find attached your ${cleanDocumentType.toLowerCase()} ${cleanInvoiceNumber}.`,
        '',
        'Regards,',
        'YantraByte Solutions',
      ].join('\n'),
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><style>
          body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f4f6f9}
          .container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
          .header{background:#0B5394;padding:24px 32px;text-align:center}
          .header h1{color:#fff;margin:0;font-size:22px}
          .header p{color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px}
          .body{padding:32px}
          .invoice-info{background:#f8fafc;border-radius:6px;padding:16px;margin-bottom:20px}
          .invoice-info table{width:100%}
          .invoice-info td{padding:4px 0;font-size:14px}
          .label{color:#64748b}
          .value{font-weight:600;color:#0f172a}
          .total-row{border-top:2px solid #0B5394}
          .total-row td{padding-top:8px;font-size:18px}
          .total-row .value{color:#0B5394}
          .bank-details{background:#f0f9ff;border-radius:6px;padding:16px;margin:20px 0}
          .bank-details h3{color:#0B5394;margin:0 0 8px;font-size:14px}
          .bank-details p{margin:2px 0;font-size:13px;color:#334155}
          .payment-link{display:inline-block;background:#0B5394;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:600;margin:16px 0}
          .terms{font-size:12px;color:#94a3b8;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0}
          .footer{text-align:center;padding:16px 32px;background:#f8fafc;font-size:12px;color:#94a3b8}
        </style></head>
        <body>
        <div class="container">
          <div class="header">
            <h1>YantraByte Solutions</h1>
            <p>IT Service, Repair &amp; Network Management</p>
          </div>
          <div class="body">
            <p>Dear ${cleanCustomerName},</p>
            <p>Please find your ${cleanDocumentType.toLowerCase()} attached below.</p>
            <div class="invoice-info">
              <table>
                <tr><td class="label">${cleanDocumentType} No:</td><td class="value">${cleanInvoiceNumber}</td></tr>
                <tr><td class="label">Customer:</td><td class="value">${cleanCustomerName}</td></tr>
                ${cleanGrandTotal ? '<tr class="total-row"><td class="label">Grand Total:</td><td class="value">\u20B9 ' + cleanGrandTotal + '</td></tr>' : ''}
              </table>
            </div>
            <a class="payment-link" href="upi://pay?pa=s0424237152@slc&pn=YantraByte%20Solutions&tn=Invoice%20${encodeURIComponent(cleanInvoiceNumber)}">Pay via UPI</a>
            <p style="font-size:13px;color:#64748b">Or pay via UPI: <strong>s0424237152@slc</strong></p>
            <div class="bank-details">
              <h3>Bank Transfer Details</h3>
              <p><strong>Bank:</strong> North East Small Finance Bank</p>
              <p><strong>A/C Name:</strong> YantraByte Solutions</p>
              <p><strong>A/C No:</strong> 033311501023226</p>
              <p><strong>IFSC:</strong> NESF0000333</p>
            </div>
            <div class="terms">
              <p><strong>Terms:</strong> Payment is due within 15 days. Late payments may incur additional charges. For queries, contact yantrabyte.solutions@gmail.com or call 09986742525.</p>
            </div>
            <p>Regards,<br><strong>YantraByte Solutions</strong></p>
          </div>
          <div class="footer">47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru - 560097 | Phone: 09986742525</div>
        </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: safeFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  } catch (error) {
    mailError = error;
    console.error('Invoice email failed:', getDeliveryErrorMessage(error));
  }

  let driveResult = {
    ok: false,
    skipped: true,
    error: 'Google Drive backup was not attempted because email delivery failed.',
  };

  if (mailError) {
    return res.status(502).json({
      error: `Gmail send failed: ${getDeliveryErrorMessage(mailError)}`,
      email: { ok: false },
      drive: driveResult,
    });
  }

  try {
    driveResult = await uploadPdfToDrive({
      pdfBuffer,
      filename: safeFilename,
      customerName: cleanCustomerName,
      invoiceNumber: cleanInvoiceNumber,
      documentType: cleanDocumentType,
    });
  } catch (error) {
    driveResult = {
      ok: false,
      skipped: false,
      error: getDeliveryErrorMessage(error),
    };
    console.error('Google Drive invoice backup failed:', getDeliveryErrorMessage(error));
  }

  return res.json({
    ok: true,
    email: { ok: true, messageId: mailResult.messageId },
    drive: driveResult,
  });
});

// ─── Fresh Spreadsheet Setup ─────────────────────────────────────────────────

const SHEET_NAMES = {
  tickets: 'Service Tickets',
  invoices: 'Invoices',
  quotations: 'Quotations',
};

const TICKET_SHEET_HEADERS = [
  'Ticket No', 'Date', 'Customer', 'Phone', 'Email', 'Address',
  'Device', 'Issue', 'Priority', 'Status', 'Notes', 'PDF Link',
];

const INVOICE_SHEET_HEADERS = [
  'Invoice No', 'Date', 'Customer', 'Phone', 'Email', 'Address',
  'Items', 'Subtotal', 'Discount', 'Tax', 'Round Off', 'Grand Total',
  'Amount Paid', 'Balance Due', 'Payment Status', 'Payment Mode', 'Due Date', 'PDF Link',
];

app.post('/api/drive/setup', requireSupabaseUser, async (req, res) => {
  const missing = getMissingDriveEnv();
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing Drive config: ${missing.join(', ')}` });
  }

  try {
    const auth = createGoogleAuth([
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
    ]);
    if (!auth) {
      return res.status(500).json({ error: 'Could not create Google auth' });
    }

    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // Create new spreadsheet in the Drive folder
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: 'YantraByte Backup' },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    const spreadsheetUrl = spreadsheet.data.spreadsheetUrl;

    // Move the spreadsheet into the Drive folder
    const file = await drive.files.get({
      fileId: spreadsheetId,
      fields: 'parents',
    });
    const previousParents = file.data.parents?.join(',') || '';
    await drive.files.update({
      fileId: spreadsheetId,
      addParents: process.env.GOOGLE_DRIVE_FOLDER_ID,
      removeParents: previousParents,
      fields: 'id, parents',
    });

    // Rename default sheet and create additional sheets
    const sheetRequests = [
      {
        updateSheetProperties: {
          properties: { sheetId: 0, title: SHEET_NAMES.tickets },
          fields: 'title',
        },
      },
      {
        addSheet: { properties: { title: SHEET_NAMES.invoices } },
      },
      {
        addSheet: { properties: { title: SHEET_NAMES.quotations } },
      },
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: sheetRequests },
    });

    // Write headers for tickets sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_NAMES.tickets}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [TICKET_SHEET_HEADERS] },
    });

    // Write headers for invoices sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_NAMES.invoices}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [INVOICE_SHEET_HEADERS] },
    });

    // Write headers for quotations sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${SHEET_NAMES.quotations}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [INVOICE_SHEET_HEADERS] },
    });

    // Fetch all existing tickets from Supabase
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data: allTickets } = await supabase
      .from('service_tickets')
      .select('*')
      .order('created_at', { ascending: true });

    if (allTickets && allTickets.length > 0) {
      const ticketRows = allTickets.map((t) => [
        t.ticket_number || '',
        t.created_at ? new Date(t.created_at).toLocaleDateString('en-GB') : '',
        t.customer_name || '',
        t.customer_phone || '',
        t.customer_email || '',
        t.customer_address || '',
        t.device_type || '',
        t.issue_description || '',
        t.priority || '',
        t.status || '',
        t.notes || '',
        '',
      ]);

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${SHEET_NAMES.tickets}'!A2`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: ticketRows },
      });
    }

    // Fetch all existing invoices from Supabase
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: true });

    if (allInvoices && allInvoices.length > 0) {
      const invoiceRows = [];
      const quotationRows = [];

      for (const inv of allInvoices) {
        const itemsStr = (inv.items || [])
          .map((i) => `${i.description} x${i.qty} @ ${i.rate}`)
          .join(', ');

        const row = [
          inv.invoice_no || '',
          inv.date || (inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB') : ''),
          inv.customer_name || '',
          inv.phone || '',
          inv.email || '',
          inv.address || '',
          itemsStr,
          inv.subtotal || 0,
          inv.discount || 0,
          inv.tax || 0,
          inv.round_off || 0,
          inv.grand_total || 0,
          inv.advance_paid || 0,
          inv.balance_due || 0,
          inv.payment_status || '',
          inv.payment_mode || '',
          inv.due_date || '',
          '',
        ];

        if (inv.doc_type === 'Quotation') {
          quotationRows.push(row);
        } else {
          invoiceRows.push(row);
        }
      }

      if (invoiceRows.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${SHEET_NAMES.invoices}'!A2`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: invoiceRows },
        });
      }

      if (quotationRows.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${SHEET_NAMES.quotations}'!A2`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: quotationRows },
        });
      }
    }

    return res.json({
      ok: true,
      spreadsheetId,
      spreadsheetUrl,
    });
  } catch (error) {
    console.error('Spreadsheet setup failed:', getDeliveryErrorMessage(error));
    return res.status(502).json({ ok: false, error: getDeliveryErrorMessage(error) });
  }
});

// ─── Drive Backup: Ticket (server generates PDF) ────────────────────────────

app.post('/api/drive/backup-ticket', requireSupabaseUser, async (req, res) => {
  const { ticketId } = req.body || {};
  if (!ticketId) {
    return res.status(400).json({ error: 'ticketId is required' });
  }

  try {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data: ticket, error: fetchError } = await supabase
      .from('service_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (fetchError || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Generate PDF server-side
    const pdfBuffer = await generateTicketPdf(ticket);
    const filename = `${ticket.ticket_number || 'ticket'}.pdf`.replace(/[/\\?%*:|"<>]/g, '-');

    // Upload to Drive
    const driveResult = await uploadPdfToDrive({
      pdfBuffer,
      filename,
      customerName: ticket.customer_name || 'Customer',
      invoiceNumber: ticket.ticket_number || '',
      documentType: 'Service Ticket',
    });

    const pdfLink = driveResult.ok && driveResult.file ? driveResult.file.webViewLink : '';

    // Append to sheet (use existing spreadsheet or fall back to configured one)
    const sheetResult = await appendRowToGoogleSheet({
      sheetName: SHEET_NAMES.tickets,
      headers: TICKET_SHEET_HEADERS,
      row: [
        ticket.ticket_number || '',
        ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('en-GB') : '',
        ticket.customer_name || '',
        ticket.customer_phone || '',
        ticket.customer_email || '',
        ticket.customer_address || '',
        ticket.device_type || '',
        ticket.issue_description || '',
        ticket.priority || '',
        ticket.status || '',
        ticket.notes || '',
        pdfLink,
      ],
    });

    sendTelegramNotification(
      `🛠 <b>Ticket Backup (Admin)</b>\n` +
      `Ticket: ${ticket.ticket_number || 'N/A'}\n` +
      `Customer: ${ticket.customer_name || 'N/A'}\n` +
      `Phone: ${ticket.customer_phone || 'N/A'}\n` +
      `Device: ${ticket.device_type || 'N/A'}\n` +
      `Issue: ${(ticket.issue_description || '').slice(0, 100)}`
    );

    logAudit({
      action: 'backup',
      entity: 'service_ticket',
      entityId: ticket.ticket_number,
      details: { customer_name: ticket.customer_name, device_type: ticket.device_type },
      userId: req.user?.id,
    });

    return res.json({
      ok: true,
      drive: driveResult,
      sheet: sheetResult,
      pdfLink,
    });
  } catch (error) {
    console.error('Ticket backup failed:', getDeliveryErrorMessage(error));
    return res.status(502).json({ ok: false, error: getDeliveryErrorMessage(error) });
  }
});

// ─── Drive Backup: Invoice / Quotation (client provides PDF) ───────────────

app.post('/api/drive/backup-invoice', requireSupabaseUser, async (req, res) => {
  const { invoiceId, pdfBase64, filename } = req.body || {};
  if (!invoiceId || !pdfBase64) {
    return res.status(400).json({ error: 'invoiceId and pdfBase64 are required' });
  }

  try {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const safeFilename = sanitizeFilename(filename || `${invoice.invoice_no || 'invoice'}.pdf`);
    const isQuotation = invoice.doc_type === 'Quotation';
    const sheetName = isQuotation ? SHEET_NAMES.quotations : SHEET_NAMES.invoices;

    // Upload to Drive
    const driveResult = await uploadPdfToDrive({
      pdfBuffer,
      filename: safeFilename,
      customerName: invoice.customer_name || 'Customer',
      invoiceNumber: invoice.invoice_no || '',
      documentType: invoice.doc_type || 'Invoice',
    });

    const pdfLink = driveResult.ok && driveResult.file ? driveResult.file.webViewLink : '';

    // Build row data
    const itemsStr = (invoice.items || [])
      .map((i) => `${i.description} x${i.qty} @ ${i.rate}`)
      .join(', ');

    const row = [
      invoice.invoice_no || '',
      invoice.date || (invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-GB') : ''),
      invoice.customer_name || '',
      invoice.phone || '',
      invoice.email || '',
      invoice.address || '',
      itemsStr,
      invoice.subtotal || 0,
      invoice.discount || 0,
      invoice.tax || 0,
      invoice.round_off || 0,
      invoice.grand_total || 0,
      invoice.advance_paid || 0,
      invoice.balance_due || 0,
      invoice.payment_status || '',
      invoice.payment_mode || '',
      invoice.due_date || '',
      pdfLink,
    ];

    // Append to sheet
    const sheetResult = await appendRowToGoogleSheet({
      sheetName,
      headers: INVOICE_SHEET_HEADERS,
      row,
    });

    const docType = invoice.doc_type === 'Quotation' ? 'Quotation' : 'Invoice';
    sendTelegramNotification(
      `💰 <b>${docType} Backup</b>\n` +
      `${docType === 'Quotation' ? 'Quote' : 'Invoice'}: ${invoice.invoice_no || 'N/A'}\n` +
      `Customer: ${invoice.customer_name || 'N/A'}\n` +
      `Amount: ₹${invoice.grand_total || 0}\n` +
      `Status: ${invoice.payment_status || 'N/A'}`
    );

    logAudit({
      action: 'backup',
      entity: 'invoice',
      entityId: invoice.invoice_no,
      details: { customer_name: invoice.customer_name, doc_type: invoice.doc_type, grand_total: invoice.grand_total },
      userId: req.user?.id,
    });

    return res.json({
      ok: true,
      drive: driveResult,
      sheet: sheetResult,
      pdfLink,
    });
  } catch (error) {
    console.error('Invoice backup failed:', getDeliveryErrorMessage(error));
    return res.status(502).json({ ok: false, error: getDeliveryErrorMessage(error) });
  }
});

app.get('/api/tickets/export', requireSupabaseUser, async (req, res) => {
  try {
    const token = req.get('authorization')?.startsWith('Bearer ') ? req.get('authorization').slice(7) : '';
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await supabase
      .from('service_tickets')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, count: data?.length || 0, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/export', requireSupabaseUser, async (req, res) => {
  try {
    const token = req.get('authorization')?.startsWith('Bearer ') ? req.get('authorization').slice(7) : '';
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, count: data?.length || 0, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── WhatsApp Notification ──────────────────────────────────────────────────

app.post('/api/notify/whatsapp', (req, res) => {
  const { phone, name, ticketNo, device, status } = req.body || {};
  if (!phone) return res.status(400).json({ error: 'phone is required' });

  const message = encodeURIComponent(
    `Hi ${name || 'Customer'},\nYour service ticket (${ticketNo || 'N/A'}) for ${device || 'your device'} is now: ${status || 'updated'}.\n- YantraByte Solutions`
  );
  const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`;

  return res.json({ ok: true, waUrl });
});

app.post('/api/notify/ticket-status-change', (req, res) => {
  const { ticketId, status, ticket_number, customer_name, customer_phone, device_type } = req.body || {};

  console.log('Ticket status change notification:', { ticketId, status, ticket_number, customer_name, customer_phone, device_type });

  const message = encodeURIComponent(
    `Hi ${customer_name || 'Customer'},\nYour service ticket (${ticket_number || 'N/A'}) for ${device_type || 'your device'} has been updated to: ${status || 'updated'}.\n- YantraByte Solutions`
  );
  const waUrl = `https://wa.me/${(customer_phone || '').replace(/[^0-9]/g, '')}?text=${message}`;

  return res.json({ ok: true, waUrl, logged: true });
});

// ─── SLA Tracking ──────────────────────────────────────────────────────────

app.get('/api/sla/check', requireSupabaseUser, async (req, res) => {
  try {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data: tickets, error } = await supabase
      .from('service_tickets')
      .select('*')
      .in('status', ['open', 'in-progress', 'in_progress'])
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const now = new Date();
    const slaHoursMap = { high: 24, medium: 72, low: 168 };

    const results = (tickets || []).map(ticket => {
      const priority = (ticket.priority || 'medium').toLowerCase();
      const sla = slaHoursMap[priority] || 72;
      const created = new Date(ticket.created_at);
      const hoursElapsed = (now - created) / (1000 * 60 * 60);
      const ratio = hoursElapsed / sla;

      let status;
      if (ratio >= 1) status = 'breached';
      else if (ratio >= 0.75) status = 'approaching';
      else status = 'ok';

      return {
        ticket_number: ticket.ticket_number,
        customer_name: ticket.customer_name,
        priority,
        created_at: ticket.created_at,
        sla_hours: sla,
        hours_elapsed: Math.round(hoursElapsed * 100) / 100,
        status,
      };
    }).filter(t => t.status !== 'ok');

    return res.json({ ok: true, count: results.length, results });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Invoice email API listening on port ${port}`);
});
