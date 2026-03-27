/**
 * Scalable Product Database Structure
 * Designed for 180+ countries with comprehensive product catalog
 * Sephora-level mobile app product database
 */

export interface RegionalAvailability {
  country: string;
  countryCode: string;
  available: boolean;
  price: string;
  currency: string;
  retailer: 'amazon' | 'sephora' | 'ulta' | 'cult-beauty' | 'yesstyle' | 'stylevana' | 'local';
  retailerUrl?: string;
  affiliateUrl?: string;
}

export interface ProductImage {
  url: string;
  type: 'primary' | 'secondary' | 'packaging' | 'ingredients';
  region?: string; // For region-specific images
}

export interface ProductReview {
  rating: number; // 1-5
  count: number;
  averageRating: number;
}

export interface GlobalProduct {
  id: string;
  name: string;
  brand: string;
  category: 'cleansers' | 'toners' | 'essences' | 'serums' | 'ampoules' | 'moisturizers' | 'sunscreens' | 'treatments' | 'masks' | 'eye-creams' | 'lip-care' | 'body-care' | 'hair-care';
  subcategory?: string; // e.g., 'foaming', 'gel', 'oil', 'balm'
  description: string;
  images: ProductImage[];
  ingredients: string[]; // INCI names
  size: string; // e.g., '50ml', '1.7oz'
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  regionalAvailability: RegionalAvailability[];
  targetSkinTypes: string[];
  targetConcerns: string[];
  keyIngredients: string[]; // Highlighted active ingredients
  verified: boolean;
  lastVerified: string;
  reviews?: ProductReview;
  sephoraId?: string;
  ultaId?: string;
  amazonAsin?: string;
  inciDecoderUrl?: string;
  cosdnaUrl?: string;
  tags: string[]; // e.g., 'cruelty-free', 'vegan', 'fragrance-free', 'k-beauty'
}

/**
 * Product Categories for Global Market
 */
export const PRODUCT_CATEGORIES = {
  CLEANSERS: ['oil-cleansers', 'foaming-cleansers', 'gel-cleansers', 'balm-cleansers', 'micellar-waters', 'cleansing-wipes'],
  TONERS: ['hydrating-toners', 'exfoliating-toners', 'essences', 'first-treatment-essences'],
  SERUMS: ['hydrating-serums', 'anti-aging-serums', 'brightening-serums', 'acne-serums', 'vitamin-c-serums', 'retinol-serums'],
  MOISTURIZERS: ['lightweight-moisturizers', 'rich-moisturizers', 'gel-creams', 'sleeping-masks'],
  SUNSCREENS: ['mineral-sunscreens', 'chemical-sunscreens', 'tinted-sunscreens', 'spray-sunscreens'],
  TREATMENTS: ['retinoids', 'acids', 'peptides', 'vitamin-c', 'niacinamide', 'spot-treatments'],
  MASKS: ['sheet-masks', 'clay-masks', 'sleeping-masks', 'wash-off-masks'],
  EYE_CARE: ['eye-creams', 'eye-serums', 'eye-masks'],
  LIP_CARE: ['lip-balms', 'lip-treatments', 'lip-masks'],
  BODY_CARE: ['body-lotions', 'body-oils', 'body-washes'],
} as const;

/**
 * Major Global Brands by Region
 */
export const GLOBAL_BRANDS = {
  // K-Beauty
  KOREAN: [
    'COSRX', 'Innisfree', 'Laneige', 'Sulwhasoo', 'SK-II', 'The Face Shop', 
    'Etude House', 'Missha', 'Tony Moly', 'Klairs', 'Beauty of Joseon',
    'Round Lab', 'Anua', 'Torriden', 'Isntree', 'Skin1004', 'Purito'
  ],
  // Japanese
  JAPANESE: [
    'Shiseido', 'SK-II', 'Hada Labo', 'Biore', 'Kose', 'DHC', 'Canmake',
    'Curel', 'DHC', 'Fancl', 'Kikumasamune', 'Melano CC'
  ],
  // European Luxury
  EUROPEAN_LUXURY: [
    'La Mer', 'La Prairie', 'Sisley', 'Clarins', 'Lancôme', 'Yves Saint Laurent',
    'Dior', 'Chanel', 'Guerlain', 'Estée Lauder', 'Clinique'
  ],
  // European Drugstore
  EUROPEAN_DRUGSTORE: [
    'La Roche-Posay', 'Vichy', 'Avene', 'Bioderma', 'Eucerin', 'Nivea',
    'Garnier', 'L\'Oréal', 'Caudalie', 'The Ordinary', 'The Inkey List'
  ],
  // US Drugstore
  US_DRUGSTORE: [
    'CeraVe', 'Cetaphil', 'Neutrogena', 'Olay', 'Aveeno', 'Dove',
    'Pond\'s', 'St. Ives', 'Burt\'s Bees'
  ],
  // US Premium
  US_PREMIUM: [
    'Drunk Elephant', 'Sunday Riley', 'Tatcha', 'Glow Recipe', 'Farmacy',
    'Kiehl\'s', 'Fresh', 'Origins', 'Murad', 'Paula\'s Choice', 'SkinCeuticals'
  ],
  // Australian
  AUSTRALIAN: [
    'Aesop', 'Jurlique', 'Sukin', 'Ultra Violette', 'Cancer Council'
  ],
  // French Pharmacy
  FRENCH_PHARMACY: [
    'La Roche-Posay', 'Vichy', 'Avene', 'Bioderma', 'Uriage', 'Nuxe'
  ],
} as const;

/**
 * Country/Region Mapping for Retailers
 */
export const REGIONAL_RETAILERS: Record<string, {
  primary: string[];
  secondary: string[];
  currency: string;
}> = {
  'US': { primary: ['sephora', 'ulta', 'amazon'], secondary: ['target', 'walmart'], currency: 'USD' },
  'CA': { primary: ['sephora', 'amazon'], secondary: ['shoppers-drug-mart'], currency: 'CAD' },
  'GB': { primary: ['cult-beauty', 'boots', 'amazon'], secondary: ['space-nk'], currency: 'GBP' },
  'FR': { primary: ['sephora', 'amazon'], secondary: ['nocibe'], currency: 'EUR' },
  'DE': { primary: ['douglas', 'amazon'], secondary: ['dm'], currency: 'EUR' },
  'AU': { primary: ['sephora', 'amazon'], secondary: ['priceline', 'chemist-warehouse'], currency: 'AUD' },
  'JP': { primary: ['amazon'], secondary: ['cosme', 'matsumoto-kiyoshi'], currency: 'JPY' },
  'KR': { primary: ['yesstyle', 'stylevana', 'amazon'], secondary: ['olive-young'], currency: 'KRW' },
  'CN': { primary: ['tmall', 'jd'], secondary: ['sephora'], currency: 'CNY' },
  'IN': { primary: ['amazon', 'nykaa'], secondary: ['purplle'], currency: 'INR' },
  'BR': { primary: ['sephora', 'amazon'], secondary: ['drogasil'], currency: 'BRL' },
  'MX': { primary: ['sephora', 'amazon'], secondary: ['farmacias-guadalajara'], currency: 'MXN' },
  'AE': { primary: ['sephora', 'amazon'], secondary: ['boots'], currency: 'AED' },
  'SG': { primary: ['sephora', 'amazon'], secondary: ['watsons'], currency: 'SGD' },
  'MY': { primary: ['sephora', 'amazon'], secondary: ['watsons'], currency: 'MYR' },
  'TH': { primary: ['sephora', 'amazon'], secondary: ['boots', 'watsons'], currency: 'THB' },
  'PH': { primary: ['sephora', 'amazon'], secondary: ['watsons'], currency: 'PHP' },
  'ID': { primary: ['sephora', 'amazon'], secondary: ['watsons'], currency: 'IDR' },
  'VN': { primary: ['sephora', 'amazon'], secondary: ['watsons'], currency: 'VND' },
} as const;

/**
 * Helper function to get regional retailers for a country
 */
export function getRegionalRetailers(countryCode: string): {
  primary: string[];
  secondary: string[];
  currency: string;
} {
  return REGIONAL_RETAILERS[countryCode] || {
    primary: ['amazon'],
    secondary: [],
    currency: 'USD',
  };
}

/**
 * Helper function to check if product is available in country
 */
export function isProductAvailableInCountry(
  product: GlobalProduct,
  countryCode: string
): boolean {
  return product.regionalAvailability.some(
    availability => availability.countryCode === countryCode && availability.available
  );
}

/**
 * Get product price for specific country
 */
export function getProductPriceForCountry(
  product: GlobalProduct,
  countryCode: string
): RegionalAvailability | null {
  return product.regionalAvailability.find(
    availability => availability.countryCode === countryCode && availability.available
  ) || null;
}


