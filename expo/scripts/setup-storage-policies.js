#!/usr/bin/env node

/**
 * Setup Storage Policies
 * Creates storage policies via Supabase REST API
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

// Storage policies SQL
const POLICIES_SQL = `
-- User Uploads Policies
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('user-uploads', 'analyses', 'avatars') AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    bucket_id = 'avatars'
  )
);

DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('user-uploads', 'avatars') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('user-uploads', 'avatars') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read access for analyses (for sharing)
DROP POLICY IF EXISTS "Public can view analyses" ON storage.objects;
CREATE POLICY "Public can view analyses"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'analyses');
`;

async function executeSQL(sql) {
  // Use Supabase REST API to execute SQL
  // Note: This requires using the PostgREST API or Management API
  // For now, we'll use a direct SQL execution endpoint if available
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  }).catch(() => null);

  // If that doesn't work, try the SQL editor API
  if (!response || !response.ok) {
    // Supabase doesn't expose direct SQL execution via REST API
    // We need to use the SQL Editor or provide instructions
    return { success: false, needsManual: true };
  }

  return { success: true, data: await response.json() };
}

async function main() {
  console.log('\n');
  log('🔒 Storage Policies Setup', 'cyan');
  log('='.repeat(60), 'cyan');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logError('Missing Supabase credentials');
    process.exit(1);
  }

  logInfo('Setting up storage policies...');
  logWarning('\nNote: Supabase REST API doesn\'t support direct SQL execution.');
  logInfo('You need to run the SQL in the Supabase Dashboard.\n');

  log('='.repeat(60), 'cyan');
  log('📋 SQL to Execute:', 'cyan');
  log('='.repeat(60), 'cyan');
  console.log(POLICIES_SQL);
  log('\n' + '='.repeat(60), 'cyan');

  logInfo('\nTo set up policies:');
  logInfo('1. Open: https://supabase.com/dashboard/project/pmroozitldbgnchainxv/sql/new');
  logInfo('2. Copy the SQL above');
  logInfo('3. Paste and click "Run"');
  logInfo('\nOr run the complete storage setup:');
  logInfo('  Copy entire content from: supabase/storage-optimized.sql (lines 44-92)');
}

main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});





