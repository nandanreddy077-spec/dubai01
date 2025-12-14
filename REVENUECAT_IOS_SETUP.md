# 🍎 RevenueCat iOS Setup Guide - App Store

## ✅ What's Been Set Up in Your Code

Your app is now properly configured to work with RevenueCat! Here's what's implemented:

1. ✅ `react-native-purchases` package installed
2. ✅ Product IDs updated to match App Store Connect:
   - Monthly: `com.glowcheck.monthly.premium`
   - Yearly: `com.glowcheck.yearly1.premium`
3. ✅ RevenueCat initialization with user ID syncing
4. ✅ Subscription status listener for real-time updates
5. ✅ Automatic subscription status syncing from RevenueCat
6. ✅ Purchase flow with RevenueCat integration

---

## 📋 Step-by-Step RevenueCat Dashboard Setup

### Step 1: Create/Login to RevenueCat Account

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Sign up or log in
3. Create a new project: **"Glow Check"**

---

### Step 2: Add iOS App to RevenueCat

1. In RevenueCat dashboard, click **"Apps"** in left sidebar
2. Click **"+ Add App"** → Select **"iOS"**
3. Fill in the details:
   - **App Name**: `Glow Check`
   - **Bundle ID**: `com.glowcheck01.app`
   - **App Store Shared Secret**: `5063e6dd7c174550b12001c140f6b803`
   - **Team ID**: `2V4DJQD8G3`
4. Click **"Save"**

**✅ You'll get your iOS API Key** - Save this! (It starts with `appl_`)

---

### Step 3: Create Entitlement

1. In RevenueCat dashboard, go to **"Entitlements"**
2. Click **"+ Add Entitlement"**
3. Create entitlement:
   - **Identifier**: `premium`
   - **Display Name**: `Premium Access`
   - **Description**: `Access to all premium features`
4. Click **"Save"**

---

### Step 4: Create Products in RevenueCat

1. Go to **"Products"** in RevenueCat dashboard
2. Click **"+ Add Product"**

#### Monthly Product:
- **Product ID**: `com.glowcheck.monthly.premium` ⚠️ **Must match App Store exactly!**
- **Store Product ID**: `com.glowcheck.monthly.premium`
- **Type**: `Subscription`
- **Duration**: `1 month`
- **Platform**: `iOS`
- **Price**: Will auto-detect from App Store ($8.99)

#### Yearly Product:
- **Product ID**: `com.glowcheck.yearly1.premium` ⚠️ **Must match App Store exactly!**
- **Store Product ID**: `com.glowcheck.yearly1.premium`
- **Type**: `Subscription`
- **Duration**: `1 year`
- **Platform**: `iOS`
- **Price**: Will auto-detect from App Store ($99)

**✅ Attach both products to the `premium` entitlement**

---

### Step 5: Create Offering

1. Go to **"Offerings"** in RevenueCat dashboard
2. Click **"+ Add Offering"**
3. Create offering:
   - **Identifier**: `default` ⚠️ **Must be "default"!**
   - **Display Name**: `Premium Plans`
4. Click **"Save"**

5. **Add Packages to Offering**:
   - Click on the `default` offering
   - Click **"+ Add Package"**
   - Create package for monthly:
     - **Identifier**: `monthly`
     - **Product**: Select `com.glowcheck.monthly.premium`
   - Create package for yearly:
     - **Identifier**: `yearly`
     - **Product**: Select `com.glowcheck.yearly1.premium`
   - Set **yearly** as the default/recommended package

---

### Step 6: Get Your API Keys

1. Go to **"Apps"** → Click on **"Glow Check"** (iOS)
2. Find the **"Public API Key"** section
3. Copy your **iOS API Key** (starts with `appl_`)
   - Example: `appl_UpDZroTEjwQSDDRJdqLgYihNxsh`

---

### Step 7: Update Your Environment Variables

Update your `.env` file (or create one if it doesn't exist):

```env
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_YOUR_ACTUAL_IOS_API_KEY_HERE

# Product IDs (already correct in code)
EXPO_PUBLIC_IAP_MONTHLY_PRODUCT_ID=com.glowcheck.monthly.premium
EXPO_PUBLIC_IAP_YEARLY_PRODUCT_ID=com.glowcheck.yearly1.premium

# App Store Configuration (already set)
EXPO_PUBLIC_APP_STORE_TEAM_ID=2V4DJQD8G3
EXPO_PUBLIC_APP_STORE_BUNDLE_ID=com.glowcheck01.app
EXPO_PUBLIC_APP_STORE_SHARED_SECRET=5063e6dd7c174550b12001c140f6b803
```

**Replace** `appl_YOUR_ACTUAL_IOS_API_KEY_HERE` with your actual iOS API key from Step 6.

---

## 🔗 Verify App Store Connect Setup

Make sure your App Store Connect products match:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to: **My Apps** → **Glow Check** → **Subscriptions**
3. Verify subscription group: **"Premium Access"**
4. Verify products:
   - ✅ `com.glowcheck.monthly.premium` - Status: **Approved**
   - ✅ `com.glowcheck.yearly1.premium` - Status: **Approved**
5. Verify both have **7-day free trial** configured
6. Verify pricing:
   - Monthly: $8.99/month
   - Yearly: $99/year

---

## 🧪 Testing Your Setup

### 1. Test in Sandbox Environment

1. Create a sandbox tester in App Store Connect:
   - Go to **Users and Access** → **Sandbox Testers**
   - Create a test account

2. Test the flow:
   - Build your app with EAS Build (not Expo Go - RevenueCat doesn't work in Expo Go)
   - Install on a physical iOS device
   - Sign in with sandbox tester account
   - Try to start a trial
   - Verify purchase flow works

### 2. Check RevenueCat Dashboard

After a purchase/test:
- Go to RevenueCat dashboard → **"Customers"**
- Search for your sandbox tester email
- Verify customer info shows subscription status
- Check that entitlement is active

### 3. Test Subscription Status Sync

1. Start a trial in your app
2. Check RevenueCat dashboard → Customer → Entitlements
3. Verify `premium` entitlement is active
4. Check app logs for sync messages

---

## 🔍 Troubleshooting

### Issue: "Product not found"

**Solution**: 
- Verify product IDs match exactly between:
  - App Store Connect
  - RevenueCat Products
  - Your code (`lib/payments.ts`)

### Issue: "No offerings available"

**Solution**:
- Ensure offering identifier is exactly `"default"`
- Ensure products are added to the offering
- Ensure products are attached to `premium` entitlement

### Issue: "Purchase successful but entitlement not active"

**Solution**:
- Check RevenueCat dashboard → Customer → Entitlements
- Verify product is attached to `premium` entitlement
- Check entitlement identifier is `"premium"` (matches code)

### Issue: RevenueCat not initializing

**Solution**:
- Check API key is correct in `.env`
- Verify API key format: `appl_...`
- Check console logs for initialization errors
- Ensure you're testing on a real device (not Expo Go)

---

## 📊 Monitor Your Setup

### RevenueCat Dashboard - Key Areas:

1. **Customers Tab**:
   - View all users
   - Check subscription status
   - See purchase history

2. **Events Tab**:
   - Track purchase events
   - Monitor trial starts
   - See subscription renewals

3. **Revenue Tab**:
   - View revenue metrics
   - Track MRR (Monthly Recurring Revenue)
   - See subscription analytics

4. **Charts Tab**:
   - Visualize subscription metrics
   - Track conversion rates
   - Monitor churn

---

## ✅ Setup Checklist

- [ ] RevenueCat account created
- [ ] iOS app added to RevenueCat
- [ ] iOS API key saved
- [ ] Entitlement `premium` created
- [ ] Products created and attached to entitlement:
  - [ ] `com.glowcheck.monthly.premium`
  - [ ] `com.glowcheck.yearly1.premium`
- [ ] Offering `default` created with both products
- [ ] API key added to `.env` file
- [ ] App Store Connect products verified
- [ ] Sandbox tester account created
- [ ] Test purchase completed successfully
- [ ] RevenueCat dashboard shows customer data

---

## 🚀 Next Steps

Once setup is complete:

1. **Test thoroughly** in sandbox before production
2. **Monitor** RevenueCat dashboard for any errors
3. **Track** subscription metrics
4. **Test** subscription renewals
5. **Verify** trial period works correctly (7 days)
6. **Check** entitlement activation on purchase

---

## 📞 Support

If you encounter issues:

1. Check RevenueCat [Documentation](https://docs.revenuecat.com/)
2. Review RevenueCat [Status Page](https://status.revenuecat.com/)
3. Check console logs in your app
4. Verify product IDs match everywhere

---

**Your app is now ready to process real subscriptions through RevenueCat!** 🎉

After completing this setup, your trial offer screen will:
- ✅ Show real products from RevenueCat
- ✅ Process real payments through App Store
- ✅ Handle 7-day free trials automatically
- ✅ Sync subscription status in real-time
- ✅ Work with sandbox and production

