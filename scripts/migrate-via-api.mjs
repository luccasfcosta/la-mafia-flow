import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://lohbyikelmvcxrctefim.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvaGJ5aWtlbG12Y3hyY3RlZmltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzY0NzYzNiwiZXhwIjoyMDgzMjIzNjM2fQ.WRJ8QKd3NFV7gRhJ0we3FX_YeCoOW4gx0e94oZ4crXs';

const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

// Test connection first
async function testConnection() {
  console.log('🔄 Testing Supabase connection...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    
    if (response.ok) {
      console.log('✅ Connection successful!\n');
      return true;
    } else {
      console.log('❌ Connection failed:', response.status, await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

// Supabase doesn't have a direct SQL execution API via REST
// But we can verify the settings table exists and insert data
async function verifyAndSeed() {
  console.log('🔄 Checking database status...');
  
  // Check if settings table exists
  const response = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=id&limit=1`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('✅ Settings table exists, records:', data.length);
    return true;
  } else {
    const errorText = await response.text();
    console.log('⚠️  Settings table check:', response.status);
    
    if (response.status === 404 || errorText.includes('relation') || errorText.includes('does not exist')) {
      console.log('\n❌ Tables do not exist yet.');
      console.log('\n📋 You need to run the migrations manually:');
      console.log('\n1. Open the Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/lohbyikelmvcxrctefim/sql/new');
      console.log('\n2. Copy the contents of: db/combined-migrations.sql');
      console.log('\n3. Paste it in the SQL Editor and click "Run"');
      return false;
    }
  }
  return false;
}

async function main() {
  const connected = await testConnection();
  
  if (connected) {
    const tablesExist = await verifyAndSeed();
    
    if (!tablesExist) {
      console.log('\n📂 Migration files are ready at: db/combined-migrations.sql');
      
      // Read and display the combined file path
      const combinedPath = path.join(__dirname, '..', 'db', 'combined-migrations.sql');
      if (fs.existsSync(combinedPath)) {
        const stats = fs.statSync(combinedPath);
        console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
      }
    }
  }
}

main();

