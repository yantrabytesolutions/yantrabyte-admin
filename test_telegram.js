const token = '8565272607:AAE28T8dPp2SOuV52g-8s7G3n9Fs_frcPZA';
const chatId = '8881083212';
const message = 'Test message from server';

async function test() {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message })
  });
  
  console.log(response.status);
  console.log(await response.text());
}

test();
