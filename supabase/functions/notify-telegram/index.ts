// supabase/functions/notify-telegram/index.ts
// Universal Telegram notification Edge Function — runs 24/7 on Supabase cloud
// Secrets required: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
