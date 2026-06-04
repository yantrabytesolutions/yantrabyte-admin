import fs from 'fs';
const content = fs.readFileSync('d:\\Antigravity\\admin\\yantrabyte-admin-main\\src\\admin\\AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const syncFromGoogleSheet = async () => {')) {
    start = i;
  }
  if (start !== -1 && i > start && lines[i].includes('setIsSyncing(false);')) {
    end = i + 2;
    break;
  }
}
console.log(`Start: ${start + 1}, End: ${end + 1}`);
for (let i = start; i < end; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
