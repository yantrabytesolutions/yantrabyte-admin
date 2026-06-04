import fs from 'fs';
const buf = fs.readFileSync('d:\\Antigravity\\Code.gs');
if (buf[0] === 0xff && buf[1] === 0xfe) {
  console.log('Encoding: UTF-16LE (BOM)');
} else if (buf[0] === 0xfe && buf[1] === 0xff) {
  console.log('Encoding: UTF-16BE (BOM)');
} else if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
  console.log('Encoding: UTF-8 (BOM)');
} else {
  console.log('Encoding: Likely UTF-8 or ASCII');
}
console.log('First 50 bytes:', buf.slice(0, 50));
