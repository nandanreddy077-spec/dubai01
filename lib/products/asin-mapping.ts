/**
 * ASIN Mapping - Incremental storage for product ASINs
 * 
 * HOW TO ADD ASINs:
 * 1. Search product on Amazon using the optimized search from the app
 * 2. Click the exact product you want
 * 3. Find ASIN in URL: amazon.com/dp/B000YQ86AU (ASIN is B000YQ86AU)
 *    OR in Product Details section → "ASIN"
 * 4. Add entry here: 'product_id': 'ASIN'
 * 
 * BENEFITS:
 * - No need to update all products at once
 * - Add ASINs incrementally as you find them
 * - App automatically uses ASINs when available
 * - Falls back to smart search if ASIN not found
 * 
 * FORMAT: productId -> ASIN (10-character code)
 */

export const ASIN_MAPPING: Record<string, string> = {
  // Example entries (uncomment and add your ASINs):
  // 'dhc_deep_cleansing_oil': 'B000YQ86AU',
  // 'banila_co_clean_it_zero': 'B00XYZ1234',
  
  // Add more ASINs incrementally - no rush!
  // The app works great with smart search even without ASINs
};

/**
 * Get ASIN for a product
 * Checks mapping file first (most up-to-date), then product data
 */
export function getProductASIN(
  productId: string, 
  product?: { amazonAsin?: string }
): string | undefined {
  // Check mapping file first (most up-to-date source)
  if (ASIN_MAPPING[productId]) {
    return ASIN_MAPPING[productId];
  }
  
  // Fallback to product's amazonAsin field (if set in product database)
  return product?.amazonAsin;
}

/**
 * Check if a product has an ASIN available
 */
export function hasProductASIN(productId: string, product?: { amazonAsin?: string }): boolean {
  return !!getProductASIN(productId, product);
}

