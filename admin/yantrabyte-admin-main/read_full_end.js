import fs from 'fs';
const convId = 'f5f7f842-4351-4f90-81c4-75b69ce64c40';
const path = `C:\\Users\\sys1\\.gemini\\antigravity\\brain\\${convId}\\.system_generated\\logs\\transcript.jsonl`;

try {
  const content = fs.readFileSync(path, 'utf-8');
  const lines = content.trim().split('\n');
  console.log(`Total lines: ${lines.length}`);
  const lastN = Math.min(15, lines.length);
  for (let i = lines.length - lastN; i < lines.length; i++) {
    console.log(`Line ${i}:`);
    console.log(lines[i]);
    console.log('-------------------------------------------');
  }
} catch (e) {
  console.error(e);
}
