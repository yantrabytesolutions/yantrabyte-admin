
async function getGids() {
  const url = 'https://docs.google.com/spreadsheets/d/1y6dyRVn0seq5qZfVmThTXJHiEoyG9kgoLeOj9WZbBOc/htmlview';
  const response = await fetch(url);
  const text = await response.text();
  const regex = /"name":"([^"]+)","gid":"?(\d+)"?/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    console.log(`Sheet: ${match[1]}, GID: ${match[2]}`);
  }
}
getGids().catch(console.error);
