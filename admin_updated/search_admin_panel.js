import fs from 'fs';
const content = fs.readFileSync('d:\\Antigravity\\admin\\yantrabyte-admin-main\\src\\admin\\AdminPanel.tsx', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('fetch(') || line.includes('axios') || line.includes('url') || line.includes('API') || line.includes('gas') || line.includes('script.google')) {
    if (line.trim().length < 150) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
