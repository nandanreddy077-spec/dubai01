# Quick Fix: Enable Google Sign-In

## The Problem
You're getting the error: **"Unsupported provider: provider is not enabled"**

This means Google OAuth is configured in Google Cloud Console but **NOT enabled in Supabase**.

## The Solution (3 Steps)

### Step 1: Get Your Google OAuth Client Secret

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth client: **"GlowCheck Supabase OAuth"**
4. Find the **Client Secret** (it's masked like `****hCKz`)
5. Click the **eye icon** or **download icon** to reveal/copy it
6. **Copy the full Client Secret** - you'll need it for Step 2

**Your Client ID (already configured):**
```
630123328156-707kdm3f3bdeou6ue0jv5ovc7lqnvcnf.apps.googleusercontent.com
```

### Step 2: Enable Google Provider in Supabase

1. Go to your Supabase Dashboard:
   - URL: https://supabase.com/dashboard/project/pmroozitldbgnchainxv
   - Or: https://supabase.com/dashboard → Select your project

2. Navigate to: **Authentication** → **Providers**

3. Find **Google** in the providers list

4. **Toggle ON** the switch that says **"Enable Sign in with Google"**
   - This is currently OFF, which is causing your error

5. Fill in the required fields:
   - **Client IDs (for OAuth)**: 
     ```
     630123328156-707kdm3f3bdeou6ue0jv5ovc7lqnvcnf.apps.googleusercontent.com
     ```
   - **Client Secret (for OAuth)**: 
     - Paste the Client Secret you copied from Step 1

6. Leave other settings as default:
   - **Skip nonce checks**: OFF
   - **Allow users without an email**: OFF

7. **Click "Save"** at the bottom

### Step 3: Fix Site URL (CRITICAL - Fixes redirect errors)

1. Still in Supabase Dashboard, go to: **Authentication** → **URL Configuration**

2. **Check your current Site URL:**
   - If it shows: `https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback` ❌ **WRONG!**
   - This causes "too many redirects" error
   
3. **Change the Site URL** to:
   ```
   https://pmroozitldbgnchainxv.supabase.co  ✅
   ```
   
   ⚠️ **CRITICAL:** 
   - Remove `/auth/v1/callback` from the Site URL
   - Site URL should be the **base domain only** (no path)
   - The callback path is handled automatically by Supabase
   - If you had `https://glowcheck.app`, change it to the Supabase URL above

4. Verify **Redirect URLs** includes:
   ```
   glowcheck://auth/callback
   ```
   - If it's already there, you're good ✅
   - If not, click **"Add URL"** and add it

5. Click **"Save changes"**

## Test It

1. Restart your Expo app (stop and run `npm start` again)
2. Try signing in with Google
3. It should work now! 🎉

## Still Not Working?

### Check Google Cloud Console Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Click your OAuth client
4. Under **Authorized redirect URIs**, ensure you have:
   ```
   https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback
   ```
5. If missing, add it and click **Save**

### Common Issues

- **"Provider is not enabled"** → You didn't toggle ON in Step 2
- **"invalid_client"** → Client ID or Secret is wrong in Supabase
- **"redirect_uri_mismatch"** → Redirect URI doesn't match between Google and Supabase
- **"too many redirects occurred"** → Site URL includes `/auth/v1/callback` - remove it! Site URL should be base domain only
- **"server can't be found"** → Site URL is set to a non-existent domain (like `glowcheck.app`) - change to your Supabase URL

## Summary

The main fix is **Step 2** - enabling the Google provider toggle in Supabase and adding your Client ID and Secret. Everything else appears to be configured correctly based on your screenshots.

