# Amazon Affiliate Quick Start Guide

**Goal**: Set up Amazon affiliate earning from all countries where your app has users.

---

## 🎯 **TL;DR - What to Do Now**

1. **Register for US Amazon Associates** (Start here!)
   - Go to: https://affiliate-program.amazon.com/
   - Takes 1-2 days for approval
   - Get your affiliate tag (looks like `glowcheck-20`)

2. **Add Your Affiliate Tag**
   ```bash
   # Using EAS Secrets (for production)
   eas secret:create --scope project --name EXPO_PUBLIC_AMAZON_AFFILIATE_TAG --value "YOUR-US-TAG" --type string
   eas secret:create --scope project --name EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_US --value "YOUR-US-TAG" --type string
   ```

3. **Test It**
   - Build and run your app
   - Complete a skin analysis
   - Click a product recommendation
   - Check URL contains `tag=YOUR-TAG`

4. **Expand Gradually**
   - Monitor which countries your users are from (analytics)
   - Register for those countries' Amazon Associates programs
   - Add their affiliate tags as environment variables

---

## ✅ **What's Already Working**

Your app already has:
- ✅ Location detection (automatic country detection)
- ✅ 90+ countries mapped to correct Amazon domains
- ✅ Affiliate link generation with proper tracking
- ✅ Multi-currency support
- ✅ Product recommendations system

**You just need to**: Register for Amazon Associates and add your affiliate tags!

---

## 📋 **Step-by-Step Setup**

### **Step 1: Register for Amazon Associates (US First)**

1. Go to https://affiliate-program.amazon.com/
2. Sign in with your Amazon account (or create one)
3. Fill out the application:
   - Website URL: Your app's website or landing page
   - How you'll drive traffic: Mobile app
   - App description: Briefly describe Glow Check
4. Wait for approval (usually 24-48 hours)
5. Once approved, you'll see your affiliate tag in your dashboard

### **Step 2: Get Your Affiliate Tag**

After approval, you'll see your tag in the Amazon Associates dashboard:
- **Location**: Associates Central → Account Settings → Your Tracking IDs
- **Format**: Usually `yourapp-20` or similar
- **Example**: `glowcheck-20`

### **Step 3: Configure in Your App**

#### **Option A: EAS Secrets (Recommended for Production)**

```bash
# Primary tag (fallback for all countries)
eas secret:create --scope project --name EXPO_PUBLIC_AMAZON_AFFILIATE_TAG --value "glowcheck-20" --type string

# US-specific tag
eas secret:create --scope project --name EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_US --value "glowcheck-20" --type string
```

#### **Option B: .env File (For Local Development Only)**

Create `.env` in your project root:

```bash
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG=glowcheck-20
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_US=glowcheck-20
```

**⚠️ Important**: Never commit `.env` files! Add `.env` to `.gitignore`.

### **Step 4: Test Your Setup**

1. Build your app: `eas build --platform ios --profile production`
2. Install on device
3. Complete a skin analysis
4. View product recommendations
5. Click any product
6. Check the Amazon URL contains `tag=glowcheck-20`

---

## 🌍 **Expanding to Other Countries**

After you have US working, expand based on your user base:

### **Quick Registration Priority**

1. **US** ✅ (Start here - largest market)
2. **UK** (Second largest - easy setup)
3. **Germany** (Large European market)
4. **Japan** (High-value market)
5. **Canada** (Easy, similar to US)

Then expand to countries where you have actual users (check your app analytics).

### **Registration Links**

- 🇺🇸 **US**: https://affiliate-program.amazon.com/
- 🇬🇧 **UK**: https://affiliate-program.amazon.co.uk/
- 🇩🇪 **Germany**: https://partnernet.amazon.de/
- 🇯🇵 **Japan**: https://affiliate.amazon.co.jp/
- 🇨🇦 **Canada**: https://associates.amazon.ca/

See `AMAZON_AFFILIATE_STATUS.md` for complete list.

### **Adding New Country Tags**

Once you register for a new country:

```bash
# Example: UK
eas secret:create --scope project --name EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_UK --value "glowcheck0f-21" --type string
```

Your app will automatically use the correct tag based on user's location!

---

## 💰 **How Commissions Work**

### **Commission Rates** (Beauty Products)
- **Luxury Beauty**: 10% commission
- **Health & Personal Care**: 4% commission
- **Average**: 4-10% per sale

### **Cookie Duration**
- **24 hours**: User must purchase within 24 hours of clicking your link
- **90 days**: If user adds item to cart within 24 hours, cookie lasts 90 days

### **Payment**
- US: Paid via check, ACH, or Amazon gift card
- Other countries: Varies (PayPal, bank transfer, gift card)
- Payment threshold: Usually $10-25 minimum

---

## 📊 **What You Can Expect**

### **Realistic Scenario**
- **1,000 monthly active users**
- **300 complete analysis** (30%)
- **30 click products** (10% of analyzers)
- **0.3-1 purchase** (1-3% conversion)
- **Average order**: $50
- **Commission**: 4-10%

**Monthly revenue**: $0.60 - $5.00 per 1,000 users

**At scale** (100k users): **$60 - $500/month**

**Note**: Revenue scales with:
- Better product recommendations
- More regional programs registered
- Higher conversion rates

---

## ✅ **Checklist**

- [ ] Register for US Amazon Associates
- [ ] Get US affiliate tag
- [ ] Add tag to EAS Secrets or `.env`
- [ ] Build and test app
- [ ] Verify affiliate tag appears in URLs
- [ ] Check Amazon Associates dashboard for clicks
- [ ] Monitor first commission (24-48 hours after purchase)
- [ ] Expand to more countries based on user analytics

---

## 🔍 **Troubleshooting**

### **"No commission from clicks"**
- ✅ Normal! Only 1-5% of clicks convert to sales
- ✅ Check you're registered in that country
- ✅ Verify affiliate tag is correct
- ✅ Make sure link contains `tag=YOUR-TAG`

### **"Wrong Amazon domain"**
- ✅ Location detection might be wrong
- ✅ Test with VPN to different countries
- ✅ Check `getUserLocation()` returns correct country

### **"Tag not in URL"**
- ✅ Check environment variables are set
- ✅ Rebuild app after adding secrets
- ✅ Verify `REGIONAL_AFFILIATE_TAGS` in `lib/location.ts`

---

## 📚 **Full Documentation**

- **Complete Status**: `AMAZON_AFFILIATE_STATUS.md`
- **Detailed Setup**: `AMAZON_AFFILIATE_SETUP.md`
- **Code Reference**: `lib/location.ts`, `lib/amazon-recommendations.ts`

---

## 🎉 **You're Ready!**

Your app code is **100% ready**. Just register for Amazon Associates and add your tags!

**Start with US, test it, then expand gradually based on where your users are.**

Good luck! 🚀

