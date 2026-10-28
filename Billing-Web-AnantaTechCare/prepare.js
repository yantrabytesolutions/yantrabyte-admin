const fs = require('fs');
let html = fs.readFileSync('D:/Antigravity/yantrabyte-bolt/Billing-Web/index.html', 'utf8');

const scriptStart = html.indexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>') + 9;

if (scriptStart !== -1 && scriptEnd !== -1) {
  html = html.substring(0, scriptStart) + '<script src="app.js"></script>' + html.substring(scriptEnd);
  fs.writeFileSync('D:/Antigravity/yantrabyte-bolt/Billing-Web/index.html', html);
  console.log('Successfully stripped inline script and linked app.js');
} else {
  console.log('Script tag not found');
}
