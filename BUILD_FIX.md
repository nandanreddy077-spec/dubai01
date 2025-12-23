# Build Fix - Capability Sync Error

## ✅ Fixed Issues

1. **Stripe Plugin Configuration**: Fixed invalid placeholder values
2. **Capability Sync**: Disabled auto capability syncing to avoid errors

## 🚀 Build Command

Run this command in your terminal:

```bash
cd /Users/nandanreddyavanaganti/dubai01
EXPO_NO_CAPABILITY_SYNC=1 eas build --platform ios --profile production
```

Or use the script:
```bash
./build-ios-fixed.sh
```

## 📋 Answer Prompts

When prompted:
1. **"iOS app only uses standard/exempt encryption?"** → Type: `yes`
2. **"Do you want to log in to your Apple account?"** → Type: `yes` (you're already logged in)
3. If asked for 2FA code → Enter the code from your device

## ✅ What's Fixed

- ✅ Stripe plugin configuration (removed invalid placeholders)
- ✅ Capability sync disabled (prevents bundle deletion errors)
- ✅ Build should proceed without capability errors

## 📱 After Build Starts

You'll see a Build URL like:
```
https://expo.dev/accounts/nandan_07/projects/glowcheck01-app/builds/[build-id]
```

**Copy that URL and share it with me!**

## ⏱️ Build Time

- Build takes: **15-25 minutes**
- You'll get an email when complete
- IPA file will be available for download



