import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

interface TicketPayload {
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  device_type?: string;
  issue_description?: string;
  priority?: string;
  status?: string;
  pdfBase64?: string;
  pdfFilename?: string;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ticket: TicketPayload = await req.json();
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailPass) {
      return new Response(JSON.stringify({ ok: false, email: { ok: false, skipped: true, reason: 'Gmail not configured on server' } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ticket.customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ticket.customer_email)) {
      return new Response(JSON.stringify({ ok: false, email: { ok: false, skipped: true, reason: 'Invalid customer email' } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = new SmtpClient();
    await client.connectTLS({
      hostname: 'smtp.gmail.com',
      port: 465,
      username: gmailUser,
      password: gmailPass,
    });

    const cleanName = String(ticket.customer_name || 'Customer');
    const cleanTicketNo = String(ticket.ticket_number || '');
    const cleanDevice = String(ticket.device_type || 'Device');

    const htmlBody = `
      <p>Dear ${cleanName},</p>
      <p>Your service ticket (<strong>${cleanTicketNo}</strong>) for your <strong>${cleanDevice}</strong> has been successfully created.</p>
      <p>Our team is reviewing the issue: <em>"${ticket.issue_description || ''}"</em></p>
      <p>We will keep you updated on the progress.</p>
      <p>Regards,<br/>YantraByte Solutions</p>
    `;

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

    const boundary = `----=${crypto.randomUUID()}`;

    let content = `MIME-Version: 1.0\r\n`;
    content += `From: "YantraByte Solutions" <${gmailUser}>\r\n`;
    content += `To: ${ticket.customer_email}\r\n`;
    content += `Subject: Service Ticket ${cleanTicketNo} Created - YantraByte Solutions\r\n`;
    content += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
    content += `--${boundary}\r\n`;
    content += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    content += `${textBody}\r\n\r\n`;
    content += `--${boundary}\r\n`;
    content += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
    content += `${htmlBody}\r\n\r\n`;

    if (ticket.pdfBase64 && ticket.pdfFilename) {
      const safeFilename = String(ticket.pdfFilename).replace(/[/\\?%*:|"<>]/g, '-').slice(0, 120);
      content += `--${boundary}\r\n`;
      content += `Content-Type: application/pdf\r\n`;
      content += `Content-Disposition: attachment; filename="${safeFilename}"\r\n`;
      content += `Content-Transfer-Encoding: base64\r\n\r\n`;
      content += `${ticket.pdfBase64}\r\n\r\n`;
    }

    content += `--${boundary}--\r\n`;

    await client.send({
      from: gmailUser,
      to: ticket.customer_email,
      subject: `Service Ticket ${cleanTicketNo} Created - YantraByte Solutions`,
      content: content,
    });

    await client.close();

    return new Response(JSON.stringify({ ok: true, email: { ok: true } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Edge function error:', msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
