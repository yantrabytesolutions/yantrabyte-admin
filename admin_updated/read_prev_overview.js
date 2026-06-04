import fs from 'fs';
const path = 'C:\\Users\\sys1\\.gemini\\antigravity\\brain\\101e815d-1be5-4182-9ca8-be7f7c0992ab\\.system_generated\\logs\\overview.txt';
try {
  const content = fs.readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  console.log(`Total lines: ${lines.length}`);
  console.log(`Line 87: ${lines[87] || ''}`);
  console.log(`Line 88: ${lines[88] || ''}`);
} catch (e) {
  console.error(e);
}
