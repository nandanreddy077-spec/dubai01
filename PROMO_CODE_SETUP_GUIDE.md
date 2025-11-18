# Promo Code Setup Guide

## Overview

The promo code page (`app/promo-code.tsx`) has been created and is ready to use in your app. This guide explains how to set up promo codes (also called offer codes or promotional codes) in both App Store Connect and Google Play Console.

---

## How It Works

### App-Side Implementation ✅ (Already Done)
- **Promo code input page** created at `app/promo-code.tsx`
- **Automatic redirection** to App Store/Play Store when user enters a code
- **Subscription status sync** after redemption
- **User-friendly UI** with validation and instructions
- **Cross-platform support** (iOS & Android)

### Store-Side Setup ⚙️ (What You Need to Do)

You need to create and configure promo codes in both app stores. The stores handle:
- Code generation and validation
- Subscription activation
- Free trial or discount application
- Subscription management

---

## App Store Connect Setup (iOS)

### Step 1: Set Up In-App Purchase Offer Codes

1. **Log in to App Store Connect**
   - Go to [https://appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Select your app

2. **Navigate to Subscriptions**
   - Go to **Features** → **In-App Purchases**
   - Click on your subscription product (Monthly or Yearly)

3. **Create Subscription Offer**
   - Click **Subscription Offers** (or **Offer Codes**)
   - Click the **+** button to create a new offer
   - Choose **Offer Type**: "Promotional Offer" or "Offer Code"

4. **Configure the Offer**
   - **Offer Name**: Internal name (e.g., "Launch Promo")
   - **Offer Code**: This will be generated or you can create custom codes
   - **Duration**: Choose how long the discount/free period lasts
     - Example: 1 month free, 50% off for 3 months, etc.
   - **Number of Periods**: How many billing cycles the offer applies to

5. **Generate Codes**
   - Click **Generate Codes**
   - Choose quantity (up to 1,000 codes at a time)
   - Download the codes as CSV
   - Codes format: `ABC123XYZ` (alphanumeric, usually 9-12 characters)

### Step 2: Important iOS Notes

**Code Format:**
- Apple generates codes in format: `XXXXXXXXXXXXX` (all caps, alphanumeric)
- Codes are case-insensitive
- Maximum 10,000 active codes per offer

**Redemption URLs:**
- The app automatically opens: `https://apps.apple.com/redeem?code=YOURCODE`
- Users can also redeem manually in the App Store app

**Restrictions:**
- Users must not have an active subscription to the same product
- Each code can only be used once
- Codes expire after 6 months if not used
- Users must be in the correct region/country

### Step 3: Update App Configuration

In your promo code screen (`app/promo-code.tsx`), update line 47:

```typescript
// Replace YOUR_APP_ID with your actual App Store App ID
const redemptionUrl = `https://apps.apple.com/redeem?ctx=offercodes&id=YOUR_APP_ID&code=${trimmedCode}`;
```

To find your App ID:
- Go to App Store Connect → Your App → App Information
- Look for **Apple ID** (it's a numeric ID like `1234567890`)

---

## Google Play Console Setup (Android)

### Step 1: Create Promotional Codes

1. **Log in to Google Play Console**
   - Go to [https://play.google.com/console](https://play.google.com/console)
   - Select your app

2. **Navigate to Monetization**
   - Go to **Monetize** → **Subscriptions**
   - Click on your subscription product (Monthly or Yearly Premium)

3. **Create Promo Code Campaign**
   - Scroll to **Promo codes** section
   - Click **Create promo code**
   - Or click **Manage promo codes** if you've created codes before

4. **Configure Promo Code Details**
   - **Number of codes**: How many codes to generate (max 500 per batch)
   - **Offer type**: Choose from:
     - Free trial extension
     - Discount percentage
     - Specific price
   - **Duration**: How long the offer lasts
   - **Start date**: When codes become active
   - **End date**: When codes expire

5. **Generate and Download**
   - Click **Create**
   - Download the CSV file with codes
   - Codes format: `ABCDEFGHIJKLMNOP` (16 alphanumeric characters)

### Step 2: Important Android Notes

**Code Format:**
- Google generates 16-character alphanumeric codes
- Codes are case-insensitive
- Format: `ABCD-EFGH-IJKL-MNOP` (with or without dashes)

**Redemption URLs:**
- The app automatically opens: `https://play.google.com/redeem?code=YOURCODE`
- Users can also redeem in Play Store app → Menu → Redeem

**Restrictions:**
- Each code can only be used once
- User must not have active subscription to same product
- Codes expire on the set expiration date
- Maximum 500 codes per campaign

### Step 3: Promo Code Types

Google Play offers several promo code types:

1. **One-time codes**
   - Single-use promotional codes
   - Can offer free trials or discounts
   - Best for giveaways, influencers, press

2. **Multi-use codes** (Developer-defined)
   - Can be used multiple times
   - Set a maximum number of redemptions
   - Good for marketing campaigns

---

## Testing Promo Codes

### iOS Testing

1. **Use Sandbox Environment**
   - Create test promo codes in App Store Connect
   - Use a sandbox tester account
   - Go to Settings → App Store → Sandbox Account

2. **Test Redemption Flow**
   - Open your app
   - Navigate to promo code screen
   - Enter test code
   - Verify redirection to App Store works
   - Complete redemption in sandbox mode

### Android Testing

1. **Use Internal Test Track**
   - Create promo codes in Play Console
   - Add your account to internal test users
   - Install app from internal test track

2. **Test Redemption Flow**
   - Open your app
   - Navigate to promo code screen
   - Enter test code
   - Verify redirection to Play Store works
   - Complete redemption

---

## Using the Promo Code Page in Your App

### Navigation

To navigate users to the promo code page, add a button anywhere in your app:

```typescript
import { router } from 'expo-router';

<TouchableOpacity onPress={() => router.push('/promo-code')}>
  <Text>Have a promo code?</Text>
</TouchableOpacity>
```

### Recommended Locations

Good places to add promo code entry:
- **Subscription/Paywall screen** - As a subtle link at the bottom
- **Profile/Settings page** - Under account or subscription section
- **First-time user onboarding** - To encourage sign-ups
- **Marketing campaigns** - Deep link directly to promo code page

### Deep Linking

You can create deep links that open the promo code page directly:

```
glowcheck://promo-code
```

Configure this in `app.json` under `scheme`.

---

## Best Practices

### For Code Distribution

1. **Track Code Usage**
   - Keep a spreadsheet of which codes were sent where
   - Monitor redemption rates in store dashboards
   - Use different code batches for different campaigns

2. **Code Security**
   - Don't post codes publicly online (they'll be used immediately)
   - Send codes via email, DM, or secure channels
   - Consider time-limited campaigns

3. **Communication**
   - Clearly communicate what the code offers
   - Include expiration dates
   - Provide redemption instructions

### For Marketing

1. **Influencer Partnerships**
   - Generate unique codes for each influencer
   - Track which codes perform best

2. **Launch Campaigns**
   - Offer limited-time promo codes for app launches
   - Create urgency with expiration dates

3. **Re-engagement**
   - Send promo codes to users who haven't subscribed
   - Offer win-back discounts for lapsed subscribers

---

## Monitoring & Analytics

### App Store Connect Analytics

- **View redemption data**:
  - Go to App Analytics → Subscriptions → Subscription Offers
  - See how many codes redeemed per offer
  - Track conversion rates

### Google Play Console Analytics

- **View promo code performance**:
  - Go to Monetization → Subscriptions → Promo codes
  - See redemption statistics
  - Monitor which campaigns perform best

---

## Troubleshooting

### Common Issues

**iOS:**
- ❌ "Code not found" → Code may be expired or invalid
- ❌ "Not eligible" → User already has active subscription
- ❌ "Wrong region" → Code only valid in specific countries

**Android:**
- ❌ "Code invalid" → Check code format and expiration
- ❌ "Already redeemed" → Each code is single-use
- ❌ "Product unavailable" → Subscription product not properly configured

### Support Resources

- **Apple:** [Subscription Offer Codes Documentation](https://developer.apple.com/app-store/subscriptions/)
- **Google:** [Promo Codes Help](https://support.google.com/googleplay/android-developer/answer/6321495)

---

## Summary Checklist

### ✅ App Implementation (Done)
- [x] Promo code page created
- [x] Store redirection configured
- [x] Subscription status checking
- [x] User-friendly UI with validation

### ⚙️ Your Action Items

**App Store Connect:**
- [ ] Create subscription offers/offer codes
- [ ] Generate promo codes
- [ ] Set offer duration and discount
- [ ] Update app with your App Store ID
- [ ] Test in sandbox environment

**Google Play Console:**
- [ ] Create promo code campaigns
- [ ] Generate promotional codes
- [ ] Set redemption limits and expiration
- [ ] Test with internal test track

**App Distribution:**
- [ ] Add navigation to promo code page in your app
- [ ] Test redemption flow end-to-end
- [ ] Create marketing materials with instructions
- [ ] Set up tracking for code usage

---

## Questions?

If you need help with:
- Creating specific types of offers
- Troubleshooting redemption issues
- Setting up deep linking
- Integrating promo codes into marketing campaigns

Feel free to refer to the official documentation links above or reach out to App Store Connect / Google Play Console support teams.

---

**Note:** According to system instructions, I cannot help with actual App Store or Google Play Console submission processes, but I've provided all the educational information you need to set this up yourself. The app-side implementation is complete and ready to use!
