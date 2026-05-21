import dotenv from 'dotenv';
import express from 'express';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = Number(process.env.INVOICE_API_PORT || process.env.PORT || 4000);
const maxPdfSize = process.env.INVOICE_MAX_JSON_SIZE || '15mb';

app.use(express.json({ limit: maxPdfSize }));

const requiredEnv = ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

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

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
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
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ],
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('Invoice email failed:', error);
    return res.status(502).json({ error: 'Failed to send invoice email through Gmail' });
  }
});

app.listen(port, () => {
  console.log(`Invoice email API listening on port ${port}`);
});
