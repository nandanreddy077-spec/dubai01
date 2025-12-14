# OAuth Testing Guide for GlowCheck

## ✅ What's Done

1. ✅ Google OAuth enabled in Supabase
2. ✅ OAuth buttons added to signup and login screens
3. ✅ App scheme configured: `glowcheck`

## 🧪 Next Steps: Test Google Sign-In

### Step 1: Test on Web/Expo Go

1. **Start your development server:**
   ```bash
   bun start
   ```

2. **Open the app** in Expo Go or web browser

3. **Navigate to Signup or Login screen**

4. **Click "Continue with Google"**

5. **Expected flow:**
   - Browser/WebView opens
   - Google sign-in page appears
   - After signing in, you're redirected back to the app
   - User is authenticated and logged in

### Step 2: Test on iOS Simulator/Device

1. **Build and run on iOS:**
   ```bash
   bunx expo run:ios
   ```

2. **Test the Google Sign-In flow**

3. **Note:** For production iOS apps, you may need to:
   - Configure URL schemes in `Info.plist`
   - Set up Associated Domains for universal links

### Step 3: Test on Android Emulator/Device

1. **Build and run on Android:**
   ```bash
   bunx expo run:android
   ```

2. **Test the Google Sign-In flow**

## 🔧 Troubleshooting

### Issue: "redirect_uri_mismatch"
**Solution:** 
- Make sure the callback URL in Google Cloud Console exactly matches:
  ```
  https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback
  ```
- Check for trailing slashes or extra characters

### Issue: OAuth opens but doesn't redirect back
**Solution:**
- Check that your app scheme `glowcheck://` is properly configured
- For web: The redirect should work automatically
- For mobile: May need to configure deep linking

### Issue: "invalid_client" error
**Solution:**
- Double-check Client ID and Client Secret in Supabase
- Make sure they're from the same Google Cloud project
- Verify OAuth consent screen is configured

### Issue: Authentication succeeds but user not logged in
**Solution:**
- Check browser console for errors
- Verify Supabase session is being created
- Check `onAuthStateChange` listener in AuthContext

## 📱 Optional: Set Up Apple Sign-In

If you want to enable Apple Sign-In (iOS only):

1. **In Supabase Dashboard:**
   - Go to Authentication → Providers → Apple
   - Enable Apple Sign-In
   - You'll need:
     - Apple Services ID
     - Apple Team ID
     - Apple Key ID
     - Apple Private Key

2. **In Apple Developer Account:**
   - Create a Services ID
   - Configure Sign in with Apple
   - Add callback URL: `https://jsvzqgtqkanscjoafyoi.supabase.co/auth/v1/callback`

3. **The Apple button will automatically appear on iOS devices**

## 🎯 Production Checklist

Before going to production:

- [ ] Test OAuth on all platforms (iOS, Android, Web)
- [ ] Verify user data is being saved correctly
- [ ] Test error handling (network errors, cancelled auth)
- [ ] Set up proper error logging
- [ ] Configure production redirect URLs in Google Cloud Console
- [ ] Test with multiple Google accounts
- [ ] Verify user profile creation after OAuth sign-in
- [ ] Test sign-out and sign-in again flow

## 📝 Notes

- The OAuth flow uses `expo-auth-session` which handles the browser redirect automatically
- For production, you may want to use native Google Sign-In SDKs for better UX
- Apple Sign-In is only available on iOS devices (the button won't show on Android/Web)

