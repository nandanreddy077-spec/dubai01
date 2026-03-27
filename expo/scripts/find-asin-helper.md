# ASIN Finder Helper Guide

## Quick Method: Find ASIN from Amazon Search

When you click "Buy on Amazon" and see search results:

1. **Look for the exact product** in the search results (should be first or near the top with brand filter)
2. **Click the product** to open its page
3. **Find ASIN** in one of these places:
   - **URL**: `amazon.com/dp/B000YQ86AU` → ASIN is `B000YQ86AU`
   - **Product Details**: Scroll down to "Product Information" → "ASIN"
   - **Page Source**: Right-click → View Source → Search for "ASIN"

4. **Add to mapping file**: Open `lib/products/asin-mapping.ts` and add:
   ```typescript
   'product_id': 'B000YQ86AU',
   ```

## Automated Method (Future Enhancement)

For bulk ASIN finding, you can:
1. Use Amazon Product Advertising API (requires API keys)
2. Use a browser extension to extract ASINs
3. Use a script to parse Amazon search results (server-side)

## Current Solution

The optimized search should now show the exact product **first** in results because:
- ✅ Brand filter ensures only products from that brand
- ✅ Category filter narrows to Beauty/Skincare
- ✅ Relevance ranking puts exact matches first
- ✅ Optimized query includes brand + name + size

If the product still doesn't appear first, you can manually find the ASIN and add it to the mapping file.

