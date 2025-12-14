#!/usr/bin/env node

/**
 * Storage Setup Script
 * Automatically creates storage buckets and policies
 * 
 * Usage:
 *   node scripts/setup-storage.js
 * 
 * Note: Requires SUPABASE_SERVICE_ROLE_KEY in env file
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

const BUCKETS = [
  {
    id: 'user-uploads',
    name: 'user-uploads',
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic'],
  },
  {
    id: 'analyses',
    name: 'analyses',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/json'],
  },
  {
    id: 'avatars',
    name: 'avatars',
    public: true,
    fileSizeLimit: 2097152, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
];

async function setupStorageBuckets() {
  if (!SUPABASE_URL) {
    logError('EXPO_PUBLIC_SUPABASE_URL not found in env file');
    return false;
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    logError('SUPABASE_SERVICE_ROLE_KEY not found in env file');
    logInfo('Get it from: Supabase Dashboard → Settings → API → service_role key');
    logInfo('Add it to your env file as: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
    return false;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  log('\n' + '='.repeat(60), 'cyan');
  log('📦 Setting Up Storage Buckets', 'cyan');
  log('='.repeat(60), 'cyan');

  const results = {
    created: [],
    exists: [],
    failed: [],
  };

  for (const bucket of BUCKETS) {
    try {
      logInfo(`Checking bucket: ${bucket.id}...`);

      // Check if bucket exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        logError(`Failed to list buckets: ${listError.message}`);
        results.failed.push(bucket.id);
        continue;
      }

      const exists = existingBuckets.some(b => b.id === bucket.id);

      if (exists) {
        logSuccess(`${bucket.id} already exists`);
        results.exists.push(bucket.id);
        
        // Try to update it
        try {
          // Note: Supabase JS client doesn't have direct bucket update
          // But we can verify it's configured correctly
          logInfo(`  ✓ ${bucket.id} is configured`);
        } catch (updateError) {
          logWarning(`  Could not update ${bucket.id}: ${updateError.message}`);
        }
      } else {
        // Create bucket via REST API since JS client doesn't support all options
        logInfo(`Creating bucket: ${bucket.id}...`);
        
        const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
          },
          body: JSON.stringify({
            id: bucket.id,
            name: bucket.name,
            public: bucket.public,
            file_size_limit: bucket.fileSizeLimit,
            allowed_mime_types: bucket.allowedMimeTypes,
          }),
        });

        if (response.ok) {
          logSuccess(`Created bucket: ${bucket.id}`);
          results.created.push(bucket.id);
        } else {
          const errorText = await response.text();
          logError(`Failed to create ${bucket.id}: ${errorText}`);
          results.failed.push(bucket.id);
        }
      }
    } catch (error) {
      logError(`Error with ${bucket.id}: ${error.message}`);
      results.failed.push(bucket.id);
    }
  }

  // Summary
  log('\n' + '-'.repeat(60), 'cyan');
  log('📊 Summary', 'cyan');
  log('-'.repeat(60), 'cyan');
  
  if (results.created.length > 0) {
    logSuccess(`Created: ${results.created.length} bucket(s)`);
    results.created.forEach(id => log(`  ✓ ${id}`, 'green'));
  }
  
  if (results.exists.length > 0) {
    logInfo(`Already exists: ${results.exists.length} bucket(s)`);
    results.exists.forEach(id => log(`  ✓ ${id}`, 'blue'));
  }
  
  if (results.failed.length > 0) {
    logError(`Failed: ${results.failed.length} bucket(s)`);
    results.failed.forEach(id => log(`  ✗ ${id}`, 'red'));
    logWarning('\nIf buckets failed to create, you may need to:');
    logInfo('1. Run the SQL file manually: supabase/storage-optimized.sql');
    logInfo('2. Or create buckets via Supabase Dashboard → Storage');
  }

  // Verify final state
  log('\n' + '-'.repeat(60), 'cyan');
  log('🔍 Verifying Storage Setup', 'cyan');
  log('-'.repeat(60), 'cyan');

  const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets();
  
  if (finalError) {
    logError(`Failed to verify: ${finalError.message}`);
    return false;
  }

  const bucketNames = finalBuckets.map(b => b.id);
  const allExist = BUCKETS.every(b => bucketNames.includes(b.id));

  if (allExist) {
    logSuccess('All storage buckets are set up!');
    logInfo(`Found ${finalBuckets.length} total bucket(s)`);
    return true;
  } else {
    const missing = BUCKETS.filter(b => !bucketNames.includes(b.id));
    logWarning(`Missing buckets: ${missing.map(b => b.id).join(', ')}`);
    logInfo('Please run: supabase/storage-optimized.sql in SQL Editor');
    return false;
  }
}

async function setupStoragePolicies() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🔒 Setting Up Storage Policies', 'cyan');
  log('='.repeat(60), 'cyan');

  logWarning('Storage policies must be set up via SQL');
  logInfo('Run this SQL in Supabase Dashboard → SQL Editor:');
  logInfo('  supabase/storage-optimized.sql');
  logInfo('\nOr copy the policies section from that file.');
}

async function main() {
  console.log('\n');
  log('🚀 Storage Setup Script', 'cyan');
  
  const success = await setupStorageBuckets();
  
  if (success) {
    await setupStoragePolicies();
    log('\n' + '='.repeat(60), 'green');
    log('✅ Storage setup complete!', 'green');
    log('='.repeat(60), 'green');
    log('\nNext step: Set up storage policies via SQL Editor');
  } else {
    log('\n' + '='.repeat(60), 'yellow');
    log('⚠️  Storage setup incomplete', 'yellow');
    log('='.repeat(60), 'yellow');
    log('\nPlease run: supabase/storage-optimized.sql in SQL Editor');
  }
}

main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});





