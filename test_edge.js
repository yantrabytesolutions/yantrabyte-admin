async function testEdgeFunc() {
  const url = 'https://eyajwjrafudarccvcada.supabase.co/functions/v1/send-ticket-email';
  try {
    const res = await fetch(url, {
      method: 'OPTIONS'
    });
    console.log(res.status, await res.text());
  } catch (err) {
    console.error(err);
  }
}
testEdgeFunc();
