import dotenv from 'dotenv';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

dotenv.config();

export async function exchangeCode(codeOrUrl) {
  let code = codeOrUrl.trim();
  if (code.includes('code=')) {
    const urlObj = new URL(code.startsWith('http') ? code : `https://example.com/?${code}`);
    code = urlObj.searchParams.get('code') || code;
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  const { tokens } = await oauth2.getToken(code);
  console.log('REFRESH_TOKEN:', tokens.refresh_token);

  if (tokens.refresh_token) {
    const envPath = path.resolve('.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
      envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/, `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('Updated .env with new GOOGLE_REFRESH_TOKEN successfully!');
  }

  return tokens;
}

if (process.argv[2]) {
  exchangeCode(process.argv[2])
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Exchange failed:', err.message);
      process.exit(1);
    });
}
