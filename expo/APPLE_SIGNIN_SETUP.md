# Apple Sign-In Setup Guide for GlowCheck

## Prerequisites

- Apple Developer Account (paid membership required - $99/year)
- Access to Apple Developer Portal
- Your app's bundle identifier

## Step 1: Create Services ID in Apple Developer

1. **Go to Apple Developer Portal**
   - Visit [developer.apple.com](https://developer.apple.com)
   - Sign in with your Apple Developer account

2. **Navigate to Certificates, Identifiers & Profiles**
   - Click on **Certificates, Identifiers & Profiles** in the sidebar
   - Or go directly to: https://developer.apple.com/account/resources/identifiers/list

3. **Create a Services ID**
   - Click the **+** button to create a new identifier
   - Select **Services IDs** and click **Continue**
   - Fill in:
     - **Description**: `GlowCheck Web Auth` (or any descriptive name)
     - **Identifier**: `com.yourcompany.glowcheck.web` (must be unique, reverse domain format)
   - Click **Continue** then **Register**

4. **Configure Sign in with Apple**
   - Click on your newly created Services ID
   - Check the box for **Sign in with Apple**
   - Click **Configure**

5. **Set Up Sign in with Apple Configuration**
   - **Primary App ID**: Select your app's App ID (or create one if needed)
   - **Website URLs**:
     - **Domains**: `jsvzqgtqkanscjoafyoi.supabase.co`
     - **Return URLs**: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`
   - Click **Save**
   - Click **Continue** then **Register**

## Step 2: Create a Key for Sign in with Apple

1. **Go to Keys Section**
   - In Apple Developer Portal, go to **Certificates, Identifiers & Profiles**
   - Click on **Keys** in the sidebar
   - Click the **+** button to create a new key

2. **Configure the Key**
   - **Key Name**: `GlowCheck Sign in with Apple Key`
   - Check the box for **Sign in with Apple**
   - Click **Configure** next to Sign in with Apple
   - **Primary App ID**: Select your app's App ID
   - Click **Save**
   - Click **Continue** then **Register**

3. **Download the Key**
   - ⚠️ **IMPORTANT**: Download the key file (`.p8` file) immediately
   - You can only download it once - if you lose it, you'll need to create a new key
   - Note down the **Key ID** (shown on the confirmation page)

## Step 3: Get Your Team ID

1. **Find Your Team ID**
   - In Apple Developer Portal, go to **Membership**
   - Your **Team ID** is displayed at the top (format: `ABC123DEF4`)
   - Copy this - you'll need it

## Step 4: Fill in Supabase Apple Configuration

Now go back to your Supabase dashboard and fill in the Apple configuration:

### 1. Enable Sign in with Apple
- ✅ Toggle **ON** (already done)

### 2. Client IDs
Enter your Services ID identifier:
```
com.yourcompany.glowcheck.web
```
Or if you have multiple (iOS app, web, etc.), separate with commas:
```
com.yourcompany.glowcheck,com.yourcompany.glowcheck.web
```

### 3. Secret Key (for OAuth)
This is the tricky part. You need to generate a JWT token from your key file.

**Option A: Use Supabase's built-in generator (if available)**
- Some Supabase versions have a helper for this

**Option B: Generate manually using Node.js script**

Create a file `generate-apple-secret.js`:

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Replace these with your actual values
const TEAM_ID = 'YOUR_TEAM_ID'; // e.g., ABC123DEF4
const KEY_ID = 'YOUR_KEY_ID'; // The Key ID from Step 2
const PRIVATE_KEY_PATH = './AuthKey_KEYID.p8'; // Path to your downloaded .p8 file

// Read the private key
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH);

// Create the JWT
const token = jwt.sign(
  {
    iss: TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 180, // 6 months
    aud: 'https://appleid.apple.com',
    sub: 'YOUR_SERVICES_ID', // Your Services ID from Step 1, e.g., com.yourcompany.glowcheck.web
  },
  privateKey,
  {
    algorithm: 'ES256',
    keyid: KEY_ID,
  }
);

console.log('Apple Secret Key:');
console.log(token);
```

Run it:
```bash
node generate-apple-secret.js
```

Copy the output token and paste it into the **Secret Key** field in Supabase.

**Option C: Use online tool (less secure)**
- You can use tools like https://appleid.apple.com/account/manage (not recommended for production)
- Or use a JWT generator with your key

### 4. Allow users without an email
- Leave **OFF** (unless you specifically need this)

### 5. Callback URL
- Already filled: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`
- Make sure this matches what you entered in Apple Developer Portal

### 6. Click Save

## Step 5: Important Notes

### Key Expiration
⚠️ **Apple OAuth secret keys expire every 6 months!**
- You'll need to regenerate the secret key every 6 months
- Set a reminder to update it before expiration
- When expired, users won't be able to sign in with Apple

### For iOS Native Apps
If you want to use native Apple Sign-In in your iOS app (not just web OAuth):

1. **Add your iOS App Bundle ID** to the Client IDs field:
   ```
   app.rork.glowcheck-app-development-9yhnj3q7-z0c6x351-k17jcry2-qj0yhdmu-s2mtilai-6gzkcsz3-rhhhbp65-kh89ecf8
   ```

2. **Configure in Xcode**:
   - Enable "Sign in with Apple" capability
   - Add the capability in your app's target settings

## Step 6: Test Apple Sign-In

1. **On iOS Device/Simulator**:
   - Open your app
   - Tap "Continue with Apple"
   - Should open native Apple Sign-In
   - After signing in, you should be authenticated

2. **On Web/Android**:
   - Apple Sign-In button won't appear (iOS only)
   - This is expected behavior

## Troubleshooting

### "Invalid client" error
- Check that your Services ID matches exactly in both places
- Verify the callback URL matches in Apple Developer Portal

### "Invalid key" error
- Make sure your secret key (JWT) is not expired
- Regenerate the key if it's older than 6 months
- Verify the Key ID and Team ID are correct

### Key not working
- Ensure you downloaded the `.p8` key file
- Verify the Key ID matches
- Check that the key has "Sign in with Apple" enabled

### Button not appearing
- Apple Sign-In only works on iOS devices
- On Android/Web, the button won't show (this is normal)

## Quick Reference

**What you need:**
- ✅ Services ID: `com.yourcompany.glowcheck.web`
- ✅ Team ID: `ABC123DEF4` (your actual Team ID)
- ✅ Key ID: `XYZ789ABC1` (from the key you created)
- ✅ Private Key: `.p8` file downloaded from Apple
- ✅ Secret Key: JWT token generated from the above

**Where to find:**
- Services ID: Apple Developer → Identifiers → Services IDs
- Team ID: Apple Developer → Membership
- Key ID: Apple Developer → Keys → (your key)
- Private Key: Downloaded `.p8` file

