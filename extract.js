const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\softw\\.gemini\\antigravity\\brain\\3c8c34b3-3dc4-4ad4-af3c-d47ad04a8cf3\\.system_generated\\steps\\3\\content.md', 'utf8');

// Let's find any large JSON structure or specific tags.
// Let's extract any text inside <div class="message-content"> or similar, or let's search for interesting text.
// Gemini share pages have script tags with WIZ_global_data.
// Let's find all script tags.
const regex = /window\.WIZ_global_data\s*=\s*({[\s\S]*?});/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log("Found WIZ_global_data!");
  const jsonStr = match[1];
  try {
    // Write JSON to a file to examine
    fs.writeFileSync('wiz_data.json', jsonStr);
    console.log("Wrote wiz_data.json");
  } catch (e) {
    console.error("Error parsing JSON:", e.message);
  }
}

// Also let's extract all text content from HTML tags.
// A crude regex to strip HTML tags and print non-empty lines
const cleanText = content.replace(/<[^>]*>/g, ' ');
const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
fs.writeFileSync('clean_text.txt', lines.join('\n'));
console.log("Wrote clean_text.txt with lines count:", lines.length);
