# Fix: "Server can't be found" Error for Google Sign-In

## The Problem

When you try to sign in with Google, Safari shows:
**"Safari can't open the page because the server can't be found"** for `glowcheck.app`

This happens because:
1. The **Site URL** in Supabase is set to `https://glowcheck.app` (which doesn't exist)
2. Supabase uses the Site URL as a fallback or default redirect, causing the OAuth flow to fail

## The Solution

You need to update the **Site URL** in Supabase to a valid URL. For mobile apps, you should use your Supabase project URL.

### Step 1: Update Site URL in Supabase

1. Go to your Supabase Dashboard:
   - URL: https://supabase.com/dashboard/project/pmroozitldbgnchainxv
   - Or: https://supabase.com/dashboard → Select your project

2. Navigate to: **Authentication** → **URL Configuration**

3. Find the **Site URL** field

4. Change it from:
   ```
   https://glowcheck.app
   ```
   
   To:
   ```
   https://pmroozitldbgnchainxv.supabase.co
   ```
   
   ⚠️ **CRITICAL:** Make sure it includes:
   - `https://` protocol (not just `pmroozitldbgnchainxv.supabase.co`)
   - No trailing slash
   - The complete URL: `https://pmroozitldbgnchainxv.supabase.co`
   
   **OR** if you have a real website domain, use that instead (but it must be a valid, accessible URL).

5. **Keep the Redirect URLs** as they are:
   ```
   glowcheck://auth/callback
   ```
   (This is the important one for mobile app redirects)

6. Click **"Save changes"**

### Step 2: Verify Redirect URLs

While you're in the URL Configuration page, make sure **Redirect URLs** includes:
```
glowcheck://auth/callback
```

If it's not there, click **"Add URL"** and add it.

### Step 3: Enable Google Provider (if not done)

1. Go to: **Authentication** → **Providers** → **Google**
2. Toggle **"Enable Sign in with Google"** to **ON**
3. Add your:
   - **Client ID**: `630123328156-707kdm3f3bdeou6ue0jv5ovc7lqnvcnf.apps.googleusercontent.com`
   - **Client Secret**: (from Google Cloud Console)
4. Click **Save**

### Step 4: Test Again

1. Restart your Expo app
2. Try signing in with Google
3. It should now redirect properly using the deep link `glowcheck://auth/callback` instead of trying to access the non-existent `glowcheck.app` domain

## Why This Happens

- **Site URL** is used by Supabase as a default/fallback URL for OAuth redirects
- For mobile apps, the actual redirect uses the **Redirect URLs** (like `glowcheck://auth/callback`)
- But if the Site URL is invalid, Supabase might try to use it and fail
- Setting it to your Supabase URL ensures there's always a valid fallback

## Alternative: Use a Real Domain

If you own `glowcheck.app` or plan to:
1. Set up the domain to point to your Supabase project
2. Or use it as your actual website URL
3. Then you can set Site URL back to `https://glowcheck.app`

For now, using the Supabase URL is the quickest fix.

