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

<<<<<<< HEAD
async function uploadToDrive(fileName: string, base64Data: string, folderId: string, token: string): Promise<string> {
  // Step 1: Create file metadata
  const metaRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: fileName,
      parents: [folderId],
      mimeType: 'application/pdf'
    })
  });
  
  const meta = await metaRes.json();
  if (!meta.id) {
    throw new Error('Failed to create Drive file: ' + JSON.stringify(meta));
  }
  
  // Step 2: Upload content
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${meta.id}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/pdf'
    },
    body: bytes
  });
  
  if (!uploadRes.ok) {
    const errorBody = await uploadRes.text();
    throw new Error('Failed to upload file content: ' + errorBody);
  }

  // Step 2.5: Set sharing permissions to 'Anyone with the link can view'
  await fetch(`https://www.googleapis.com/drive/v3/files/${meta.id}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });

  // Step 3: Get webViewLink
  const linkRes = await fetch(`https://www.googleapis.com/drive/v3/files/${meta.id}?fields=webViewLink`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const linkData = await linkRes.json();
  return linkData.webViewLink || `https://drive.google.com/file/d/${meta.id}/view`;
=======
async function clearSheet(spreadsheetId: string, sheetName: string, token: string): Promise<void> {
  const quotedSheet = `'${sheetName.replace(/'/g, "''")}'`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedSheet + '!A:Z')}:clear`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || 'Sheets clear failed');
  }
>>>>>>> 1ec7463 (chore: refactor billing software and update typings)
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
<<<<<<< HEAD
    const { sheetName, headers, row, pdfBase64, invoiceNo } = body;
=======
    const { sheetName, headers, row, action } = body;
>>>>>>> 1ec7463 (chore: refactor billing software and update typings)

    if (!sheetName) {
      return new Response(
        JSON.stringify({ ok: false, error: 'sheetName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = await getAccessToken(clientId, clientSecret, refreshToken);
    await ensureSheet(spreadsheetId, sheetName, token);

<<<<<<< HEAD
    const finalRow = [...row];

    if (pdfBase64 && invoiceNo) {
      const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');
      if (!folderId) {
        console.warn('GOOGLE_DRIVE_FOLDER_ID not set. Skipping PDF upload.');
      } else {
        const fileUrl = await uploadToDrive(`${invoiceNo}.pdf`, pdfBase64, folderId, token);
        // Append PDF link to the row
        // Check if headers contains "PDF Link", if not, we can just append it
        if (!headers.includes('PDF Link')) {
          headers.push('PDF Link');
        }
        finalRow.push(fileUrl);
      }
=======
    if (action === 'clear') {
      await clearSheet(spreadsheetId, sheetName, token);
      return new Response(JSON.stringify({ ok: true, cleared: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!Array.isArray(headers) || !Array.isArray(row)) {
      return new Response(
        JSON.stringify({ ok: false, error: 'headers (array), and row (array) are required for append/update' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
>>>>>>> 1ec7463 (chore: refactor billing software and update typings)
    }

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
              body: JSON.stringify({ values: [finalRow] }),
            }
          );
          const updateData = await updateRes.json();
          if (!updateRes.ok) throw new Error(updateData.error?.message || 'Sheets update failed');
          return updateData.updatedRange || '';
        }
      }
      return await appendRow(spreadsheetId, sheetName, finalRow, token);
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
