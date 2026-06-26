async function run() {
  const res = await fetch('https://eyajwjrafudarccvcada.supabase.co/functions/v1/send-ticket-email', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTg0NjIsImV4cCI6MjA5NDQ5NDQ2Mn0.vQIGd5WdCfqhney2PKLImEDyF324lGmO2-3KaImIX04'
    },
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
