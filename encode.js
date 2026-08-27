const fs = require('fs');
const path = require('path');

try {
  const imagePath = path.join(__dirname, 'computer hardware items.jpg');
  if (!fs.existsSync(imagePath)) {
    console.error('File not found:', imagePath);
    process.exit(1);
  }
  const base64Data = fs.readFileSync(imagePath).toString('base64');
  const dataUri = `data:image/jpeg;base64,${base64Data}`;
  fs.writeFileSync(path.join(__dirname, 'base64.txt'), dataUri, 'utf8');
  console.log('Successfully wrote base64 to base64.txt');
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
