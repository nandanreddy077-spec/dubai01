# Fix: "requested path is invalid" Error for Google Sign-In

## The Problem

You're seeing: `{"error":"requested path is invalid"}` when trying to sign in with Google.

This happens because:
1. The OAuth redirect is trying to access the Supabase domain directly without the proper callback path
2. The Site URL might be missing the `https://` protocol
3. The redirect URLs might not be configured correctly

## The Solution

### Step 1: Fix Site URL in Supabase

1. Go to your Supabase Dashboard:
   - https://supabase.com/dashboard/project/pmroozitldbgnchainxv
   - Navigate to: **Authentication** → **URL Configuration**

2. **Site URL** must be:
   ```
   https://pmroozitldbgnchainxv.supabase.co
   ```
   ⚠️ **Important:** Make sure it includes:
   - `https://` protocol (not just the domain)
   - No trailing slash
   - The full domain: `pmroozitldbgnchainxv.supabase.co`

3. **Redirect URLs** must include:
   ```
   glowcheck://auth/callback
   ```
   - This is the deep link your mobile app uses
   - Click **"Add URL"** if it's not there

4. Click **"Save changes"**

### Step 2: Verify Google Provider Configuration

1. Go to: **Authentication** → **Providers** → **Google**

2. Ensure:
   - ✅ **Enable Sign in with Google** is **ON**
   - ✅ **Client IDs (for OAuth)** is set:
     ```
     630123328156-707kdm3f3bdeou6ue0jv5ovc7lqnvcnf.apps.googleusercontent.com
     ```
   - ✅ **Client Secret (for OAuth)** is set (from Google Cloud Console)

3. **Callback URL** should show:
   ```
   https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback
   ```
   - This is automatically set by Supabase
   - Use this exact URL in Google Cloud Console

4. Click **Save**

### Step 3: Verify Google Cloud Console Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth client: **"GlowCheck Supabase OAuth"**
4. Under **Authorized redirect URIs**, ensure you have **exactly**:
   ```
   https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback
   ```
   - Must include `https://`
   - Must include `/auth/v1/callback` path
   - No trailing slash

5. Click **Save**

### Step 4: Clear App Cache and Restart

1. Stop your Expo app (Ctrl+C)
2. Clear the cache:
   ```bash
   npm start -- --clear
   ```
   Or:
   ```bash
   npx expo start --clear
   ```
3. Try signing in with Google again

## Why This Happens

The OAuth flow works like this:
1. App requests OAuth → Supabase generates OAuth URL
2. User authenticates with Google → Google redirects to Supabase callback
3. Supabase processes callback → Redirects to your app's deep link

If the Site URL is wrong (missing `https://` or incorrect), Supabase can't properly construct the redirect URLs, causing the "invalid path" error.

## Expected Flow

1. User taps "Continue with Google"
2. Browser opens: `https://accounts.google.com/...` (Google login)
3. After login, redirects to: `https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback?code=...`
4. Supabase processes this and redirects to: `glowcheck://auth/callback?code=...`
5. App receives the deep link and completes sign-in

If any step fails, you'll see an error. The "invalid path" error usually means step 3 or 4 is failing due to incorrect URL configuration.

## Still Not Working?

### Check Console Logs

When you try to sign in, check the console output. You should see:
```
[Auth] Starting Google OAuth
[Auth] Supabase URL: https://pmroozitldbgnchainxv.supabase.co
[Auth] redirectTo: glowcheck://auth/callback
[Auth] Google Cloud Console (Web client) Authorized redirect URI must be: https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback
```

If these don't match your configuration, fix them.

### Common Issues

- **Site URL missing `https://`** → Add it
- **Site URL has trailing slash** → Remove it
- **Redirect URL not in Supabase** → Add `glowcheck://auth/callback`
- **Google redirect URI doesn't match** → Must be exactly `https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback`





