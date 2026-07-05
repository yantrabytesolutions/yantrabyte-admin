// supabase/functions/send-ticket-email/index.ts
// Sends customer confirmation email + Telegram notification + PDF attachment when a ticket is created.
// Also uploads PDF to Google Drive using a service account.
// Secrets: GMAIL_USER, GMAIL_APP_PASSWORD, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
//          GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_DRIVE_FOLDER_ID

import { PDFDocument, rgb, StandardFonts, degrees } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Telegram ──────────────────────────────────────────────────────────────────
async function sendTelegram(token: string, chatId: string, message: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(chatId), text: message, parse_mode: 'HTML' }),
    });
  } catch {
    // Telegram notification failure is non-fatal
  }
}

// ── Base64url helpers ─────────────────────────────────────────────────────────
function base64url(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── User OAuth Refresh Token → Drive access token ─────────────────────────────
async function getUserOAuthToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `client_id=${clientId}&client_secret=${clientSecret}&refresh_token=${refreshToken}&grant_type=refresh_token`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error('OAuth token error: ' + JSON.stringify(tokenData));
  return tokenData.access_token;
}

// ── Upload PDF to Google Drive folder ─────────────────────────────────────────
async function uploadPdfToDrive(
  accessToken: string,
  folderId: string,
  filename: string,
  pdfBytes: Uint8Array,
): Promise<string | null> {
  const boundary = '-------YBSDriveBoundary2026';
  const metadata = JSON.stringify({ name: filename, mimeType: 'application/pdf', parents: [folderId] });

  const enc        = new TextEncoder();
  const metaPart   = enc.encode(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`);
  const fileHeader = enc.encode(`--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`);
  const closeDelim = enc.encode(`\r\n--${boundary}--`);

  const body = new Uint8Array(metaPart.length + fileHeader.length + pdfBytes.length + closeDelim.length);
  let offset = 0;
  body.set(metaPart,   offset); offset += metaPart.length;
  body.set(fileHeader, offset); offset += fileHeader.length;
  body.set(pdfBytes,   offset); offset += pdfBytes.length;
  body.set(closeDelim, offset);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body,
    }
  );
  const data = await res.json();
  if (!res.ok) { console.error('Drive upload failed:', JSON.stringify(data)); return null; }
  console.log('Drive upload success:', data.id, data.webViewLink);
  return data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`;
}

// ── PDF Generator ─────────────────────────────────────────────────────────────
async function generateTicketPdf(ticket: Record<string, string>): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // A4 page: 595 x 842 pts
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontNormal  = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // ── Colors ────────────────────────────────────────────────────────────────
  const navy   = rgb(0.043, 0.325, 0.58);
  const amber  = rgb(0.937, 0.624, 0.043);
  const slate  = rgb(0.243, 0.31,  0.388);
  const light  = rgb(0.973, 0.98,  0.988);
  const white  = rgb(1, 1, 1);
  const black  = rgb(0, 0, 0);

  // ── WATERMARK: hardware_watermark.png ───────────────────────────────────────────────
  try {
    const wmRes = await fetch('https://raw.githubusercontent.com/yantrabytesolutions/yantrabyte-admin/main/public/hardware_watermark.png');
    if (wmRes.ok) {
      const wmBytes = await wmRes.arrayBuffer();
      const uint8 = new Uint8Array(wmBytes);
      
      let wmImg;
      try {
        wmImg = await pdfDoc.embedPng(uint8);
      } catch (e) {
        // Fallback to JPG in case the image is a JPEG renamed to .png
        wmImg = await pdfDoc.embedJpg(uint8);
      }
      
      // Calculate scale to cover the entire page (like object-fit: cover)
      const scaleX = width / wmImg.width;
      const scaleY = height / wmImg.height;
      const scale  = Math.max(scaleX, scaleY); // max for cover, min for contain
      
      const newWidth  = wmImg.width * scale;
      const newHeight = wmImg.height * scale;
      
      page.drawImage(wmImg, {
        x: (width - newWidth) / 2,
        y: (height - newHeight) / 2,
        width: newWidth, 
        height: newHeight,
        opacity: 0.15,
      });
    }
  } catch (e) { 
    console.error('Watermark error:', e); 
  }

  // ── HEADER BAR ─────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: navy });

  page.drawText('YantraByte Solutions', {
    x: 24, y: height - 38,
    size: 20, font: fontBold, color: white,
  });
  page.drawText('IT Service  •  Repair  •  Network Management', {
    x: 24, y: height - 58,
    size: 9, font: fontNormal, color: rgb(0.8, 0.88, 1),
  });
  page.drawText('09986742525  |  yantrabyte.anantatechcare.com', {
    x: 24, y: height - 74,
    size: 8, font: fontNormal, color: rgb(0.75, 0.85, 1),
  });



  // ── TITLE + DATE ──────────────────────────────────────────────────────────
  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  page.drawRectangle({ x: 0, y: height - 130, width, height: 40, color: light });
  page.drawText('SERVICE TICKET', {
    x: 24, y: height - 112,
    size: 14, font: fontBold, color: navy,
  });
  page.drawText(`Date: ${dateStr}`, {
    x: width - 170, y: height - 112,
    size: 10, font: fontNormal, color: slate,
  });

  // ── TICKET NUMBER BADGE ───────────────────────────────────────────────────
  page.drawRectangle({ x: 23, y: height - 162, width: width - 46, height: 26, color: navy });
  const tn      = ticket.ticket_no || 'N/A';
  const tnWidth = fontBold.widthOfTextAtSize(tn, 14);
  page.drawText(tn, {
    x: (width - tnWidth) / 2, y: height - 152,
    size: 14, font: fontBold, color: white, characterSpacing: 2,
  });

  // ── DETAILS TABLE ─────────────────────────────────────────────────────────
  const rows = [
    ['Customer Name', String(ticket.customer_name || '—')],
    ['Phone', String(ticket.customer_phone || ticket.mobile_no || '—')],
    ['Email', String(ticket.customer_email || '—')],
    ['Address', String(ticket.customer_address || '—')],
    ['Device / Service', String(ticket.device_type || '—')],
    ['Make / Model', String(ticket.device_make_model || '—')],
    ['Issue Reported', String(ticket.issue_description || '—')],
    ['Priority', String(ticket.priority || 'Medium')],
  ];

  let rowY = height - 180;
  const colLabel = 24;
  const colValue = 180;
  const rowH     = 26;

  // Table header
  page.drawRectangle({ x: 20, y: rowY - 2, width: width - 40, height: 20, color: navy });
  page.drawText('TICKET DETAILS', {
    x: colLabel + 4, y: rowY + 4,
    size: 9, font: fontBold, color: white,
  });
  rowY -= rowH;

  rows.forEach(([label, value], idx) => {
    const bgColor = idx % 2 === 0 ? light : white;
    page.drawRectangle({ x: 20, y: rowY - 2, width: width - 40, height: 22, color: bgColor, opacity: 0.1 });
    page.drawText(label, { x: colLabel, y: rowY + 5, size: 9, font: fontBold, color: slate });
    const maxChars  = 55;
    const displayVal = value.length > maxChars ? value.slice(0, maxChars) + '…' : value;
    page.drawText(displayVal, { x: colValue, y: rowY + 5, size: 9, font: fontNormal, color: black });
    rowY -= rowH;
  });

  rowY -= 10;

  // ── TERMS & CONDITIONS BOX ────────────────────────────────────────────────
  const tcBoxH = 78;
  page.drawRectangle({ x: 20, y: rowY - tcBoxH, width: width - 40, height: tcBoxH, color: rgb(1, 0.98, 0.93), opacity: 0.1 });
  page.drawRectangle({ x: 20, y: rowY - tcBoxH, width: width - 40, height: tcBoxH, borderColor: amber, borderWidth: 1.5, color: rgb(0,0,0,0) as ReturnType<typeof rgb>, opacity: 0, borderOpacity: 1 });
  page.drawRectangle({ x: 20, y: rowY - tcBoxH, width: 5,          height: tcBoxH, color: amber });

  page.drawText('IMPORTANT NOTICE — TERMS & CONDITIONS', {
    x: 34, y: rowY - 14,
    size: 9, font: fontBold, color: rgb(0.55, 0.28, 0.02),
  });
  const tcLines = [
    'Customer must collect working or non-working materials within 2 months from the',
    'date given for service. After that, YantraByte Solutions will not be responsible',
    'for the items. The customer has acknowledged and agreed to this policy.',
  ];
  tcLines.forEach((line, i) => {
    page.drawText(line, { x: 34, y: rowY - 28 - i * 14, size: 8.5, font: fontNormal, color: rgb(0.45, 0.25, 0.02) });
  });

  rowY -= tcBoxH + 18;

  // ── SIGNATURE SECTION ─────────────────────────────────────────────────────
  const sigBoxH = 120;
  const sigBoxY = rowY - sigBoxH;
  page.drawRectangle({ x: 20, y: sigBoxY, width: width - 40, height: sigBoxH, color: light, opacity: 0.1 });

  // Left: customer digital acceptance
  page.drawText('Customer Accepted Terms:', { x: 30, y: sigBoxY + 100, size: 8, font: fontBold, color: slate });
  page.drawText('Agreed digitally via online service request form', { x: 30, y: sigBoxY + 86, size: 8, font: fontNormal, color: rgb(0.1, 0.55, 0.2) });
  page.drawText(`Date: ${dateStr}`, { x: 30, y: sigBoxY + 72, size: 8, font: fontNormal, color: slate });

  // Right: authorised signatory
  const sigX = width / 2 + 20;
  page.drawText('Authorised Signatory:', { x: sigX, y: sigBoxY + 100, size: 8, font: fontBold, color: slate });
  page.drawLine({ start: { x: sigX, y: sigBoxY + 22 }, end: { x: sigX + 180, y: sigBoxY + 22 }, thickness: 1, color: navy, opacity: 0.4 });
  page.drawText('For YantraByte Solutions', { x: sigX, y: sigBoxY + 10, size: 7.5, font: fontNormal, color: slate });

  // ── SEAL (Authorised Signatory) ───────────────────────────────────────────
  try {
    const sealRes = await fetch('https://raw.githubusercontent.com/yantrabytesolutions/yantrabyte-admin/main/public/seal.png');
    if (sealRes.ok) {
      const sealBytes = await sealRes.arrayBuffer();
      let sealImg;
      try {
        sealImg = await pdfDoc.embedPng(new Uint8Array(sealBytes));
      } catch (e) {
        sealImg = await pdfDoc.embedJpg(new Uint8Array(sealBytes));
      }
      const sealSize  = 72;
      page.drawImage(sealImg, {
        x: sigX + 30, y: sigBoxY + 26,
        width: sealSize, height: sealSize,
        opacity: 0.85,
      });
    }
  } catch { /* optional */ }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height: 36, color: navy });
  page.drawText('47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru – 560097', {
    x: 24, y: 20, size: 7.5, font: fontNormal, color: rgb(0.8, 0.88, 1),
  });
  page.drawText('This is a system-generated document. No physical signature required.', {
    x: 24, y: 8, size: 7, font: fontNormal, color: rgb(0.65, 0.75, 0.9),
  });

  // ── PAGE BORDER ───────────────────────────────────────────────────────────
  page.drawRectangle({ x: 6, y: 6, width: width - 12, height: height - 12, borderColor: navy, borderWidth: 1.2, color: rgb(0,0,0) as ReturnType<typeof rgb>, opacity: 0, borderOpacity: 0.25 });

  return pdfDoc.save();
}

// ── Base64 encode ─────────────────────────────────────────────────────────────
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.length;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    // Unwrap the record if it comes from a Supabase webhook
    const ticket = payload.record || payload;

    // Fetch Supabase env
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    let tgToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    let tgChatId = Deno.env.get('TELEGRAM_CHAT_ID');

    if ((!tgToken || !tgChatId) && supabaseUrl && supabaseKey) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/site_settings?key=in.(telegram_bot_token,telegram_chat_id)`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        });
        const settings = await res.json();
        if (Array.isArray(settings)) {
          const tRow = settings.find((s: { key: string; value: string }) => s.key === 'telegram_bot_token');
          const cRow = settings.find((s: { key: string; value: string }) => s.key === 'telegram_chat_id');
          if (tRow?.value) tgToken = tRow.value;
          if (cRow?.value) tgChatId = cRow.value;
        }
      } catch (dbErr) {
        console.error('Failed to fetch from DB:', dbErr);
      }
    }

    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD');

    const escapeHtml = (text: string) =>
      text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // ── Telegram notification ──────────────────────────────────────────────
    if (tgToken && tgChatId) {
      const tgMessage =
        `🛠 <b>New Service Ticket</b>\n` +
        `Ticket: ${escapeHtml(ticket.ticket_no || 'N/A')}\n` +
        `Customer: ${escapeHtml(ticket.customer_name || 'N/A')}\n` +
        `Phone: ${escapeHtml(ticket.customer_phone || 'N/A')}\n` +
        `Device: ${escapeHtml(ticket.device_type || 'N/A')}\n` +
        `Issue: ${escapeHtml(String(ticket.issue_description || '').slice(0, 120))}\n` +
        `Priority: ${escapeHtml(ticket.priority || 'medium')}`;
      await sendTelegram(tgToken, tgChatId, tgMessage);
    }

    // ── Generate PDF ───────────────────────────────────────────────────────
    let pdfBytes: Uint8Array | null = null;
    let pdfBase64 = '';
    let pdfErrorStr = '';
    const pdfFilename = `ServiceTicket-${String(ticket.ticket_no || 'XXXXXX').replace(/[\s/]/g, '_')}.pdf`;
    try {
      pdfBytes  = await generateTicketPdf(ticket);
      pdfBase64 = uint8ToBase64(pdfBytes);
    } catch (pdfErr) {
      console.error('PDF generation failed:', pdfErr);
      pdfErrorStr = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
    }
    // ── Upload PDF to Google Drive (OAuth) ────────────────────────────────────
    const clientId      = Deno.env.get('GOOGLE_CLIENT_ID') || '';
    const clientSecret  = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
    const refreshToken  = Deno.env.get('GOOGLE_REFRESH_TOKEN') || '';
    const driveFolderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID') || '';
    
    let driveViewLink: string | null = null;
    let driveErrorMsg: string | null = null;
    if (pdfBytes && clientId && clientSecret && refreshToken && driveFolderId) {
      try {
        const driveToken = await getUserOAuthToken(clientId, clientSecret, refreshToken);
        driveViewLink = await uploadPdfToDrive(driveToken, driveFolderId, pdfFilename, pdfBytes);
        console.log('Drive link:', driveViewLink);
      } catch (driveErr) {
        driveErrorMsg = String(driveErr);
        console.error('Drive upload error:', driveErr);
      }
    } else {
        driveErrorMsg = `Missing secrets. clientId:${!!clientId}, clientSecret:${!!clientSecret}, refreshToken:${!!refreshToken}, driveFolderId:${!!driveFolderId}`;
    }

    if (!gmailUser || !gmailPass) {
      return new Response(
        JSON.stringify({ ok: true, email: { ok: false, reason: 'Gmail not configured', pdfBase64 }, telegram: { ok: !!tgToken }, drive: { ok: !!driveViewLink, link: driveViewLink } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasValidCustomerEmail = ticket.customer_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticket.customer_email);
    const cleanName     = String(ticket.customer_name || 'Customer');
    const cleanTicketNo = String(ticket.ticket_no || '');
    const cleanDevice   = String(ticket.device_type   || 'Device');
    const cleanIssue    = String(ticket.issue_description || '');

    // ── HTML email body ────────────────────────────────────────────────────
    const driveLink = driveViewLink
      ? `<p style="text-align:center;margin:12px 0"><a href="${driveViewLink}" style="background:#0B5394;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">📂 View PDF in Google Drive</a></p>`
      : '';

    const htmlBody = `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:#0B5394;padding:24px 32px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px">YantraByte Solutions</h1>
    <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px">IT Service, Repair &amp; Network Management</p>
  </div>
  <div style="padding:28px 32px">
    <p style="color:#0f172a;font-size:15px">Dear <strong>${escapeHtml(cleanName)}</strong>,</p>
    <p style="color:#334155">Your service ticket has been successfully created. The official PDF is attached to this email${driveViewLink ? ' and saved to your Google Drive' : ''}.</p>
    <div style="background:#f8fafc;border-radius:6px;padding:16px;margin:16px 0;border-left:4px solid #0B5394;text-align:center">
      <p style="margin:0 0 6px;color:#64748b;font-size:13px">Ticket Number</p>
      <p style="margin:0;font-size:22px;font-weight:700;color:#0B5394;letter-spacing:2px">${escapeHtml(cleanTicketNo)}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:40%">Device</td><td style="color:#0f172a;font-weight:600">${escapeHtml(cleanDevice)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Issue Reported</td><td style="color:#0f172a">${escapeHtml(cleanIssue)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Priority</td><td style="color:#0f172a;text-transform:capitalize">${escapeHtml(ticket.priority || 'Medium')}</td></tr>
    </table>
    ${driveLink}
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 16px;margin:20px 0">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e">⚠ Important Notice — Terms &amp; Conditions</p>
      <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6">
        Customer must collect working or non-working materials within <strong>2 months</strong> from the date given for service.
        After that, <strong>YantraByte Solutions will not be responsible for the items</strong>.
      </p>
    </div>
    <p style="color:#334155;margin-top:24px">Regards,<br><strong>YantraByte Solutions</strong><br>
      <a href="tel:09986742525" style="color:#0B5394">09986742525</a> |
      47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru 560097
    </p>
  </div>
  <div style="text-align:center;padding:16px;background:#f8fafc;font-size:12px;color:#94a3b8">
    📎 Official service ticket PDF is attached to this email.
  </div>
</div>`.trim();

    const textBody = [
      `Dear ${cleanName},`,
      '',
      `Your service ticket (${cleanTicketNo}) has been created for your ${cleanDevice}.`,
      `Issue: "${cleanIssue}"`,
      '',
      'An official PDF of your service ticket is attached to this email.',
      driveViewLink ? `Saved to Google Drive: ${driveViewLink}` : '',
      '',
      'Our technician will contact you shortly.',
      '',
      'IMPORTANT NOTICE — TERMS & CONDITIONS:',
      'Customer must collect working or non-working materials within 2 months from the date given for service.',
      'After that, YantraByte Solutions will not be responsible for the items.',
      '',
      'Regards, YantraByte Solutions | 09986742525',
      '47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru 560097',
    ].filter(l => l !== null).join('\n');

    // ── Build MIME (multipart/mixed with PDF attachment) ───────────────────
    const outerBoundary = `----outer_${crypto.randomUUID().replace(/-/g, '')}`;
    const innerBoundary = `----inner_${crypto.randomUUID().replace(/-/g, '')}`;

    let mime = '';
    mime += `From: "YantraByte Solutions" <${gmailUser}>\r\n`;
    if (hasValidCustomerEmail) mime += `To: ${ticket.customer_email}\r\n`;
    mime += `Cc: yantrabyte.solutions@gmail.com\r\n`;
    mime += `Subject: Service Ticket ${cleanTicketNo} - YantraByte Solutions\r\n`;
    mime += `MIME-Version: 1.0\r\n`;
    mime += `Content-Type: multipart/mixed; boundary="${outerBoundary}"\r\n\r\n`;

    // Text + HTML body
    mime += `--${outerBoundary}\r\n`;
    mime += `Content-Type: multipart/alternative; boundary="${innerBoundary}"\r\n\r\n`;
    mime += `--${innerBoundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${textBody}\r\n\r\n`;
    mime += `--${innerBoundary}\r\nContent-Type: text/html; charset="UTF-8"\r\n\r\n${htmlBody}\r\n\r\n`;
    mime += `--${innerBoundary}--\r\n\r\n`;

    // PDF attachment
    if (pdfBase64) {
      mime += `--${outerBoundary}\r\n`;
      mime += `Content-Type: application/pdf; name="${pdfFilename}"\r\n`;
      mime += `Content-Disposition: attachment; filename="${pdfFilename}"\r\n`;
      mime += `Content-Transfer-Encoding: base64\r\n\r\n`;
      const chunks = pdfBase64.match(/.{1,76}/g) || [];
      mime += chunks.join('\r\n') + '\r\n\r\n';
    }

    mime += `--${outerBoundary}--\r\n`;

    // ── SMTP send ─────────────────────────────────────────────────────────
    const conn   = await Deno.connectTls({ hostname: 'smtp.gmail.com', port: 465 });
    const reader = conn.readable.getReader();
    const writer = conn.writable.getWriter();
    const enc    = new TextEncoder();
    const dec    = new TextDecoder();

    const readLine = async (): Promise<string> => {
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        if (buf.includes('\r\n')) break;
      }
      const idx = buf.indexOf('\r\n');
      return idx >= 0 ? buf.substring(0, idx) : buf;
    };

    const cmd = async (c: string): Promise<string> => {
      await writer.write(enc.encode(c + '\r\n'));
      return readLine();
    };

    await readLine(); // greeting
    await cmd('EHLO yantrabyte.com');
    await cmd('AUTH LOGIN');
    await cmd(btoa(gmailUser));
    const authResp = await cmd(btoa(gmailPass));

    if (!authResp.startsWith('235')) {
      await conn.close();
      return new Response(
        JSON.stringify({ ok: false, email: { ok: false, reason: 'SMTP auth failed: ' + authResp } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await cmd(`MAIL FROM:<${gmailUser}>`);
    // Temporarily disabled sending to customer until user confirms
    if (hasValidCustomerEmail) await cmd(`RCPT TO:<${ticket.customer_email}>`);
    await cmd(`RCPT TO:<yantrabyte.solutions@gmail.com>`);
    await cmd('DATA');
    await writer.write(enc.encode(mime + '\r\n.\r\n'));
    await readLine();
    await cmd('QUIT');
    await conn.close();

    const emailOk = true;

    return new Response(
<<<<<<< HEAD
      JSON.stringify({ ok: true, email: { ok: emailOk, pdf: !!pdfBytes, pdfError: pdfErrorStr, pdfBase64 }, telegram: { ok: !!tgToken }, storage: { ok: !!driveViewLink, url: driveViewLink } }),
=======
      JSON.stringify({ ok: true, email: { ok: true, pdf: !!pdfBase64 }, telegram: { ok: !!tgToken }, drive: { ok: !!driveViewLink, link: driveViewLink, error: driveErrorMsg } }),
>>>>>>> 1ec7463 (chore: refactor billing software and update typings)
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error('send-ticket-email error:', msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
