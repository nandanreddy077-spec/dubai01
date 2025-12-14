# Apple Sign-In Setup Guide for GlowCheck

## Overview

This guide will help you set up "Sign in with Apple" for your GlowCheck app. Apple Sign-In works on iOS, macOS, watchOS, tvOS, and also on the web using OAuth.

## Prerequisites

- An active Apple Developer account ($99/year)
- Access to [Apple Developer Portal](https://developer.apple.com/account/)
- Your Supabase project URL: `https://jsvzqgtqkanscjoafyoi.supabase.co`
- Your app's Bundle ID: `app.rork.glowcheck-app-development-9yhnj3q7-z0c6x351-k17jcry2-qj0yhdmu-s2mtilai-6gzkcsz3-rhhhbp65-kh89ecf8`

---

## Step 1: Create a Services ID (for Web OAuth)

A Services ID is required for web-based Apple Sign-In (OAuth flow).

### 1.1 Navigate to Identifiers

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Sign in with your Apple Developer account
3. Click **Certificates, Identifiers & Profiles**
4. Click **Identifiers** in the left sidebar
5. Click the **+** button to create a new identifier

### 1.2 Create Services ID

1. Select **Services IDs** and click **Continue**
2. Click **Continue** again
3. Fill in the details:
   - **Description**: `GlowCheck Web OAuth` (or any descriptive name)
   - **Identifier**: `com.glowcheck.web.oauth` (or your preferred identifier)
     - ⚠️ **Important**: This must be unique and follow reverse domain notation
4. Click **Continue**
5. Review and click **Register**

### 1.3 Configure Sign in with Apple

1. Find your newly created Services ID in the list and click on it
2. Check the box **Sign in with Apple**
3. Click **Configure** next to "Sign in with Apple"
4. In the **Primary App ID** dropdown, select your app's Bundle ID:
   - `app.rork.glowcheck-app-development-9yhnj3q7-z0c6x351-k17jcry2-qj0yhdmu-s2mtilai-6gzkcsz3-rhhhbp65-kh89ecf8`
   - (If you don't see it, you may need to create an App ID first - see Step 2)
5. **Website URLs** section:
   - **Domains**: `jsvzqgtqkanscjoafyoi.supabase.co`
   - **Return URLs**: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`
     - ⚠️ **Important**: This must match exactly with your Supabase callback URL
6. Click **Save**
7. Click **Continue**
8. Click **Register**

---

## Step 2: Create an App ID (if not already created)

If you don't have an App ID yet, create one:

1. In **Identifiers**, click **+**
2. Select **App IDs** and click **Continue**
3. Select **App** and click **Continue**
4. Fill in:
   - **Description**: `GlowCheck App`
   - **Bundle ID**: Select **Explicit** and enter: `app.rork.glowcheck-app-development-9yhnj3q7-z0c6x351-k17jcry2-qj0yhdmu-s2mtilai-6gzkcsz3-rhhhbp65-kh89ecf8`
5. Under **Capabilities**, check **Sign in with Apple**
6. Click **Continue** and **Register**

---

## Step 3: Create a Key for OAuth (Secret Key)

The Secret Key is used for OAuth authentication and expires every 6 months.

### 3.1 Create a Key

1. In Apple Developer Portal, go to **Certificates, Identifiers & Profiles**
2. Click **Keys** in the left sidebar
3. Click the **+** button to create a new key
4. Fill in:
   - **Key Name**: `GlowCheck Apple OAuth Key` (or any descriptive name)
   - Check **Sign in with Apple**
5. Click **Configure** next to "Sign in with Apple"
6. Select your **Primary App ID** (the Bundle ID from Step 2)
7. Click **Save**
8. Click **Continue**
9. Click **Register**

### 3.2 Download the Key

⚠️ **CRITICAL**: You can only download this key **once**. Save it securely!

1. After registration, you'll see a confirmation screen
2. Click **Download** to download the `.p8` file
   - The file will be named something like `AuthKey_XXXXXXXXXX.p8`
3. **Save this file securely** - you cannot download it again!
4. Note down:
   - **Key ID**: Shown on the confirmation screen (e.g., `ABC123DEF4`)
   - **Team ID**: Found in the top right of Apple Developer Portal (e.g., `2V4DJQD8G3`)

---

## Step 4: Configure Supabase

Now that you have all the Apple credentials, configure Supabase:

### 4.1 Open Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Apple** in the list and click on it

### 4.2 Fill in the Configuration

1. **Enable Sign in with Apple**: Toggle **ON** ✅

2. **Client IDs**: 
   - Enter your Services ID from Step 1.2: `com.glowcheck.web.oauth`
   - For native iOS apps, you can also add your Bundle ID (comma-separated):
     - `com.glowcheck.web.oauth, app.rork.glowcheck-app-development-9yhnj3q7-z0c6x351-k17jcry2-qj0yhdmu-s2mtilai-6gzkcsz3-rhhhbp65-kh89ecf8`
   - ⚠️ **Note**: The Services ID is required for web OAuth. The Bundle ID is optional for native sign-in.

3. **Secret Key (for OAuth)**:
   - Open the `.p8` file you downloaded in Step 3.2
   - Copy the entire contents (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
   - Paste it into this field
   - Format should look like:
     ```
     -----BEGIN PRIVATE KEY-----
     MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
     -----END PRIVATE KEY-----
     ```

4. **Allow users without an email**: 
   - Toggle **OFF** (recommended) - This ensures all users have an email
   - Or toggle **ON** if you want to allow users who hide their email

5. **Callback URL (for OAuth)**: 
   - This is automatically filled: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`
   - ✅ Make sure this matches what you entered in Apple Developer Portal (Step 1.3)

6. Click **Save**

---

## Step 5: Verify Configuration

### 5.1 Check Apple Developer Portal

1. Go back to your Services ID configuration (Step 1.3)
2. Verify the Return URL matches: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`

### 5.2 Test in Your App

1. Run your app: `bun start` or `bunx expo start`
2. Navigate to the login or signup screen
3. On iOS devices, you should see a "Continue with Apple" button
4. On web, the Apple Sign-In option should appear
5. Try signing in with Apple

---

## Important Notes

### ⚠️ Secret Key Expiration

**Apple OAuth secret keys expire every 6 months!**

- You need to generate a new key every 6 months
- Set a reminder to rotate the key before expiration
- When creating a new key:
  1. Create a new key in Apple Developer Portal (Step 3)
  2. Download the new `.p8` file
  3. Update the **Secret Key** in Supabase (Step 4.2)
  4. The old key will stop working after expiration

### 📱 Native vs Web Sign-In

- **Web OAuth**: Requires Services ID and Secret Key
- **Native iOS**: Can use Bundle ID directly (no OAuth flow needed)
- Your current setup supports both:
  - Web: Uses Services ID + OAuth flow
  - iOS Native: Can use Bundle ID (if configured)

### 🔐 Security Best Practices

1. **Never commit** the `.p8` key file to git
2. Store the key securely (password manager, secure vault)
3. Rotate keys every 6 months
4. Use environment variables for sensitive data in production

---

## Troubleshooting

### Error: "At least one Client ID is required"

**Solution**: Make sure you've entered your Services ID in the **Client IDs** field in Supabase.

### Error: "Invalid client" or "invalid_request"

**Possible causes:**
1. Services ID doesn't match what's in Apple Developer Portal
2. Return URL in Apple Developer Portal doesn't match Supabase callback URL
3. Secret Key is incorrect or expired

**Solution:**
- Double-check Services ID matches exactly
- Verify Return URL: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`
- Check if Secret Key has expired (older than 6 months)

### Error: "redirect_uri_mismatch"

**Solution**: 
- The Return URL in Apple Developer Portal must exactly match: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`
- Check for trailing slashes or typos
- Wait a few minutes after updating - Apple's changes may take time to propagate

### Apple Sign-In button doesn't appear

**On iOS:**
- Make sure you're testing on a real iOS device or simulator
- Verify your Bundle ID has "Sign in with Apple" capability enabled
- Check that the app is properly configured in Xcode

**On Web:**
- Make sure Services ID is configured correctly
- Verify the domain is registered in Apple Developer Portal
- Check browser console for errors

### Authentication succeeds but user not logged in

**Solution:**
- Check browser console for errors
- Verify Supabase session is being created
- Check `onAuthStateChange` listener in AuthContext
- Ensure the OAuth flow completes (code exchange)

---

## Testing Checklist

- [ ] Services ID created and configured
- [ ] Return URL matches Supabase callback URL
- [ ] Key created and downloaded (`.p8` file saved)
- [ ] Key ID and Team ID noted down
- [ ] Supabase configured with:
  - [ ] Client IDs (Services ID)
  - [ ] Secret Key (from `.p8` file)
  - [ ] Apple Sign-In enabled
- [ ] Tested on iOS device/simulator
- [ ] Tested on web browser
- [ ] User can sign in successfully
- [ ] User data is saved correctly
- [ ] Sign-out and sign-in again works

---

## Production Considerations

### Update Bundle ID (Optional)

Your current Bundle ID is quite long. For production, consider using a shorter one:
- Current: `app.rork.glowcheck-app-development-9yhnj3q7-z0c6x351-k17jcry2-qj0yhdmu-s2mtilai-6gzkcsz3-rhhhbp65-kh89ecf8`
- Suggested: `com.glowcheck.app` or `com.glowcheck01.app`

If you change the Bundle ID:
1. Update `app.json`
2. Create a new App ID in Apple Developer Portal
3. Update Services ID configuration to use the new Bundle ID
4. Update Supabase Client IDs if needed

### Key Rotation Schedule

Set reminders to rotate your OAuth key:
- Create calendar reminder for 5 months from now
- Document the rotation process
- Test new key before old one expires

---

## Additional Resources

- [Apple Sign in with Apple Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Supabase Apple Provider Docs](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Apple Developer Portal](https://developer.apple.com/account/)

---

## Summary

You now have:
1. ✅ Services ID for web OAuth
2. ✅ App ID with Sign in with Apple capability
3. ✅ OAuth Key (Secret Key) downloaded and saved
4. ✅ Supabase configured with Apple Sign-In
5. ✅ Ready to test Apple Sign-In in your app

The Apple Sign-In button will automatically appear on iOS devices, and the web OAuth flow will work through Supabase's callback URL.

