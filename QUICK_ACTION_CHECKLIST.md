# 🚀 Quick Action Checklist - RevenueCat & App Store Launch

## ⚠️ CRITICAL: Fix Entitlement Identifier

**Your code expects:** `'premium'`  
**RevenueCat shows:** "Premium Access" (display name)

**Action Required:**
1. Go to RevenueCat Dashboard → **Product catalog** → **Entitlements** → **Premium Access**
2. Click **"Edit"**
3. Check the **Identifier** field (NOT the display name)
4. If identifier is NOT `premium`, you have two options:

   **Option A (Recommended):** Change identifier to `premium`
   - Change Identifier from current value to: `premium`
   - Save changes
   
   **Option B:** Update code to match your identifier
   - Update `lib/payments.ts` line 8:
   ```typescript
   ENTITLEMENT_ID: 'Premium Access', // or whatever your identifier is
   ```

---

## ✅ Verification Steps (Do These Now)

### 1. Check Entitlement Identifier
- [ ] Open RevenueCat → Entitlements → Premium Access
- [ ] Note the **Identifier** (not display name)
- [ ] Verify it matches `'premium'` in code OR update code to match

### 2. Verify Products Are Attached
- [ ] Go to Entitlements → Premium Access → "Associated products"
- [ ] Verify all 4 products are listed:
  - [ ] monthly Glow Premium (App Store)
  - [ ] Yearly Glow Premium (App Store)
  - [ ] com.glowcheck.monthly.premium:monthly-base (Play Store)
  - [ ] com.glowcheck.yearly1.premium:yearly-base (Play Store)

### 3. Create/Verify Offering
- [ ] Go to RevenueCat → Offerings
- [ ] Create or verify offering named `default`
- [ ] Add both monthly and yearly products
- [ ] Set as **Current offering**

### 4. Get API Keys
- [ ] Go to RevenueCat → Project settings → API keys
- [ ] Copy iOS API key (starts with `appl_`)
- [ ] Copy Android API key (starts with `goog_`)
- [ ] Add to `.env` file:
  ```env
  EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_YOUR_KEY
  EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_YOUR_KEY
  ```

### 5. Verify Product IDs Match
- [ ] App Store: `com.glowcheck.monthly.premium` ✅
- [ ] App Store: `com.glowcheck.yearly1.premium` ✅
- [ ] Code uses same IDs ✅ (already correct)

---

## 📱 App Store Connect Checklist

- [ ] App created with Bundle ID: `com.glowcheck01.app`
- [ ] Both subscriptions are **Approved** ✅ (Already done!)
- [ ] Subscription Group ID: `21788174` ✅
- [ ] App version matches `app.json` (1.0.2)
- [ ] Privacy policy URL added
- [ ] App description and screenshots added
- [ ] Demo account credentials added (if needed for review)

---

## 🤖 Google Play Console Checklist

- [ ] App created with Package: `com.glowcheck01.app`
- [ ] Both subscriptions are **Published** ✅ (Already done!)
- [ ] Content rating completed
- [ ] Privacy policy URL added
- [ ] Store listing completed (description, screenshots)
- [ ] App is ready for internal testing

---

## 🧪 Testing Before Launch

### Test in TestFlight (iOS):
1. [ ] Build app with EAS: `eas build --platform ios --profile production`
2. [ ] Upload to TestFlight
3. [ ] Install on test device
4. [ ] Test subscription purchase flow
5. [ ] Verify purchase appears in RevenueCat dashboard
6. [ ] Test subscription restoration (delete/reinstall app)

### Test in Internal Testing (Android):
1. [ ] Build app with EAS: `eas build --platform android --profile production`
2. [ ] Upload to Google Play Console → Internal Testing
3. [ ] Install on test device
4. [ ] Test subscription purchase flow
5. [ ] Verify purchase appears in RevenueCat dashboard
6. [ ] Test subscription restoration

---

## 🎯 What You Need to Do Right Now

1. **Fix entitlement identifier** (5 minutes)
   - Check RevenueCat entitlement identifier
   - Make sure it's `premium` or update code

2. **Get API keys** (2 minutes)
   - Copy from RevenueCat dashboard
   - Add to `.env` file

3. **Verify offering** (2 minutes)
   - Create/verify `default` offering
   - Add products to it

4. **Test purchase flow** (30 minutes)
   - Build for TestFlight/Internal Testing
   - Test actual purchase
   - Verify in RevenueCat dashboard

---

## ✅ Once All Checked, You're Ready to Launch!

1. Submit to App Store for review
2. Submit to Google Play for review
3. Monitor RevenueCat dashboard for purchases
4. Celebrate! 🎉

---

## 📞 If Something Doesn't Work

1. **Purchase not working?**
   - Check RevenueCat logs
   - Verify entitlement identifier matches
   - Verify products are attached to entitlement
   - Check API keys are correct

2. **Entitlement not activating?**
   - Verify entitlement identifier in RevenueCat matches code
   - Check products are attached to entitlement
   - Verify offering includes the products

3. **Products not showing?**
   - Verify offering is set as "Current"
   - Check products are in the offering
   - Verify product IDs match exactly

---

**Most Important:** Fix the entitlement identifier first! Everything else is already set up. 🚀

