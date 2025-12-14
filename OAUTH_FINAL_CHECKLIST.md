# OAuth Sign-In Final Checklist

## ✅ What's Been Set Up

### Google OAuth
- ✅ Google OAuth enabled in Supabase
- ✅ Client ID and Secret configured in Supabase
- ✅ Callback URL configured: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`
- ✅ OAuth buttons added to signup and login screens
- ✅ Error handling improved
- ✅ Deep linking configured (scheme: `glowcheck`)

### Apple OAuth
- ✅ Apple OAuth enabled in Supabase
- ✅ Services ID created: `com.glowcheck01.web`
- ✅ App ID configured: `com.glowcheck01.app`
- ✅ Secret Key generated (JWT token)
- ✅ Client IDs configured in Supabase: `com.glowcheck01.app,com.glowcheck01.web`
- ✅ OAuth buttons added to signup and login screens (iOS only)
- ✅ Error handling improved

## 🔧 Configuration Checklist

### Google Cloud Console
- [ ] Verify redirect URL is added:
  - `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`
  - `glowcheck://auth/callback` (for mobile deep linking)

### Apple Developer Portal
- [ ] Verify Services ID (`com.glowcheck01.web`) is configured:
  - Sign in with Apple enabled
  - Primary App ID: `com.glowcheck01.app`
  - Domains: `jsvzqgtqkanscjoafyoi.supabase.co`
  - Return URLs: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`

### Supabase Configuration
- [ ] Google Provider:
  - Enable Sign in with Google: ✅ ON
  - Client IDs: (your Google Client ID)
  - Client Secret: (your Google Client Secret)
  - Callback URL: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`

- [ ] Apple Provider:
  - Enable Sign in with Apple: ✅ ON
  - Client IDs: `com.glowcheck01.app,com.glowcheck01.web`
  - Secret Key: (JWT token generated)
  - Callback URL: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`

## 🧪 Testing Steps

### Test Google Sign-In

1. **On Web:**
   - Open app in browser
   - Click "Continue with Google"
   - Should open Google sign-in
   - After signing in, should redirect back and log in

2. **On Mobile (iOS/Android):**
   - Open app
   - Click "Continue with Google"
   - Should open browser/WebView
   - After signing in, should redirect back to app
   - Should be logged in

### Test Apple Sign-In

1. **On iOS Device/Simulator:**
   - Open app
   - Click "Continue with Apple"
   - Should open native Apple Sign-In
   - After signing in, should be logged in

2. **On Android/Web:**
   - Apple button should NOT appear (this is correct)

## 🐛 Troubleshooting

### Google Sign-In Issues

**Problem: "redirect_uri_mismatch"**
- Solution: Add both URLs to Google Cloud Console:
  - `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`
  - `glowcheck://auth/callback`

**Problem: Opens browser but doesn't redirect back**
- Solution: Check app scheme is `glowcheck` in `app.json`
- Verify deep linking is configured

**Problem: "invalid_client"**
- Solution: Double-check Client ID and Secret in Supabase match Google Cloud Console

### Apple Sign-In Issues

**Problem: "Invalid client"**
- Solution: Verify Services ID matches exactly in both places
- Check callback URL matches in Apple Developer Portal

**Problem: Button doesn't appear**
- Solution: Apple Sign-In only works on iOS. This is expected on Android/Web.

**Problem: "Invalid key"**
- Solution: Secret key may be expired (regenerate if older than 6 months)
- Verify Key ID and Team ID are correct

**Problem: Key expired**
- Solution: Regenerate secret key using `generate-apple-secret.js`
- Update in Supabase

## 📝 Important Notes

1. **Secret Key Expiration:**
   - Apple secret keys expire every 6 months
   - Set a reminder to regenerate in 5 months
   - Use the same script: `node generate-apple-secret.js`

2. **Platform Support:**
   - Google: Works on all platforms (iOS, Android, Web)
   - Apple: Only works on iOS devices

3. **Deep Linking:**
   - App scheme: `glowcheck`
   - Redirect path: `auth/callback`
   - Full URL: `glowcheck://auth/callback`

4. **Session Handling:**
   - Sessions are automatically managed by Supabase
   - Auth state changes are listened to in `AuthContext`
   - Sessions persist across app restarts

## ✅ Final Verification

After setup, verify:
- [ ] Google sign-in works on web
- [ ] Google sign-in works on mobile
- [ ] Apple sign-in works on iOS
- [ ] Users are properly authenticated after OAuth
- [ ] User data is saved correctly
- [ ] Sessions persist after app restart
- [ ] Error messages are user-friendly
- [ ] Loading states work correctly

