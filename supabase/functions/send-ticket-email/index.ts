// supabase/functions/send-ticket-email/index.ts
// Sends customer confirmation email + Telegram notification when a ticket is created.
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
  } catch {
    // Telegram notification failure is non-fatal
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ticket = await req.json();

    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD');
    const tgToken   = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const tgChatId  = Deno.env.get('TELEGRAM_CHAT_ID');

    // ── Always send Telegram notification ───────────────────────────────────
    if (tgToken && tgChatId) {
      await sendTelegram(
        tgToken, tgChatId,
        `🛠 <b>New Service Ticket</b>\n` +
        `Ticket: ${ticket.ticket_number || 'N/A'}\n` +
        `Customer: ${ticket.customer_name || 'N/A'}\n` +
        `Phone: ${ticket.customer_phone || 'N/A'}\n` +
        `Device: ${ticket.device_type || 'N/A'}\n` +
        `Issue: ${String(ticket.issue_description || '').slice(0, 120)}\n` +
        `Priority: ${ticket.priority || 'medium'}`
      );
    }

    // ── Send email if Gmail is configured and email is valid ─────────────────
    if (!gmailUser || !gmailPass) {
      return new Response(
        JSON.stringify({ ok: true, email: { ok: false, reason: 'Gmail not configured' }, telegram: { ok: !!tgToken } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ticket.customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticket.customer_email)) {
      return new Response(
        JSON.stringify({ ok: true, email: { ok: false, reason: 'No valid customer email' }, telegram: { ok: !!tgToken } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanName     = String(ticket.customer_name || 'Customer');
    const cleanTicketNo = String(ticket.ticket_number || '');
    const cleanDevice   = String(ticket.device_type || 'Device');
    const cleanIssue    = String(ticket.issue_description || '');

    const htmlBody = `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:#0B5394;padding:24px 32px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:20px">YantraByte Solutions</h1>
    <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px">IT Service, Repair &amp; Network Management</p>
  </div>
  <div style="padding:28px 32px">
    <p style="color:#0f172a;font-size:15px">Dear <strong>${cleanName}</strong>,</p>
    <p style="color:#334155">Your service ticket has been successfully created.</p>
    <div style="background:#f8fafc;border-radius:6px;padding:16px;margin:16px 0;border-left:4px solid #0B5394">
      <p style="margin:0 0 6px;color:#64748b;font-size:13px">Ticket Number</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#0B5394;letter-spacing:1px">${cleanTicketNo}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b;width:40%">Device</td><td style="color:#0f172a;font-weight:600">${cleanDevice}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Issue Reported</td><td style="color:#0f172a">${cleanIssue}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Priority</td><td style="color:#0f172a;text-transform:capitalize">${ticket.priority || 'Medium'}</td></tr>
    </table>
    <p style="color:#334155">Our technician will review your device and contact you with an update shortly.</p>
    <p style="color:#334155;margin-top:24px">Regards,<br><strong>YantraByte Solutions</strong><br>
      <a href="tel:09986742525" style="color:#0B5394">09986742525</a> | 
      47A 1st Cross, Sainagar 2nd Stage, Vidyaranyapura Post, Bengaluru 560097
    </p>
  </div>
  <div style="text-align:center;padding:16px;background:#f8fafc;font-size:12px;color:#94a3b8">
    This is an automated confirmation. Please keep your ticket number for follow-up.
  </div>
</div>`.trim();

    const textBody = [
      `Dear ${cleanName},`,
      '',
      `Your service ticket (${cleanTicketNo}) has been created for your ${cleanDevice}.`,
      `Issue: "${cleanIssue}"`,
      '',
      'Our technician will contact you shortly.',
      '',
      'Regards, YantraByte Solutions | 09986742525',
    ].join('\n');

    // Build MIME message
    const boundary = `----boundary_${crypto.randomUUID()}`;
    let mime = '';
    mime += `From: "YantraByte Solutions" <${gmailUser}>\r\n`;
    mime += `To: ${ticket.customer_email}\r\n`;
    mime += `Subject: Service Ticket ${cleanTicketNo} - YantraByte Solutions\r\n`;
    mime += `MIME-Version: 1.0\r\n`;
    mime += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
    mime += `--${boundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\n\r\n${textBody}\r\n\r\n`;
    mime += `--${boundary}\r\nContent-Type: text/html; charset="UTF-8"\r\n\r\n${htmlBody}\r\n\r\n`;
    mime += `--${boundary}--\r\n`;

    // Send via Gmail SMTP over TLS
    const conn = await Deno.connectTls({ hostname: 'smtp.gmail.com', port: 465 });
    const reader = conn.readable.getReader();
    const writer = conn.writable.getWriter();
    const enc = new TextEncoder();
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
    await cmd(`RCPT TO:<${ticket.customer_email}>`);
    await cmd('DATA');
    await writer.write(enc.encode(mime + '\r\n.\r\n'));
    await readLine();
    await cmd('QUIT');
    await conn.close();

    return new Response(
      JSON.stringify({ ok: true, email: { ok: true }, telegram: { ok: !!tgToken } }),
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
