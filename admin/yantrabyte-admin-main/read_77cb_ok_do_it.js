import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\sys1\\.gemini\\antigravity\\brain';
const conv = '77cba6ce-0713-4e59-8161-bc8312dfe573';
const dirPath = path.join(brainDir, conv);

try {
  const transPath = path.join(dirPath, '.system_generated', 'logs', 'transcript.jsonl');
  if (fs.existsSync(transPath)) {
    const content = fs.readFileSync(transPath, 'utf-8');
    const lines = content.trim().split('\n');
    console.log(`Total lines: ${lines.length}`);
    for (let i = 100; i < Math.min(140, lines.length); i++) {
      console.log(`Line ${i}:`);
      const obj = JSON.parse(lines[i]);
      console.log(`Source: ${obj.source}, Type: ${obj.type}`);
      if (obj.content) {
        console.log(`Content snippet: ${obj.content.substring(0, 1000)}`);
      }
      if (obj.tool_calls) {
        console.log(`Tool Calls:`, JSON.stringify(obj.tool_calls));
      }
      console.log('-------------------------------------------');
    }
  }
} catch (e) {
  console.error(e);
}
