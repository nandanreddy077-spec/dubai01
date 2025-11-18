# Production Payment Setup Guide

## Current Status
❌ **Your app will NOT handle payments properly when built as .aab/.ipa files** because it's missing the actual payment SDK integration.

## What You Need to Do for Production

### 1. Update app.json Configuration
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.glowcheck01.app"
    },
    "android": {
      "package": "com.glowcheck01.app"
    },
    "plugins": [
      [
        "react-native-purchases",
        {
          "revenuecat_api_key": "YOUR_REVENUECAT_PUBLIC_API_KEY"
        }
      ]
    ]
  }
}
```

### 2. Install RevenueCat SDK
For production build (not Expo Go):
```bash
expo install react-native-purchases
```

### 3. Set Up RevenueCat Dashboard
1. Create account at https://revenuecat.com
2. Add your app with bundle ID: `com.glowcheck01.app`
3. Configure products:
   - Monthly: `com.glowcheck.app.premium.monthly` ($8.99)
   - Yearly: `com.glowcheck.app.premium.annual` ($99.00)
4. Set up 3-day free trial for both products
5. Create entitlement called "premium"
6. Get your public API key

### 4. Environment Variables
Add to your .env file:
```
EXPO_PUBLIC_REVENUECAT_API_KEY=your_public_api_key_here
```

### 5. Uncomment Production Code
In `lib/payments.ts`, uncomment all the RevenueCat code sections marked with `/* */`

### 6. App Store Connect Setup
1. Create app with bundle ID: `com.glowcheck01.app`
2. Add in-app purchases:
   - Monthly subscription: `com.glowcheck.app.premium.monthly`
   - Yearly subscription: `com.glowcheck.app.premium.annual`
3. Configure 3-day free trial
4. Set pricing: $8.99/month, $99/year
5. Add your shared secret to RevenueCat

### 7. Google Play Console Setup
1. Create app with package name: `com.glowcheck01.app`
2. Add subscription products with same IDs
3. Upload your service account JSON to RevenueCat
4. Configure billing

### 8. Build for Production
```bash
# For iOS
eas build --platform ios

# For Android
eas build --platform android
```

## Current Limitations in Expo Go

- ✅ UI works correctly
- ✅ Redirects to app stores for subscription
- ❌ No actual in-app purchase processing
- ❌ No subscription status checking
- ❌ No purchase restoration

## After Production Setup

- ✅ Real in-app purchases
- ✅ Subscription status checking
- ✅ Purchase restoration
- ✅ Trial period handling
- ✅ Cross-platform payment processing

## Testing

1. **Development**: Use Expo Go (current state) - redirects to stores
2. **Production**: Build .aab/.ipa with RevenueCat integration
3. **Sandbox Testing**: Use App Store Connect sandbox and Google Play testing tracks

## Important Notes

- Your Google service account JSON is already configured
- Product IDs match your requirements
- Pricing is set correctly ($8.99/month, $99/year)
- 3-day free trial is configured
- Bundle IDs need to be updated in app.json

## Next Steps

1. Update app.json with correct bundle IDs
2. Set up RevenueCat dashboard
3. Add RevenueCat API key to environment
4. Uncomment production code in payments.ts
5. Build for production testing