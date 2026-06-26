async function run() {
  const res = await fetch('https://dpwwgbbczhssiukctixu.supabase.co/functions/v1/send-ticket-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ticket_number: "TEST-999",
      customer_email: "sguragha@gmail.com",
      customer_name: "Test User",
      customer_phone: "1234567890",
      device_type: "Laptop",
      issue_description: "Test issue",
      priority: "low"
    })
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}
run();
