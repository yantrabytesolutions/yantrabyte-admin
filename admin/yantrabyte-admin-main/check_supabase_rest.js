async function testEndpoint(name, url) {
  const apiKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
      }
    });
    if (!res.ok) {
      console.log(`Endpoint ${name} failed with status: ${res.status}`);
      const text = await res.text();
      console.log('Response:', text);
      return;
    }
    const data = await res.json();
    console.log(`--- ${name} (count: ${data.length}) ---`);
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
    console.log();
  } catch (err) {
    console.error(`Error querying ${name}:`, err.message);
  }
}

async function main() {
  const baseUrl = 'http://127.0.0.1:54321/rest/v1';
  
  console.log('Querying Supabase Local REST API...');
  console.log();

  await testEndpoint('SITE SETTINGS', `${baseUrl}/site_settings?select=*`);
  await testEndpoint('SERVICE TICKETS', `${baseUrl}/service_tickets?select=*&order=created_at.desc`);
  await testEndpoint('INVOICES', `${baseUrl}/invoices?select=*&order=created_at.desc`);
}

main();
