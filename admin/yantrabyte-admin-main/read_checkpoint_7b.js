import fs from 'fs';
const convId = '7b9155f3-4da9-4cf2-b2f2-931e3bf670a9';
const path = `C:\\Users\\sys1\\.gemini\\antigravity\\brain\\${convId}\\.system_generated\\logs\\transcript.jsonl`;

try {
  const content = fs.readFileSync(path, 'utf-8');
  const lines = content.trim().split('\n');
  
  // Find checkpoints or model responses with goals
  lines.forEach((line, idx) => {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'CHECKPOINT') {
        console.log(`Line ${idx} [CHECKPOINT]:`);
        console.log(obj.content);
        console.log('=============================');
      } else if (idx === 0 || idx === 1 || idx === 2) {
        console.log(`Line ${idx} [${obj.type}]:`);
        console.log(obj.content);
        console.log('=============================');
      }
    } catch(e) {}
  });
} catch (e) {
  console.error(e);
}
