const fs = require('fs');
const { execSync } = require('child_process');

try {
  console.log("Checking Nginx configs...");
  const sitesAvailable = '/etc/nginx/sites-available';
  const files = fs.readdirSync(sitesAvailable);
  
  let fixed = false;
  
  for (const file of files) {
    if (file === 'default' || file.includes('yantra')) {
      const filePath = `${sitesAvailable}/${file}`;
      let content = fs.readFileSync(filePath, 'utf8');
      
      if (!content.includes('location /api/')) {
        console.log(`Found candidate config: ${file}`);
        
        // Find the HTTPS server block (listen 443) or just the main server block
        // This is a simple injection strategy.
        const proxyBlock = `
    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
`;
        
        // Let's insert it before the first "location / " or just before the closing brace of the server block
        if (content.includes('location / {')) {
          content = content.replace('location / {', proxyBlock + '\n    location / {');
          fs.writeFileSync(filePath, content);
          console.log(`Successfully injected reverse proxy into ${file}`);
          fixed = true;
        } else if (content.includes('server_name yantrabyte.anantatechcare.com')) {
           // Insert near the server_name
           content = content.replace('server_name yantrabyte.anantatechcare.com;', 'server_name yantrabyte.anantatechcare.com;\n' + proxyBlock);
           fs.writeFileSync(filePath, content);
           console.log(`Successfully injected reverse proxy into ${file}`);
           fixed = true;
        }
      } else {
        console.log(`${file} already has /api/ configured.`);
      }
    }
  }
  
  if (fixed) {
    execSync('systemctl restart nginx');
    console.log("Nginx restarted successfully!");
  } else {
    console.log("Could not find a place to automatically inject the config. Please check manually.");
  }
  
} catch(e) {
  console.error("Error:", e.message);
}
