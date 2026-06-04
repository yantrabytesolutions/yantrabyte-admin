import fs from 'fs';
const path = 'C:\\Users\\sys1\\.gemini\\antigravity\\brain\\7b33dfe9-0f90-433d-bb0d-d4620377a564\\.system_generated\\logs\\overview.txt';
try {
  const content = fs.readFileSync(path, 'utf-8');
  const lines = content.split('\n');
  console.log(`Total lines: ${lines.length}`);
  console.log('Lines 0 to 15:');
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    console.log(`${i}: ${lines[i]}`);
  }
} catch (e) {
  console.error(e);
}
