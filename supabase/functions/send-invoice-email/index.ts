// supabase/functions/send-invoice-email/index.ts
// Sends invoice/quotation PDF email to customer + Telegram notification
// Secrets: GMAIL_USER, GMAIL_APP_PASSWORD, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendTelegram(token: string, chatId: string, message: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: Number(chatId), text: message, parse_mode: 'HTML' }),
    });
  } catch { /* non-fatal */ }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD');
    const tgToken   = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const tgChatId  = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!gmailUser || !gmailPass) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Email service not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in Supabase secrets.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { to, customerName, invoiceNumber, documentType = 'Invoice', pdfBase64, filename, grandTotal } = body;

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Valid customer email address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ ok: false, error: 'pdfBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanInvoiceNo  = String(invoiceNumber || 'invoice');
    const cleanCustomer   = String(customerName || 'Customer');
    const cleanDocType    = String(documentType || 'Invoice');
    const cleanFilename   = String(filename || `${cleanInvoiceNo}.pdf`).replace(/[/\\?%*:|"<>]/g, '-').slice(0, 120);
    const cleanTotal      = grandTotal != null ? `₹${Number(grandTotal).toLocaleString('en-IN')}` : '';
    const isQuotation     = cleanDocType === 'Quotation';

    const htmlBody = `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:#0B5394;padding:24px 32px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px">YantraByte Solutions</h1>
    <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px">IT Service, Repair &amp; Network Management</p>
  </div>
  <div style="padding:28px 32px">
    <p style="color:#0f172a;font-size:15px">Dear <strong>${cleanCustomer}</strong>,</p>
    <p style="color:#334155">Please find attached your <strong>${cleanDocType.toLowerCase()}</strong> from YantraByte Solutions.</p>
    <div style="background:#f8fafc;border-radius:6px;padding:16px;margin:16px 0">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:5px 0;color:#64748b;width:40%">${cleanDocType} No.</td><td style="color:#0f172a;font-weight:700">${cleanInvoiceNo}</td></tr>
        ${cleanTotal ? `<tr><td style="padding:5px 0;color:#64748b">Amount</td><td style="color:#0B5394;font-weight:700;font-size:16px">${cleanTotal}</td></tr>` : ''}
      </table>
    </div>
    ${isQuotation
      ? '<p style="color:#334155">This is an estimate. Kindly review and confirm to proceed with the service.</p>'
      : '<p style="color:#334155">Payment details and terms are included in the attached PDF. For any queries, please call us.</p>'
    }
    <div style="margin:20px 0;padding:14px;background:#f0f9ff;border-radius:6px">
      <p style="margin:0 0 4px;font-weight:600;color:#0B5394">Payment Options</p>
      <p style="margin:0;font-size:13px;color:#334155">UPI: yantrabyte.solutions@okaxis &nbsp;|&nbsp; Cash at workshop</p>
    </div>
    <p style="color:#334155;margin-top:24px">Regards,<br><strong>YantraByte Solutions</strong><br>
      <a href="tel:09986742525" style="color:#0B5394">09986742525</a> | 
      47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru 560097
    </p>
  </div>
  <div style="text-align:center;padding:14px;background:#f8fafc;font-size:12px;color:#94a3b8">
    YantraByte Solutions — Authorized IT Service | Bengaluru
  </div>
</div>`.trim();

    const textBody = [
      `Dear ${cleanCustomer},`,
      '',
      `Please find your ${cleanDocType.toLowerCase()} ${cleanInvoiceNo} attached.`,
      cleanTotal ? `Amount: ${cleanTotal}` : '',
      '',
      'Regards, YantraByte Solutions | 09986742525',
    ].filter(l => l !== undefined).join('\n');

    // Decode PDF
    const pdfBytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    // Build multipart MIME with PDF attachment
    const boundary = `----boundary_${crypto.randomUUID()}`;
    const enc = new TextEncoder();

    const headerPart = [
      `From: "YantraByte Solutions" <${gmailUser}>`,
      `To: ${to}`,
      `Subject: ${cleanDocType} ${cleanInvoiceNo} - YantraByte Solutions`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: multipart/alternative; boundary="alt_' + boundary + '"',
      '',
      `--alt_${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      textBody,
      '',
      `--alt_${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      htmlBody,
      '',
      `--alt_${boundary}--`,
      '',
      `--${boundary}`,
      `Content-Type: application/pdf; name="${cleanFilename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${cleanFilename}"`,
      '',
      pdfBase64,
      '',
      `--${boundary}--`,
    ].join('\r\n');

    // Send via Gmail SMTP TLS
    const conn = await Deno.connectTls({ hostname: 'smtp.gmail.com', port: 465 });
    const reader = conn.readable.getReader();
    const writer = conn.writable.getWriter();
    const dec = new TextDecoder();

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

    await readLine();
    await cmd('EHLO yantrabyte.com');
    await cmd('AUTH LOGIN');
    await cmd(btoa(gmailUser));
    const authResp = await cmd(btoa(gmailPass));

    if (!authResp.startsWith('235')) {
      await conn.close();
      return new Response(
        JSON.stringify({ ok: false, error: 'SMTP auth failed: ' + authResp }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await cmd(`MAIL FROM:<${gmailUser}>`);
    await cmd(`RCPT TO:<${to}>`);
    await cmd('DATA');
    await writer.write(enc.encode(headerPart + '\r\n.\r\n'));
    await readLine();
    await cmd('QUIT');
    await conn.close();

    // Telegram notification
    if (tgToken && tgChatId) {
      await sendTelegram(
        tgToken, tgChatId,
        `💰 <b>${cleanDocType} Emailed</b>\n` +
        `${cleanDocType}: ${cleanInvoiceNo}\n` +
        `Customer: ${cleanCustomer}\n` +
        `Amount: ${cleanTotal || '—'}\n` +
        `Sent to: ${to}`
      );
    }

    return new Response(
      JSON.stringify({ ok: true, email: { ok: true }, telegram: { ok: !!tgToken } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error('send-invoice-email error:', msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
