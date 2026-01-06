import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://lohbyikelmvcxrctefim.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvaGJ5aWtlbG12Y3hyY3RlZmltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY0NzYzNiwiZXhwIjoyMDgzMjIzNjM2fQ.WRJ8QKd3NFV7gRhJ0we3FX_YeCoOW4gx0e94oZ4crXs';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

async function runMigrations() {
  console.log('🚀 Starting migrations...\n');

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
      // Execute the SQL using the Supabase REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          query: sql,
        }),
      });

      // For DDL statements, we need to use the SQL editor endpoint
      // Let's use the postgres connection string via supabase management API
      
      // Alternative: Execute via supabase.rpc or direct SQL
      // For now, let's output the SQL to be run manually or use supabase db push
      
      console.log(`   ✅ Prepared: ${file}`);
    } catch (error) {
      console.error(`   ❌ Error in ${file}:`, error.message);
    }
  }

  console.log('\n✨ Migration files ready!');
  console.log('\nTo execute migrations, go to the Supabase Dashboard SQL Editor:');
  console.log('https://supabase.com/dashboard/project/lohbyikelmvcxrctefim/sql');
  console.log('\nOr use: npx supabase db push');
}

// Concatenate all migrations into a single file
async function createCombinedMigration() {
  console.log('📦 Creating combined migration file...\n');

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let combinedSql = '-- LA MAFIA 13 - Combined Migrations\n';
  combinedSql += '-- Generated: ' + new Date().toISOString() + '\n\n';

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    combinedSql += `-- ========================================\n`;
    combinedSql += `-- Migration: ${file}\n`;
    combinedSql += `-- ========================================\n\n`;
    combinedSql += sql;
    combinedSql += '\n\n';
  }

  const outputPath = path.join(__dirname, '..', 'db', 'combined-migrations.sql');
  fs.writeFileSync(outputPath, combinedSql);

  console.log(`✅ Combined migration saved to: db/combined-migrations.sql`);
  console.log(`\n📋 Copy and paste this file content into the Supabase SQL Editor:`);
  console.log(`   https://supabase.com/dashboard/project/lohbyikelmvcxrctefim/sql/new`);
}

createCombinedMigration();

