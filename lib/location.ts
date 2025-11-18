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

export function formatAmazonAffiliateLink(
  baseAffiliateTag: string,
  searchQuery: string,
  country: LocationInfo
): string {
  const searchEncoded = encodeURIComponent(searchQuery);
  
  return `https://www.${country.amazonDomain}/s?k=${searchEncoded}&tag=${baseAffiliateTag}`;
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
