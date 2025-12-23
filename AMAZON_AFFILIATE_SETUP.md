# Amazon Affiliate Setup Guide

## Overview
Your app now has a comprehensive Amazon affiliate system with:
- ✅ AI-powered product recommendations
- ✅ Support for 180+ countries  
- ✅ Automatic location detection and Amazon domain routing
- ✅ Multi-currency price conversion
- ✅ Proper affiliate tracking parameters

## What You Need to Setup

### 1. Amazon Associates Account

You need to sign up for Amazon Associates program in each region you want to earn commissions from:

#### Primary Markets (High Priority):
- **United States**: https://affiliate-program.amazon.com/
- **United Kingdom**: https://affiliate-program.amazon.co.uk/
- **Canada**: https://associates.amazon.ca/
- **Germany**: https://partnernet.amazon.de/
- **France**: https://partenaires.amazon.fr/
- **Italy**: https://programma-affiliazione.amazon.it/
- **Spain**: https://afiliados.amazon.es/
- **Japan**: https://affiliate.amazon.co.jp/
- **India**: https://affiliate.amazon.in/
- **Australia**: https://affiliate-program.amazon.com.au/

#### Secondary Markets:
- **UAE/Middle East**: https://affiliate.amazon.ae/
- **Saudi Arabia**: https://affiliate.amazon.sa/
- **Brazil**: https://associados.amazon.com.br/
- **Mexico**: https://afiliados.amazon.com.mx/
- **Singapore**: https://affiliate.amazon.sg/
- **Netherlands**: https://partnernet.amazon.nl/
- **Sweden**: https://affiliate.amazon.se/
- **Poland**: https://program-partnerski.amazon.pl/
- **Turkey**: https://affiliate-program.amazon.com.tr/

### 2. Get Your Affiliate Tags

After signing up, you'll get an affiliate tag (tracking ID) from each program. They look like:
- US: `yourapp-20`
- UK: `yourapp-21`
- DE: `yourapp0e-21`
- etc.

### 3. Add Environment Variables

Add these to your `.env` file:

```bash
# Primary affiliate tag (fallback)
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG=yourapp-20

# Regional affiliate tags (optional but recommended for max revenue)
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_US=yourapp-20
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_UK=yourapp-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_CA=yourapp0b-20
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_DE=yourapp0e-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_FR=yourapp04-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_IT=yourapp08-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_ES=yourapp01-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_JP=yourapp-22
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_IN=yourapp-21
EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_AU=yourapp0c-22
# ... add more as needed
```

**Important**: If you don't set regional tags, the system will use `EXPO_PUBLIC_AMAZON_AFFILIATE_TAG` as fallback, or default to 'glowcheck-20' (which won't earn you money).

## How It Works

### 1. **Automatic Location Detection**
- On mobile: Uses device GPS + IP geolocation
- On web: Uses IP geolocation
- Falls back to US if detection fails

### 2. **Smart Amazon Domain Routing**
- User in Germany → amazon.de
- User in Japan → amazon.co.jp
- User in Brazil → amazon.com.br
- Countries without local Amazon → amazon.com (closest regional store)

### 3. **AI-Powered Recommendations**
When a user completes skin analysis, the app:
1. Analyzes their skin type, concerns, and scores
2. Uses OpenAI (if configured) or rule-based system
3. Recommends 4-7 specific products:
   - Cleanser (essential)
   - Targeted serum based on biggest concern (essential)
   - Moisturizer for their skin type (essential)
   - Sunscreen SPF 30+ (essential)
   - Additional treatments as needed (recommended/optional)

### 4. **Product Tiers**
Each recommendation includes 3 price tiers:
- **Budget**: $5-20 (drugstore brands)
- **Mid-Range**: $20-60 (quality without premium price)
- **Luxury**: $60-150+ (professional-grade)

### 5. **Proper Affiliate Tracking**
All links include:
- `tag=your-affiliate-tag` - Your commission tracking
- `linkCode=ll2` - Associates link format
- `ref=as_li_ss_tl` - Reference tag for tracking

This ensures you get credit even if users don't purchase immediately (24-hour cookie).

## Testing Your Setup

1. **Test Location Detection**:
   ```typescript
   import { getUserLocation } from '@/lib/location';
   
   const location = await getUserLocation();
   console.log('User location:', location);
   // Should show: country, currency, amazonDomain
   ```

2. **Test Recommendations**:
   - Complete a skin analysis in the app
   - Check product recommendations
   - Verify Amazon links open correct regional store
   - Verify your affiliate tag is in the URL

3. **Check Affiliate Links**:
   - Click a product recommendation
   - Look at the URL in browser
   - Should see: `https://www.amazon.XX/s?k=...&tag=YOUR-TAG&linkCode=ll2&ref=as_li_ss_tl`

## Revenue Optimization Tips

### 1. Register in Multiple Regions
Each Amazon Associates program is separate. You can only earn from regions where you're registered:
- ✅ Registered in US + UK → Earn from both
- ❌ Only registered in US → UK users = no commission

**Priority order** (by market size):
1. US (largest)
2. UK, Germany, Japan
3. Canada, France, Italy, India
4. Australia, Spain, Brazil
5. Rest

### 2. Accurate Recommendations
The AI recommendations are based on:
- Skin type (oily/dry/combination/sensitive)
- Specific concerns (hydration/aging/acne/brightness)
- Detailed analysis scores

More accurate = higher conversion = more revenue.

### 3. Product Variety
Users see 3 price tiers per product. This increases chances of purchase:
- Budget-conscious → $10 product
- Quality-focused → $30 product
- Premium seekers → $80 product

All generate commissions (4-10% typically).

### 4. Tracking & Analytics
Monitor which products get most clicks:
```typescript
const { trackAffiliateTap } = useProducts();

// This is already implemented when users click products
trackAffiliateTap(productId, amazonUrl);
```

Check AsyncStorage key `product_affiliate_taps` for analytics.

## Important Notes

### Commission Rates
Amazon typically pays:
- Luxury Beauty: 10%
- Health & Personal Care: 4%
- Beauty: 10%
- Average: 4-10% per sale

### Cookie Duration
- **24 hours**: User must purchase within 24 hours of clicking your link
- **90 days**: For items added to cart within 24 hours

### Compliance
**Required disclosures** (Amazon Associates rules):
- ✅ Already included in Privacy Policy
- Clearly state you earn from qualifying purchases
- Follow FTC guidelines

### Best Practices
1. ✅ Keep recommendations relevant to analysis
2. ✅ Mix budget and premium products
3. ✅ Update product links if search terms aren't working
4. ✅ Monitor which products convert best
5. ❌ Don't spam irrelevant products
6. ❌ Don't guarantee specific results

## Advanced: Customizing Recommendations

### Add New Product Categories
Edit `lib/amazon-recommendations.ts`:

```typescript
function getNewProductType(skinType: string, location: LocationInfo, tag: string): ProductRecommendation {
  return {
    name: 'Eye Cream',
    brand: 'CeraVe or Neutrogena',
    category: 'eye-care',
    description: 'Reduces puffiness and dark circles',
    whyRecommended: 'Your analysis shows signs of fatigue around eyes',
    keyIngredients: ['Caffeine', 'Vitamin K', 'Peptides'],
    benefits: ['Reduces puffiness', 'Brightens dark circles', 'Firms skin'],
    bestFor: ['Dark circles', 'Puffy eyes', 'Fine lines'],
    priceRange: '$15-25',
    searchQuery: 'eye cream dark circles caffeine',
    amazonSearchUrl: formatAmazonUrl('eye cream dark circles caffeine', location.amazonDomain, tag),
    matchScore: 88,
    priority: 'recommended',
  };
}
```

### Customize Search Queries
If products aren't relevant, adjust search terms in the recommendation functions:
```typescript
searchQuery: 'CeraVe hydrating cleanser dry skin'
// → More specific = better Amazon results
```

### AI Recommendations
To enable AI (more personalized):
1. Add OpenAI API key to `.env`:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=sk-...
   ```
2. AI will automatically generate product recommendations based on detailed skin analysis

## Revenue Potential

Example scenario:
- 1,000 monthly active users
- 30% complete skin analysis (300 users)
- 10% click product recommendations (30 users)
- 5% purchase (1-2 purchases)
- Average order: $50
- Commission: 8%

**Monthly estimate**: $4-8 per 1,000 users
**At scale** (100k users): $400-800/month

This scales with:
- Better recommendations = higher conversion
- More regional programs = more commissions  
- User engagement = repeat purchases

## Support & Questions

If recommendations aren't showing:
1. Check user completed skin analysis
2. Verify `recommendations` array in ProductContext
3. Test `generateProductRecommendations()` function
4. Check console logs for errors

If affiliate links aren't working:
1. Verify environment variables are set
2. Check affiliate tag format (should be `yourapp-20`)
3. Test link in browser - should redirect to Amazon
4. Confirm you're registered in that region's program

## Next Steps

1. ✅ Sign up for Amazon Associates (start with US)
2. ✅ Add affiliate tag to `.env`
3. ✅ Test product recommendations
4. ✅ Monitor first commissions (usually 24-48 hours delay)
5. ✅ Expand to more regions as you grow
6. ✅ Optimize based on analytics

**Good luck with your affiliate revenue! 🎉**
