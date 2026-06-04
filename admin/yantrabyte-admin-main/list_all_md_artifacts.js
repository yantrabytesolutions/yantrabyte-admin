import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\sys1\\.gemini\\antigravity\\brain';

function scanDir(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (file !== '.system_generated' && file !== 'node_modules' && file !== '.git') {
          results = results.concat(scanDir(fullPath));
        }
      } else if (file.endsWith('.md')) {
        results.push({ path: fullPath, mtime: stat.mtime });
      }
    });
  } catch (e) {}
  return results;
}

try {
  const mdFiles = scanDir(brainDir);
  console.log(`Found ${mdFiles.length} markdown files:`);
  
  // Sort by mtime descending
  mdFiles.sort((a, b) => b.mtime - a.mtime);
  
  mdFiles.forEach((f, idx) => {
    console.log(`${idx + 1}. Path: ${f.path} (Modified: ${f.mtime.toISOString()})`);
    try {
      const content = fs.readFileSync(f.path, 'utf-8');
      console.log('--- Content ---');
      console.log(content.substring(0, 1500));
      if (content.length > 1500) {
        console.log('... [TRUNCATED] ...');
      }
      console.log('==================================================');
    } catch(e) {
      console.error('Error reading file:', e);
    }
  });
} catch(e) {
  console.error(e);
}
