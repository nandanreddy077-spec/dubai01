# Google Sign-In Testing & Troubleshooting Guide

## ✅ Configuration Checklist

Based on your screenshots, everything is configured correctly:

- [x] **Site URL**: `https://pmroozitldbgnchainxv.supabase.co` (correct - no callback path)
- [x] **Redirect URLs**: `glowcheck://auth/callback` (correct)
- [x] **Google Provider**: Enabled with Client ID and Secret
- [x] **Google Cloud Console**: Redirect URI is `https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback`
- [x] **App Scheme**: `glowcheck` (configured in app.json)

## 🧪 Testing Steps

### Step 1: Clear Everything and Restart

1. **Stop your Expo app** (Ctrl+C in terminal)

2. **Clear Expo cache:**
   ```bash
   npm start -- --clear
   ```
   Or:
   ```bash
   npx expo start --clear
   ```

3. **On your device/simulator:**
   - Close the app completely (swipe it away)
   - Reopen the app

### Step 2: Test Google Sign-In

1. Open your app
2. Go to Login or Sign Up screen
3. Tap "Continue with Google"
4. **Watch the console logs** - you should see:
   ```
   [Auth] Starting Google OAuth
   [Auth] Platform: ios (or android)
   [Auth] Supabase URL: https://pmroozitldbgnchainxv.supabase.co
   [Auth] redirectTo: glowcheck://auth/callback
   ```

5. **Expected flow:**
   - Browser opens with Google login page
   - You sign in with Google
   - Browser redirects to Supabase callback
   - Supabase redirects to `glowcheck://auth/callback?code=...`
   - App receives the deep link
   - Console shows: `🔗 Deep link received: glowcheck://auth/callback?...`
   - Console shows: `✅ OAuth session established`

### Step 3: Check Console Logs

Look for these log messages in order:

**When you tap "Continue with Google":**
```
[Auth] Starting Google OAuth
[Auth] Platform: ios
[Auth] ExecutionEnvironment: Standalone
[Auth] Supabase URL: https://pmroozitldbgnchainxv.supabase.co
[Auth] redirectTo: glowcheck://auth/callback
[Auth] Opening OAuth URL...
```

**When OAuth completes:**
```
🔗 Deep link received: glowcheck://auth/callback?code=...
📋 OAuth params: { code: 'present', ... }
🔄 Exchanging code for session...
✅ OAuth session established via deep link: your@email.com
```

## 🔍 Troubleshooting

### Issue: Browser opens but shows error

**Symptoms:**
- Browser opens with Google login
- After login, shows error page or "too many redirects"

**Solutions:**
1. Verify Site URL is exactly: `https://pmroozitldbgnchainxv.supabase.co` (no trailing slash, no path)
2. Verify Google Cloud Console redirect URI is exactly: `https://pmroozitldbgnchainxv.supabase.co/auth/v1/callback`
3. Wait 5-10 minutes after making changes (Google/Supabase can take time to propagate)

### Issue: Browser opens but app doesn't receive callback

**Symptoms:**
- Google login succeeds
- Browser shows success but app doesn't sign in
- No deep link received

**Solutions:**
1. **Check if deep link is registered:**
   - On iOS: Settings → Your App → Check if URL scheme is registered
   - On Android: Check if intent filter is set

2. **Test deep link manually:**
   ```bash
   # iOS Simulator
   xcrun simctl openurl booted "glowcheck://auth/callback?test=123"
   
   # Android
   adb shell am start -W -a android.intent.action.VIEW -d "glowcheck://auth/callback?test=123" com.glowcheck01.app
   ```

3. **Check console for deep link logs:**
   - Look for: `🔗 Deep link received: ...`
   - If missing, the app isn't receiving the deep link

### Issue: "No code or access_token found"

**Symptoms:**
- Deep link is received
- Console shows: `⚠️ No code or access_token found`

**Solutions:**
1. Verify Redirect URLs in Supabase includes: `glowcheck://auth/callback`
2. Check the deep link URL format - it should include `?code=...` or `#code=...`
3. The code might be in the hash (`#`) instead of query params (`?`)

### Issue: "Provider is not enabled"

**Symptoms:**
- Error: "Unsupported provider: provider is not enabled"

**Solutions:**
1. Go to Supabase → Authentication → Providers → Google
2. Verify toggle is **ON** (green)
3. Verify Client ID and Secret are filled in
4. Click **Save**

### Issue: App crashes or freezes

**Symptoms:**
- App crashes when tapping "Continue with Google"
- App freezes after OAuth

**Solutions:**
1. Check console for error messages
2. Verify all dependencies are installed: `npm install --legacy-peer-deps`
3. Check if there are any TypeScript/compilation errors

## 📱 Platform-Specific Notes

### iOS
- Deep links work automatically with `scheme: "glowcheck"` in app.json
- Make sure you're testing on a real device or simulator (not Expo Go for production builds)

### Android
- Deep links require proper intent filters (handled by Expo)
- Test on a real device or emulator

### Expo Go vs Production Build
- **Expo Go**: Uses `exp://` scheme, may have limitations
- **Production Build**: Uses `glowcheck://` scheme (what you configured)
- For testing OAuth, use a production build or development build, not Expo Go

## 🐛 Debug Mode

Enable detailed logging by checking the console. The app logs:
- OAuth URL generation
- Deep link reception
- Code/token extraction
- Session establishment
- Any errors

## ✅ Success Indicators

You'll know it's working when:
1. Browser opens with Google login ✅
2. After login, browser redirects and closes ✅
3. App automatically signs you in ✅
4. Console shows: `✅ OAuth session established` ✅
5. You're logged into the app ✅

## 🆘 Still Not Working?

If you've tried everything:

1. **Share the console logs** - especially:
   - The OAuth URL that's generated
   - The deep link URL that's received
   - Any error messages

2. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs → Auth Logs
   - Look for any errors during OAuth attempts

3. **Verify timing:**
   - Wait 5-10 minutes after configuration changes
   - Some changes take time to propagate

4. **Test with a fresh build:**
   ```bash
   # Clear everything
   rm -rf node_modules
   npm install --legacy-peer-deps
   npm start -- --clear
   ```







