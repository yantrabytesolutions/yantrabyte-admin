import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  try {
    fs.readdirSync(dir).forEach(f => {
      if (f === 'node_modules' || f === '.git' || f === '.gemini') return;
      let dirPath = path.join(dir, f);
      let isDirectory = fs.statSync(dirPath).isDirectory();
      if (isDirectory) {
        walkDir(dirPath, callback);
      } else {
        callback(dirPath);
      }
    });
  } catch (e) {}
}

const query = 'Record Type';
walkDir('d:\\Antigravity', (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.gs') || filePath.endsWith('.json')) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        console.log(`${filePath.replace('d:\\Antigravity\\', '')}:${idx + 1}: ${line.trim()}`);
      }
    });
  }
});
console.log('Search complete.');
