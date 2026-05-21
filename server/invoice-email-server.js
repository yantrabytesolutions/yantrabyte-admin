import dotenv from 'dotenv';
import express from 'express';
import { Readable } from 'stream';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = Number(process.env.INVOICE_API_PORT || process.env.PORT || 4000);
const maxPdfSize = process.env.INVOICE_MAX_JSON_SIZE || '15mb';

app.use(express.json({ limit: maxPdfSize }));

const requiredEnv = ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const driveEnv = ['GOOGLE_DRIVE_FOLDER_ID'];

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

function getDriveAuthConfig() {
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
    missing.push('GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS');
  }
  return missing;
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

  const auth = new google.auth.GoogleAuth({
    ...getDriveAuthConfig(),
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.files.create({
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

  try {
    const [mailResult, driveResult] = await Promise.all([
      transporter.sendMail({
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
      }),
      uploadPdfToDrive({
        pdfBuffer,
        filename: safeFilename,
        customerName: cleanCustomerName,
        invoiceNumber: cleanInvoiceNumber,
        documentType: cleanDocumentType,
      }),
    ]);

    return res.json({
      ok: true,
      email: { ok: true, messageId: mailResult.messageId },
      drive: driveResult,
    });
  } catch (error) {
    console.error('Invoice delivery failed:', error);
    return res.status(502).json({ error: 'Failed to email invoice or upload it to Google Drive' });
  }
});

app.listen(port, () => {
  console.log(`Invoice email API listening on port ${port}`);
});
