async function checkSheet() {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/1y6dyRVn0seq5qZfVmThTXJHiEoyG9kgoLeOj9WZbBOc/export?format=csv&gid=1073064749';
  const response = await fetch(csvUrl);
  const text = await response.text();
  
  const lines = text.split('\n');
  const headerLine = lines.find(l => l.includes('Timestamp') || l.includes('Customer Name'));
  if (!headerLine) {
    console.log("No header line found.");
    return;
  }
  
  console.log("Header Line:", headerLine);
  
  const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
  const headers = headerLine.split(regex).map(h => h.trim().replace(/^"|"$/g, ''));
  
  console.log("--- HEADERS ---");
  headers.forEach((h, i) => console.log(`${i}: ${h}`));
}

checkSheet();
