import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connection string for Supabase
// Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://postgres.lohbyikelmvcxrctefim:sb_secret_7BsHUYo391fvMveEA_l7Xw_TOQnorJM@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Get all migration files sorted by name
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files\n`);

    for (const file of files) {
      console.log(`📄 Running: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        await client.query(sql);
        console.log(`   ✅ Success: ${file}`);
      } catch (error) {
        console.error(`   ❌ Error in ${file}:`, error.message);
        // Continue with other migrations
      }
    }

    console.log('\n✨ Migrations completed!');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.log('\n💡 Make sure you have the correct database URL.');
    console.log('   You can find it in Supabase Dashboard > Settings > Database');
  } finally {
    await client.end();
  }
}

runMigrations();

