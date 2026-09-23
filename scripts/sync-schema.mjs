import fs from 'node:fs';
import path from 'node:path';

const distIndex = path.resolve('dist/index.html');
const srcIndex = path.resolve('index.html');

if (fs.existsSync(distIndex) && fs.existsSync(srcIndex)) {
  const srcContent = fs.readFileSync(srcIndex, 'utf8');
  let distContent = fs.readFileSync(distIndex, 'utf8');

  // Extract ld+json from src
  const srcSchemaMatch = srcContent.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (srcSchemaMatch) {
    distContent = distContent.replace(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
      srcSchemaMatch[0]
    );
    fs.writeFileSync(distIndex, distContent, 'utf8');
    console.log('Successfully updated dist/index.html with latest Google LocalBusiness schema!');
  }
}
