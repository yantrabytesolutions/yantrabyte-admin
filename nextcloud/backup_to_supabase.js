const { execSync } = require('child_process');
const fs = require('fs');

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://eyajwjrafudarccvcada.supabase.co';
// WARNING: Do NOT use the ANON key here. You MUST use the SERVICE_ROLE_KEY to bypass storage security policies.
// You can find this in Supabase Dashboard -> Project Settings -> API -> service_role secret
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; 

const BUCKET_NAME = 'nextcloud_backups'; // Make sure you create this bucket in Supabase Storage!
const DB_USER = 'nextcloud';
const DB_NAME = 'nextcloud';
const DB_PASSWORD = 'YOUR_NEXTCLOUD_DB_PASSWORD'; // Replace with your Nextcloud DB password

// Generate a timestamped filename
const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
const DUMP_FILE = `nextcloud_db_dump_${dateStr}.sql`;

async function main() {
  try {
    console.log(`[1/3] Dumping Nextcloud Database...`);
    // If your Nextcloud DB is inside a docker container named 'nextcloud_db', uncomment the docker exec part:
    // const dumpCommand = `docker exec nextcloud_db mariadb-dump -u ${DB_USER} -p"${DB_PASSWORD}" ${DB_NAME} > ${DUMP_FILE}`;
    
    // Default command assuming running directly on the database server:
    const dumpCommand = `mysqldump -u ${DB_USER} -p"${DB_PASSWORD}" ${DB_NAME} > ${DUMP_FILE}`;
    
    execSync(dumpCommand);
    console.log(`Successfully created dump: ${DUMP_FILE}`);

    console.log(`[2/3] Uploading ${DUMP_FILE} to Supabase...`);
    const fileBuffer = fs.readFileSync(DUMP_FILE);

    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${DUMP_FILE}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/sql',
      },
      body: fileBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase Upload Failed (${response.status}): ${errorText}`);
    }

    console.log(`[3/3] Upload successful! Backup is now safely stored in Supabase.`);
    
    // Optional: Clean up the local dump file after successful upload
    fs.unlinkSync(DUMP_FILE);
    console.log(`Cleaned up local file: ${DUMP_FILE}`);

  } catch (err) {
    console.error('BACKUP FAILED:', err.message);
  }
}

main();
