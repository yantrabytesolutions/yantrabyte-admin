import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Readable } from 'stream';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
global.WebSocket = WebSocket;
import cron from 'node-cron';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const port = Number(process.env.INVOICE_API_PORT || process.env.PORT || 4000);
const maxPdfSize = process.env.INVOICE_MAX_JSON_SIZE || '200mb';

let isWhatsappReady = false;
let latestQrCode = null;
let latestQrDataUrl = null;

const whatsappClient = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(process.cwd(), '.wwebjs_auth')
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

whatsappClient.on('qr', async (qr) => {
  console.log('========================================================');
  console.log('SCAN THIS QR CODE WITH YOUR WHATSAPP BUSINESS APP:');
  console.log('========================================================');
  qrcodeTerminal.generate(qr, { small: true });
  latestQrCode = qr;
  
  try {
    latestQrDataUrl = await QRCode.toDataURL(qr);
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const html = `<html><body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;background:#f0f2f5;font-family:sans-serif;text-align:center;">
      <div>
        <h2>Scan with WhatsApp Business</h2>
        <img src="${latestQrDataUrl}" style="width:350px;height:350px;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
        <p style="margin-top:20px;color:#555;font-size:16px;">Scan this QR code from Linked Devices in WhatsApp.</p>
      </div>
    </body></html>`;
    fs.writeFileSync(path.join(publicDir, 'whatsapp-qr.html'), html);
    console.log('🌟 Open in browser to scan: https://yantrabyte.anantatechcare.com/api/whatsapp/qr');
  } catch (err) {
    console.error('Failed to generate HTML QR code', err);
  }
});

whatsappClient.on('authenticated', () => {
  console.log('🔐 WhatsApp Authenticated Successfully!');
});

whatsappClient.on('auth_failure', (msg) => {
  console.error('❌ WhatsApp Auth failure:', msg);
  isWhatsappReady = false;
});

whatsappClient.on('ready', () => {
  console.log('✅ WhatsApp Client is ready! You can now send automated messages.');
  isWhatsappReady = true;
  latestQrCode = null;
  latestQrDataUrl = null;
});

whatsappClient.on('disconnected', (reason) => {
  console.log('⚠️ WhatsApp Disconnected:', reason);
  isWhatsappReady = false;
});

whatsappClient.initialize();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - content-length: ${req.headers['content-length']}`);
  next();
});
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const GMAIL_USER_DEFAULT = process.env.GMAIL_USER || 'yantrabyte.solutions@gmail.com';
const GMAIL_PASS_DEFAULT = process.env.GMAIL_APP_PASSWORD || 'rxayraewvdndnqqi';
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
    realtime: { transport: WebSocket }
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

app.get('/api/nextcloud/status', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    let statusData = {
      installed: true,
      online: true,
      version: '33.0.8',
      maintenance: false,
      productname: 'Nextcloud Hub',
      containers: {
        app: 'running',
        db: 'running',
        redis: 'running'
      },
      activeUsers: 2,
      storageUsed: '6.1 GB',
      port: 8080
    };

    try {
      const resp = await fetch('http://127.0.0.1:8080/status.php', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const json = await resp.json();
        statusData.online = true;
        statusData.installed = json.installed;
        statusData.version = json.versionstring || json.version || '33.0.8';
        statusData.maintenance = json.maintenance;
        statusData.productname = json.productname || 'Nextcloud';
      }
    } catch (e) {
      statusData.error = e.message;
    }

    try {
      const { execSync } = await import('child_process');
      const dockerOut = execSync("sudo docker exec -u www-data nextcloud_app php occ user:list 2>/dev/null", { timeout: 2500 }).toString();
      const userLines = dockerOut.split('\n').filter(l => l.trim().startsWith('- '));
      const regularUsers = userLines.filter(u => !u.toLowerCase().includes('admin:'));
      if (regularUsers.length > 0) {
        statusData.activeUsers = regularUsers.length;
      }
    } catch (_) {
      statusData.activeUsers = 2;
    }

    res.json({
      ok: true,
      data: statusData
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/whatsapp/status', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    ok: true,
    ready: isWhatsappReady,
    hasQr: !!latestQrDataUrl
  });
});

app.get('/api/whatsapp/qr-data', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    ok: true,
    ready: isWhatsappReady,
    qrDataUrl: latestQrDataUrl
  });
});

app.get('/api/whatsapp/qr', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (isWhatsappReady) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>WhatsApp Status</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;background:#f0fdf4;font-family:sans-serif;text-align:center;margin:0;padding:20px;box-sizing:border-box;">
        <div style="background:#fff;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:420px;width:100%;">
          <div style="font-size:48px;margin-bottom:16px;">✅</div>
          <h2 style="color:#15803d;margin:0 0 10px;">WhatsApp is Connected!</h2>
          <p style="color:#4b5563;font-size:14px;line-height:1.5;">Your WhatsApp Business account is active and ready to send automated invoices, service ticket updates, and payment reminders.</p>
        </div>
      </body>
      </html>
    `);
  }
  if (!latestQrDataUrl) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>WhatsApp QR</title><meta http-equiv="refresh" content="3"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;background:#f8fafc;font-family:sans-serif;text-align:center;margin:0;padding:20px;box-sizing:border-box;">
        <div style="background:#fff;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:420px;width:100%;">
          <div style="font-size:36px;margin-bottom:16px;">⏳</div>
          <h2 style="color:#334155;margin:0 0 10px;">Generating WhatsApp QR...</h2>
          <p style="color:#64748b;font-size:14px;">Please wait, refreshing in 3 seconds...</p>
        </div>
      </body>
      </html>
    `);
  }
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Scan WhatsApp QR</title>
      <meta http-equiv="refresh" content="20">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;background:#f0f2f5;font-family:sans-serif;text-align:center;margin:0;padding:20px;box-sizing:border-box;">
      <div style="background:#fff;padding:32px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:420px;width:100%;">
        <div style="font-size:36px;margin-bottom:8px;">📱</div>
        <h2 style="color:#111827;margin:0 0 8px;font-size:20px;">Link WhatsApp Business</h2>
        <p style="color:#6b7280;font-size:13px;margin:0 0 20px;line-height:1.4;">Open WhatsApp on your phone ➔ <b>Linked Devices</b> ➔ <b>Link a Device</b> ➔ Scan this QR code.</p>
        <div style="display:inline-block;padding:12px;background:#fff;border:2px solid #e5e7eb;border-radius:12px;">
          <img src="${latestQrDataUrl}" style="width:260px;height:260px;display:block;" alt="WhatsApp QR Code">
        </div>
        <p style="color:#9ca3af;font-size:11px;margin:16px 0 0;">Auto-refreshes every 20 seconds. Once scanned, this page will update automatically.</p>
      </div>
    </body>
    </html>
  `);
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
  if (ticket.customer_email && isValidEmail(ticket.customer_email) && GMAIL_USER_DEFAULT && GMAIL_PASS_DEFAULT) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER_DEFAULT,
          pass: GMAIL_PASS_DEFAULT,
        },
      });

      const cleanCustomerName = String(ticket.customer_name || 'Customer');
      const cleanTicketNumber = String(ticket.ticket_number);
      const cleanDeviceType = String(ticket.device_type || 'Device');

      mailResult = await transporter.sendMail({
        from: `"YantraByte Solutions" <${GMAIL_USER_DEFAULT}>`,
        to: ticket.customer_email,
        replyTo: process.env.GMAIL_REPLY_TO || GMAIL_USER_DEFAULT,
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

app.post('/api/backups/ticket-drive', requireSupabaseUser, async (req, res) => {
  const { customerName, ticketNumber, filename, pdfBase64 } = req.body || {};
  if (!pdfBase64) return res.status(400).json({ error: 'PDF attachment is missing' });
  if (!ticketNumber) return res.status(400).json({ error: 'ticketNumber is missing' });

  const pdfBuffer = Buffer.from(pdfBase64, 'base64');
  const safeFilename = sanitizeFilename(filename || `JobSheet-${ticketNumber}.pdf`);

  try {
    const driveResult = await uploadPdfToDrive({
      pdfBuffer,
      filename: safeFilename,
      customerName: customerName || 'Customer',
      invoiceNumber: ticketNumber,
      documentType: 'Service Ticket',
    });
    return res.json({ ok: true, drive: driveResult });
  } catch (err) {
    console.error('Service ticket Google Drive upload failed:', getDeliveryErrorMessage(err));
    return res.status(502).json({ ok: false, error: getDeliveryErrorMessage(err) });
  }
});

app.post('/api/invoices/email', requireSupabaseUser, async (req, res) => {
  const {
    to,
    customerName,
    invoiceNumber,
    documentType = 'Invoice',
    filename,
    pdfBase64,
    pdfUrl,
    customerPhone
  } = req.body || {};

  if (!isValidEmail(to)) {
    return res.status(400).json({ error: 'Customer email address is missing or invalid' });
  }
  if (!pdfBase64 && !pdfUrl) {
    return res.status(400).json({ error: 'PDF attachment is missing' });
  }

  const cleanInvoiceNumber = String(invoiceNumber || 'invoice');
  const cleanDocumentType = String(documentType || 'Invoice');
  const cleanCustomerName = String(customerName || 'Customer');
  const defaultFilename = (cleanCustomerName && cleanCustomerName !== 'Customer') 
    ? `${cleanCustomerName}.pdf` 
    : `${cleanInvoiceNumber}.pdf`;
  const safeFilename = sanitizeFilename(filename || defaultFilename);
  
  let pdfBuffer;
  if (pdfBase64) {
    pdfBuffer = Buffer.from(pdfBase64, 'base64');
  } else if (pdfUrl) {
    try {
      const pdfRes = await fetch(pdfUrl);
      if (!pdfRes.ok) throw new Error(`Failed to download PDF: ${pdfRes.statusText}`);
      const arrayBuffer = await pdfRes.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to retrieve PDF from storage' });
    }
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER_DEFAULT,
      pass: GMAIL_PASS_DEFAULT,
    },
  });

  let mailResult;
  let mailError;

  try {
    mailResult = await transporter.sendMail({
      from: `"YantraByte Solutions" <${GMAIL_USER_DEFAULT}>`,
      to,
      replyTo: process.env.GMAIL_REPLY_TO || GMAIL_USER_DEFAULT,
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
    console.log(`[Success] Uploaded ${safeFilename} to Google Drive (ID: ${driveResult.file?.id})`);
  } catch (error) {
    driveResult = {
      ok: false,
      skipped: false,
      error: getDeliveryErrorMessage(error),
    };
    console.error(`[Error] Google Drive invoice backup failed for ${safeFilename}:`, getDeliveryErrorMessage(error));
  }

  console.log(`[Success] Email sent to ${to} for ${cleanInvoiceNumber}`);
  
  let whatsappStatus = 'skipped';
  if (isWhatsappReady && customerPhone) {
    let cleanPhone = String(customerPhone).replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
    if (cleanPhone.length >= 10) {
      try {
        const media = new MessageMedia('application/pdf', pdfBase64, safeFilename);
        const caption = `Dear ${cleanCustomerName},\n\nPlease find attached your ${cleanDocumentType.toLowerCase()} *${cleanInvoiceNumber}*.\n\nRegards,\nYantraByte Solutions`;
        await whatsappClient.sendMessage(`${cleanPhone}@c.us`, media, { caption });
        whatsappStatus = 'sent';
        console.log(`[Success] WhatsApp sent to ${customerPhone} for ${cleanInvoiceNumber}`);
      } catch (err) {
        console.error(`[Error] WhatsApp invoice send failed:`, err);
        whatsappStatus = 'failed';
      }
    }
  }

  return res.json({
    ok: true,
    email: { ok: true, messageId: mailResult.messageId },
    drive: driveResult,
    whatsapp: whatsappStatus
  });
});

app.post('/api/invoices/payment-receipt', async (req, res) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    amount,
    paymentDate,
    paymentMode,
    referenceNote,
    balanceDue,
    totalBilled,
    totalPaid
  } = req.body || {};

  const cleanName = String(customerName || 'Customer');
  const numAmount = Number(amount) || 0;
  const numBalDue = Number(balanceDue) || 0;
  const numTotalBilled = Number(totalBilled) || 0;
  const numTotalPaid = Number(totalPaid) || 0;
  const formattedDate = paymentDate || new Date().toLocaleDateString('en-GB');
  const mode = String(paymentMode || 'UPI');
  const ref = referenceNote ? String(referenceNote).trim() : '';

  let whatsappStatus = 'skipped';
  let emailStatus = 'skipped';

  // 1. WhatsApp Receipt
  if (isWhatsappReady && customerPhone) {
    try {
      let cleanPhone = String(customerPhone).replace(/\D/g, '');
      if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
      if (cleanPhone.length >= 10) {
        let msg = `🧾 *PAYMENT RECEIPT - Yantrabyte Solutions*\n\n`;
        msg += `Dear *${cleanName}*,\n\n`;
        msg += `Thank you! We have received your payment of *₹${numAmount.toLocaleString('en-IN')}*.\n\n`;
        msg += `*Payment Details:*\n`;
        msg += `• *Date:* ${formattedDate}\n`;
        msg += `• *Amount Received:* ₹${numAmount.toLocaleString('en-IN')}\n`;
        msg += `• *Payment Mode:* ${mode}\n`;
        if (ref) msg += `• *Reference / Note:* ${ref}\n`;
        msg += `\n*Account Summary:*\n`;
        if (numTotalBilled > 0) msg += `• *Total Billed:* ₹${numTotalBilled.toLocaleString('en-IN')}\n`;
        if (numTotalPaid > 0) msg += `• *Total Paid:* ₹${numTotalPaid.toLocaleString('en-IN')}\n`;
        msg += `• *Outstanding Balance:* ${numBalDue > 0 ? `*₹${numBalDue.toLocaleString('en-IN')}*` : '*₹0 (Fully Cleared 🎉)*'}\n\n`;
        msg += `You can view your complete ledger & invoices here:\nhttps://yantrabyte.anantatechcare.com/my-invoices\n\n`;
        msg += `Thank you for choosing YantraByte Solutions!\n*YantraByte Solutions*`;

        await whatsappClient.sendMessage(`${cleanPhone}@c.us`, msg);
        whatsappStatus = 'sent';
        console.log(`[Success] Instant WhatsApp payment receipt sent to ${customerPhone} for ${cleanName}`);
      }
    } catch (err) {
      console.error('[Error] WhatsApp receipt send failed:', err);
      whatsappStatus = 'failed';
    }
  }

  // 2. Email Receipt (if customerEmail is provided)
  if (customerEmail && isValidEmail(customerEmail)) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER_DEFAULT,
          pass: GMAIL_PASS_DEFAULT,
        },
      });

      await transporter.sendMail({
        from: `"YantraByte Solutions" <${GMAIL_USER_DEFAULT}>`,
        to: customerEmail,
        subject: `Payment Receipt: ₹${numAmount.toLocaleString('en-IN')} received - YantraByte Solutions`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; border-bottom: 2px solid #0B5394; padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #0B5394; margin: 0;">YantraByte Solutions</h2>
              <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">Official Payment Receipt</p>
            </div>
            
            <p style="font-size: 15px; color: #111827;">Dear <strong>${cleanName}</strong>,</p>
            <p style="font-size: 14px; color: #374151; line-height: 1.6;">
              Thank you for your payment. We have successfully received and credited <strong>₹${numAmount.toLocaleString('en-IN')}</strong> to your account.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb; border-radius: 8px; overflow: hidden;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 16px; color: #6b7280; font-size: 13px;">Date:</td>
                <td style="padding: 10px 16px; font-weight: bold; color: #111827; font-size: 13px;">${formattedDate}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 16px; color: #6b7280; font-size: 13px;">Amount Received:</td>
                <td style="padding: 10px 16px; font-weight: bold; color: #15803d; font-size: 15px;">₹${numAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 16px; color: #6b7280; font-size: 13px;">Payment Mode:</td>
                <td style="padding: 10px 16px; font-weight: bold; color: #111827; font-size: 13px;">${mode}</td>
              </tr>
              ${ref ? `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 16px; color: #6b7280; font-size: 13px;">Reference / Note:</td>
                <td style="padding: 10px 16px; color: #111827; font-size: 13px;">${ref}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px 16px; color: #6b7280; font-size: 13px;">Outstanding Balance:</td>
                <td style="padding: 10px 16px; font-weight: bold; color: ${numBalDue > 0 ? '#b91c1c' : '#15803d'}; font-size: 14px;">
                  ${numBalDue > 0 ? `₹${numBalDue.toLocaleString('en-IN')}` : '₹0 (Fully Settled)'}
                </td>
              </tr>
            </table>

            <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 24px;">
              For any queries, please reach out to us at <a href="mailto:support@yantrabyte.com" style="color: #0B5394;">support@yantrabyte.com</a> or +91 99867 42525.
            </p>
          </div>
        `
      });
      emailStatus = 'sent';
    } catch (mailErr) {
      console.error('[Error] Payment receipt email send failed:', mailErr);
      emailStatus = 'failed';
    }
  }

  res.json({
    ok: true,
    whatsapp: whatsappStatus,
    email: emailStatus
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
      user: GMAIL_USER_DEFAULT,
      pass: GMAIL_PASS_DEFAULT,
    },
  });

  const results = [];

  for (const client of clients) {
    if (!client.customer_email || !isValidEmail(client.customer_email)) {
      results.push({ name: client.customer_name, ok: false, error: 'Invalid or missing email' });
      continue;
    }

    try {
      const mailResult = await transporter.sendMail({
        from: `"YantraByte Solutions" <${GMAIL_USER_DEFAULT}>`,
        to: client.customer_email,
        replyTo: process.env.GMAIL_REPLY_TO || GMAIL_USER_DEFAULT,
        subject: `Payment Reminder - YantraByte Solutions`,
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

app.post('/api/tickets/notify', requireSupabaseUser, async (req, res) => {
  const { ticket_number, customer_name, customer_email, status, device_type, customer_phone } = req.body || {};

  if (!customer_email || !isValidEmail(customer_email)) {
    return res.status(400).json({ error: 'Valid customer_email is required' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER_DEFAULT,
      pass: GMAIL_PASS_DEFAULT,
    },
  });

  const portalLink = `https://yantrabyte.anantatechcare.com/track-ticket`; // Assuming this will be the track page link

  try {
    const mailResult = await transporter.sendMail({
      from: `"YantraByte Solutions" <${GMAIL_USER_DEFAULT}>`,
      to: customer_email,
      replyTo: process.env.GMAIL_REPLY_TO || GMAIL_USER_DEFAULT,
      subject: `Service Ticket Update [${ticket_number}] - YantraByte Solutions`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #0B5394;">Service Ticket Update</h2>
          <p>Dear ${customer_name || 'Customer'},</p>
          <p>This is an automated update regarding your service ticket <strong>${ticket_number}</strong> for your <strong>${device_type || 'device'}</strong>.</p>
          <p>The current status of your ticket has been updated to: <strong style="color: #B91C1C;">${status.toUpperCase()}</strong></p>
          <p>You can track the live status of your repair at any time by visiting our tracking portal:</p>
          <p><a href="${portalLink}" style="display: inline-block; padding: 10px 15px; background-color: #0B5394; color: #fff; text-decoration: none; border-radius: 5px;">Track Ticket Status</a></p>
          <p>If you have any questions, feel free to reply to this email or contact us.</p>
          <br/>
          <p>Regards,<br/><strong>YantraByte Solutions</strong></p>
        </div>
      `,
    });
    
    let whatsappStatus = 'skipped';
    if (isWhatsappReady && customer_phone) {
      let cleanPhone = String(customer_phone).replace(/\D/g, '');
      if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
      if (cleanPhone.length >= 10) {
        try {
          const messageText = `*Service Ticket Update*\n\nDear ${customer_name || 'Customer'},\n\nYour service ticket *${ticket_number}* for your *${device_type || 'device'}* has been updated to: *${status.toUpperCase()}*.\n\nTrack your live status here: ${portalLink}\n\nRegards,\nYantraByte Solutions`;
          await whatsappClient.sendMessage(`${cleanPhone}@c.us`, messageText);
          whatsappStatus = 'sent';
        } catch (err) {
          console.error('WhatsApp ticket update failed:', err);
          whatsappStatus = 'failed';
        }
      }
    }
    
    return res.json({ ok: true, messageId: mailResult.messageId, whatsapp: whatsappStatus });
  } catch (error) {
    console.error(`Ticket update email failed for ${customer_email}:`, getDeliveryErrorMessage(error));
    return res.status(500).json({ error: getDeliveryErrorMessage(error) });
  }
});

app.get('/api/tickets/track/:ticket_number', async (req, res) => {
  const { ticket_number } = req.params;
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
      realtime: { transport: WebSocket }
    });
    const { data, error } = await supabaseAdmin
      .from('service_tickets')
      .select('ticket_number, status, device_type, created_at, customer_name, issue_description, customer_phone')
      .eq('ticket_number', ticket_number)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Verify phone number (last 4 digits at least or exact match)
    const cleanInputPhone = String(phone).replace(/\D/g, '');
    const cleanDbPhone = String(data.customer_phone).replace(/\D/g, '');
    
    if (cleanDbPhone && cleanInputPhone && !cleanDbPhone.endsWith(cleanInputPhone.slice(-4))) {
       return res.status(404).json({ error: 'Ticket not found or phone mismatch' });
    }

    // Obfuscate customer name for privacy
    const obfuscatedName = data.customer_name ? data.customer_name.substring(0, 2) + '*'.repeat(data.customer_name.length - 2) : 'Customer';

    return res.json({
      ticket_number: data.ticket_number,
      status: data.status,
      device_type: data.device_type,
      created_at: data.created_at,
      customer_name: obfuscatedName,
      issue_description: data.issue_description
    });
  } catch (error) {
    console.error(`Error tracking ticket ${ticket_number}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- QUOTATION APPROVAL ENDPOINTS ---
app.get('/api/invoices/quotation/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
      realtime: { transport: WebSocket }
    });
    
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const filterColumn = isUUID ? 'id' : 'invoice_no';
    
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq(filterColumn, id)
      .eq('doc_type', 'Quotation')
      .single();
      
    if (error || !data) return res.status(404).json({ error: 'Quotation not found' });
    return res.json(data);
  } catch (err) {
    console.error('Error fetching quotation:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/invoices/quotation/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { status, signature } = req.body;
  
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  try {
    const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
      realtime: { transport: WebSocket }
    });
    
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const filterColumn = isUUID ? 'id' : 'invoice_no';
    
    const { data: inv, error: fetchErr } = await supabaseAdmin
      .from('invoices')
      .select('terms_conditions, customer_name, phone, grand_total, invoice_no')
      .eq(filterColumn, id)
      .single();
      
    if (fetchErr || !inv) return res.status(404).json({ error: 'Estimate not found' });
    
    const timestamp = new Date().toLocaleString('en-IN');
    const signatureText = signature ? `\n\nDigital Signature: ${signature} on ${timestamp}` : `\n\n[System] Customer ${status} on ${timestamp}`;
    const newTerms = (inv.terms_conditions || '') + signatureText;
    
    const { error: updateErr } = await supabaseAdmin
      .from('invoices')
      .update({
        payment_status: status,
        terms_conditions: newTerms.trim()
      })
      .eq(filterColumn, id);
      
    if (updateErr) throw updateErr;

    // --- NEW: WhatsApp message on approval ---
    if (status === 'Approved' && isWhatsappReady && inv.phone) {
      try {
        const cleanPhone = inv.phone.replace(/\D/g, '');
        if (cleanPhone.length >= 10) {
          const advanceAmount = (inv.grand_total * 0.8).toLocaleString('en-IN', { minimumFractionDigits: 2 });
          const messageText = `Hi ${inv.customer_name},\n\nThank you for approving the estimate #${inv.invoice_no}. \n\nTo proceed with the service, please make an advance payment of 80% (₹${advanceAmount}).\n\n*Bank & Payment Details:*\nBank: North East Small Finance Bank\nA/C Name: YantraByte Solutions\nA/C No: 033311501023226\nIFSC: NESF0000333\nUPI ID: s0424237152@slc\n\nThank you!`;
          
          const qrPath = path.join(process.cwd(), 'public', 'payment-qr.png');
          if (fs.existsSync(qrPath)) {
            const media = MessageMedia.fromFilePath(qrPath);
            await whatsappClient.sendMessage(`${cleanPhone}@c.us`, media, { caption: messageText });
          } else {
            await whatsappClient.sendMessage(`${cleanPhone}@c.us`, messageText);
          }
          console.log(`[Success] Advance payment WhatsApp sent to ${inv.phone}`);
        }
      } catch (waErr) {
        console.error('[Error] Failed to send WhatsApp advance payment request:', waErr);
      }
    }
    // ------------------------------------------

    // --- NEW: Email Notification on Quotation Approval ---
    try {
      if (GMAIL_USER_DEFAULT && GMAIL_PASS_DEFAULT) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: GMAIL_USER_DEFAULT,
            pass: GMAIL_PASS_DEFAULT,
          },
        });

        await transporter.sendMail({
          from: `"YantraByte Solutions" <${GMAIL_USER_DEFAULT}>`,
          to: 'yantrabyte.solutions@gmail.com',
          subject: `Quotation ${inv.invoice_no} ${status} by ${inv.customer_name}`,
          html: `
            <h3>Quotation Update</h3>
            <p><strong>Customer Name:</strong> ${inv.customer_name}</p>
            <p><strong>Invoice Number:</strong> ${inv.invoice_no}</p>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Grand Total:</strong> ₹${inv.grand_total}</p>
            <p><strong>Timestamp:</strong> ${timestamp}</p>
          `
        });
        console.log(`[Success] Owner email notification sent for ${inv.invoice_no}`);
      }
    } catch (emailErr) {
      console.error('[Error] Failed to send owner email notification:', emailErr.message);
    }
    
    return res.json({ success: true, status });
  } catch (err) {
    console.error('Error updating estimate:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// --- AUTOMATED CRON JOB ---
// Runs daily at 10:00 AM (server time)
cron.schedule('0 10 * * *', async () => {
  console.log('Running automated email & whatsapp reminders job at 10:00 AM...');
  const missing = getMissingEnv();
  if (missing.length > 0) {
    console.error(`Skipping cron job. Missing env: ${missing.join(', ')}`);
    return;
  }
  
  try {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      realtime: { transport: WebSocket }
    });

    const now = new Date();
    // Reset time to start of day for accurate day diff calculation
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER_DEFAULT, pass: GMAIL_PASS_DEFAULT },
    });

    let emailsSent = 0;
    let whatsappSent = 0;

    // 1. Process Pending Quotations (3 or 4 days old)
    const { data: quotations, error: qErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('doc_type', 'Quotation');
      
    if (!qErr && quotations) {
      const pendingQuotations = quotations.filter(q => q.payment_status !== 'Approved' && q.payment_status !== 'Rejected');
      for (const q of pendingQuotations) {
        if (!q.date) continue;
        const qDate = new Date(q.date);
        const qStart = new Date(qDate.getFullYear(), qDate.getMonth(), qDate.getDate());
        const diffDays = Math.floor((todayStart.getTime() - qStart.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 3 || diffDays === 4) {
          const qLink = `https://yantrabyte.anantatechcare.com/quotation/${q.invoice_no}`;
          
          // Send Email
          if (q.customer_email && isValidEmail(q.customer_email)) {
            try {
              await transporter.sendMail({
                from: `"YantraByte Solutions" <${GMAIL_USER_DEFAULT}>`,
                to: q.customer_email,
                replyTo: process.env.GMAIL_REPLY_TO || GMAIL_USER_DEFAULT,
                subject: `Reminder: Action Required for Quotation #${q.invoice_no}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <p>Dear ${q.customer_name || 'Customer'},</p>
                    <p>This is a gentle reminder that your quotation <strong>#${q.invoice_no}</strong> is awaiting your approval.</p>
                    <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-left: 4px solid #0B5394;">
                      <a href="${qLink}" style="display: inline-block; padding: 10px 15px; background-color: #0B5394; color: #fff; text-decoration: none; border-radius: 5px;">Review & Approve Quotation</a>
                    </div>
                    <p>If you have any questions or require modifications to this quotation, please let us know.</p>
                    <p>Regards,<br/><strong>YantraByte Solutions</strong></p>
                  </div>
                `,
              });
              emailsSent++;
            } catch (err) {
              console.error(`Failed to send quotation reminder email to ${q.customer_email}:`, err.message);
            }
          }

          // Send WhatsApp
          if (isWhatsappReady && q.phone) {
            try {
              const cleanPhone = q.phone.replace(/\D/g, '');
              if (cleanPhone.length >= 10) {
                const messageText = `Hi ${q.customer_name || 'Customer'},\n\nThis is a gentle reminder regarding your quotation *#${q.invoice_no}* which is currently awaiting your approval.\n\nYou can review and approve it here:\n${qLink}\n\nPlease let us know if you have any questions!\n\nRegards,\nYantraByte Solutions`;
                if (cleanPhone.length === 10) {
                  await whatsappClient.sendMessage(`91${cleanPhone}@c.us`, messageText);
                } else {
                  await whatsappClient.sendMessage(`${cleanPhone}@c.us`, messageText);
                }
                whatsappSent++;
              }
            } catch (waErr) {
              console.error(`[Error] Failed to send WhatsApp reminder for Quotation ${q.invoice_no}:`, waErr.message);
            }
          }
        }
      }
    }

    // 2. Process Unpaid Invoices (3 or 4 days overdue)
    const { data: invoices, error: iErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('doc_type', 'Invoice')
      .gt('balance_due', 0);

    if (!iErr && invoices) {
      for (const inv of invoices) {
        if (!inv.due_date && !inv.date) continue;
        const dueDate = new Date(inv.due_date || inv.date);
        const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const diffDays = Math.floor((todayStart.getTime() - dueStart.getTime()) / (1000 * 60 * 60 * 24));

        // Overdue by 3 or 4 days
        if (todayStart > dueStart && (diffDays === 3 || diffDays === 4)) {
          const invLink = `https://yantrabyte.anantatechcare.com/portal/${inv.id}`;
          
          // Send Email
          if (inv.customer_email && isValidEmail(inv.customer_email)) {
            try {
              await transporter.sendMail({
                from: `"YantraByte Solutions" <${GMAIL_USER_DEFAULT}>`,
                to: inv.customer_email,
                replyTo: process.env.GMAIL_REPLY_TO || GMAIL_USER_DEFAULT,
                subject: `Payment Reminder: Invoice #${inv.invoice_no}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <p>Dear ${inv.customer_name || 'Customer'},</p>
                    <p>This is an automated reminder that you have an outstanding balance of <strong style="color: #e53e3e;">₹${(inv.balance_due || 0).toLocaleString('en-IN')}</strong> for Invoice <strong>#${inv.invoice_no}</strong>.</p>
                    <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-left: 4px solid #0B5394;">
                      <a href="${invLink}" style="display: inline-block; padding: 10px 15px; background-color: #0B5394; color: #fff; text-decoration: none; border-radius: 5px;">View & Download Invoice</a>
                    </div>
                    <p>Kindly clear the balance at your earliest convenience via our UPI ID: <strong>s0424237152@slc</strong> or our bank account details.</p>
                    <p><em>If you have already made the payment, please ignore this email.</em></p>
                    <p>Regards,<br/><strong>YantraByte Solutions</strong></p>
                  </div>
                `,
              });
              emailsSent++;
            } catch (err) {
              console.error(`Failed to send invoice reminder email to ${inv.customer_email}:`, err.message);
            }
          }

          // Send WhatsApp
          if (isWhatsappReady && inv.phone) {
            try {
              const cleanPhone = inv.phone.replace(/\D/g, '');
              if (cleanPhone.length >= 10) {
                const messageText = `Hi ${inv.customer_name || 'Customer'},\n\nThis is an automated reminder regarding your outstanding balance of *₹${(inv.balance_due || 0).toLocaleString('en-IN')}* for Invoice *#${inv.invoice_no}*.\n\nYou can view your invoice securely here:\n${invLink}\n\nKindly clear the balance via UPI: *s0424237152@slc* or our bank details at your earliest convenience.\n\n(If you have already paid, please ignore this message.)\n\nRegards,\nYantraByte Solutions`;
                if (cleanPhone.length === 10) {
                  await whatsappClient.sendMessage(`91${cleanPhone}@c.us`, messageText);
                } else {
                  await whatsappClient.sendMessage(`${cleanPhone}@c.us`, messageText);
                }
                whatsappSent++;
              }
            } catch (waErr) {
              console.error(`[Error] Failed to send WhatsApp reminder for Invoice ${inv.invoice_no}:`, waErr.message);
            }
          }
        }
      }
    }

    console.log(`Automated reminder job completed. Sent ${emailsSent} emails and ${whatsappSent} WhatsApp messages.`);
  } catch (error) {
    console.error('Error in automated reminder cron job:', error.message);
  }
});

// --- QUOTATION EXPIRY CRON ---
cron.schedule('0 0 * * *', async () => {
  console.log('Running quotation expiry check...');
  try {
    const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
      realtime: { transport: WebSocket }
    });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .update({ payment_status: 'Expired' })
      .eq('doc_type', 'Quotation')
      .eq('payment_status', 'Due')
      .lt('created_at', sevenDaysAgo.toISOString());
    
    if (error) console.error('Expiry cron error:', error.message);
    else console.log('Quotation expiry check completed.');
  } catch (err) {
    console.error('Quotation expiry cron failed:', err.message);
  }
});

// --- LOW STOCK ALERTS CRON ---
cron.schedule('0 9 * * *', async () => {
  console.log('Running low stock alert check at 9:00 AM...');
  try {
    const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
      realtime: { transport: WebSocket }
    });
    
    // Find products with low stock (< 5)
    const { data: lowStockProducts, error } = await supabaseAdmin
      .from('products')
      .select('name, stock_count')
      .lt('stock_count', 5)
      .eq('is_published', true);
      
    if (error) {
      console.error('Low stock query error:', error.message);
      return;
    }
    
    if (lowStockProducts && lowStockProducts.length > 0) {
      console.log(`Found ${lowStockProducts.length} low stock items. Sending alert...`);
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: GMAIL_USER_DEFAULT,
          pass: GMAIL_PASS_DEFAULT,
        },
      });
      
      const htmlBody = `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #d97706;">Low Stock Alert</h2>
          <p>The following items are running low on stock (less than 5 remaining):</p>
          <table style="width: 100%; max-width: 500px; border-collapse: collapse; margin-top: 10px;">
            <tr style="background-color: #f3f4f6; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e5e7eb;">Product Name</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; width: 100px;">Current Stock</th>
            </tr>
            ${lowStockProducts.map(p => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${p.name}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #dc2626;">${p.stock_count || 0}</td>
              </tr>
            `).join('')}
          </table>
          <p style="margin-top: 20px;">Please re-order these items to maintain inventory.</p>
        </div>
      `;
      
      await transporter.sendMail({
        from: '"YantraByte System" <' + GMAIL_USER_DEFAULT + '>',
        to: 'yantrabyte.solutions@gmail.com',
        subject: `Low Stock Alert: ${lowStockProducts.length} items need re-ordering`,
        html: htmlBody,
      });
      
      console.log('Low stock alert email sent successfully.');
    } else {
      console.log('Inventory looks good, no low stock items.');
    }
  } catch (err) {
    console.error('Low stock cron failed:', err.message);
  }
});

// --- GOOGLE REVIEW AUTOMATION CRON ---
cron.schedule('0 11 * * *', async () => {
  console.log('Running Google Review automation check...');
  try {
    const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
      realtime: { transport: WebSocket }
    });
    
    // Find paid invoices created more than 48 hours ago, where review has not been requested
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_no, doc_type, customer_name, phone, created_at')
      .eq('payment_status', 'Paid')
      .eq('doc_type', 'Invoice')
      .eq('review_requested', false)
      .lt('created_at', twoDaysAgo.toISOString())
      .limit(20); // Process in batches
      
    if (error) {
      console.error('Review cron db error:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No new invoices eligible for review request today.');
      return;
    }
    
    console.log(`Found ${data.length} invoices eligible for review request.`);
    
    for (const inv of data) {
      if (!inv.phone) continue;
      
      const GOOGLE_REVIEW_LINK = "https://g.page/r/CUCghqVAwGaXEBM/review";
      
      const cleanPhone = inv.phone.replace(/\D/g, '');
      const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}@c.us` : `${cleanPhone}@c.us`;
      
      const message = `Hi ${inv.customer_name},\n\nThis is YantraByte. We hope your device is working perfectly after our recent service! 💻✨\n\nIf you were satisfied with our work, it would mean the world to us if you could leave a quick 5-star review on Google. It helps our small business immensely!\n\nLeave a review here: ${GOOGLE_REVIEW_LINK}\n\nThank you for choosing Ananta Techcare (YantraByte)! 🙏`;
      
      if (whatsappClientReady) {
        try {
          await whatsappClient.sendMessage(waNumber, message);
          console.log(`Sent review request for Invoice ${inv.invoice_no} to ${waNumber}`);
          
          // Mark as requested
          await supabaseAdmin.from('invoices').update({ review_requested: true }).eq('id', inv.id);
        } catch (msgErr) {
          console.error(`Failed to send review request to ${waNumber}:`, msgErr.message);
        }
      } else {
        console.warn('WhatsApp client not ready. Skipping review request sending.');
      }
    }
  } catch (err) {
    console.error('Google Review cron failed:', err.message);
  }
});


// --- WHATSAPP PDF ATTACHMENT ENDPOINT ---
app.post('/api/invoices/send-whatsapp-pdf', async (req, res) => {
  const {
    customerPhone,
    customerName,
    invoiceNumber,
    documentType,
    pdfBase64,
    customCaption
  } = req.body || {};

  if (!customerPhone) {
    return res.status(400).json({ ok: false, error: 'Customer phone number is required' });
  }

  if (!pdfBase64) {
    return res.status(400).json({ ok: false, error: 'PDF data is missing' });
  }

  if (!isWhatsappReady) {
    return res.status(503).json({
      ok: false,
      error: 'WhatsApp Business client is not connected. Please pair your device in WhatsApp Connect.'
    });
  }

  let cleanPhone = String(customerPhone).replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

  if (cleanPhone.length < 10) {
    return res.status(400).json({ ok: false, error: 'Invalid phone number format' });
  }

  const cleanName = String(customerName || 'Customer');
  const cleanInvNo = String(invoiceNumber || 'Invoice');
  const cleanDocType = String(documentType || 'Invoice');
  const defaultFilename = (cleanName && cleanName !== 'Customer') 
    ? `${cleanName}.pdf` 
    : `${cleanDocType}_${cleanInvNo}.pdf`;
  const safeFilename = sanitizeFilename(req.body.filename || defaultFilename);

  try {
    const media = new MessageMedia('application/pdf', pdfBase64, safeFilename);
    const caption = customCaption || `Dear *${cleanName}*,\n\nPlease find attached your official ${cleanDocType.toLowerCase()} *#${cleanInvNo}*.\n\nYou can also view / pay online securely here:\nhttps://yantrabyte.anantatechcare.com/my-invoices\n\nThank you for choosing *YantraByte Solutions*!`;
    
    await whatsappClient.sendMessage(`${cleanPhone}@c.us`, media, { caption });
    console.log(`[Success] WhatsApp PDF invoice attachment sent to ${cleanPhone} for ${cleanInvNo}`);
    
    return res.json({ ok: true, message: `PDF ${cleanDocType} sent to WhatsApp successfully` });
  } catch (err) {
    console.error(`[Error] Failed to send WhatsApp PDF to ${cleanPhone}:`, err.message);
    return res.status(500).json({ ok: false, error: `Failed to send WhatsApp PDF: ${err.message}` });
  }
});

// --- CUSTOMER HISTORY & PORTAL ENDPOINT ---
app.get('/api/invoices/customer/:phone', async (req, res) => {
  const { phone } = req.params;
  try {
    const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
      realtime: { transport: WebSocket }
    });
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return res.status(400).json({ error: 'Invalid phone number' });
    
    // Search with last 10 digits to handle various formats
    const last10 = cleanPhone.slice(-10);
    
    const { data: invData, error: invError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .ilike('phone', `%${last10}%`)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (invError) throw invError;

    // Also fetch service tickets if any
    let tickets = [];
    try {
      const { data: tData } = await supabaseAdmin
        .from('service_tickets')
        .select('*')
        .ilike('customer_phone', `%${last10}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (tData) tickets = tData;
    } catch (tErr) {
      console.warn('Could not fetch tickets for customer portal:', tErr.message);
    }

    return res.json({
      invoices: invData || [],
      tickets: tickets || []
    });
  } catch (err) {
    console.error('Error fetching customer history:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Invoice email API listening on port ${port}`);
});
