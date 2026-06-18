// supabase/functions/backup-to-sheets/index.ts
// Appends a row to a Google Sheet via OAuth2 — runs 24/7 on Supabase cloud
// Secrets: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_SHEETS_SPREADSHEET_ID

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Failed to get Google access token: ' + (data.error_description || data.error || JSON.stringify(data)));
  }
  return data.access_token;
}

async function ensureSheet(spreadsheetId: string, sheetName: string, token: string): Promise<void> {
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const meta = await metaRes.json();
  const sheets: Array<{ properties: { title: string } }> = meta.sheets || [];
  const exists = sheets.some(s => s.properties.title === sheetName);
  if (exists) return;

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: sheetName } } }] }),
  });
}

async function getHeaderRow(spreadsheetId: string, sheetName: string, token: string): Promise<string[]> {
  const quotedSheet = `'${sheetName.replace(/'/g, "''")}'`;
  const rangeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedSheet + '!A1:ZZ1')}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const rangeData = await rangeRes.json();
  return (rangeData.values?.[0] as string[]) || [];
}

async function setHeaderRow(spreadsheetId: string, sheetName: string, headers: string[], token: string): Promise<void> {
  const quotedSheet = `'${sheetName.replace(/'/g, "''")}'`;
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedSheet + '!A1')}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [headers] }),
    }
  );
}

async function appendRow(spreadsheetId: string, sheetName: string, row: unknown[], token: string): Promise<string> {
  const quotedSheet = `'${sheetName.replace(/'/g, "''")}'`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedSheet + '!A2')}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Sheets append failed');
  return data.updates?.updatedRange || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientId      = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret  = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const refreshToken  = Deno.env.get('GOOGLE_REFRESH_TOKEN');
    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');

    if (!clientId || !clientSecret || !refreshToken || !spreadsheetId) {
      return new Response(
        JSON.stringify({ ok: false, skipped: true, error: 'Google Sheets not configured in Supabase secrets' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { sheetName, headers, row } = body;

    if (!sheetName || !Array.isArray(headers) || !Array.isArray(row)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'sheetName, headers (array), and row (array) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = await getAccessToken(clientId, clientSecret, refreshToken);
    await ensureSheet(spreadsheetId, sheetName, token);

    // Set headers if sheet is empty
    const existingHeaders = await getHeaderRow(spreadsheetId, sheetName, token);
    if (existingHeaders.length === 0) {
      await setHeaderRow(spreadsheetId, sheetName, headers, token);
    }

    const updateOrAppendRow = async () => {
      const { keyColumnIndex, keyValue } = body;
      if (keyColumnIndex !== undefined && keyValue !== undefined) {
        const colLetter = String.fromCharCode(65 + keyColumnIndex);
        const quotedSheet = `'${sheetName.replace(/'/g, "''")}'`;
        const colRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedSheet + '!' + colLetter + ':' + colLetter)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const colData = await colRes.json();
        const values = colData.values || [];
        
        const targetKey = String(keyValue).trim().toLowerCase();
        const rowIndex = values.findIndex((v: any[]) => String(v[0] || '').trim().toLowerCase() === targetKey);
        if (rowIndex >= 0) {
          const rowNum = rowIndex + 1;
          const updateRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedSheet + '!A' + rowNum)}?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ values: [row] }),
            }
          );
          const updateData = await updateRes.json();
          if (!updateRes.ok) throw new Error(updateData.error?.message || 'Sheets update failed');
          return updateData.updatedRange || '';
        }
      }
      return await appendRow(spreadsheetId, sheetName, row, token);
    };

    const updatedRange = await updateOrAppendRow();

    return new Response(
      JSON.stringify({ ok: true, updatedRange }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('backup-to-sheets error:', msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
