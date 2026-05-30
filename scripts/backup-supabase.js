import ws from 'ws';
// Polyfill WebSocket for Node.js < 22 (e.g. GitHub Actions Node 20)
if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}

import dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '..', '.env') });

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { google } from 'googleapis';
import { Readable } from 'stream';

const BACKUP_DIR = join(__dirname, '..', 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUTPUT_DIR = join(BACKUP_DIR, TIMESTAMP);

const TABLES = [
  'service_tickets',
  'invoices',
  'customers',
  'purchases',
  'suppliers',
  'products',
  'services',
  'pages',
  'blog_posts',
  'testimonials',
  'team_members',
  'careers',
  'industries',
  'faqs',
  'gallery_images',
  'client_logos',
  'contact_submissions',
  'site_settings',
];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function createAuth() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );
    oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return oauth2;
  }

  const keyFile = resolve(__dirname, '..', process.env.GOOGLE_APPLICATION_CREDENTIALS || '');
  if (keyFile && existsSync(keyFile)) {
    return new google.auth.GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
  }

  return null;
}

async function backup() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const auth = createAuth();
  let drive = null;
  let driveFolderId = null;

  if (auth && process.env.GOOGLE_DRIVE_FOLDER_ID) {
    try {
      drive = google.drive({ version: 'v3', auth });
      console.log(`Creating Drive backup folder: Backup_${TIMESTAMP}...`);
      const folderRes = await drive.files.create({
        requestBody: {
          name: `Backup_${TIMESTAMP}`,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        },
        fields: 'id',
      });
      driveFolderId = folderRes.data.id;
      console.log(`Drive folder created: ${driveFolderId}`);
    } catch (err) {
      console.warn('Could not initialize Google Drive folder backup:', err.message);
    }
  } else {
    console.log('Google Drive credentials not set. Saving locally only.');
  }

  let total = 0;
  let errors = [];

  for (const table of TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const fileContent = JSON.stringify(data || [], null, 2);
      
      // Save locally
      const filePath = join(OUTPUT_DIR, `${table}.json`);
      writeFileSync(filePath, fileContent);
      console.log(`${table}: ${(data || []).length} rows`);
      total += (data || []).length;

      // Upload to Drive
      if (drive && driveFolderId) {
        process.stdout.write(`  Uploading ${table}.json to Drive... `);
        await drive.files.create({
          requestBody: {
            name: `${table}.json`,
            parents: [driveFolderId],
          },
          media: {
            mimeType: 'application/json',
            body: Readable.from(fileContent),
          },
        });
        console.log('✅');
      }
    } catch (err) {
      const msg = `${table}: ERROR - ${err.message || err}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  const summary = {
    timestamp: TIMESTAMP,
    total_rows: total,
    tables_backed_up: TABLES.length,
    tables_with_errors: errors.length,
    errors: errors.length ? errors : undefined,
  };

  const summaryContent = JSON.stringify(summary, null, 2);
  writeFileSync(join(OUTPUT_DIR, '_summary.json'), summaryContent);
  writeFileSync(join(BACKUP_DIR, 'latest.json'), JSON.stringify({ latest: TIMESTAMP }, null, 2));

  // Upload summary to Drive
  if (drive && driveFolderId) {
    try {
      await drive.files.create({
        requestBody: {
          name: '_summary.json',
          parents: [driveFolderId],
        },
        media: {
          mimeType: 'application/json',
          body: Readable.from(summaryContent),
        },
      });
    } catch (err) {
      console.error('Failed to upload summary to Drive:', err.message);
    }
  }

  if (errors.length) {
    console.error(`\nCompleted with ${errors.length} error(s)`);
    process.exit(1);
  }

  console.log(`\nBackup complete: ${total} rows across ${TABLES.length} tables`);
  console.log(`Saved locally: backups/${TIMESTAMP}/`);
  if (driveFolderId) {
    console.log(`Saved to Google Drive folder: Backup_${TIMESTAMP}`);
  }
}

backup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
