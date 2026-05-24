Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ticket = await req.json();
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailPass) {
      return new Response(JSON.stringify({ ok: false, email: { ok: false, reason: 'Gmail not configured' } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ticket.customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticket.customer_email)) {
      return new Response(JSON.stringify({ ok: false, email: { ok: false, reason: 'Invalid email' } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanName = String(ticket.customer_name || 'Customer');
    const cleanTicketNo = String(ticket.ticket_number || '');
    const cleanDevice = String(ticket.device_type || 'Device');

    const htmlBody = `
<p>Dear ${cleanName},</p>
<p>Your service ticket (<strong>${cleanTicketNo}</strong>) for your <strong>${cleanDevice}</strong> has been successfully created.</p>
<p>Our team is reviewing the issue: <em>"${ticket.issue_description || ''}"</em></p>
<p>We will keep you updated on the progress.</p>
<p>Regards,<br/>YantraByte Solutions</p>
    `.trim();

    const textBody = [
      `Dear ${cleanName},`,
      '',
      `Your service ticket (${cleanTicketNo}) for your ${cleanDevice} has been successfully created.`,
      `Our team is reviewing the issue: "${ticket.issue_description || ''}"`,
      '',
      'We will keep you updated on the progress.',
      '',
      'Regards,',
      'YantraByte Solutions',
    ].join('\n');

    // Build MIME message manually
    const boundary = `----boundary_${crypto.randomUUID()}`;

    let mimeMessage = '';
    mimeMessage += `From: "YantraByte Solutions" <${gmailUser}>\r\n`;
    mimeMessage += `To: ${ticket.customer_email}\r\n`;
    mimeMessage += `Subject: Service Ticket ${cleanTicketNo} Created - YantraByte Solutions\r\n`;
    mimeMessage += `MIME-Version: 1.0\r\n`;
    mimeMessage += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;

    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    mimeMessage += `${textBody}\r\n\r\n`;

    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
    mimeMessage += `${htmlBody}\r\n\r\n`;

    mimeMessage += `--${boundary}--\r\n`;

    // Send via Gmail SMTP using raw TLS connection
    const smtpHost = 'smtp.gmail.com';
    const smtpPort = 465;
    const conn = await Deno.connectTls({ hostname: smtpHost, port: smtpPort });

    const reader = conn.readable.getReader();
    const writer = conn.writable.getWriter();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readLine = async (): Promise<string> => {
      let line = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        line += decoder.decode(value, { stream: true });
        if (line.includes('\r\n')) break;
      }
      const idx = line.indexOf('\r\n');
      return idx >= 0 ? line.substring(0, idx) : line;
    };

    const sendCmd = async (cmd: string): Promise<string> => {
      await writer.write(encoder.encode(cmd + '\r\n'));
      return await readLine();
    };

    // Read greeting
    await readLine();

    // EHLO
    await sendCmd('EHLO yantrabyte.com');

    // AUTH LOGIN
    await sendCmd('AUTH LOGIN');
    await sendCmd(btoa(gmailUser));
    const authResp = await sendCmd(btoa(gmailPass));
    if (!authResp.startsWith('235')) {
      await conn.close();
      return new Response(JSON.stringify({ ok: false, error: 'SMTP auth failed: ' + authResp }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // MAIL FROM
    await sendCmd(`MAIL FROM:<${gmailUser}>`);
    // RCPT TO
    await sendCmd(`RCPT TO:<${ticket.customer_email}>`);
    // DATA
    await sendCmd('DATA');
    // Send message body
    await writer.write(encoder.encode(mimeMessage + '\r\n.\r\n'));
    await readLine();
    // QUIT
    await sendCmd('QUIT');

    await conn.close();

    return new Response(JSON.stringify({ ok: true, email: { ok: true } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error('Edge function error:', msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
