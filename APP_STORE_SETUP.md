# App Store Connect In-App Purchase Setup Guide

## Current Issue
Your app shows "Purchase Failed" because it's using a mock implementation for in-app purchases. To fix this for production, you need to:

## 1. App Store Connect Configuration

### Step 1: Create In-App Purchase Products
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **Features** → **In-App Purchases**
4. Click **+** to create new products

### Step 2: Create Your Subscription Products
Create these two auto-renewable subscriptions:

**Monthly Subscription:**
- Product ID: `com.glowcheck.monthly_premium`
- Reference Name: `Monthly Glow Premium`
- Price: $8.90/month
- Subscription Group: `premium_subscriptions`

**Yearly Subscription:**
- Product ID: `com.glowcheck.yearly_premium`
- Reference Name: `Yearly Glow Premium`
- Price: $99.00/year
- Subscription Group: `premium_subscriptions`

### Step 3: Configure Subscription Group
1. Create subscription group: `premium_subscriptions`
2. Add both subscriptions to this group
3. Set subscription levels (yearly should be higher level)

### Step 4: Add Required Metadata
For each subscription, add:
- Display Name
- Description
- Screenshot (1284x2778 pixels)
- Review Information

## 2. App Configuration

### Update app.json
Your current bundle identifier is very long. Consider shortening it:

```json
{
  "ios": {
    "bundleIdentifier": "com.glowcheck.app"
  },
  "android": {
    "package": "com.glowcheck.app"
  }
}
```

### Add In-App Purchase Capability
Ensure your app has the in-app purchase capability enabled in App Store Connect.

## 3. Testing Setup

### Sandbox Testing
1. Go to **Users and Access** → **Sandbox Testers**
2. Create test accounts for different regions
3. Use these accounts to test purchases

### TestFlight Testing
1. Upload build to TestFlight
2. Add internal testers
3. Test subscription flow before production

## 4. Production Implementation

Since you're using Expo Go, you have two options:

### Option A: Use Expo Development Build
1. Run `expo install expo-dev-client`
2. Create development build with `eas build --profile development`
3. Install `react-native-iap` or `expo-in-app-purchases`
4. Implement real purchase logic

### Option B: Use Expo's Managed Workflow (Recommended)
Wait for Expo to support in-app purchases in managed workflow, or use a web-based subscription system.

## 5. Current Workaround

For now, your app works in development mode with mock purchases. To test:

1. **In Expo Go**: Purchases will simulate success after 2 seconds
2. **In Production**: You need a native build with real IAP implementation

## 6. Alternative: Web-Based Subscriptions

Consider using Stripe or similar for web-based subscriptions:
1. User signs up on your website
2. App checks subscription status via API
3. Unlock premium features based on server response

## 7. Required Files for Native Build

When ready for native build, you'll need:

```typescript
// lib/iap.ts
import { 
  initConnection, 
  purchaseUpdatedListener, 
  purchaseErrorListener,
  getSubscriptions,
  requestSubscription,
  finishTransaction
} from 'react-native-iap';

const productIds = [
  'com.glowcheck.monthly_premium',
  'com.glowcheck.yearly_premium'
];

export const initIAP = async () => {
  await initConnection();
  // Setup listeners
};

export const purchaseSubscription = async (productId: string) => {
  return await requestSubscription({
    sku: productId,
    andDangerouslyFinishTransactionAutomaticallyIOS: false,
  });
};
```

## 8. Next Steps

1. **Immediate**: Test current mock implementation in Expo Go
2. **Short-term**: Set up App Store Connect products
3. **Long-term**: Create native build with real IAP implementation

## 9. Common Issues

- **"Purchase Failed"**: Usually means no real IAP implementation
- **"Cannot connect to iTunes Store"**: Sandbox testing issue
- **"This In-App Purchase has already been bought"**: Need to finish previous transactions

Your current implementation will work for testing and development, but requires a native build for production App Store submission.