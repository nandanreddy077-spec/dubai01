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

// Enhanced configuration with better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Enable URL detection for OAuth redirects
    debug: __DEV__,
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