# 🚨 URGENT FIX: Site URL Configuration

## The Problem

Your **Site URL** in Supabase is currently set to:
```
https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback  ❌ WRONG!
```

This causes: **"Too many redirects occurred"** error

## The Fix (Do This Right Now!)

### In Supabase Dashboard:

1. Go to: **Authentication** → **URL Configuration**

2. Find the **Site URL** field

3. **Delete everything after `.co`** - remove `/auth/v1/callback`

4. It should be:
   ```
   https://pmroozitldbgnchainxv.supabase.co  ✅ CORRECT!
   ```

5. Click **"Save changes"**

## Visual Guide

### ❌ WRONG (Current - Causes Redirect Loop):
```
Site URL: https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback
```

### ✅ CORRECT (What It Should Be):
```
Site URL: https://pmroozitldbgnchainxv.supabase.co
```

## Why This Matters

- **Site URL** = Base domain for your app (fallback URL)
- **Callback URL** = OAuth endpoint (automatically handled by Supabase)
- When Site URL includes the callback path, it creates an infinite redirect loop

## Complete Configuration Checklist

After fixing, verify:

- [ ] **Site URL**: `https://pmroozitldbgnchainxv.supabase.co` (no path, no trailing slash)
- [ ] **Redirect URLs**: `glowcheck://auth/callback` (for mobile app)
- [ ] **Google Provider**: Enabled with Client ID and Secret
- [ ] **Google Cloud Console**: Redirect URI is `https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback`

## After Fixing

1. Save changes in Supabase
2. Clear app cache: `npm start -- --clear`
3. Try Google sign-in again

The redirect loop should be fixed! 🎉







