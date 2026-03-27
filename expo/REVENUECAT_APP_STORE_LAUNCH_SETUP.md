# RevenueCat & App Store Launch Setup Guide

## 🎯 Current Status Check

Based on your RevenueCat dashboard, here's what's already configured:

### ✅ Already Configured:
- **App Store Products**: 
  - `com.glowcheck.monthly.premium` (Approved ✅)
  - `com.glowcheck.yearly1.premium` (Approved ✅)
- **Play Store Products**: 
  - `com.glowcheck.monthly.premium:monthly-base` (Published ✅)
  - `com.glowcheck.yearly1.premium:yearly-base` (Published ✅)
- **Entitlement**: "Premium Access" (ID: `entif3294f6359`)
- **Subscription Group**: ID `21788174` (Approved ✅)

### ⚠️ Critical Fix Needed:

**Your code uses entitlement ID `'premium'` but RevenueCat shows "Premium Access"**

You need to either:
1. **Option A (Recommended)**: Change the entitlement identifier in RevenueCat to `premium`
2. **Option B**: Update the code to use the correct entitlement identifier

---

## 📋 Complete Setup Checklist

### Step 1: Fix Entitlement Identifier in RevenueCat

**In RevenueCat Dashboard:**
1. Go to **Product catalog** → **Entitlements**
2. Click on **"Premium Access"**
3. Click **"Edit"** button
4. Change the **Identifier** from `Premium Access` to `premium`
5. Save changes

**Why?** Your code expects `'premium'` as the entitlement ID:
```typescript
// lib/payments.ts line 8
ENTITLEMENT_ID: 'premium'
```

**OR** if you want to keep "Premium Access" as the identifier, update the code:
```typescript
ENTITLEMENT_ID: 'Premium Access'
```

---

### Step 2: Verify RevenueCat API Keys

**In RevenueCat Dashboard:**
1. Go to **Project settings** → **API keys**
2. Copy your **iOS API Key** (starts with `appl_`)
3. Copy your **Android API Key** (starts with `goog_`)

**Update your `.env` file:**
```env
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_YOUR_ACTUAL_IOS_KEY
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_YOUR_ACTUAL_ANDROID_KEY
```

**Current code has fallback keys, but you should use your actual keys:**
- Current iOS fallback: `appl_UpDZroTEjwQSDDRJdqLgYihNxsh`
- Current Android fallback: `goog_xCXiGuMlJXxLNPQUlodNDLnAAYZ`

---

### Step 3: Verify Product IDs Match

**Your code expects:**
- Monthly: `com.glowcheck.monthly.premium` ✅ (matches RevenueCat)
- Yearly: `com.glowcheck.yearly1.premium` ✅ (matches RevenueCat)

**Location:** `lib/payments.ts` lines 14-15

---

### Step 4: Verify App Store Connect Configuration

**In App Store Connect:**
1. Go to your app → **Features** → **In-App Purchases**
2. Verify both subscriptions are **Approved** ✅ (They are!)
3. Verify Subscription Group ID: `21788174` ✅
4. Check that both products are in the same subscription group

**Subscription Levels (from your screenshot):**
- Level 1: Yearly Glow Premium (Higher tier)
- Level 2: Monthly Glow Premium (Lower tier)

This is correct! Yearly should be Level 1 (higher value).

---

### Step 5: Verify Google Play Console Configuration

**In Google Play Console:**
1. Go to your app → **Monetization** → **Products** → **Subscriptions**
2. Verify both subscriptions are **Published** ✅ (They are!)
3. Verify base plan IDs match:
   - `com.glowcheck.monthly.premium:monthly-base` ✅
   - `com.glowcheck.yearly1.premium:yearly-base` ✅

---

### Step 6: Create RevenueCat Offering

**In RevenueCat Dashboard:**
1. Go to **Product catalog** → **Offerings**
2. Click **"New offering"** or edit existing
3. Name: `default` (or match what your code expects)
4. Add both products to this offering:
   - Monthly Glow Premium
   - Yearly Glow Premium
5. Set as **Current offering**

**Your code expects:** Offering identifier `default` (this is the default if not specified)

---

### Step 7: Attach Products to Entitlement

**In RevenueCat Dashboard:**
1. Go to **Product catalog** → **Entitlements** → **Premium Access**
2. Under **"Associated products"**, verify both products are attached:
   - monthly Glow Premium ✅
   - Yearly Glow Premium ✅
   - com.glowcheck.yearly1.premium:yearly-base ✅
   - com.glowcheck.monthly.premium:monthly-base ✅

If any are missing, click **"Attach"** and add them.

---

### Step 8: Test Subscription Flow

**Before App Store submission, test:**

1. **Build for TestFlight (iOS) or Internal Testing (Android)**
2. **Test the purchase flow:**
   - Open app
   - Navigate to subscription screen
   - Try to purchase monthly subscription
   - Verify purchase completes
   - Check RevenueCat dashboard shows the purchase
   - Verify entitlement is active

3. **Test subscription restoration:**
   - Delete and reinstall app
   - Verify subscription status is restored

---

### Step 9: App Store Connect Final Checks

**Before submitting to App Store:**

1. **App Information:**
   - ✅ Bundle ID: `com.glowcheck01.app`
   - ✅ Version: `1.0.2` (from app.json)
   - ✅ Build number: Increment for each submission

2. **Pricing and Availability:**
   - Set app price (Free with in-app purchases)
   - Set availability countries

3. **App Privacy:**
   - Complete privacy questionnaire
   - Add privacy policy URL

4. **App Review Information:**
   - Add demo account credentials if needed
   - Add review notes explaining subscription flow

---

### Step 10: Google Play Console Final Checks

**Before submitting to Play Store:**

1. **App Content:**
   - Complete content rating questionnaire
   - Add privacy policy URL
   - Set target audience

2. **Pricing and Distribution:**
   - Set app as free with in-app purchases
   - Select countries for distribution

3. **Store Listing:**
   - Add app description
   - Add screenshots
   - Add feature graphic

---

## 🔧 Code Configuration Summary

**Current Configuration (lib/payments.ts):**
```typescript
REVENUECAT_CONFIG = {
  API_KEY_IOS: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || 'appl_UpDZroTEjwQSDDRJdqLgYihNxsh',
  API_KEY_ANDROID: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || 'goog_xCXiGuMlJXxLNPQUlodNDLnAAYZ',
  ENTITLEMENT_ID: 'premium', // ⚠️ MUST match RevenueCat entitlement identifier
}

PRODUCT_IDS = {
  MONTHLY: 'com.glowcheck.monthly.premium', // ✅ Matches App Store
  YEARLY: 'com.glowcheck.yearly1.premium', // ✅ Matches App Store
}
```

---

## ✅ Final Verification Checklist

Before launching, verify:

- [ ] Entitlement identifier in RevenueCat is `premium` (or code updated to match)
- [ ] RevenueCat API keys are set in `.env` file
- [ ] All products are attached to the entitlement in RevenueCat
- [ ] Offering is created and set as current in RevenueCat
- [ ] App Store Connect subscriptions are Approved
- [ ] Google Play subscriptions are Published
- [ ] Test purchase flow works in TestFlight/Internal Testing
- [ ] Subscription restoration works
- [ ] App Store Connect app is ready for submission
- [ ] Google Play Console app is ready for submission

---

## 🚀 Launch Steps

1. **Fix entitlement identifier** (Step 1 above)
2. **Update API keys** in `.env` file (Step 2)
3. **Test thoroughly** in TestFlight/Internal Testing (Step 8)
4. **Submit to App Store** for review
5. **Submit to Google Play** for review
6. **Monitor RevenueCat dashboard** for purchases after launch

---

## 📞 Support

If you encounter issues:
1. Check RevenueCat dashboard for purchase events
2. Check App Store Connect/Google Play Console for subscription status
3. Review app logs for RevenueCat SDK errors
4. Test with sandbox/test accounts first

---

## 🎉 You're Almost Ready!

Your products are already approved in both stores! Just need to:
1. Fix the entitlement identifier match
2. Test the purchase flow
3. Submit for review

Good luck with your launch! 🚀



