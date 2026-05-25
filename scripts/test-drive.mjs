import dotenv from 'dotenv';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

async function main() {
  const keyFile = resolve(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  console.log('Testing Drive upload...');
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });

  // Try listing files in the shared folder first
  try {
    const list = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name)',
      pageSize: 5,
    });
    console.log('Folder access OK. Existing files:', list.data.files?.length || 0);
  } catch (err) {
    console.error('Cannot access folder:', err.message);
    throw err;
  }

  // Try creating a test file
  const testContent = Buffer.from('Hello YantraByte!');
  const result = await drive.files.create({
    requestBody: {
      name: 'test-access.txt',
      parents: [folderId],
    },
    media: { mimeType: 'text/plain', body: Readable.from(testContent) },
    fields: 'id,name,webViewLink',
  });
  console.log('File created:', result.data.webViewLink);

  // Clean up
  await drive.files.delete({ fileId: result.data.id });
  console.log('Test file cleaned up. Drive access works!');
}

main().catch(err => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
