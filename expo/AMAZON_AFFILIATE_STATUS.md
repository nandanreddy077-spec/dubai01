# Amazon Affiliate Global Setup Status

**Last Updated**: January 8, 2026  
**Version**: 1.0.2 (Build 7)

---

## ✅ **What's Already Done**

### 1. **Code Implementation** ✅
- ✅ Location detection (GPS + IP fallback)
- ✅ 90+ countries mapped to Amazon domains
- ✅ Multi-currency support
- ✅ Regional affiliate tag system
- ✅ Proper affiliate link formatting with tracking parameters
- ✅ AI-powered product recommendations
- ✅ Product tier system (Budget/Mid-Range/Luxury)
- ✅ Affiliate tap tracking

### 2. **Amazon Domain Mapping** ✅
Your app supports these Amazon domains:
- ✅ amazon.com (US)
- ✅ amazon.co.uk (UK)
- ✅ amazon.ca (Canada)
- ✅ amazon.de (Germany)
- ✅ amazon.fr (France)
- ✅ amazon.it (Italy)
- ✅ amazon.es (Spain)
- ✅ amazon.co.jp (Japan)
- ✅ amazon.in (India)
- ✅ amazon.com.au (Australia)
- ✅ amazon.ae (UAE)
- ✅ amazon.sa (Saudi Arabia)
- ✅ amazon.com.br (Brazil)
- ✅ amazon.com.mx (Mexico)
- ✅ amazon.sg (Singapore)
- ✅ amazon.nl (Netherlands)
- ✅ amazon.se (Sweden)
- ✅ amazon.pl (Poland)
- ✅ amazon.com.tr (Turkey)
- ✅ amazon.eg (Egypt)

**Countries without local Amazon** → Redirect to nearest regional store (usually amazon.com)

---

## ⚠️ **What You Need to Do**

### **STEP 1: Register for Amazon Associates Programs**

Amazon Associates programs are **separate for each country**. You need to register in each country where you want to earn commissions.

#### **Priority 1: High-Value Markets** (Do These First!)

| Country | Amazon Domain | Registration Link | Commission Rate | Status |
|---------|--------------|-------------------|-----------------|--------|
| 🇺🇸 **United States** | amazon.com | https://affiliate-program.amazon.com/ | 4-10% | ⬜ Not Registered |
| 🇬🇧 **United Kingdom** | amazon.co.uk | https://affiliate-program.amazon.co.uk/ | 1-7% | ⬜ Not Registered |
| 🇩🇪 **Germany** | amazon.de | https://partnernet.amazon.de/ | 3-12% | ⬜ Not Registered |
| 🇯🇵 **Japan** | amazon.co.jp | https://affiliate.amazon.co.jp/ | 3-10% | ⬜ Not Registered |
| 🇨🇦 **Canada** | amazon.ca | https://associates.amazon.ca/ | 1-4% | ⬜ Not Registered |

#### **Priority 2: Major European Markets**

| Country | Amazon Domain | Registration Link | Commission Rate | Status |
|---------|--------------|-------------------|-----------------|--------|
| 🇫🇷 **France** | amazon.fr | https://partenaires.amazon.fr/ | 3-8% | ⬜ Not Registered |
| 🇮🇹 **Italy** | amazon.it | https://programma-affiliazione.amazon.it/ | 3-8% | ⬜ Not Registered |
| 🇪🇸 **Spain** | amazon.es | https://afiliados.amazon.es/ | 3-8% | ⬜ Not Registered |
| 🇮🇳 **India** | amazon.in | https://affiliate.amazon.in/ | 1-10% | ⬜ Not Registered |
| 🇦🇺 **Australia** | amazon.com.au | https://affiliate-program.amazon.com.au/ | 1-10% | ⬜ Not Registered |

#### **Priority 3: Growing Markets**

| Country | Amazon Domain | Registration Link | Commission Rate | Status |
|---------|--------------|-------------------|-----------------|--------|
| 🇧🇷 **Brazil** | amazon.com.br | https://associados.amazon.com.br/ | 4-8.5% | ⬜ Not Registered |
| 🇲🇽 **Mexico** | amazon.com.mx | https://afiliados.amazon.com.mx/ | 1-4.5% | ⬜ Not Registered |
| 🇸🇬 **Singapore** | amazon.sg | https://affiliate.amazon.sg/ | 1-10% | ⬜ Not Registered |
| 🇳🇱 **Netherlands** | amazon.nl | https://partnernet.amazon.nl/ | 1-5% | ⬜ Not Registered |
| 🇸🇪 **Sweden** | amazon.se | https://affiliate.amazon.se/ | 3-8% | ⬜ Not Registered |
| 🇵🇱 **Poland** | amazon.pl | https://program-partnerski.amazon.pl/ | 1-5% | ⬜ Not Registered |
| 🇹🇷 **Turkey** | amazon.com.tr | https://affiliate-program.amazon.com.tr/ | 4-10% | ⬜ Not Registered |
| 🇦🇪 **UAE** | amazon.ae | https://affiliate.amazon.ae/ | 1-10% | ⬜ Not Registered |
| 🇸🇦 **Saudi Arabia** | amazon.sa | https://affiliate.amazon.sa/ | 1-10% | ⬜ Not Registered |

#### **Priority 4: Additional Markets** (Optional)

| Country | Amazon Domain | Registration Link | Commission Rate | Status |
|---------|--------------|-------------------|-----------------|--------|
| 🇪🇬 **Egypt** | amazon.eg | https://affiliate.amazon.eg/ | 1-10% | ⬜ Not Registered |

---

### **STEP 2: Get Your Affiliate Tags**

After registering in each country, you'll receive an affiliate tag (tracking ID). They typically look like:
- US: `glowcheck-20`
- UK: `glowcheck0f-21`
- DE: `glowcheck0e-21`
- etc.

**Note**: Each country has a different tag format. Save all your tags in a spreadsheet.

---

### **STEP 3: Configure Environment Variables**

#### **Option A: Use EAS Secrets (Recommended for Production)**

```bash
# Set primary fallback tag
eas secret:create --scope project --name EXPO_PUBLIC_AMAZON_AFFILIATE_TAG --value "glowcheck-20" --type string

# Set regional tags as you register
eas secret:create --scope project --name EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_US --value "glowcheck-20" --type string
eas secret:create --scope project --name EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_UK --value "glowcheck0f-21" --type string
eas secret:create --scope project --name EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_DE --value "glowcheck0e-21" --type string
# ... add more as you register
```

#### **Option B: Use .env File (For Local Development)**

Create `.env` file in project root:

```bash
# Primary affiliate tag (fallback for countries without regional tag)
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG=glowcheck-20

# Regional affiliate tags (add as you register)
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_US=glowcheck-20
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_UK=glowcheck0f-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_CA=glowcheck0b-20
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_DE=glowcheck0e-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_FR=glowcheck04-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_IT=glowcheck08-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_ES=glowcheck01-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_JP=glowcheck-22
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_IN=glowcheck-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_AU=glowcheck0c-22
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_BR=glowcheck0d-20
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_MX=glowcheck0d-20
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_SG=glowcheck-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_NL=glowcheck0c-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_SE=glowcheck0c-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_PL=glowcheck0c-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_TR=glowcheck0d-20
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_AE=glowcheck-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_SA=glowcheck-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_EG=glowcheck-21
```

**Important**: 
- ⚠️ **Never commit `.env` files to git**
- ✅ Add `.env` to `.gitignore`
- ✅ Use EAS Secrets for production builds

---

### **STEP 4: Verify Configuration**

Test that your affiliate tags are working:

```typescript
import { getUserLocation, formatAmazonAffiliateLink } from '@/lib/location';

// Test location detection
const location = await getUserLocation();
console.log('Location:', location);
// Should output: { country: '...', countryCode: '...', amazonDomain: '...', currency: '...' }

// Test affiliate link generation
const testLink = formatAmazonAffiliateLink('CeraVe cleanser', location);
console.log('Affiliate Link:', testLink);
// Should contain your affiliate tag: ...&tag=YOUR-TAG&...
```

---

## 📊 **Commission Structure**

### **Amazon Associates Commission Rates (Beauty/Health & Personal Care)**

| Category | US | UK | DE | JP | Other Regions |
|----------|----|----|----|----|---------------|
| Luxury Beauty | 10% | 10% | 12% | 10% | 4-10% |
| Health & Personal Care | 4% | 7% | 3% | 3% | 1-5% |
| Beauty | 10% | 10% | 10% | 10% | 4-10% |
| **Average** | **4-10%** | **1-7%** | **3-12%** | **3-10%** | **1-10%** |

### **Cookie Duration**
- **24 hours**: User must purchase within 24 hours of clicking your link
- **90 days**: For items added to cart within 24 hours

---

## 🎯 **Revenue Optimization Strategy**

### **Phase 1: Start with Top 3 Markets** (Do This First!)
1. ✅ Register for **US** Amazon Associates
2. ✅ Register for **UK** Amazon Associates
3. ✅ Register for **Germany** Amazon Associates

These 3 markets typically account for **70-80%** of global Amazon affiliate revenue.

### **Phase 2: Expand to Major Markets** (After First Sales)
4. Register for **Japan**
5. Register for **Canada**
6. Register for **France**
7. Register for **India**

### **Phase 3: Fill Remaining Markets** (As Traffic Grows)
8. Register for remaining countries based on your user base analytics

---

## 📈 **Expected Revenue**

### **Conservative Estimates** (4% commission, 1% conversion)

**Per 1,000 Monthly Active Users:**
- 300 complete skin analysis (30%)
- 30 click product links (10% of analyzers)
- 0.3-1 purchase (1-3% of clickers)
- Average order: $50
- Commission: 4%

**Monthly Revenue**: $0.60 - $2.00 per 1,000 users

**At Scale** (100,000 monthly users):
- **Monthly**: $60 - $200
- **Annual**: $720 - $2,400

### **Optimistic Estimates** (8% commission, 3% conversion)

**Per 1,000 Monthly Active Users:**
- 300 complete skin analysis (30%)
- 60 click product links (20% of analyzers)
- 1.8-3 purchases (3-5% of clickers)
- Average order: $75
- Commission: 8%

**Monthly Revenue**: $10.80 - $18.00 per 1,000 users

**At Scale** (100,000 monthly users):
- **Monthly**: $1,080 - $1,800
- **Annual**: $12,960 - $21,600

**Key Factors**:
- Better recommendations = higher conversion
- More regional programs = more commissions
- Premium products = higher commissions (10% vs 4%)

---

## ✅ **Setup Checklist**

### **Immediate Actions**
- [ ] Register for US Amazon Associates (Priority 1)
- [ ] Get US affiliate tag
- [ ] Set `EXPO_PUBLIC_AMAZON_AFFILIATE_TAG` environment variable
- [ ] Set `EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_US` environment variable
- [ ] Test affiliate links in app
- [ ] Verify tags appear in generated URLs

### **Week 1-2: Top Markets**
- [ ] Register for UK Amazon Associates
- [ ] Get UK affiliate tag
- [ ] Set `EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_UK`
- [ ] Register for Germany Amazon Associates
- [ ] Get DE affiliate tag
- [ ] Set `EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_DE`
- [ ] Test with different locations (VPN test)

### **Month 1: Major Markets**
- [ ] Register for Japan
- [ ] Register for Canada
- [ ] Register for France
- [ ] Register for India
- [ ] Register for Australia
- [ ] Set all corresponding environment variables

### **Month 2-3: Expansion**
- [ ] Register for remaining Priority 2 markets
- [ ] Monitor which countries generate most clicks
- [ ] Prioritize registration based on actual traffic
- [ ] Set environment variables for active markets

---

## 🔍 **Testing & Verification**

### **1. Test Location Detection**
```bash
# In your app, check console logs when user opens product recommendations
# Should see: "User location: { country: '...', amazonDomain: '...' }"
```

### **2. Test Affiliate Links**
- Click any product recommendation
- Check the URL in browser
- Should contain: `?k=...&tag=YOUR-TAG&linkCode=ll2&ref=as_li_ss_tl`

### **3. Test Different Regions** (Use VPN)
- Connect to UK VPN → Should use amazon.co.uk with UK tag
- Connect to DE VPN → Should use amazon.de with DE tag
- Connect to JP VPN → Should use amazon.co.jp with JP tag

### **4. Verify Tracking**
- Make a test purchase through your affiliate link
- Check Amazon Associates dashboard after 24-48 hours
- Should see click and (if purchase) commission

---

## 📝 **Important Notes**

### **Registration Requirements**
- Most countries require a website/domain to register
- Some countries have minimum sales requirements to get paid
- Tax information required for some countries (W-9 for US, etc.)
- Different payment methods per country (PayPal, bank transfer, gift card)

### **Compliance**
- ✅ Must disclose affiliate relationships (already in Privacy Policy)
- ✅ Follow FTC guidelines
- ✅ Don't guarantee specific results
- ✅ Don't spam irrelevant products

### **Best Practices**
- ✅ Register in markets where you have actual users
- ✅ Start with US (easiest to set up, highest revenue potential)
- ✅ Monitor which countries generate clicks before registering everywhere
- ✅ Keep affiliate tags organized in a spreadsheet
- ✅ Update environment variables as you register

---

## 🚨 **Common Issues**

### **Issue: "No commission from [country]"**
**Solution**: You're not registered in that country's Amazon Associates program. Register first, then add the affiliate tag.

### **Issue: "Links redirect to wrong Amazon domain"**
**Solution**: Check location detection is working. Verify `getUserLocation()` returns correct country code.

### **Issue: "Affiliate tag not in URL"**
**Solution**: Check environment variables are set correctly. Verify in `lib/location.ts` that `REGIONAL_AFFILIATE_TAGS` includes your domain.

### **Issue: "Getting clicks but no sales"**
**Solution**: 
- Normal: 1-5% conversion rate is typical
- Improve recommendations (more relevant products)
- Add more product tiers (budget options)
- Check if products are actually available in that region

---

## 📞 **Support Resources**

### **Amazon Associates Support**
- **US**: https://affiliate-program.amazon.com/help/node/topic/GP38Q2TQE3PEGPRD
- **UK**: https://affiliate-program.amazon.co.uk/help/node/topic/GP38Q2TQE3PEGPRD
- **Global**: Check each country's Associates portal for support

### **Documentation**
- Full setup guide: `AMAZON_AFFILIATE_SETUP.md`
- Code implementation: `lib/location.ts`, `lib/amazon-recommendations.ts`

---

## 🎉 **Next Steps**

1. **Start Now**: Register for US Amazon Associates (takes 1-2 days approval)
2. **Get Your Tag**: Once approved, get your affiliate tag
3. **Set Environment Variable**: Add to EAS Secrets or `.env`
4. **Test**: Verify links contain your tag
5. **Monitor**: Check Associates dashboard for clicks/sales
6. **Expand**: Register for more countries as you see traffic

**Remember**: You can only earn commissions from countries where you're registered. Start with US, then expand based on your actual user base!

---

**Status**: 🟡 **Setup Required** - Code is ready, but you need to register for Amazon Associates programs and configure affiliate tags.

