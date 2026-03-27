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
  'EG': { domain: 'amazon.eg', currency: 'EGP' },
  'BE': { domain: 'amazon.com', currency: 'EUR' },
  'NO': { domain: 'amazon.com', currency: 'NOK' },
  'DK': { domain: 'amazon.com', currency: 'DKK' },
  'AT': { domain: 'amazon.de', currency: 'EUR' },
  'CH': { domain: 'amazon.de', currency: 'CHF' },
  'IE': { domain: 'amazon.co.uk', currency: 'EUR' },
  'NZ': { domain: 'amazon.com.au', currency: 'NZD' },
  'ZA': { domain: 'amazon.com', currency: 'ZAR' },
  'KR': { domain: 'amazon.com', currency: 'KRW' },
  'TH': { domain: 'amazon.sg', currency: 'THB' },
  'MY': { domain: 'amazon.sg', currency: 'MYR' },
  'ID': { domain: 'amazon.sg', currency: 'IDR' },
  'PH': { domain: 'amazon.sg', currency: 'PHP' },
  'VN': { domain: 'amazon.sg', currency: 'VND' },
  'CL': { domain: 'amazon.com', currency: 'CLP' },
  'AR': { domain: 'amazon.com', currency: 'ARS' },
  'CO': { domain: 'amazon.com', currency: 'COP' },
  'PE': { domain: 'amazon.com', currency: 'PEN' },
  'IL': { domain: 'amazon.com', currency: 'ILS' },
  'QA': { domain: 'amazon.ae', currency: 'QAR' },
  'KW': { domain: 'amazon.ae', currency: 'KWD' },
  'BH': { domain: 'amazon.ae', currency: 'BHD' },
  'OM': { domain: 'amazon.ae', currency: 'OMR' },
  'JO': { domain: 'amazon.ae', currency: 'JOD' },
  'LB': { domain: 'amazon.com', currency: 'LBP' },
  'PK': { domain: 'amazon.in', currency: 'PKR' },
  'BD': { domain: 'amazon.in', currency: 'BDT' },
  'LK': { domain: 'amazon.in', currency: 'LKR' },
  'NP': { domain: 'amazon.in', currency: 'NPR' },
  'HK': { domain: 'amazon.com', currency: 'HKD' },
  'TW': { domain: 'amazon.co.jp', currency: 'TWD' },
  'UA': { domain: 'amazon.com', currency: 'UAH' },
  'RU': { domain: 'amazon.com', currency: 'RUB' },
  'KZ': { domain: 'amazon.com', currency: 'KZT' },
  'GR': { domain: 'amazon.com', currency: 'EUR' },
  'PT': { domain: 'amazon.es', currency: 'EUR' },
  'RO': { domain: 'amazon.com', currency: 'RON' },
  'CZ': { domain: 'amazon.de', currency: 'CZK' },
  'HU': { domain: 'amazon.de', currency: 'HUF' },
  'BG': { domain: 'amazon.com', currency: 'BGN' },
  'HR': { domain: 'amazon.de', currency: 'HRK' },
  'SK': { domain: 'amazon.de', currency: 'EUR' },
  'SI': { domain: 'amazon.de', currency: 'EUR' },
  'LT': { domain: 'amazon.de', currency: 'EUR' },
  'LV': { domain: 'amazon.de', currency: 'EUR' },
  'EE': { domain: 'amazon.de', currency: 'EUR' },
  'FI': { domain: 'amazon.se', currency: 'EUR' },
  'IS': { domain: 'amazon.co.uk', currency: 'ISK' },
  'NG': { domain: 'amazon.com', currency: 'NGN' },
  'KE': { domain: 'amazon.com', currency: 'KES' },
  'GH': { domain: 'amazon.com', currency: 'GHS' },
  'MA': { domain: 'amazon.fr', currency: 'MAD' },
  'TN': { domain: 'amazon.fr', currency: 'TND' },
  'DZ': { domain: 'amazon.fr', currency: 'DZD' },
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
  const amazonDomain = country?.amazonDomain || 'amazon.com';
  const affiliateTag = REGIONAL_AFFILIATE_TAGS[amazonDomain] || 
                       process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 
                       'glowcheck-20';
  
  return `https://www.${amazonDomain}/s?k=${searchEncoded}&tag=${affiliateTag}&linkCode=ll2&ref=as_li_ss_tl`;
}

/**
 * Enhanced Amazon search with brand filter for better product matching
 * Use this when you have product object with brand information
 */
export function formatAmazonAffiliateLinkWithBrand(
  product: { brand: string; name: string; size?: string },
  country?: LocationInfo | null
): string {
  const query = `${product.brand} ${product.name}${product.size ? ` ${product.size}` : ''}`;
  const searchEncoded = encodeURIComponent(query);
  const amazonDomain = country?.amazonDomain || 'amazon.com';
  const affiliateTag = REGIONAL_AFFILIATE_TAGS[amazonDomain] || 
                       process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 
                       'glowcheck-20';
  
  // Use brand filter for better matching: rh=p_89:BRAND_NAME
  const brandFilter = encodeURIComponent(product.brand);
  return `https://www.${amazonDomain}/s?k=${searchEncoded}&rh=p_89:${brandFilter}&tag=${affiliateTag}&linkCode=ll2&ref=as_li_ss_tl`;
}

export function formatAmazonProductLink(
  asin: string,
  country?: LocationInfo | null
): string {
  const amazonDomain = country?.amazonDomain || 'amazon.com';
  const affiliateTag = REGIONAL_AFFILIATE_TAGS[amazonDomain] || 
                       process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 
                       'glowcheck-20';
  
  return `https://www.${amazonDomain}/dp/${asin}?tag=${affiliateTag}&linkCode=ll2&ref=as_li_ss_tl`;
}

/**
 * Generate Amazon deep link for mobile apps
 * Uses app-specific URI schemes for direct product access
 */
export function formatAmazonDeepLink(
  asin: string,
  country?: LocationInfo | null
): string {
  const amazonDomain = country?.amazonDomain || 'amazon.com';
  const affiliateTag = REGIONAL_AFFILIATE_TAGS[amazonDomain] || 
                       process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 
                       'glowcheck-20';
  
  // Mobile app deep link format: amazon://dp/ASIN?tag=AFFILIATE_TAG
  // Falls back to web URL if app not installed
  const webUrl = `https://www.${amazonDomain}/dp/${asin}?tag=${affiliateTag}&linkCode=ll2&ref=as_li_ss_tl`;
  
  // iOS: com.amazon.mobile.shopping://www.amazon.com/dp/ASIN
  // Android: amazon://dp/ASIN
  if (Platform.OS === 'ios') {
    return `com.amazon.mobile.shopping://www.${amazonDomain}/dp/${asin}?tag=${affiliateTag}`;
  } else if (Platform.OS === 'android') {
    return `amazon://dp/${asin}?tag=${affiliateTag}`;
  }
  
  // Web fallback
  return webUrl;
}

export function formatAmazonCartLink(
  asin: string,
  country?: LocationInfo | null
): string {
  const amazonDomain = country?.amazonDomain || 'amazon.com';
  const affiliateTag = REGIONAL_AFFILIATE_TAGS[amazonDomain] || 
                       process.env.EXPO_PUBLIC_AMAZON_AFFILIATE_TAG || 
                       'glowcheck-20';
  
  return `https://www.${amazonDomain}/gp/aws/cart/add.html?AssociateTag=${affiliateTag}&ASIN.1=${asin}&Quantity.1=1`;
}

export function getLocalizedPrice(basePrice: number, fromCurrency: string, toCurrency: string): string {
  const rates: Record<string, number> = {
    'USD': 1, 'EUR': 0.92, 'GBP': 0.79, 'CAD': 1.35, 'AUD': 1.52,
    'JPY': 149.50, 'INR': 83.12, 'BRL': 4.97, 'MXN': 17.05, 'CNY': 7.24,
    'SGD': 1.34, 'TRY': 32.15, 'AED': 3.67, 'SAR': 3.75, 'SEK': 10.57,
    'PLN': 4.03, 'EGP': 49.12, 'NOK': 10.82, 'DKK': 6.88, 'CHF': 0.88,
    'NZD': 1.68, 'ZAR': 18.65, 'KRW': 1387.50, 'THB': 34.25, 'MYR': 4.47,
    'IDR': 15830.0, 'PHP': 56.42, 'VND': 25368.0, 'CLP': 976.50, 'ARS': 1012.0,
    'COP': 4312.0, 'PEN': 3.74, 'ILS': 3.64, 'QAR': 3.64, 'KWD': 0.31,
    'BHD': 0.38, 'OMR': 0.39, 'JOD': 0.71, 'LBP': 89500.0, 'PKR': 278.50,
    'BDT': 110.25, 'LKR': 292.0, 'NPR': 133.0, 'HKD': 7.78, 'TWD': 32.15,
    'UAH': 41.25, 'RUB': 97.50, 'KZT': 496.0, 'RON': 4.58, 'CZK': 23.42,
    'HUF': 362.0, 'BGN': 1.80, 'HRK': 6.93, 'ISK': 137.50, 'NGN': 1570.0,
    'KES': 129.0, 'GHS': 15.82, 'MAD': 9.95, 'TND': 3.13, 'DZD': 134.0,
  };

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  const convertedPrice = (basePrice / fromRate) * toRate;
  
  const currencySymbols: Record<string, string> = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'C$', 'AUD': 'A$',
    'JPY': '¥', 'INR': '₹', 'BRL': 'R$', 'MXN': 'MX$', 'CNY': '¥',
    'SGD': 'S$', 'TRY': '₺', 'AED': 'د.إ', 'SAR': '﷼', 'SEK': 'kr',
    'PLN': 'zł', 'EGP': 'E£', 'NOK': 'kr', 'DKK': 'kr', 'CHF': 'Fr',
    'NZD': 'NZ$', 'ZAR': 'R', 'KRW': '₩', 'THB': '฿', 'MYR': 'RM',
    'IDR': 'Rp', 'PHP': '₱', 'VND': '₫', 'CLP': '$', 'ARS': '$',
    'COP': '$', 'PEN': 'S/', 'ILS': '₪', 'QAR': 'ر.ق', 'KWD': 'د.ك',
    'BHD': 'د.ب', 'OMR': 'ر.ع.', 'JOD': 'د.ا', 'LBP': 'ل.ل', 'PKR': '₨',
    'BDT': '৳', 'LKR': 'Rs', 'NPR': 'रू', 'HKD': 'HK$', 'TWD': 'NT$',
    'UAH': '₴', 'RUB': '₽', 'KZT': '₸', 'RON': 'lei', 'CZK': 'Kč',
    'HUF': 'Ft', 'BGN': 'лв', 'HRK': 'kn', 'ISK': 'kr', 'NGN': '₦',
    'KES': 'KSh', 'GHS': '₵', 'MAD': 'د.م.', 'TND': 'د.ت', 'DZD': 'د.ج',
  };

  const symbol = currencySymbols[toCurrency] || '$';
  return `${symbol}${convertedPrice.toFixed(2)}`;
}
