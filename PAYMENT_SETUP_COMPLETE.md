# Complete Payment Setup Guide for Glow Check App

This guide will help you set up real payments for both App Store and Google Play Store using RevenueCat.

## Overview

Your app is configured to use:
- **Monthly Subscription**: $8.99/month with 3-day free trial
- **Yearly Subscription**: $99/year with 3-day free trial
- **Bundle ID**: com.glowcheck01.app
- **Package Name**: com.glowcheck01.app

## Step 1: RevenueCat Setup

### 1.1 Create RevenueCat Account
1. Go to [RevenueCat](https://www.revenuecat.com/)
2. Sign up for a free account
3. Create a new project called "Glow Check"

### 1.2 Configure App Store Connect Integration
1. In RevenueCat dashboard, go to "App settings"
2. Add iOS app with Bundle ID: `com.glowcheck01.app`
3. Upload your App Store Connect API Key:
   - Team ID: `2V4DJQD8G3`
   - Shared Secret: `5063e6dd7c174550b12001c140f6b803`

### 1.3 Configure Google Play Console Integration
1. In RevenueCat dashboard, add Android app
2. Package Name: `com.glowcheck01.app`
3. Upload the Google Play service account JSON file you provided

### 1.4 Get RevenueCat API Keys
1. Go to "API keys" in RevenueCat dashboard
2. Copy the iOS API key (starts with `appl_`)
3. Copy the Android API key (starts with `goog_`)

## Step 2: App Store Connect Setup

### 2.1 Create Subscription Products
1. Go to App Store Connect
2. Navigate to your app → Features → In-App Purchases
3. Create two Auto-Renewable Subscriptions:

**Monthly Subscription:**
- Product ID: `com.glowcheck.app.premium.monthly`
- Reference Name: "Monthly Glow Premium"
- Price: $8.99/month
- Free Trial: 3 days

**Yearly Subscription:**
- Product ID: `com.glowcheck.app.premium.annual`
- Reference Name: "Yearly Glow Premium"
- Price: $99/year
- Free Trial: 3 days

### 2.2 Create Subscription Group
1. Create a subscription group called "Glow Premium"
2. Add both subscriptions to this group
3. Set yearly as higher service level than monthly

## Step 3: Google Play Console Setup

### 3.1 Create Subscription Products
1. Go to Google Play Console
2. Navigate to your app → Monetize → Products → Subscriptions
3. Create two subscriptions:

**Monthly Subscription:**
- Product ID: `com.glowcheck.app.premium.monthly`
- Name: "Monthly Glow Premium"
- Price: $8.99/month
- Free Trial: 3 days

**Yearly Subscription:**
- Product ID: `com.glowcheck.app.premium.annual`
- Name: "Yearly Glow Premium"
- Price: $99/year
- Free Trial: 3 days

## Step 4: RevenueCat Product Configuration

### 4.1 Create Entitlement
1. In RevenueCat dashboard, go to "Entitlements"
2. Create entitlement called "premium"
3. This controls access to premium features

### 4.2 Create Products
1. Go to "Products" in RevenueCat
2. Add both subscription products:
   - `com.glowcheck.app.premium.monthly`
   - `com.glowcheck.app.premium.annual`
3. Attach both products to the "premium" entitlement

### 4.3 Create Offering
1. Go to "Offerings" in RevenueCat
2. Create offering called "default"
3. Add both products to this offering
4. Set as current offering

## Step 5: Update Environment Variables

Create a `.env` file in your project root with:

```env
# RevenueCat API Keys (get from RevenueCat dashboard)
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_YOUR_ACTUAL_IOS_API_KEY
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_YOUR_ACTUAL_ANDROID_API_KEY

# App Store Connect Configuration
EXPO_PUBLIC_APP_STORE_TEAM_ID=2V4DJQD8G3
EXPO_PUBLIC_APP_STORE_BUNDLE_ID=com.glowcheck01.app
EXPO_PUBLIC_APP_STORE_SHARED_SECRET=5063e6dd7c174550b12001c140f6b803

# Google Play Configuration
EXPO_PUBLIC_GOOGLE_PLAY_PACKAGE_NAME=com.glowcheck01.app

# Product IDs
EXPO_PUBLIC_MONTHLY_PRODUCT_ID=com.glowcheck.app.premium.monthly
EXPO_PUBLIC_YEARLY_PRODUCT_ID=com.glowcheck.app.premium.annual

# Pricing
EXPO_PUBLIC_MONTHLY_PRICE=8.99
EXPO_PUBLIC_YEARLY_PRICE=99.00
EXPO_PUBLIC_TRIAL_DAYS=3
```

## Step 6: Build Configuration

### 6.1 Update app.json
Add the RevenueCat plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-purchases",
        {
          "revenuecat_api_key": "appl_YOUR_IOS_API_KEY"
        }
      ]
    ]
  }
}
```

### 6.2 Install Dependencies
When building standalone app, add to package.json:

```json
{
  "dependencies": {
    "react-native-purchases": "^7.0.0"
  }
}
```

## Step 7: Testing

### 7.1 Sandbox Testing (iOS)
1. Create sandbox test accounts in App Store Connect
2. Sign out of App Store on test device
3. Sign in with sandbox account when prompted during purchase

### 7.2 Internal Testing (Android)
1. Upload signed APK to Google Play Console
2. Add test accounts to internal testing track
3. Install app from Play Store internal testing

## Step 8: Production Deployment

### 8.1 iOS Deployment
1. Build production IPA with EAS Build
2. Upload to App Store Connect
3. Submit for review with in-app purchases

### 8.2 Android Deployment
1. Build production AAB with EAS Build
2. Upload to Google Play Console
3. Publish to production

## Important Notes

1. **Testing in Expo Go**: Payments will redirect to store pages since react-native-purchases doesn't work in Expo Go
2. **Standalone Builds**: Real payments will work in production builds
3. **RevenueCat Webhooks**: Set up webhooks for server-side validation
4. **Receipt Validation**: RevenueCat handles receipt validation automatically
5. **Cross-Platform**: Users can access premium features across iOS and Android with same account

## Troubleshooting

### Common Issues:
1. **Products not loading**: Check product IDs match exactly
2. **Purchase fails**: Verify app is signed with production certificate
3. **Entitlements not active**: Check RevenueCat product configuration
4. **Sandbox issues**: Ensure using sandbox test account

### Support:
- RevenueCat Documentation: https://docs.revenuecat.com/
- App Store Connect Help: https://developer.apple.com/support/app-store-connect/
- Google Play Console Help: https://support.google.com/googleplay/android-developer/

## Revenue Tracking

The app includes analytics tracking for:
- Purchase events
- Trial starts
- Subscription cancellations
- Revenue metrics

All events are logged and can be integrated with your analytics service.