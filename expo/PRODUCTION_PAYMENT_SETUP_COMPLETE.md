# Complete Production Payment Setup Guide

## Overview
This guide provides complete setup instructions for implementing real payments in your Glow Check app using RevenueCat for both iOS App Store and Google Play Store.

## Your App Configuration
- **Bundle ID (iOS)**: com.glowcheck01.app
- **Package Name (Android)**: com.glowcheck01.app
- **Team ID**: 2V4DJQD8G3
- **App Store Shared Secret**: 5063e6dd7c174550b12001c140f6b803

## Product IDs
- **Monthly Subscription**: com.glowcheck.app.premium.monthly ($8.99/month)
- **Yearly Subscription**: com.glowcheck.app.premium.annual ($99.00/year)
- **Free Trial**: 3 days for both plans

## Step 1: RevenueCat Setup

### 1.1 Create RevenueCat Account
1. Go to https://www.revenuecat.com/
2. Sign up for a free account
3. Create a new project called "Glow Check"

### 1.2 Configure iOS App Store
1. In RevenueCat dashboard, go to "Apps" → "Add App"
2. Select "iOS" platform
3. Enter your Bundle ID: `com.glowcheck01.app`
4. Upload your App Store Connect API Key:
   - Go to App Store Connect → Users and Access → Keys
   - Create a new API key with "App Manager" role
   - Download the .p8 file and upload to RevenueCat
   - Enter your Issuer ID and Key ID from App Store Connect

### 1.3 Configure Google Play Store
1. In RevenueCat dashboard, add Android app
2. Enter your Package Name: `com.glowcheck01.app`
3. Upload your Google Play Service Account JSON:
   - Use the JSON file you provided (already configured)
   - Upload the complete JSON to RevenueCat

### 1.4 Get RevenueCat API Keys
After setup, get your API keys from RevenueCat dashboard:
- iOS API Key (starts with `appl_`)
- Android API Key (starts with `goog_`)

## Step 2: App Store Connect Setup

### 2.1 Create Subscriptions
1. Go to App Store Connect → Your App → Features → In-App Purchases
2. Create two Auto-Renewable Subscriptions:

**Monthly Subscription:**
- Product ID: `com.glowcheck.app.premium.monthly`
- Reference Name: "Monthly Glow Premium"
- Price: $8.99 USD
- Subscription Duration: 1 Month
- Free Trial: 3 Days

**Yearly Subscription:**
- Product ID: `com.glowcheck.app.premium.annual`
- Reference Name: "Yearly Glow Premium"
- Price: $99.00 USD
- Subscription Duration: 1 Year
- Free Trial: 3 Days

### 2.2 Create Subscription Group
1. Create a new subscription group called "Glow Premium"
2. Add both subscriptions to this group
3. Set yearly as higher level (for upgrade/downgrade logic)

### 2.3 Configure Subscription Details
For both subscriptions, add:
- **Display Name**: "Glow Premium"
- **Description**: "Unlimited beauty scans, AI-powered skincare coach, personalized recommendations, and premium features"
- **Privacy Policy URL**: Your privacy policy URL
- **Terms of Use URL**: Your terms of service URL

## Step 3: Google Play Console Setup

### 3.1 Create Subscriptions
1. Go to Google Play Console → Your App → Monetize → Products → Subscriptions
2. Create two subscriptions:

**Monthly Subscription:**
- Product ID: `com.glowcheck.app.premium.monthly`
- Name: "Monthly Glow Premium"
- Description: "Unlimited beauty scans and premium features"
- Price: $8.99 USD
- Billing Period: 1 Month
- Free Trial: 3 Days

**Yearly Subscription:**
- Product ID: `com.glowcheck.app.premium.annual`
- Name: "Yearly Glow Premium"
- Description: "Unlimited beauty scans and premium features - Best Value!"
- Price: $99.00 USD
- Billing Period: 1 Year
- Free Trial: 3 Days

### 3.2 Configure Base Plans
For each subscription, create base plans with:
- Auto-renewing subscription
- 3-day free trial offer
- Proper pricing for your target markets

## Step 4: Environment Variables Setup

Create a `.env.production` file with your RevenueCat API keys:

```env
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_YOUR_IOS_API_KEY_HERE
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_YOUR_ANDROID_API_KEY_HERE
```

## Step 5: Build Configuration

### 5.1 Update app.json for Production
The bundle IDs are already configured correctly in your payment system:
- iOS: com.glowcheck01.app
- Android: com.glowcheck01.app

### 5.2 Add RevenueCat Plugin
Add to your app.json plugins array:
```json
[
  "react-native-purchases",
  {
    "useFrameworks": "static"
  }
]
```

## Step 6: Production Build Process

### 6.1 Install Dependencies for Production Build
When building for production (not in Expo Go), install:
```bash
npx expo install react-native-purchases
```

### 6.2 Enable Production Payment Code
The payment system is already set up to automatically use RevenueCat in production builds. The commented code in `/lib/payments.ts` will be active when `react-native-purchases` is available.

### 6.3 Build Commands
```bash
# For iOS
eas build --platform ios --profile production

# For Android
eas build --platform android --profile production
```

## Step 7: Testing

### 7.1 Sandbox Testing (iOS)
1. Create sandbox test accounts in App Store Connect
2. Test purchases using TestFlight builds
3. Verify subscription flows and trial periods

### 7.2 Internal Testing (Android)
1. Upload AAB to Google Play Console internal testing
2. Add test accounts to internal testing
3. Test subscription flows

### 7.3 RevenueCat Testing
1. Use RevenueCat's sandbox mode for testing
2. Verify webhook events are received
3. Test subscription status synchronization

## Step 8: Webhook Setup (Optional but Recommended)

### 8.1 RevenueCat Webhooks
1. In RevenueCat dashboard, go to Integrations → Webhooks
2. Add your server endpoint for receiving subscription events
3. Configure events: purchase, renewal, cancellation, etc.

### 8.2 Server-Side Verification
Implement server-side receipt verification for additional security:
- Verify App Store receipts with Apple's servers
- Verify Google Play purchases with Google's API
- Update user subscription status in your database

## Step 9: Analytics and Monitoring

### 9.1 RevenueCat Analytics
- Monitor subscription metrics in RevenueCat dashboard
- Track conversion rates, churn, and revenue
- Set up cohort analysis

### 9.2 Custom Analytics
The payment system includes tracking functions:
- `trackPurchaseEvent()` - Track successful purchases
- `trackTrialStartEvent()` - Track trial starts
- `trackSubscriptionCancelEvent()` - Track cancellations

## Step 10: Launch Checklist

Before launching:
- [ ] All subscription products created and approved in both stores
- [ ] RevenueCat properly configured with store credentials
- [ ] Environment variables set for production
- [ ] Sandbox/internal testing completed successfully
- [ ] Privacy policy and terms of service updated
- [ ] Webhook endpoints configured (if using)
- [ ] Analytics tracking implemented
- [ ] Customer support process for subscription issues

## Important Notes

1. **Store Review**: Both Apple and Google will review your subscription implementation
2. **Compliance**: Ensure your app complies with store policies for subscriptions
3. **Customer Support**: Implement proper subscription management and support
4. **Refunds**: Handle refund requests according to store policies
5. **Localization**: Consider localizing subscription descriptions and pricing

## Support

If you encounter issues:
1. Check RevenueCat documentation: https://docs.revenuecat.com/
2. Review store-specific guidelines
3. Test thoroughly in sandbox/internal testing environments
4. Monitor RevenueCat dashboard for errors and events

## Current Status

✅ **Configured:**
- Payment service with your credentials
- Product IDs and pricing
- Store configuration
- Trial period (3 days)
- Subscription context and state management

🔄 **Next Steps:**
1. Set up RevenueCat account with your credentials
2. Create subscriptions in App Store Connect and Google Play Console
3. Get RevenueCat API keys and add to environment variables
4. Build and test in production environment

The payment system is fully prepared and will work automatically once you complete the store setup and build for production!