# Apple Sign-In Setup - Step by Step

## What is Client ID?

**Client ID** in Supabase Apple configuration can be:
1. **Services ID** (for web OAuth) - `com.yourcompany.glowcheck.web`
2. **App ID/Bundle ID** (for native iOS apps) - `com.glowcheck01.app`

Since you want to use Apple Sign-In in your app, you need **BOTH**:
- Your existing **App ID**: `com.glowcheck01.app` (for native iOS sign-in)
- A new **Services ID** (for web OAuth flow that Supabase uses)

## Step 1: Create Services ID (Required for Supabase)

You currently only have an App ID. You need to create a Services ID for web OAuth.

1. **In Apple Developer Portal:**
   - You're already in "Identifiers" section
   - Click the **blue + button** (top right) to create new identifier

2. **Select Type:**
   - Choose **Services IDs**
   - Click **Continue**

3. **Fill in Details:**
   - **Description**: `GlowCheck Web Auth`
   - **Identifier**: `com.glowcheck01.web` (or similar, must be unique)
   - Click **Continue** then **Register**

4. **Configure Sign in with Apple:**
   - Click on your newly created Services ID
   - Check the box for **Sign in with Apple**
   - Click **Configure**

5. **Set Up Configuration:**
   - **Primary App ID**: Select `com.glowcheck01.app` (your existing App ID)
   - **Website URLs**:
     - **Domains**: `jsvzqgtqkanscjoafyoi.supabase.co`
     - **Return URLs**: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`
   - Click **Save**
   - Click **Continue** then **Register**

**Note your Services ID** - you'll need it (e.g., `com.glowcheck01.web`)

## Step 2: Generate Secret Key

You have:
- ✅ `.p8` key file (downloaded)
- ✅ Key ID (from when you created the key)
- ✅ Team ID: `2V4DJQD8G3`

Now generate the secret key:

### Option A: Using the Script (Recommended)

1. **Install jsonwebtoken:**
   ```bash
   npm install jsonwebtoken
   ```

2. **Edit `generate-apple-secret.js`:**
   Open the file and replace these values:

   ```javascript
   const TEAM_ID = '2V4DJQD8G3'; // Your Team ID
   const KEY_ID = 'YOUR_KEY_ID'; // The Key ID from when you created the key
   const SERVICES_ID = 'com.glowcheck01.web'; // Your Services ID from Step 1
   const PRIVATE_KEY_PATH = './AuthKey_YOUR_KEY_ID.p8'; // Path to your .p8 file
   ```

   **Example:**
   ```javascript
   const TEAM_ID = '2V4DJQD8G3';
   const KEY_ID = 'ABC123XYZ'; // Replace with your actual Key ID
   const SERVICES_ID = 'com.glowcheck01.web';
   const PRIVATE_KEY_PATH = './AuthKey_ABC123XYZ.p8'; // Your downloaded file
   ```

3. **Place your .p8 file in the project root:**
   - The file is usually named like `AuthKey_KEYID.p8`
   - Copy it to your project directory: `/Users/nandanreddyavanaganti/dubai01/`

4. **Run the script:**
   ```bash
   node generate-apple-secret.js
   ```

5. **Copy the output:**
   - The script will output a long JWT token
   - Copy this entire token - this is your **Secret Key**

### Option B: Manual Generation (Advanced)

If you prefer to generate it manually or the script doesn't work, you can use online tools or generate it programmatically. The JWT needs:
- **Header**: `{"alg":"ES256","kid":"YOUR_KEY_ID"}`
- **Payload**: 
  ```json
  {
    "iss": "2V4DJQD8G3",
    "iat": <current_timestamp>,
    "exp": <timestamp_6_months_from_now>,
    "aud": "https://appleid.apple.com",
    "sub": "com.glowcheck01.web"
  }
  ```
- **Signed with**: Your `.p8` private key using ES256 algorithm

## Step 3: Fill in Supabase

Go back to Supabase → Authentication → Providers → Apple:

1. **Enable Sign in with Apple**: ✅ Already ON

2. **Client IDs**: Enter both (comma-separated):
   ```
   com.glowcheck01.app,com.glowcheck01.web
   ```
   - `com.glowcheck01.app` = Your App ID (for native iOS)
   - `com.glowcheck01.web` = Your Services ID (for web OAuth)

3. **Secret Key (for OAuth)**: 
   - Paste the JWT token you generated in Step 2
   - This is the long token from the script output

4. **Allow users without an email**: Leave OFF

5. **Callback URL**: Already filled correctly

6. **Click Save**

## Step 4: Test

1. Open your app on an iOS device/simulator
2. Go to signup/login screen
3. Tap "Continue with Apple"
4. Should open Apple Sign-In
5. After signing in, you should be authenticated

## Quick Reference

**Your Values:**
- Team ID: `2V4DJQD8G3`
- App ID: `com.glowcheck01.app`
- Services ID: `com.glowcheck01.web` (create this)
- Key ID: (from your key - check the key name or Apple Developer)
- .p8 File: (you downloaded this)

**What goes where:**
- **Supabase Client IDs**: `com.glowcheck01.app,com.glowcheck01.web`
- **Supabase Secret Key**: (JWT token from script)
- **Apple Services ID Return URL**: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`

