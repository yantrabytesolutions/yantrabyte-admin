import { google } from 'googleapis';
import http from 'http';
import { execSync } from 'child_process';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-client-id';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-client-secret';
const REDIRECT_URI = 'http://localhost:3001/oauth-callback';
const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// First, update the OAuth client's redirect URI in Google Cloud Console
console.log('=== STEP 1 ===');
console.log('Go to: https://console.cloud.google.com/apis/credentials?project=ybs-backup');
console.log('Click edit on "Web client 1"');
console.log('Under Authorized redirect URIs, add:');
console.log('  http://localhost:3001/oauth-callback');
console.log('Click Save. Then come back and press Enter.');
console.log('');

process.stdin.once('data', async () => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log('\n=== STEP 2 ===');
  console.log('Open this URL:');
  console.log(authUrl);
  console.log('\nAfter authorizing, you\'ll be redirected to localhost (which may not load).');
  console.log('Copy the ENTIRE localhost URL from your browser and paste it here:');
  console.log('');

  process.stdin.once('data', async (input) => {
    const url = input.toString().trim();
    try {
      const urlObj = new URL(url);
      const code = urlObj.searchParams.get('code');
      if (!code) throw new Error('No code found in URL');

      const { tokens } = await oauth2Client.getToken(code);
      console.log('\n=== REFRESH TOKEN ===');
      console.log(tokens.refresh_token);
      console.log('\n=== ACCESS TOKEN ===');
      console.log(tokens.access_token);
    } catch (err) {
      console.error('Error:', err.message);
    }
    process.exit(0);
  });
});
