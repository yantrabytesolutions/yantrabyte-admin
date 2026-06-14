import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Readable } from 'stream';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = Number(process.env.INVOICE_API_PORT || process.env.PORT || 4000);
const maxPdfSize = process.env.INVOICE_MAX_JSON_SIZE || '15mb';

app.use(cors());
app.use(express.json({ limit: maxPdfSize }));

const requiredEnv = ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const driveEnv = ['GOOGLE_DRIVE_FOLDER_ID'];
const sheetsEnv = ['GOOGLE_SHEETS_SPREADSHEET_ID'];
const serviceTicketHeaders = [
  'Ticket No',
  'Created At',
  'Customer',
  'Phone',
  'Email',
  'Address',
  'Device / Service',
  'Issue',
  'Priority',
  'Status',
  'Assigned To',
  'Notes',
  'Link',
];

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
    ticket.ticket_number || '',
    ticket.created_at || new Date().toISOString(),
    ticket.customer_name || '',
    ticket.customer_phone || '',
    ticket.customer_email || '',
    ticket.customer_address || '',
    ticket.device_type || '',
    ticket.issue_description || '',
    ticket.priority || '',
    ticket.status || '',
    ticket.assigned_to || '',
    ticket.notes || '',
    ticket.ticket_number ? `https://yantrabyte.com/admin` : '',
  ];
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
  const missing = getMissingEnv();
  if (missing.length > 0) {
    return res.status(500).json({ error: `Missing server configuration: ${missing.join(', ')}` });
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

app.post('/api/backups/public-service-ticket', async (req, res) => {
  const ticket = req.body || {};
  if (!ticket.ticket_number || !ticket.customer_name || !ticket.customer_phone || !ticket.issue_description) {
    return res.status(400).json({ error: 'ticket_number, customer_name, customer_phone, and issue_description are required' });
  }

  let sheetResult = null;
  try {
    sheetResult = await appendRowToGoogleSheet({
      sheetName: 'Service Tickets',
      headers: serviceTicketHeaders,
      row: serviceTicketRowFromPayload(ticket),
    });
  } catch (error) {
    console.error('Public service ticket Google Sheets backup failed:', getDeliveryErrorMessage(error));
    return res.status(502).json({
      ok: false,
      skipped: false,
      error: getDeliveryErrorMessage(error),
    });
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

      mailResult = await transporter.sendMail({
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
          '⚠ IMPORTANT NOTICE:',
          'Customer must collect working or non-working materials within 2 months from the date given for service.',
          'After that, YantraByte Solutions will not be responsible for the items.',
          '',
          'Regards,',
          'YantraByte Solutions | 09986742525',
          '47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru 560097',
        ].join('\n'),
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
            <div style="background:#0B5394;padding:24px 32px;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:20px">YantraByte Solutions</h1>
              <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px">IT Service, Repair &amp; Network Management</p>
            </div>
            <div style="padding:28px 32px">
              <p style="color:#0f172a;font-size:15px">Dear <strong>${cleanCustomerName}</strong>,</p>
              <p style="color:#334155">Your service ticket has been successfully created.</p>

              <div style="text-align:center;margin:20px 0">
                <img src="https://yantrabyte.anantatechcare.com/seal.png" alt="YantraByte Official Seal" width="110" height="110" style="display:inline-block;border-radius:50%;object-fit:contain" />
              </div>

              <div style="background:#f8fafc;border-radius:6px;padding:16px;margin:16px 0;border-left:4px solid #0B5394;text-align:center">
                <p style="margin:0 0 6px;color:#64748b;font-size:13px">Ticket Number</p>
                <p style="margin:0;font-size:22px;font-weight:700;color:#0B5394;letter-spacing:2px">${cleanTicketNumber}</p>
              </div>

              <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
                <tr><td style="padding:6px 0;color:#64748b;width:40%">Device</td><td style="color:#0f172a;font-weight:600">${cleanDeviceType}</td></tr>
                <tr><td style="padding:6px 0;color:#64748b">Issue Reported</td><td style="color:#0f172a">${ticket.issue_description}</td></tr>
              </table>

              <p style="color:#334155">Our team is reviewing your issue and will contact you shortly.</p>

              <div style="background:#fffbeb;border:1px solid #fcd34d;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 16px;margin:20px 0">
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e">⚠ Important Notice</p>
                <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6">
                  Customer must collect working or non-working materials within <strong>2 months</strong> from the date given for service.
                  After that, <strong>YantraByte Solutions will not be responsible for the items</strong>.
                </p>
              </div>

              <p style="color:#334155;margin-top:24px">Regards,<br/><strong>YantraByte Solutions</strong><br/>
                <a href="tel:09986742525" style="color:#0B5394">09986742525</a> |
                47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru 560097
              </p>
            </div>
            <div style="text-align:center;padding:16px;background:#f8fafc;font-size:12px;color:#94a3b8">
              This is an automated confirmation. Please keep your ticket number for follow-up.
            </div>
          </div>
        `,
      });

    } catch (error) {
      console.error('Service ticket email failed:', getDeliveryErrorMessage(error));
    }
  }

  return res.json({
    ok: true,
    sheet: sheetResult,
    email: mailResult ? { ok: true, messageId: mailResult.messageId } : { ok: false, skipped: true }
  });
});

app.post('/api/invoices/email', requireSupabaseUser, async (req, res) => {
  const {
    to,
    customerName,
    invoiceNumber,
    documentType = 'Invoice',
    filename,
    pdfBase64,
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
        <p>Dear ${cleanCustomerName},</p>
        <p>Please find attached your ${cleanDocumentType.toLowerCase()} <strong>${cleanInvoiceNumber}</strong>.</p>
        <p>Regards,<br/>YantraByte Solutions</p>
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

  if (mailError) {
    return res.status(502).json({
      error: `Gmail send failed: ${getDeliveryErrorMessage(mailError)}`,
      email: { ok: false },
    });
  }

  return res.json({
    ok: true,
    email: { ok: true, messageId: mailResult.messageId },
  });
});

app.post('/api/invoices/reminders', requireSupabaseUser, async (req, res) => {
  const { clients } = req.body || {};

  if (!Array.isArray(clients)) {
    return res.status(400).json({ error: 'clients array is required' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const results = [];

  for (const client of clients) {
    if (!client.customer_email || !isValidEmail(client.customer_email)) {
      results.push({ name: client.customer_name, ok: false, error: 'Invalid or missing email' });
      continue;
    }

    try {
      await transporter.sendMail({
        from: `"YantraByte Solutions" <${process.env.GMAIL_USER}>`,
        to: client.customer_email,
        replyTo: process.env.GMAIL_REPLY_TO || process.env.GMAIL_USER,
        subject: `Payment Reminder: Outstanding Dues - YantraByte Solutions`,
        text: [
          `Dear ${client.customer_name || 'Customer'},`,
          '',
          `This is a friendly reminder that you have an outstanding balance of ₹${(client.balance_due || 0).toLocaleString('en-IN')}.`,
          `This balance is associated with the following invoice(s): ${client.invoices.join(', ')}.`,
          '',
          'Kindly clear the balance at your earliest convenience via our UPI ID: s0424237152@slc or our bank account details.',
          '',
          'If you have already made the payment, please ignore this email.',
          '',
          'Regards,',
          'YantraByte Solutions',
        ].join('\n'),
        html: `
          <p>Dear ${client.customer_name || 'Customer'},</p>
          <p>This is a friendly reminder that you have an outstanding balance of <strong>₹${(client.balance_due || 0).toLocaleString('en-IN')}</strong>.</p>
          <p>This balance is associated with the following invoice(s): ${client.invoices.join(', ')}.</p>
          <p>Kindly clear the balance at your earliest convenience via our UPI ID: <strong>s0424237152@slc</strong> or our bank account details.</p>
          <p>If you have already made the payment, please ignore this email.</p>
          <p>Regards,<br/>YantraByte Solutions</p>
        `,
      });
      results.push({ name: client.customer_name, ok: true });
    } catch (error) {
      console.error(`Reminder email failed for ${client.customer_email}:`, getDeliveryErrorMessage(error));
      results.push({ name: client.customer_name, ok: false, error: getDeliveryErrorMessage(error) });
    }
  }

  return res.json({ ok: true, results });
});

app.listen(port, () => {
  console.log(`Invoice email API listening on port ${port}`);
});
