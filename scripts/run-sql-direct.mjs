import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase database connection options
// Try different regions and formats
const PROJECT_REF = 'lohbyikelmvcxrctefim';
const DB_PASSWORD = 'sb_secret_7BsHUYo391fvMveEA_l7Xw_TOQnorJM';

const regions = [
  'aws-0-sa-east-1',     // São Paulo
  'aws-0-us-east-1',     // N. Virginia
  'aws-0-us-west-1',     // N. California
  'aws-0-eu-west-1',     // Ireland
  'aws-0-ap-southeast-1', // Singapore
];

const connectionFormats = [
  // Transaction pooler (port 6543)
  (region) => `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@${region}.pooler.supabase.com:6543/postgres`,
  // Session pooler (port 5432)
  (region) => `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@${region}.pooler.supabase.com:5432/postgres`,
  // Direct connection
  (region) => `postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
];

const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

async function tryConnection(connectionString, description) {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log(`✅ Connected via: ${description}`);
    return client;
  } catch (error) {
    console.log(`❌ Failed: ${description} - ${error.message}`);
    return null;
  }
}

async function runMigrations() {
  console.log('🚀 Attempting database connection...\n');

  let client = null;

  // Try direct connection first
  console.log('Trying direct connection...');
  client = await tryConnection(
    `postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
    'Direct connection'
  );

  // If direct fails, try pooler connections
  if (!client) {
    for (const region of regions) {
      for (const formatFn of connectionFormats) {
        const connectionString = formatFn(region);
        client = await tryConnection(connectionString, `${region}`);
        if (client) break;
      }
      if (client) break;
    }
  }

  if (!client) {
    console.log('\n❌ Could not connect to database.');
    console.log('\n📋 Please run migrations manually:');
    console.log('\n1. Go to: https://supabase.com/dashboard/project/lohbyikelmvcxrctefim/sql/new');
    console.log('2. Open the file: db/combined-migrations.sql');
    console.log('3. Copy all content and paste in the SQL Editor');
    console.log('4. Click "Run"');
    return;
  }

  console.log('\n📄 Running migrations...\n');

  // Get all migration files
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`📄 ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      await client.query(sql);
      console.log(`   ✅ Success`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  await client.end();
  console.log('\n✨ Done!');
}

runMigrations();

