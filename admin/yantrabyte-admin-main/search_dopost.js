import fs from 'fs';
const content = fs.readFileSync('d:\\Antigravity\\Code.gs', 'utf-8');
const lines = content.split('\n');
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function doPost(e) {')) {
    start = i;
  }
  if (start !== -1 && i > start && lines[i].includes('return ContentService.createTextOutput')) {
    if (lines[i+1] && lines[i+1].includes('setMimeType') && lines[i+3] && lines[i+3].includes('}')) {
       // Just find a reasonable block
    }
  }
}
for (let i = start; i < start + 50; i++) {
  if(lines[i]) console.log(`${i + 1}: ${lines[i]}`);
}
