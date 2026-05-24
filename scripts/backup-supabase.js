import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
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

async function backup() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  let total = 0;
  let errors = [];

  for (const table of TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const filePath = join(OUTPUT_DIR, `${table}.json`);
      writeFileSync(filePath, JSON.stringify(data || [], null, 2));
      console.log(`${table}: ${(data || []).length} rows`);
      total += (data || []).length;
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

  writeFileSync(join(OUTPUT_DIR, '_summary.json'), JSON.stringify(summary, null, 2));
  writeFileSync(join(BACKUP_DIR, 'latest.json'), JSON.stringify({ latest: TIMESTAMP }, null, 2));

  if (errors.length) {
    console.error(`\nCompleted with ${errors.length} error(s)`);
    process.exit(1);
  }

  console.log(`\nBackup complete: ${total} rows across ${TABLES.length} tables`);
  console.log(`Saved to: backups/${TIMESTAMP}/`);
}

backup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
