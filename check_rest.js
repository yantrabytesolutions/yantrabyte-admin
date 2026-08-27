async function check() {
  const supabaseUrl = 'http://127.0.0.1:54321';
  const anonKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
  
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`
  };

  try {
    const res1 = await fetch(`${supabaseUrl}/rest/v1/Form%20Responses%201?select=*`, { headers });
    console.log('Form Responses 1:', await res1.text());

    const res2 = await fetch(`${supabaseUrl}/rest/v1/service_tickets?select=*`, { headers });
    console.log('service_tickets:', await res2.text());

    const res3 = await fetch(`${supabaseUrl}/rest/v1/contact_submissions?select=*`, { headers });
    console.log('contact_submissions:', await res3.text());
  } catch(e) {
    console.error(e);
  }
}
check();
