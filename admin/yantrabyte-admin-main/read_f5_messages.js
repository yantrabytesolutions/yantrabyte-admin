import fs from 'fs';
import path from 'path';

const convId = 'f5f7f842-4351-4f90-81c4-75b69ce64c40';
const messagesDir = `C:\\Users\\sys1\\.gemini\\antigravity\\brain\\${convId}\\.system_generated\\messages`;

try {
  const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));
  files.forEach(f => {
    const fullPath = path.join(messagesDir, f);
    const stat = fs.statSync(fullPath);
    console.log(`=== File: ${f} (Modified: ${stat.mtime.toISOString()}) ===`);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      console.log(content);
    } catch (e) {
      console.error(e);
    }
    console.log('==================================================');
  });
} catch (e) {
  console.error(e);
}
