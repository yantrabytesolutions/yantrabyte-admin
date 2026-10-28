const SUPABASE_URL = 'https://eyajwjrafudarccvcada.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkxODQ2MiwiZXhwIjoyMDk0NDk0NDYyfQ.9A9D9dPb_GoHJiREuIWML1PATN-es4MC9_DE8wvK76g';

function supabaseGet(table, queryParams) {
  let url = SUPABASE_URL + '/rest/v1/' + table;
  if (queryParams) {
    url += '?' + queryParams;
  }
  
  const options = {
    method: 'get',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };
  
  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() >= 400) {
    throw new Error('Supabase GET Error: ' + res.getContentText());
  }
  return JSON.parse(res.getContentText());
}

function supabasePost(table, data) {
  const url = SUPABASE_URL + '/rest/v1/' + table;
  const options = {
    method: 'post',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };
  
  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() >= 400) {
    throw new Error('Supabase POST Error: ' + res.getContentText());
  }
  return JSON.parse(res.getContentText());
}

function supabasePatch(table, data, matchQuery) {
  const url = SUPABASE_URL + '/rest/v1/' + table + '?' + matchQuery;
  const options = {
    method: 'patch',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };
  
  const res = UrlFetchApp.fetch(url, options);
  if (res.getResponseCode() >= 400) {
    throw new Error('Supabase PATCH Error: ' + res.getContentText());
  }
  return JSON.parse(res.getContentText());
}

function supabaseUploadStorage(bucket, path, blob) {
  const url = SUPABASE_URL + '/storage/v1/object/' + bucket + '/' + encodeURIComponent(path);
  const options = {
    method: 'post',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': blob.getContentType() || 'application/pdf'
    },
    payload: blob.getBytes(),
    muteHttpExceptions: true
  };
  
  const res = UrlFetchApp.fetch(url, options);
  // Storage API sometimes returns 400s if file exists, we could handle upsert but let's keep simple
  if (res.getResponseCode() >= 400) {
    throw new Error('Supabase Storage Error: ' + res.getContentText());
  }
  
  return SUPABASE_URL + '/storage/v1/object/public/' + bucket + '/' + encodeURIComponent(path);
}
