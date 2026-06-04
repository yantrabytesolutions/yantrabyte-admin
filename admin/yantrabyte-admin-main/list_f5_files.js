import fs from 'fs';
import path from 'path';

const convId = 'f5f7f842-4351-4f90-81c4-75b69ce64c40';
const dirPath = `C:\\Users\\sys1\\.gemini\\antigravity\\brain\\${convId}`;

function listAll(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(listAll(fullPath));
      } else {
        results.push({ path: fullPath, size: stat.size, mtime: stat.mtime });
      }
    });
  } catch (e) {}
  return results;
}

try {
  const files = listAll(dirPath);
  console.log(`Found ${files.length} files in ${convId}:`);
  files.sort((a, b) => b.mtime - a.mtime);
  files.forEach(f => {
    console.log(`- ${f.path.substring(dirPath.length)} (Size: ${f.size}, Modified: ${f.mtime.toISOString()})`);
  });
} catch (e) {
  console.error(e);
}
