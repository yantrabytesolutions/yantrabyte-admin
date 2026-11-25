function getSupabaseConfig_() {
  const props = PropertiesService.getScriptProperties();
  const url = (props.getProperty('SUPABASE_URL') || '').replace(/\/+$/, '');
  const key = props.getProperty('SUPABASE_SERVICE_KEY') || props.getProperty('SUPABASE_KEY') || '';
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in Apps Script Script Properties.');
  }
  return { url: url, key: key };
}

function supabaseGet(table, queryParams) {
  const cfg = getSupabaseConfig_();
  let url = cfg.url + '/rest/v1/' + table;
  if (queryParams) {
    url += '?' + queryParams;
  }
  
  const options = {
    method: 'get',
    headers: {
      'apikey': cfg.key,
      'Authorization': 'Bearer ' + cfg.key,
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
  const cfg = getSupabaseConfig_();
  const url = cfg.url + '/rest/v1/' + table;
  const options = {
    method: 'post',
    headers: {
      'apikey': cfg.key,
      'Authorization': 'Bearer ' + cfg.key,
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
  const cfg = getSupabaseConfig_();
  const url = cfg.url + '/rest/v1/' + table + '?' + matchQuery;
  const options = {
    method: 'patch',
    headers: {
      'apikey': cfg.key,
      'Authorization': 'Bearer ' + cfg.key,
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
  const cfg = getSupabaseConfig_();
  const url = cfg.url + '/storage/v1/object/' + bucket + '/' + encodeURIComponent(path);
  const options = {
    method: 'post',
    headers: {
      'apikey': cfg.key,
      'Authorization': 'Bearer ' + cfg.key,
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
  
  return cfg.url + '/storage/v1/object/public/' + bucket + '/' + encodeURIComponent(path);
}
