import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWp3anJhZnVkYXJjY3ZjYWRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkxODQ2MiwiZXhwIjoyMDk0NDk0NDYyfQ.9A9D9dPb_GoHJiREuIWML1PATN-es4MC9_DE8wvK76g';
const BASE = 'https://eyajwjrafudarccvcada.supabase.co/rest/v1';
const headers = { 'apikey': SRK, 'Authorization': `Bearer ${SRK}` };
const BACKUP_DIR = path.join(__dirname, 'backups', '2026-06-12');

const TABLES = ['service_tickets', 'invoices', 'customers', 'services', 'products', 'expenses'];

async function run() {
  console.log('=== SUPABASE DATABASE BACKUP ===');
  console.log('Date:', new Date().toLocaleString('en-IN'));
  console.log('Backup dir:', BACKUP_DIR);
  console.log('');

  const summary = {};

  for (const table of TABLES) {
    try {
      const res = await fetch(`${BASE}/${table}?select=*&order=created_at.asc`, { headers });
      if (!res.ok) {
        console.log(`❌ ${table}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      summary[table] = data.length;

      // Save as JSON
      const filePath = path.join(BACKUP_DIR, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✅ ${table}: ${data.length} rows → ${table}.json`);
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }

  // Save a combined backup file
  const allData = {};
  for (const table of TABLES) {
    const filePath = path.join(BACKUP_DIR, `${table}.json`);
    if (fs.existsSync(filePath)) {
      allData[table] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  }
  const combinedPath = path.join(BACKUP_DIR, 'full_backup.json');
  fs.writeFileSync(combinedPath, JSON.stringify(allData, null, 2));

  console.log('');
  console.log('=== BACKUP SUMMARY ===');
  Object.entries(summary).forEach(([t, c]) => console.log(`  ${t}: ${c} rows`));
  console.log(`\n✅ Full backup saved to: ${combinedPath}`);
}
run();
