# Quick Test: Google Sign-In

## What to Check Right Now

Since your configuration looks correct, let's verify it's working:

### 1. Check Console Logs

When you tap "Continue with Google", you should see in the console:

```
[Auth] Starting Google OAuth
[Auth] Platform: ios (or android)
[Auth] Supabase URL: https://pmroozitldbgnchainxv.supabase.co
[Auth] redirectTo: glowcheck://auth/callback
[Auth] Opening OAuth URL...
```

**If you see an error here**, share the error message.

### 2. What Happens After Google Login?

After you sign in with Google in the browser:

**Expected:**
- Browser redirects and closes
- App receives deep link: `glowcheck://auth/callback?code=...`
- Console shows: `🔗 Deep link received: ...`
- Console shows: `✅ OAuth session established`
- You're signed into the app

**If this doesn't happen:**
- Share what you see instead
- Check if the browser stays open
- Check if you see any error messages

### 3. Quick Fixes to Try

1. **Restart everything:**
   ```bash
   # Stop app
   # Then:
   npm start -- --clear
   ```

2. **Close and reopen the app** on your device

3. **Wait 5 minutes** after any Supabase/Google changes (propagation delay)

### 4. What Error Are You Seeing?

Please share:
- What happens when you tap "Continue with Google"?
- What error message do you see (if any)?
- What do the console logs show?

This will help identify the exact issue!





