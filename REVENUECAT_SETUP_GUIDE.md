# RevenueCat Setup Guide for Glow Check App

## Overview
This guide will help you complete the RevenueCat setup for real payment processing in your Glow Check app.

## Your App Configuration
- **Bundle ID (iOS)**: com.glowcheck01.app
- **Package Name (Android)**: com.glowcheck01.app
- **Team ID**: 2V4DJQD8G3
- **App Store Shared Secret**: 5063e6dd7c174550b12001c140f6b803

## Product IDs
- **Monthly Plan**: com.glowcheck.app.premium.monthly ($8.99/month)
- **Yearly Plan**: com.glowcheck.app.premium.annual ($99/year)
- **Free Trial**: 3 days for both plans

## Step 1: Create RevenueCat Account
1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Sign up or log in
3. Create a new project called "Glow Check"

## Step 2: Configure iOS App in RevenueCat
1. In RevenueCat dashboard, go to "Apps"
2. Click "Add App" → "iOS"
3. Enter:
   - **App Name**: Glow Check
   - **Bundle ID**: com.glowcheck01.app
   - **App Store Shared Secret**: 5063e6dd7c174550b12001c140f6b803
4. Save the app

## Step 3: Configure Android App in RevenueCat
1. Click "Add App" → "Android"
2. Enter:
   - **App Name**: Glow Check Android
   - **Package Name**: com.glowcheck01.app
3. Upload your Google Service Account JSON file (the one you provided)
4. Save the app

## Step 4: Create Products in RevenueCat
1. Go to "Products" in RevenueCat dashboard
2. Click "Add Product"
3. Create Monthly Product:
   - **Product ID**: com.glowcheck.app.premium.monthly
   - **Type**: Subscription
   - **Duration**: 1 month
4. Create Yearly Product:
   - **Product ID**: com.glowcheck.app.premium.annual
   - **Type**: Subscription
   - **Duration**: 1 year

## Step 5: Create Entitlement
1. Go to "Entitlements" in RevenueCat dashboard
2. Click "Add Entitlement"
3. Create entitlement:
   - **Identifier**: premium
   - **Description**: Premium features access
4. Attach both products to this entitlement

## Step 6: Create Offering
1. Go to "Offerings" in RevenueCat dashboard
2. Click "Add Offering"
3. Create offering:
   - **Identifier**: default
   - **Description**: Default subscription offering
4. Add both products to this offering

## Step 7: Get API Keys
1. Go to "API Keys" in RevenueCat dashboard
2. Copy the iOS API key (starts with "appl_")
3. Copy the Android API key (starts with "goog_")

## Step 8: Update Environment Variables
Update your `.env` file with the API keys:

```env
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_YOUR_ACTUAL_IOS_API_KEY
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_YOUR_ACTUAL_ANDROID_API_KEY
```

## Step 9: App Store Connect Setup
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create your app with bundle ID: com.glowcheck01.app
3. Go to "Features" → "In-App Purchases"
4. Create Auto-Renewable Subscriptions:
   - **Product ID**: com.glowcheck.app.premium.monthly
   - **Price**: $8.99
   - **Subscription Duration**: 1 Month
   - **Free Trial**: 3 Days
   
   - **Product ID**: com.glowcheck.app.premium.annual
   - **Price**: $99.00
   - **Subscription Duration**: 1 Year
   - **Free Trial**: 3 Days

## Step 10: Google Play Console Setup
1. Go to [Google Play Console](https://play.google.com/console)
2. Create your app with package name: com.glowcheck01.app
3. Go to "Monetization" → "Products" → "Subscriptions"
4. Create subscriptions with the same product IDs and pricing

## Step 11: Install RevenueCat SDK
For production builds, you'll need to install the RevenueCat SDK:

```bash
npm install react-native-purchases
```

## Step 12: Test Your Setup
1. Build your app for TestFlight (iOS) or Internal Testing (Android)
2. Test the subscription flow
3. Verify purchases appear in RevenueCat dashboard

## Important Notes
- The current code is set up to work in both development (Expo Go) and production
- In Expo Go, it will redirect to app stores
- In production builds, it will use the actual RevenueCat SDK
- Make sure to test thoroughly before releasing

## Webhook Setup (Optional but Recommended)
Set up webhooks in RevenueCat to sync subscription status with your Supabase backend:
1. Go to "Integrations" → "Webhooks" in RevenueCat
2. Add webhook URL pointing to your backend
3. Configure events to track subscription changes

Your app is now configured for real payments! The payment flow will work as follows:
1. User taps subscription button
2. App shows native iOS/Android payment sheet
3. Payment is processed through App Store/Google Play
4. RevenueCat handles receipt validation
5. Your app receives confirmation and unlocks premium features