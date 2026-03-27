# Start iOS Build - Quick Guide

## 🚀 Option 1: Run the Build Script (Easiest)

I've created a script that will start the build and show you the URL:

```bash
cd /Users/nandanreddyavanaganti/dubai01
./start-ios-build.sh
```

When prompted:
- **Encryption compliance**: Answer **"Yes"** (standard/exempt encryption)
- The script will capture and display the build URL

## 🖥️ Option 2: Run Build Command Directly

Run this command in your terminal:

```bash
cd /Users/nandanreddyavanaganti/dubai01
eas build --platform ios --profile production
```

When prompted:
1. **Encryption compliance**: Answer **"Yes"**
2. The build will start and you'll see a URL like:
   ```
   https://expo.dev/accounts/nandan_07/projects/glowcheck01-app/builds/[build-id]
   ```

## 🌐 Option 3: Start via Expo Dashboard

1. Go to: **https://expo.dev/accounts/nandan_07/projects/glowcheck01-app**
2. Click **"Build"** or **"New Build"**
3. Select **"iOS"** → **"Production"**
4. Click **"Start Build"**
5. Answer **"Yes"** to encryption compliance
6. The build page will show the build URL immediately

## 📱 Getting the Build URL

After the build starts, you'll get a URL like:
```
https://expo.dev/accounts/nandan_07/projects/glowcheck01-app/builds/[build-id]
```

You can:
- **Monitor progress** on that page
- **Download the IPA** when complete
- **Get email notification** when done

## ⏱️ Build Time

- **First build**: 20-30 minutes
- **Subsequent builds**: 15-25 minutes

## 📧 Notifications

You'll receive an email when:
- Build starts
- Build completes (with download link)
- Build fails (with error details)

## 🔗 Quick Links

- **Project Dashboard**: https://expo.dev/accounts/nandan_07/projects/glowcheck01-app
- **All Builds**: https://expo.dev/accounts/nandan_07/projects/glowcheck01-app/builds
- **Build Status**: Check the builds page for real-time updates

## 💡 Pro Tip

After starting the build, you can check status anytime with:
```bash
eas build:list --platform ios --limit 1
```

This shows your most recent iOS build with its status and URL.
