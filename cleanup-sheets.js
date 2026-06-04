import dotenv from 'dotenv';
dotenv.config();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const keepIds = [
  'YBS-20260516-001',
  'YBS-20260517-002',
  'YBS-20260517-003',
  'YBQ-20260519-004'
];

async function getAccessToken() {
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
    throw new Error('Failed to get Google access token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

async function processSheet(sheetName, token) {
  const quotedSheet = `'${sheetName.replace(/'/g, "''")}'`;
  
  // 1. Fetch existing data
  const rangeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedSheet + '!A:Z')}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const rangeData = await rangeRes.json();
  
  if (!rangeData.values || rangeData.values.length === 0) {
    console.log(`Sheet "${sheetName}" is empty or not found.`);
    return;
  }
  
  const headers = rangeData.values[0];
  const invoiceNoIndex = headers.findIndex(h => h.includes('Invoice No') || h.includes('No'));
  
  if (invoiceNoIndex === -1) {
    console.log(`Could not find "Invoice No" column in "${sheetName}". Skipping.`);
    return;
  }
  
  // 2. Filter rows
  const keptRows = [headers];
  let deletedCount = 0;
  
  for (let i = 1; i < rangeData.values.length; i++) {
    const row = rangeData.values[i];
    const invNo = row[invoiceNoIndex];
    if (keepIds.includes(invNo)) {
      keptRows.push(row);
    } else {
      deletedCount++;
    }
  }
  
  console.log(`Sheet "${sheetName}": Keeping ${keptRows.length - 1} rows, deleting ${deletedCount} rows.`);
  
  if (deletedCount > 0) {
    // 3. Clear sheet
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedSheet + '!A:Z')}:clear`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    );
    
    // 4. Write back kept rows
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(quotedSheet + '!A1')}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: keptRows }),
      }
    );
    console.log(`Sheet "${sheetName}" successfully updated.`);
  } else {
    console.log(`Sheet "${sheetName}" requires no deletion.`);
  }
}

async function run() {
  try {
    console.log('Fetching Google Access Token...');
    const token = await getAccessToken();
    console.log('Access token acquired. Processing Invoices sheet...');
    await processSheet('Invoices', token);
    console.log('Processing Quotations sheet...');
    await processSheet('Quotations', token);
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err.message || err);
  }
}

run();
