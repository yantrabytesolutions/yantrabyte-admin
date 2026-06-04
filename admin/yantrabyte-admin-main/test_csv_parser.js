

async function testSync() {
  console.log("Fetching CSV from Google Sheets...");
  const csvUrl = 'https://docs.google.com/spreadsheets/d/1y6dyRVn0seq5qZfVmThTXJHiEoyG9kgoLeOj9WZbBOc/export?format=csv&gid=1073064749';
  const response = await fetch(csvUrl);
  const csvText = await response.text();

  console.log("Parsing CSV with updated logic...");
  
  // The exact parseCSV function implemented in AdminPanel.tsx
  const parseCSV = (text) => {
    const result = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (inQuotes) {
        if (char === '"' && nextChar === '"') { cell += '"'; i++; }
        else if (char === '"') { inQuotes = false; }
        else { cell += char; }
      } else {
        if (char === '"') { inQuotes = true; }
        else if (char === ',') { row.push(cell.trim()); cell = ''; }
        else if (char === '\n' || char === '\r') {
          if (char === '\r' && nextChar === '\n') i++;
          row.push(cell.trim()); result.push(row); row = []; cell = '';
        } else { cell += char; }
      }
    }
    if (cell || row.length > 0) { row.push(cell.trim()); result.push(row); }
    return result;
  };

  const parsedRows = parseCSV(csvText);
  const newTickets = [];
  let headerIndex = -1;
  
  for (let i = 0; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    if (row.length === 0 || row.join('').trim() === '') continue;
    
    if (headerIndex === -1 && (row.includes('Timestamp') || row.includes('Customer Name'))) {
       headerIndex = i;
       continue;
    }
    
    if (headerIndex !== -1 && i > headerIndex) {
      if (row.length > 9) {
        const name = row[1] || '';
        const issue = row[6] || '';
        const address = row[9] || '';
        let ticketId = row[20] || '';
        const statusRaw = (row[12] || 'open').toLowerCase();
        
        let status = 'open';
        if (statusRaw.includes('progress')) status = 'in-progress';
        if (statusRaw.includes('closed') || statusRaw.includes('resolved') || statusRaw.includes('delivered')) status = 'closed';
        if (!ticketId) ticketId = `YBS-FORM-${Date.now()}-${i}`;
        
        if (name) {
          newTickets.push({
            ticket_number: ticketId,
            customer_name: name,
            issue_description: issue,
            address: address,
            status: status
          });
        }
      }
    }
  }

  console.log(`Successfully parsed ${newTickets.length} tickets!`);
  console.log("Latest 5 parsed tickets:");
  newTickets.slice(-5).forEach((t, index) => {
    console.log(`\nTicket ${newTickets.length - 5 + index + 1}:`);
    console.log(`  Name:   ${t.customer_name}`);
    console.log(`  ID:     ${t.ticket_number}`);
    console.log(`  Status: ${t.status}`);
    console.log(`  Issue:  ${t.issue_description}`);
    console.log(`  Address:  ${t.address}`);
  });
}

testSync().catch(console.error);
