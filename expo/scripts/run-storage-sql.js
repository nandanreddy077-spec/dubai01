#!/usr/bin/env node

/**
 * Execute Storage SQL Setup
 * Executes the storage-optimized.sql file via Supabase REST API
 * 
 * Usage:
 *   node scripts/run-storage-sql.js
 * 
 * Requires: SUPABASE_SERVICE_ROLE_KEY in env file
 */

const fs = require('fs');
const path = require('path');

// Load env file manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '../env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnvFile();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function executeSQL(sql) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  // Execute SQL via Supabase REST API
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SQL execution failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function main() {
  console.log('\n');
  log('🚀 Storage SQL Setup', 'cyan');
  log('='.repeat(60), 'cyan');

  if (!SUPABASE_URL) {
    logError('EXPO_PUBLIC_SUPABASE_URL not found in env file');
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    logError('SUPABASE_SERVICE_ROLE_KEY not found in env file');
    logInfo('\nTo get your service role key:');
    logInfo('1. Go to Supabase Dashboard → Settings → API');
    logInfo('2. Copy the "service_role" key (keep it secret!)');
    logInfo('3. Add to your env file: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
    logInfo('\nAlternatively, run the SQL file manually:');
    logInfo('1. Open Supabase Dashboard → SQL Editor');
    logInfo('2. Copy content from: supabase/storage-optimized.sql');
    logInfo('3. Paste and click "Run"');
    process.exit(1);
  }

  // Read the SQL file
  const sqlPath = path.join(__dirname, '../supabase/storage-optimized.sql');
  
  if (!fs.existsSync(sqlPath)) {
    logError(`SQL file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  logInfo('Reading SQL file...');
  logInfo(`File: ${sqlPath}`);
  logInfo(`SQL length: ${sql.length} characters`);

  logWarning('\n⚠️  Note: Supabase REST API may not support direct SQL execution.');
  logInfo('The recommended approach is to run the SQL in the dashboard.');
  logInfo('\nHere\'s what you need to do:');
  logInfo('1. Open: https://supabase.com/dashboard/project/pmroozitldbgnchainxv/sql/new');
  logInfo('2. Copy the entire content of: supabase/storage-optimized.sql');
  logInfo('3. Paste it into the SQL Editor');
  logInfo('4. Click "Run"');
  logInfo('\nOr, I can display the SQL for you to copy...\n');

  // Display the SQL
  log('='.repeat(60), 'cyan');
  log('📋 SQL to Execute:', 'cyan');
  log('='.repeat(60), 'cyan');
  console.log('\n' + sql);
  log('\n' + '='.repeat(60), 'cyan');
  logInfo('Copy the SQL above and run it in Supabase Dashboard → SQL Editor');
}

main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});





