// supabase/functions/notify-telegram/index.ts
// Universal Telegram notification Edge Function — runs 24/7 on Supabase cloud
// Secrets required: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function requireAdmin(req: Request): Promise<Response | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token || !supabaseUrl || !supabaseAnon) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseAnon, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const user = await userRes.json();
  if (user?.app_metadata?.is_admin !== true) {
    return new Response(JSON.stringify({ ok: false, error: 'Admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authErr = await requireAdmin(req);
    if (authErr) return authErr;

    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!token || !chatId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in Supabase secrets' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { message, parse_mode = 'HTML' } = body;

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ ok: false, error: 'message field is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: Number(chatId),
        text: message,
        parse_mode,
      }),
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: tgData.description || 'Telegram API error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, message_id: tgData.result?.message_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
