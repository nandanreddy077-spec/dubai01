import { GlobalProduct } from './product-database-structure';
import { LocationInfo } from './location';

const REGIONAL_AFFILIATE_TAGS: Record<string, string> = {
  'amazon.com': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_US || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.co.uk': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_UK || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.ca': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_CA || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.de': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_DE || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.fr': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_FR || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.it': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_IT || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.es': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_ES || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.co.jp': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_JP || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.in': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_IN || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.com.au': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_AU || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.com.br': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_BR || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.com.mx': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_MX || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.sg': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_SG || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.ae': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_AE || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
};

/**
 * Build an optimized Amazon search query for exact product matching
 * Includes brand, product name, size, and key identifiers
 */
export function buildOptimizedAmazonQuery(product: GlobalProduct): string {
  const parts: string[] = [];
  
  // Always include brand first (most important for matching)
  parts.push(product.brand);
  
  // Add exact product name
  parts.push(product.name);
  
  // Add size if available (helps distinguish variants)
  if (product.size) {
    parts.push(product.size);
  }
  
  // Add category/subcategory for context (optional, helps with ambiguous names)
  if (product.subcategory) {
    const subcategoryWords = product.subcategory.replace(/-/g, ' ').split(' ');
    // Only add if it adds value (not redundant with name)
    if (!product.name.toLowerCase().includes(subcategoryWords[0].toLowerCase())) {
      parts.push(subcategoryWords[0]);
    }
  }
  
  // Remove duplicates and join
  return [...new Set(parts)].join(' ');
}

/**
 * Get Amazon category ID for beauty/skincare products
 */
function getAmazonCategoryId(category: string): string {
  const categoryMap: Record<string, string> = {
    'cleansers': '3760911', // Beauty > Skin Care > Cleansers
    'toners': '3760901', // Beauty > Skin Care > Toners
    'serums': '3760906', // Beauty > Skin Care > Serums
    'moisturizers': '3760900', // Beauty > Skin Care > Moisturizers
    'sunscreens': '3760909', // Beauty > Skin Care > Sunscreens
    'treatments': '3760907', // Beauty > Skin Care > Treatments
    'masks': '3760902', // Beauty > Skin Care > Masks
    'eye-creams': '3760903', // Beauty > Skin Care > Eye Creams
  };
  return categoryMap[category] || '3760901'; // Default to Beauty > Skin Care
}

/**
 * Enhanced Amazon search link with better product matching
 * Uses exact phrase matching + multiple filters to get exact product first
 * This should show the exact product as the FIRST result
 */
export function formatOptimizedAmazonSearch(
  product: GlobalProduct,
  location?: LocationInfo | null
): string {
  const amazonDomain = location?.amazonDomain || 'amazon.com';
  const affiliateTag = REGIONAL_AFFILIATE_TAGS[amazonDomain] || 
                       process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 
                       'glowcheck-20';
  
  // Strategy 1: Use exact phrase match for best results
  // Wrap brand + product name in quotes for exact matching
  const exactPhrase = `"${product.brand} ${product.name}"`;
  const searchEncoded = encodeURIComponent(exactPhrase);
  
  const brandFilter = encodeURIComponent(product.brand);
  const categoryId = getAmazonCategoryId(product.category);
  
  // Combine filters: brand + category for best results
  const filters = [
    `p_89:${brandFilter}`, // Brand filter (ensures correct brand)
    `n:${categoryId}`, // Category filter (Beauty > Skin Care)
  ];
  
  const filterString = filters.join(',');
  
  // Build URL with:
  // - Exact phrase search (quotes around brand + name)
  // - Brand filter (p_89)
  // - Category filter (n:)
  // - Relevance ranking (s=relevancerank) - puts exact matches first
  // - Beauty category view (i=beauty) for better product display
  let url = `https://www.${amazonDomain}/s?k=${searchEncoded}&rh=${filterString}&s=relevancerank&tag=${affiliateTag}&linkCode=ll2&ref=as_li_ss_tl`;
  
  // Add beauty category view for skincare products
  if (['cleansers', 'toners', 'serums', 'moisturizers', 'sunscreens', 'treatments', 'masks', 'eye-creams'].includes(product.category)) {
    url += '&i=beauty';
  }
  
  return url;
}

/**
 * Create a search URL that's optimized to show the exact product first
 * Uses exact phrase matching when possible
 */
export function formatExactProductSearch(
  product: GlobalProduct,
  location?: LocationInfo | null
): string {
  const amazonDomain = location?.amazonDomain || 'amazon.com';
  const affiliateTag = REGIONAL_AFFILIATE_TAGS[amazonDomain] || 
                       process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 
                       'glowcheck-20';
  
  // Try exact phrase match: "Brand Product Name"
  const exactPhrase = `"${product.brand} ${product.name}"`;
  const searchEncoded = encodeURIComponent(exactPhrase);
  const brandFilter = encodeURIComponent(product.brand);
  const categoryId = getAmazonCategoryId(product.category);
  
  // Use exact phrase + brand filter for best match
  return `https://www.${amazonDomain}/s?k=${searchEncoded}&rh=p_89:${brandFilter},n:${categoryId}&s=relevancerank&tag=${affiliateTag}&linkCode=ll2&ref=as_li_ss_tl`;
}

