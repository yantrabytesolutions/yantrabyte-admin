import fs from 'fs';
const content = fs.readFileSync('d:\\Antigravity\\Code.gs', 'utf-8');
const lines = content.split('\n');
const query = process.argv[2] || '';
console.log(`Searching for "${query}" in Code.gs...`);
let matches = 0;
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes(query.toLowerCase())) {
    console.log(`${idx + 1}: ${line.trim()}`);
    matches++;
  }
});
console.log(`Found ${matches} matches.`);
