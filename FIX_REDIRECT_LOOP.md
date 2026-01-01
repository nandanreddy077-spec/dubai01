# Fix: "Too Many Redirects" Error - CRITICAL FIX

## The Problem

You're seeing: **"Safari can't open the page because too many redirects occurred"**

**Root Cause:** Your **Site URL** in Supabase is incorrectly set to:
```
https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback  ❌ WRONG!
```

This includes the callback path, which creates an infinite redirect loop.

## The Fix (Do This Now!)

### Step 1: Fix Site URL in Supabase

1. Go to: https://supabase.com/dashboard/project/pmroozitldbgnchainxv
2. Navigate to: **Authentication** → **URL Configuration**
3. Find the **Site URL** field
4. **Change it from:**
   ```
   https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback  ❌
   ```
   
   **To:**
   ```
   https://pmroozitldbgnchainxv.supabase.co  ✅
   ```
   
   ⚠️ **CRITICAL:** 
   - Remove `/auth/v1/callback` from the Site URL
   - Site URL should be the **base domain only**
   - The callback path is handled automatically by Supabase

5. **Keep Redirect URLs** as:
   ```
   glowcheck://auth/callback
   ```
   (This is correct - don't change it)

6. Click **"Save changes"**

### Step 2: Verify Configuration

Your configuration should be:

**Site URL:**
```
https://pmroozitldbgnchainxv.supabase.co
```
(No path, no trailing slash)

**Redirect URLs:**
```
glowcheck://auth/callback
```

**Google Provider Callback URL (shown in Supabase):**
```
https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback
```
(This is automatically set by Supabase - you don't configure this in Site URL)

### Step 3: Clear Cache and Test

1. Stop your Expo app
2. Clear cache:
   ```bash
   npm start -- --clear
   ```
3. Try Google sign-in again

## Why This Happens

- **Site URL** = Base domain for your app (used as fallback/default)
- **Callback URL** = Specific OAuth endpoint (`/auth/v1/callback`)
- When Site URL includes the callback path, Supabase tries to redirect to itself, creating a loop

## Correct Configuration Summary

| Setting | Location | Value |
|---------|----------|-------|
| **Site URL** | Supabase → Auth → URL Config | `https://pmroozitldbgnchainxv.supabase.co` |
| **Redirect URLs** | Supabase → Auth → URL Config | `glowcheck://auth/callback` |
| **Google Callback** | Supabase → Auth → Providers → Google | `https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback` (auto-set) |
| **Google Redirect URI** | Google Cloud Console | `https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback` |

The Site URL should **NEVER** include `/auth/v1/callback` - that's only for the Google Cloud Console redirect URI.





