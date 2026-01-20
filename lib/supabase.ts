import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPERBASE_ANON_KEY || 'placeholder-key';

const hasCorrectVars = process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const hasLegacyVars = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPERBASE_ANON_KEY;

if (!hasCorrectVars && hasLegacyVars) {
  console.warn('⚠️ TYPO DETECTED in environment variables!');
  console.warn('Found: EXPO_PUBLIC_SUPERBASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_URL');
  console.warn('Should be: EXPO_PUBLIC_SUPABASE_ANON_KEY and EXPO_PUBLIC_SUPABASE_URL');
  console.warn('Please fix the typos in your .env file!');
} else if (!hasCorrectVars && !hasLegacyVars) {
  console.warn('Supabase environment variables not configured.');
}

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');

// Custom storage wrapper that handles errors gracefully
// Note: We don't check expires_at here because that's the access token expiration.
// Supabase will automatically refresh the access token using the refresh token.
// Only Supabase should decide when to clear sessions based on refresh token validity.
const safeStorage = {
  async getItem(key: string) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.warn('Storage getItem error:', error);
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('Storage setItem error:', error);
    }
  },
  async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('Storage removeItem error:', error);
    }
  },
};

// Enhanced configuration with better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    debug: __DEV__,
    // Enable automatic token refresh
    // Supabase will automatically refresh access tokens before they expire
    // Refresh tokens typically last for weeks/months, not hours
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': `glow-app-${Platform.OS}`,
    },
  },
  db: {
    schema: 'public',
  },
});

// Add connection test function
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Supabase connection...');
    
    // Simple health check - just try to get the current session
    const { error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('Supabase connection test successful');
    return true;
  } catch (error: any) {
    console.error('Supabase connection test exception:', error.message || error);
    return false;
  }
};