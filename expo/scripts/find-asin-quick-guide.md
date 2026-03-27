# Quick Guide: Finding ASINs for Products

## The Problem
Without ASINs, Amazon links show search results instead of the exact product page.

## The Solution
We've improved the search to show the exact product **first** in results. But to go directly to the product (no search), you need ASINs.

## Quick Method (2 minutes per product)

### Step 1: Click "Buy on Amazon" in your app
- This opens Amazon with optimized search
- The exact product should be **first** in results (thanks to brand + category filters)

### Step 2: Click the exact product
- Look for your product (e.g., "DHC Deep Cleansing Oil")
- Click it to open the product page

### Step 3: Find the ASIN
**Option A - From URL:**
- Look at the URL: `amazon.com/dp/B000YQ86AU`
- The ASIN is `B000YQ86AU` (10 characters after `/dp/`)

**Option B - From Product Details:**
- Scroll down to "Product Information"
- Find "ASIN" → Copy the code

**Option C - Use Browser Console:**
1. Press F12 (or right-click → Inspect)
2. Go to Console tab
3. Paste this code:
```javascript
window.location.href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] || 'Not found'
```
4. Press Enter → ASIN appears

### Step 4: Add to mapping file
Open `lib/products/asin-mapping.ts` and add:
```typescript
export const ASIN_MAPPING: Record<string, string> = {
  'dhc_deep_cleansing_oil': 'B000YQ86AU', // ← Add your ASIN here
  // Add more as you find them...
};
```

## Bulk Method (For many products)

### Use Browser Extension
1. Install "Amazon ASIN Extractor" extension
2. Visit each product page
3. Extension shows ASIN
4. Copy and add to mapping file

### Use Script (Advanced)
See `scripts/extract-asin-bookmarklet.js` for a bookmarklet that extracts ASIN automatically.

## Current Status

✅ **Search is optimized** - Exact product should appear first
✅ **Brand + Category filters** - Better matching
✅ **Relevance ranking** - Exact matches prioritized
⚠️ **Still shows search** - Because no ASINs yet
✅ **Easy to add ASINs** - Just add to mapping file incrementally

## Pro Tip

Start with your **top 10-20 most popular products**. Add their ASINs first, then gradually add more. The app works great with search, but direct product links are even better!

