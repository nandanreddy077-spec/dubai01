# Building Android AAB File via Expo.dev

## ✅ Project Setup Complete
Your EAS project has been created and linked:
- **Project**: `@nandan_07/glowcheck01-app`
- **Project URL**: https://expo.dev/accounts/nandan_07/projects/glowcheck01-app
- **Project ID**: `683359fa-56ae-4a2e-abed-8148d23737ab`

## 📱 Build Configuration
Your `eas.json` is configured for Android AAB builds:
- **Build Type**: `app-bundle` (AAB format)
- **Package**: `com.glowcheck01.app`
- **Profile**: `production`

## 🚀 Option 1: Build via Expo Dashboard (Recommended)

1. **Go to Expo Dashboard:**
   - Visit: https://expo.dev/accounts/nandan_07/projects/glowcheck01-app
   - Or navigate: Expo Dashboard → Projects → glowcheck01-app

2. **Start Build:**
   - Click "Build" or "New Build"
   - Select "Android"
   - Select "Production" profile
   - Click "Start Build"

3. **Android Credentials:**
   - If you don't have credentials yet, Expo will prompt you
   - Choose "Let Expo manage credentials" (recommended)
   - Or upload your own keystore if you have one

4. **Monitor Build:**
   - Watch the build progress in real-time
   - Download the AAB file when complete

## 🖥️ Option 2: Build via Command Line (Interactive)

Run this command in your terminal:

```bash
cd /Users/nandanreddyavanaganti/dubai01
eas build --platform android --profile production
```

When prompted:
1. **Android Credentials**: Choose "Let Expo manage credentials" (recommended)
2. The build will start automatically
3. You'll get a build URL to monitor progress

## 📋 Option 3: Set Up Credentials First, Then Build

1. **Set up Android credentials:**
   ```bash
   eas credentials
   ```
   - Select "Android"
   - Choose "Let Expo manage credentials"
   - This will generate a keystore automatically

2. **Then start the build:**
   ```bash
   eas build --platform android --profile production
   ```

## 📦 What You'll Get

After the build completes, you'll receive:
- **AAB file** (Android App Bundle) - ready for Google Play Store
- **Build URL** to download the file
- **Email notification** when build is complete

## 🔍 Monitor Build Status

- **Dashboard**: https://expo.dev/accounts/nandan_07/projects/glowcheck01-app/builds
- **Command**: `eas build:list` (to see all builds)

## ⚙️ Build Configuration Details

Your production build includes:
- **Environment Variables**:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_OPENAI_API_KEY`
  - `EXPO_PUBLIC_AMAZON_AFFILIATE_TAG`

- **Android Settings**:
  - Package: `com.glowcheck01.app`
  - Build Type: `app-bundle` (AAB)
  - Resource Class: `medium`

## 🎯 Quick Start (Recommended)

**Easiest way**: Go to https://expo.dev/accounts/nandan_07/projects/glowcheck01-app and click "Build" → "Android" → "Production"

The build will take approximately 10-20 minutes depending on queue.

## 📝 Notes

- First build may take longer as credentials are set up
- You'll receive an email when the build is complete
- AAB files are required for Google Play Store submissions
- Keep your credentials secure - Expo manages them automatically
