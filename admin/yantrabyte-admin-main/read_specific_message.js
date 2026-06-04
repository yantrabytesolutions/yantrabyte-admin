import fs from 'fs';
const path = 'C:\\Users\\sys1\\.gemini\\antigravity\\brain\\f5f7f842-4351-4f90-81c4-75b69ce64c40\\.system_generated\\messages\\42096d91-4a59-4437-8774-be916f71ae67.json';
try {
  console.log(fs.readFileSync(path, 'utf-8'));
} catch (e) {
  console.error(e);
}
