import fs from 'fs';
const content = fs.readFileSync('d:\\Antigravity\\admin\\yantrabyte-admin-main\\src\\admin\\AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('fetch') || line.toLowerCase().includes('url') || line.toLowerCase().includes('script')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
