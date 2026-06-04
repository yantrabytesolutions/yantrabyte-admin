import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('d:\\Antigravity').filter(f => f.startsWith('Index') && f.endsWith('.html'));

files.forEach(f => {
  const content = fs.readFileSync(path.join('d:\\Antigravity', f), 'utf-8');
  const lines = content.split('\n');
  console.log(`--- Matches in ${f} ---`);
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('address') || line.toLowerCase().includes('issue') || line.toLowerCase().includes('submit')) {
      if (line.trim().length < 150) {
        console.log(`${idx + 1}: ${line.trim()}`);
      }
    }
  });
});
