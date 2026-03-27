# Supabase URL Configuration Guide

## Site URL Configuration

In Supabase Dashboard → **Authentication** → **URL Configuration**:

### Site URL
Set this to your app's deep link scheme:
```
glowcheck://
```

Or if you have a web version, use your web URL:
```
https://your-app-domain.com
```

**For mobile-only apps (like yours):**
```
glowcheck://
```

This is the base URL for your app. It's used as a fallback for redirects.

### Redirect URLs
This is the **most important** setting for OAuth. Add these URLs:

1. **Supabase Callback URL** (required for OAuth):
   ```
   https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback
   ```

2. **Your App Deep Link** (optional, for better mobile experience):
   ```
   glowcheck://auth/callback
   ```

3. **For Development/Testing** (if using Expo):
   ```
   exp://localhost:8081/--/auth/callback
   ```

## Why This Matters

- **Site URL**: Used as a fallback and for email links
- **Redirect URLs**: These are the actual URLs that OAuth providers (Google/Apple) will redirect to after authentication

## Important Notes

1. **The Supabase callback URL** (`https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`) **MUST** be in the Redirect URLs list
2. This callback URL should also be added to:
   - Google Cloud Console → OAuth Client → Authorized redirect URIs
   - Apple Developer Portal → Services ID → Return URLs

## Current Configuration

Based on your setup:
- **Site URL**: `glowcheck://`
- **Redirect URLs**: 
  - `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback` ✅ (Required)
  - `glowcheck://auth/callback` (Optional, for better UX)

## How to Configure

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Set **Site URL** to: `glowcheck://`
4. In **Redirect URLs**, add:
   - `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`
5. Click **Save**

