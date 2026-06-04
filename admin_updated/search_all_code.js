import fs from 'fs';
import path from 'path';

const files = fs.readdirSync('d:\\Antigravity').filter(f => f.endsWith('.gs'));
const query = 'appendRow';

files.forEach(f => {
  const content = fs.readFileSync(path.join('d:\\Antigravity', f), 'utf-8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(query.toLowerCase())) {
      console.log(`${f}:${idx + 1}: ${line.trim()}`);
    }
  });
});
