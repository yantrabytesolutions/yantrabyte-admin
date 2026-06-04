import fs from 'fs';
import path from 'path';

const brainDir = 'C:\\Users\\sys1\\.gemini\\antigravity\\brain';
const recentConvs = [
  '4f05ccdf-4d9c-4dba-8422-9630e428bb10',
  'f5f7f842-4351-4f90-81c4-75b69ce64c40',
  '47bd1dab-1480-47f8-9ab5-b0b3c9995f5f',
  '7b9155f3-4da9-4cf2-b2f2-931e3bf670a9'
];

recentConvs.forEach(conv => {
  const dirPath = path.join(brainDir, conv);
  if (!fs.existsSync(dirPath)) return;
  console.log(`=== Conversation ${conv} ===`);
  try {
    const files = fs.readdirSync(dirPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    console.log(`Markdown files:`, mdFiles);
    mdFiles.forEach(f => {
      const content = fs.readFileSync(path.join(dirPath, f), 'utf-8');
      console.log(`--- ${f} ---`);
      console.log(content);
      console.log('------------------------------');
    });
  } catch (e) {
    console.error(e);
  }
});
