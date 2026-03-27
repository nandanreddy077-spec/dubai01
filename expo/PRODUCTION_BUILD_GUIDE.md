# Production Build Configuration for Glow Check App

This file contains the exact configuration needed to build your app with real payment functionality.

## Required Files for Production Build

### 1. app.json (Production Configuration)
```json
{
  "expo": {
    "name": "Glow Check",
    "slug": "glow-check-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "glowcheck",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.glowcheck01.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "Allow Glow Check to access your photos for beauty analysis",
        "NSCameraUsageDescription": "Allow Glow Check to access your camera for beauty analysis",
        "NSMicrophoneUsageDescription": "Allow Glow Check to access your microphone for voice features"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.glowcheck01.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://glowcheck.app/"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Glow Check to access your photos for beauty analysis"
        }
      ],
      [
        "react-native-purchases",
        {
          "revenuecat_api_key": "appl_YOUR_IOS_API_KEY"
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#FF6B9D",
          "defaultChannel": "default"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {
        "origin": "https://glowcheck.app/"
      }
    }
  }
}
```

### 2. package.json (Production Dependencies)
Add these dependencies for production build:
```json
{
  "dependencies": {
    "react-native-purchases": "^7.0.0"
  }
}
```

### 3. eas.json (EAS Build Configuration)
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Build Commands

### Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### Login to Expo
```bash
eas login
```

### Configure Project
```bash
eas build:configure
```

### Build for iOS (Production)
```bash
eas build --platform ios --profile production
```

### Build for Android (Production)
```bash
eas build --platform android --profile production
```

### Build Both Platforms
```bash
eas build --platform all --profile production
```

## Environment Variables for EAS Build

Set these in your EAS project settings or use eas.json:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_REVENUECAT_API_KEY_IOS": "appl_YOUR_IOS_API_KEY",
        "EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID": "goog_YOUR_ANDROID_API_KEY",
        "EXPO_PUBLIC_SUPABASE_URL": "your_supabase_url",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your_supabase_anon_key"
      }
    }
  }
}
```

## Code Signing

### iOS Code Signing
1. Add your Apple Developer account to EAS:
```bash
eas credentials:configure
```

2. EAS will handle certificate and provisioning profile creation

### Android Code Signing
1. Generate keystore:
```bash
eas credentials:configure
```

2. EAS will create and manage your Android keystore

## Submission to Stores

### iOS App Store
```bash
eas submit --platform ios
```

### Google Play Store
```bash
eas submit --platform android
```

## Important Notes

1. **Bundle/Package IDs**: Must match exactly:
   - iOS: `com.glowcheck01.app`
   - Android: `com.glowcheck01.app`

2. **Product IDs**: Must match in App Store Connect and Google Play Console:
   - Monthly: `com.glowcheck.app.premium.monthly`
   - Yearly: `com.glowcheck.app.premium.annual`

3. **RevenueCat Configuration**: 
   - iOS API Key: Get from RevenueCat dashboard
   - Android API Key: Get from RevenueCat dashboard
   - Entitlement ID: `premium`

4. **Testing**:
   - Use TestFlight for iOS testing
   - Use Internal Testing track for Android testing

5. **Webhooks**:
   - Deploy webhook handler to Vercel/Netlify
   - Configure webhook URL in RevenueCat dashboard

## Troubleshooting

### Build Failures
- Check bundle/package ID matches
- Verify all required permissions are set
- Ensure code signing is configured

### Payment Issues
- Verify product IDs match exactly
- Check RevenueCat configuration
- Test with sandbox accounts first

### Store Rejection
- Ensure app metadata is complete
- Add privacy policy and terms of service
- Test all payment flows thoroughly

## Final Checklist

Before submitting to stores:

- [ ] Bundle/Package IDs configured correctly
- [ ] Product IDs created in App Store Connect and Google Play Console
- [ ] RevenueCat configured with correct API keys
- [ ] Webhook handler deployed and configured
- [ ] Database schema updated with RevenueCat tables
- [ ] Environment variables set in EAS
- [ ] App tested with sandbox payments
- [ ] Privacy policy and terms of service added
- [ ] App metadata and screenshots prepared
- [ ] Code signing configured for both platforms

## Support

If you encounter issues:
1. Check EAS build logs for specific errors
2. Verify all configuration matches this guide
3. Test payments in sandbox environment first
4. Review RevenueCat documentation for integration issues