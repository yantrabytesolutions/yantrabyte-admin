import { google } from 'googleapis';
import { createInterface } from 'readline';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-client-id';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-client-secret';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

console.log('\n=== STEP 1 ===');
console.log('Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n=== STEP 2 ===');
console.log('Sign in with your Google account and click Allow.');
console.log('You will be redirected to a page with a "code" parameter in the URL.');
console.log('\n=== STEP 3 ===');
console.log('Copy the ENTIRE redirected URL from your browser address bar and paste it below:\n');

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the full redirect URL here:\n', async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n=== REFRESH TOKEN ===');
    console.log(tokens.refresh_token);
    console.log('\n=== ACCESS TOKEN (expires soon) ===');
    console.log(tokens.access_token);
  } catch (err) {
    console.error('Error:', err.message);
  }
});
