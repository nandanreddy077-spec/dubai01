/**
 * Apple Sign-In Secret Key Generator
 * 
 * This script generates a JWT token for Apple Sign-In OAuth
 * that can be used as the Secret Key in Supabase.
 * 
 * Usage:
 * 1. Install dependencies: npm install jsonwebtoken
 * 2. Replace the values below with your actual Apple Developer credentials
 * 3. Place your .p8 key file in the same directory
 * 4. Run: node generate-apple-secret.js
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// ============================================
// REPLACE THESE VALUES WITH YOUR ACTUAL DATA
// ============================================

// Your Apple Developer Team ID (found in Apple Developer → Membership)
// You have: 2V4DJQD8G3
const TEAM_ID = '2V4DJQD8G3';

// Your Key ID (found when you created the key in Apple Developer → Keys)
const KEY_ID = 'PTZ37B3Y8Z';

// Your Services ID (the identifier you created in Apple Developer → Identifiers → Services IDs)
const SERVICES_ID = 'com.glowcheck01.web';

// Path to your downloaded .p8 key file
const PRIVATE_KEY_PATH = './AuthKey_PTZ37B3Y8Z.p8';

// ============================================
// DO NOT MODIFY BELOW THIS LINE
// ============================================

try {
  // Check if key file exists
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.error('❌ Error: Key file not found at:', PRIVATE_KEY_PATH);
    console.error('Please download your .p8 key file from Apple Developer Portal and place it in this directory.');
    process.exit(1);
  }

  // Read the private key
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

  // Validate that required values are set
  if (TEAM_ID === 'YOUR_TEAM_ID' || KEY_ID === 'YOUR_KEY_ID' || SERVICES_ID === 'YOUR_SERVICES_ID') {
    console.error('❌ Error: Please replace the placeholder values with your actual Apple Developer credentials.');
    console.error('Required values:');
    console.error('  - TEAM_ID');
    console.error('  - KEY_ID');
    console.error('  - SERVICES_ID');
    console.error('  - PRIVATE_KEY_PATH');
    process.exit(1);
  }

  // Create the JWT payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: TEAM_ID, // Issuer (your Team ID)
    iat: now, // Issued at (current time)
    exp: now + (86400 * 180), // Expires in 6 months (180 days)
    aud: 'https://appleid.apple.com', // Audience (Apple)
    sub: SERVICES_ID, // Subject (your Services ID)
  };

  // Sign the JWT
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    keyid: KEY_ID,
  });

  console.log('\n✅ Apple Secret Key generated successfully!\n');
  console.log('='.repeat(80));
  console.log('Copy this token and paste it into Supabase → Authentication → Providers → Apple → Secret Key:');
  console.log('='.repeat(80));
  console.log('\n' + token + '\n');
  console.log('='.repeat(80));
  console.log('\n⚠️  Important Notes:');
  console.log('  - This key expires in 6 months');
  console.log('  - You will need to regenerate it before expiration');
  console.log('  - Keep this token secure and never commit it to version control');
  console.log('  - Set a reminder to regenerate in 5 months\n');

} catch (error) {
  console.error('❌ Error generating Apple Secret Key:');
  console.error(error.message);
  
  if (error.message.includes('PEM')) {
    console.error('\n💡 Tip: Make sure your .p8 key file is in the correct format.');
  }
  
  if (error.message.includes('algorithm')) {
    console.error('\n💡 Tip: Make sure you\'re using ES256 algorithm (which this script does).');
  }
  
  process.exit(1);
}

