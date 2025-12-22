# Building iOS IPA File via Expo.dev

## ✅ Configuration Complete
Your iOS build configuration is ready:
- **Bundle Identifier**: `com.glowcheck01.app`
- **Resource Class**: `m-medium` (updated from deprecated m1-medium)
- **Build Configuration**: `Release`
- **Apple Team ID**: `2V4DJQD8G3`
- **Apple Credentials**: Already configured ✅

## 🚀 Option 1: Build via Expo Dashboard (Recommended)

1. **Go to Expo Dashboard:**
   - Visit: https://expo.dev/accounts/nandan_07/projects/glowcheck01-app
   - Or navigate: Expo Dashboard → Projects → glowcheck01-app

2. **Start iOS Build:**
   - Click "Build" or "New Build"
   - Select "iOS"
   - Select "Production" profile
   - Click "Start Build"

3. **Encryption Compliance:**
   - When asked: "iOS app only uses standard/exempt encryption?"
   - Answer: **Yes** (most apps use standard HTTPS/encryption)
   - This is required by Apple for App Store submission

4. **Monitor Build:**
   - Watch the build progress in real-time
   - Download the IPA file when complete

## 🖥️ Option 2: Build via Command Line (Interactive)

Run this command in your terminal:

```bash
cd /Users/nandanreddyavanaganti/dubai01
eas build --platform ios --profile production
```

When prompted:
1. **Encryption Compliance**: Answer "Yes" (standard/exempt encryption)
2. **Credentials**: Use existing credentials (you already have them set up)
3. The build will start automatically

## 📋 What Happens During Build

1. **Credential Check**: Uses your existing Apple credentials:
   - ✅ Apple Distribution Certificate (Serial: 257FDB58AA7ECF4A71029E827803C0FB)
   - ✅ Apple Push Key (Key ID: 5B64PSS7SS)
   - ✅ App Store Connect API Key (Identifier: glowcheck)
   - ✅ Apple Team (ID: 2V4DJQD8G3)

2. **Build Process**:
   - Compiles your React Native/Expo app
   - Signs with your distribution certificate
   - Creates IPA file
   - Takes approximately 15-25 minutes

3. **Completion**:
   - You'll receive an email notification
   - Download link will be available
   - IPA file ready for App Store submission

## 📦 What You'll Get

After the build completes, you'll receive:
- **IPA file** (iOS App Archive) - ready for App Store Connect
- **Build URL** to download the file
- **Email notification** when build is complete

## 🔍 Monitor Build Status

- **Dashboard**: https://expo.dev/accounts/nandan_07/projects/glowcheck01-app/builds
- **Command**: `eas build:list --platform ios` (to see iOS builds)

## ⚙️ Build Configuration Details

Your production build includes:
- **Environment Variables**:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_OPENAI_API_KEY`
  - `EXPO_PUBLIC_AMAZON_AFFILIATE_TAG`

- **iOS Settings**:
  - Bundle ID: `com.glowcheck01.app`
  - Resource Class: `m-medium`
  - Build Configuration: `Release`
  - Simulator: `false` (device build)

## 📱 App Store Submission

After you have the IPA file:
1. Upload to App Store Connect via:
   - **Transporter app** (macOS)
   - **Xcode Organizer**
   - **EAS Submit**: `eas submit --platform ios`

2. Your `eas.json` already has submit configuration:
   ```json
   "submit": {
     "production": {
       "ios": {
         "appleId": "your-apple-id@example.com",
         "ascAppId": "your-app-store-connect-app-id",
         "appleTeamId": "2V4DJQD8G3"
       }
     }
   }
   ```

## 🎯 Quick Start (Recommended)

**Easiest way**: Go to https://expo.dev/accounts/nandan_07/projects/glowcheck01-app and click "Build" → "iOS" → "Production"

When prompted about encryption, select **"Yes"** (standard/exempt encryption).

## 📝 Notes

- First build may take longer (20-30 minutes)
- You'll receive an email when the build is complete
- IPA files are required for App Store submissions
- Your Apple credentials are already configured ✅
- Make sure your App Store Connect app is created before submitting

## 🔐 Encryption Compliance

Most apps use **standard/exempt encryption** (HTTPS, standard libraries). Answer **"Yes"** when prompted. This is required by Apple for export compliance.

