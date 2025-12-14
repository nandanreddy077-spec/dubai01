import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface LocationInfo {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  currency: string;
  amazonDomain: string;
}

const COUNTRY_AMAZON_MAPPING: Record<string, { domain: string; currency: string }> = {
  'US': { domain: 'amazon.com', currency: 'USD' },
  'CA': { domain: 'amazon.ca', currency: 'CAD' },
  'UK': { domain: 'amazon.co.uk', currency: 'GBP' },
  'GB': { domain: 'amazon.co.uk', currency: 'GBP' },
  'DE': { domain: 'amazon.de', currency: 'EUR' },
  'FR': { domain: 'amazon.fr', currency: 'EUR' },
  'IT': { domain: 'amazon.it', currency: 'EUR' },
  'ES': { domain: 'amazon.es', currency: 'EUR' },
  'JP': { domain: 'amazon.co.jp', currency: 'JPY' },
  'IN': { domain: 'amazon.in', currency: 'INR' },
  'AU': { domain: 'amazon.com.au', currency: 'AUD' },
  'BR': { domain: 'amazon.com.br', currency: 'BRL' },
  'MX': { domain: 'amazon.com.mx', currency: 'MXN' },
  'CN': { domain: 'amazon.cn', currency: 'CNY' },
  'NL': { domain: 'amazon.nl', currency: 'EUR' },
  'SG': { domain: 'amazon.sg', currency: 'SGD' },
  'TR': { domain: 'amazon.com.tr', currency: 'TRY' },
  'AE': { domain: 'amazon.ae', currency: 'AED' },
  'SA': { domain: 'amazon.sa', currency: 'SAR' },
  'SE': { domain: 'amazon.se', currency: 'SEK' },
  'PL': { domain: 'amazon.pl', currency: 'PLN' },
};

export async function getUserLocation(): Promise<LocationInfo | null> {
  try {
    if (Platform.OS === 'web') {
      return await getLocationFromIP();
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied, using IP fallback');
      return await getLocationFromIP();
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low,
    });

    const [address] = await Location.reverseGeocodeAsync({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });

    if (address.isoCountryCode) {
      const countryCode = address.isoCountryCode.toUpperCase();
      const mapping = COUNTRY_AMAZON_MAPPING[countryCode] || { domain: 'amazon.com', currency: 'USD' };
      
      return {
        country: address.country || 'United States',
        countryCode,
        region: address.region || undefined,
        city: address.city || undefined,
        currency: mapping.currency,
        amazonDomain: mapping.domain,
      };
    }

    return await getLocationFromIP();
  } catch (error) {
    console.error('Error getting user location:', error);
    return await getLocationFromIP();
  }
}

async function getLocationFromIP(): Promise<LocationInfo | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      console.warn(`IP API returned status ${response.status}, using default location`);
      return getDefaultLocation();
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`IP API returned non-JSON response (${contentType}), using default location`);
      return getDefaultLocation();
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.warn(`IP API error: ${data.reason || 'Unknown error'}, using default location`);
      return getDefaultLocation();
    }
    
    const countryCode = data.country_code || 'US';
    const mapping = COUNTRY_AMAZON_MAPPING[countryCode] || { domain: 'amazon.com', currency: 'USD' };
    
    return {
      country: data.country_name || 'United States',
      countryCode,
      region: data.region || undefined,
      city: data.city || undefined,
      currency: mapping.currency,
      amazonDomain: mapping.domain,
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return getDefaultLocation();
  }
}

function getDefaultLocation(): LocationInfo {
  return {
    country: 'United States',
    countryCode: 'US',
    currency: 'USD',
    amazonDomain: 'amazon.com',
  };
}

// Map Amazon domains to their respective affiliate tags
// You need to register with each regional Amazon Associates program
const REGIONAL_AFFILIATE_TAGS: Record<string, string> = {
  'amazon.com': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_US || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.co.uk': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_UK || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.de': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_DE || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.fr': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_FR || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.it': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_IT || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.es': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_ES || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.ca': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_CA || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.co.jp': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_JP || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.in': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_IN || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.com.au': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_AU || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.ae': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_AE || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.sa': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_SA || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.com.br': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_BR || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.com.mx': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_MX || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.sg': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_SG || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.nl': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_NL || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.se': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_SE || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.pl': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_PL || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
  'amazon.com.tr': process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG_TR || process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 'glowcheck-20',
};

export function formatAmazonAffiliateLink(
  searchQuery: string,
  country?: LocationInfo | null
): string {
  const searchEncoded = encodeURIComponent(searchQuery);
  
  // Default to amazon.com if country or amazonDomain is not available
  const amazonDomain = country?.amazonDomain || 'amazon.com';
  
  // Get the appropriate affiliate tag for this region
  const affiliateTag = REGIONAL_AFFILIATE_TAGS[amazonDomain] || 
                       process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 
                       'glowcheck-20';
  
  // Use Amazon's proper affiliate link format with tracking parameters:
  // - linkCode=ll2: Associates Link format (required for proper tracking)
  // - ref=as_li_ss_tl: Reference tag for Associates tracking
  // These parameters ensure the affiliate tag persists when users click through to products
  return `https://www.${amazonDomain}/s?k=${searchEncoded}&tag=${affiliateTag}&linkCode=ll2&ref=as_li_ss_tl`;
}

// For direct product links (if you have specific ASINs)
export function formatAmazonProductLink(
  asin: string,
  country?: LocationInfo | null
): string {
  const amazonDomain = country?.amazonDomain || 'amazon.com';
  const affiliateTag = REGIONAL_AFFILIATE_TAGS[amazonDomain] || 
                       process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 
                       'glowcheck-20';
  
  // Direct product link with Associates parameters
  return `https://www.${amazonDomain}/dp/${asin}?tag=${affiliateTag}&linkCode=ll2&ref=as_li_ss_tl`;
}

// For add-to-cart links (most reliable for attribution)
export function formatAmazonCartLink(
  asin: string,
  country?: LocationInfo | null
): string {
  const amazonDomain = country?.amazonDomain || 'amazon.com';
  const affiliateTag = REGIONAL_AFFILIATE_TAGS[amazonDomain] || 
                       process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 
                       'glowcheck-20';
  
  // Add to cart link - guarantees affiliate attribution
  return `https://www.${amazonDomain}/gp/aws/cart/add.html?AssociateTag=${affiliateTag}&ASIN.1=${asin}&Quantity.1=1`;
}

export function getLocalizedPrice(basePrice: number, fromCurrency: string, toCurrency: string): string {
  const rates: Record<string, number> = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.79,
    'CAD': 1.35,
    'AUD': 1.52,
    'JPY': 149.50,
    'INR': 83.12,
    'BRL': 4.97,
    'MXN': 17.05,
    'CNY': 7.24,
    'SGD': 1.34,
    'TRY': 32.15,
    'AED': 3.67,
    'SAR': 3.75,
    'SEK': 10.57,
    'PLN': 4.03,
  };

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  
  const convertedPrice = (basePrice / fromRate) * toRate;
  
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'INR': '₹',
    'BRL': 'R$',
    'MXN': 'MX$',
    'CNY': '¥',
    'SGD': 'S$',
    'TRY': '₺',
    'AED': 'د.إ',
    'SAR': '﷼',
    'SEK': 'kr',
    'PLN': 'zł',
  };

  const symbol = currencySymbols[toCurrency] || '$';
  
  return `${symbol}${convertedPrice.toFixed(2)}`;
}
