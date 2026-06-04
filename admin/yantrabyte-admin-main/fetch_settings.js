import dotenv from 'dotenv';
dotenv.config({ path: 'd:/Antigravity/admin/yantrabyte-admin-main/.env.local' });

async function getSettings() {
  const url = process.env.VITE_SUPABASE_URL + '/rest/v1/site_settings';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.log("Missing Supabase credentials in env");
    return;
  }
  
  const response = await fetch(url, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  
  const data = await response.json();
  console.log("Site Settings:", data);
}

getSettings();
