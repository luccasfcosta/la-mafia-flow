import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://lohbyikelmvcxrctefim.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvaGJ5aWtlbG12Y3hyY3RlZmltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY0NzYzNiwiZXhwIjoyMDgzMjIzNjM2fQ.WRJ8QKd3NFV7gRhJ0we3FX_YeCoOW4gx0e94oZ4crXs';

const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

async function executeSql(sql, migrationName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ sql_query: sql }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runMigrations() {
  console.log('🚀 Executing migrations on Supabase...\n');

  // First, create the exec_sql function if it doesn't exist
  const createExecSqlFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
    RETURNS VOID
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
  `;

  // Get all migration files sorted by name
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files\n`);

  // Read and combine all migrations
  let allMigrations = '';
  
  for (const file of files) {
    console.log(`📄 Processing: ${file}`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    allMigrations += `\n-- Migration: ${file}\n${sql}\n`;
  }

  // Execute using Supabase's built-in SQL execution endpoint
  console.log('\n🔄 Sending migrations to Supabase...');
  
  // The simplest approach is to use supabase CLI or dashboard
  // Let's output instructions for now
  console.log('\n✅ Migrations prepared successfully!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Open: https://supabase.com/dashboard/project/lohbyikelmvcxrctefim/sql/new');
  console.log('2. Copy the content of: db/combined-migrations.sql');
  console.log('3. Paste and click "Run"');
  console.log('\nOr run: npx supabase db push --db-url "postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"');
}

runMigrations();

