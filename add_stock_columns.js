const { Client } = require('pg');

const regions = [
  'aws-0-ap-south-1.pooler.supabase.com', // Mumbai
  'aws-0-ap-southeast-1.pooler.supabase.com', // Singapore
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-0-ap-southeast-2.pooler.supabase.com'
];

async function addColumns() {
  let activeClient = null;
  
  for (const region of regions) {
    const connStr = `postgresql://postgres.eyajwjrafudarccvcada:Yantra$2025@${region}:6543/postgres`;
    console.log('Testing connection to', region);
    const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log('Successfully connected to', region);
      activeClient = client;
      break;
    } catch(e) {
      console.log('Failed:', e.message);
    }
  }

  if (!activeClient) {
    console.log('Could not connect to any region.');
    return;
  }

  try {
    console.log('Adding stock columns to products table...');
    await activeClient.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_count integer DEFAULT 10;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS alert_threshold integer DEFAULT 3;
    `);
    console.log('Successfully added stock_count and alert_threshold columns!');
  } catch(e) {
    console.error('Error adding columns:', e.message);
  } finally {
    await activeClient.end();
  }
}

addColumns();
