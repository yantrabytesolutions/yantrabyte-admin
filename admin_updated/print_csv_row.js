import fs from 'fs';

const filePath = 'C:\\Users\\sys1\\.gemini\\antigravity\\brain\\7b33dfe9-0f90-433d-bb0d-d4620377a564\\.system_generated\\steps\\62\\content.md';
const content = fs.readFileSync(filePath, 'utf-8');

// Basic CSV parser that handles double quotes and newlines within cells
function parseCSV(text) {
  const result = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Double quote inside quoted cell
          cell += '"';
          i++; // skip next char
        } else {
          // End of quotes
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip LF if CRLF
        }
        row.push(cell.trim());
        result.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    result.push(row);
  }
  return result;
}

const parsed = parseCSV(content);

// Remove any leading metadata lines if they exist
// Let's print the first few rows to find the header row.
console.log('First 5 rows:');
for (let i = 0; i < Math.min(5, parsed.length); i++) {
  console.log(`Row ${i} (cols: ${parsed[i].length}):`, parsed[i].slice(0, 5));
}
console.log();

// The first row starts with "Source: ..." so let's find the row that has "Timestamp" or "Customer Name"
let headerIndex = -1;
for (let i = 0; i < parsed.length; i++) {
  if (parsed[i].includes('Timestamp') || parsed[i].includes('Customer Name')) {
    headerIndex = i;
    break;
  }
}

if (headerIndex === -1) {
  console.error('Could not find header row!');
  process.exit(1);
}

const headers = parsed[headerIndex];
console.log(`Header row found at index ${headerIndex} with ${headers.length} columns.`);
console.log('Headers:', headers);
console.log();

// Print non-empty data rows after the header
console.log('--- ALL DATA ROWS ---');
let dataRowCount = 0;
for (let i = headerIndex + 1; i < parsed.length; i++) {
  const row = parsed[i];
  // Skip completely empty rows
  if (row.length === 0 || row.join('').trim() === '') continue;
  
  dataRowCount++;
  console.log(`\nRow ${dataRowCount} (original index ${i}):`);
  for (let j = 0; j < Math.max(headers.length, row.length); j++) {
    const h = headers[j] || `Col_${j}`;
    const v = row[j] || '';
    if (v) {
      console.log(`  ${h}: "${v}"`);
    }
  }
}
