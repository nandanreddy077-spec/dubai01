import { Session, User } from '@supabase/supabase-js';
import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { supabase, testSupabaseConnection } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const initializeAuth = async () => {
      // Check if Supabase is configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        console.log('Supabase not configured, skipping auth initialization');
        if (mounted) setLoading(false);
        return;
      }

      // Clear old Supabase sessions if switching projects
      const currentSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const OLD_SUPABASE_URL = 'kvwshebdezzoetmaqndc'; // Old project identifier
      
      try {
        // Check if we have cached session from old Supabase
        const allKeys = await AsyncStorage.getAllKeys();
        const supabaseKeys = allKeys.filter(key => 
          key.includes('supabase') || 
          key.includes('auth') ||
          key.includes('sb-') ||
          key.startsWith('@supabase')
        );
        
        // If we find old session data and we're using new Supabase, clear it
        if (supabaseKeys.length > 0 && currentSupabaseUrl && !currentSupabaseUrl.includes(OLD_SUPABASE_URL)) {
          console.log('🔄 Clearing old Supabase session cache...');
          console.log('Current URL:', currentSupabaseUrl);
          console.log('Found cached keys:', supabaseKeys);
          
          // Sign out from any existing session first
          await supabase.auth.signOut();
          
          // Clear all Supabase-related AsyncStorage keys
          await AsyncStorage.multiRemove(supabaseKeys);
          console.log('✅ Cleared old Supabase cache');
        }
      } catch (clearError) {
        console.warn('⚠️ Error clearing old session cache:', clearError);
        // Continue anyway - might not have old cache
      }

      try {
        // Test connection first
        console.log('Testing Supabase connection in AuthContext...');
        console.log('Using Supabase URL:', currentSupabaseUrl);
        const connectionOk = await testSupabaseConnection();
        console.log('Connection test result:', connectionOk);
        
        if (!connectionOk && retryCount < maxRetries) {
          retryCount++;
          console.log(`Connection test failed, retrying... (${retryCount}/${maxRetries})`);
          setTimeout(() => {
            if (mounted) initializeAuth();
          }, 2000 * retryCount); // Exponential backoff
          return;
        }

        // Get initial session with retry logic
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error.message || error);
          if (error.message?.includes('Failed to fetch') && retryCount < maxRetries) {
            retryCount++;
            console.log(`Session fetch failed, retrying... (${retryCount}/${maxRetries})`);
            setTimeout(() => {
              if (mounted) initializeAuth();
            }, 2000 * retryCount);
            return;
          }
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error.message || error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes with error handling
    let subscription: any;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            
            // Handle OAuth redirects
            if (event === 'SIGNED_IN' && session) {
              console.log('User signed in successfully:', session.user.email);
            } else if (event === 'SIGNED_OUT') {
              console.log('User signed out');
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('Token refreshed');
            }
          }
        }
      );
      subscription = data.subscription;
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const maxRetries = 3;
    let retryCount = 0;
    
    const attemptSignUp = async (): Promise<{ error: any }> => {
      try {
        setLoading(true);
        
        // Check if Supabase is properly configured
        if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder')) {
          return { error: { message: 'Supabase is not configured. Please set up your Supabase credentials.' } };
        }
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          // Handle rate limiting specifically
          if (error.message?.includes('For security purposes, you can only request this after')) {
            const match = error.message.match(/(\d+) seconds/);
            const waitTime = match ? parseInt(match[1]) : 60;
            return { 
              error: { 
                ...error, 
                message: `Please wait ${waitTime} seconds before trying again. This is a security measure to prevent spam.`,
                isRateLimit: true,
                waitTime
              } 
            };
          }
          
          // Check if it's a network error and retry
          if ((error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) && retryCount < maxRetries) {
            retryCount++;
            console.log(`Sign up failed, retrying... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            return attemptSignUp();
          }
          console.error('Sign up error:', error);
          return { error };
        }

        console.log('Sign up successful:', data.user?.email);
        return { error: null };
      } catch (error: any) {
        // Check if it's a network error and retry
        if ((error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) && retryCount < maxRetries) {
          retryCount++;
          console.log(`Sign up exception, retrying... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          return attemptSignUp();
        }
        console.error('Sign up exception:', error);
        return { error };
      } finally {
        setLoading(false);
      }
    };
    
    return attemptSignUp();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const maxRetries = 3;
    let retryCount = 0;
    
    const attemptSignIn = async (): Promise<{ error: any }> => {
      try {
        setLoading(true);
        
        // Check if Supabase is properly configured
        if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder')) {
          return { error: { message: 'Supabase is not configured. Please set up your Supabase credentials.' } };
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Handle rate limiting specifically
          if (error.message?.includes('For security purposes, you can only request this after')) {
            const match = error.message.match(/(\d+) seconds/);
            const waitTime = match ? parseInt(match[1]) : 60;
            return { 
              error: { 
                ...error, 
                message: `Please wait ${waitTime} seconds before trying again. This is a security measure to prevent spam.`,
                isRateLimit: true,
                waitTime
              } 
            };
          }
          
          // Check if it's a network error and retry
          if ((error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) && retryCount < maxRetries) {
            retryCount++;
            console.log(`Sign in failed, retrying... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            return attemptSignIn();
          }
          console.error('Sign in error:', error);
          return { error };
        }

        console.log('Sign in successful:', data.user?.email);
        return { error: null };
      } catch (error: any) {
        // Check if it's a network error and retry
        if ((error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) && retryCount < maxRetries) {
          retryCount++;
          console.log(`Sign in exception, retrying... (${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          return attemptSignIn();
        }
        console.error('Sign in exception:', error);
        return { error };
      } finally {
        setLoading(false);
      }
    };
    
    return attemptSignIn();
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Starting sign out process...');
      
      setUser(null);
      setSession(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Supabase sign out successful');
      }
      
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const supabaseKeys = allKeys.filter(key => 
          key.includes('supabase') || 
          key.includes('auth') ||
          key.includes('sb-') ||
          key.startsWith('@supabase')
        );
        
        if (supabaseKeys.length > 0) {
          await AsyncStorage.multiRemove(supabaseKeys);
          console.log('Cleared AsyncStorage session data');
        }
      } catch (storageError) {
        console.warn('Error clearing AsyncStorage:', storageError);
      }
      
      console.log('✅ Sign out completed successfully');
    } catch (error) {
      console.error('Sign out exception:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.error('Reset password error:', error);
        return { error };
      }
      console.log('Reset password email sent to:', email);
      return { error: null };
    } catch (error) {
      console.error('Reset password exception:', error);
      return { error };
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<{ error: any }> => {
    try {
      setLoading(true);
      
      // Check if Supabase is properly configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        return { error: { message: 'Supabase is not configured. Please set up your Supabase credentials.' } };
      }

      // Detect if running in Expo Go
      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
      
      // Determine the appropriate redirect URL based on environment
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      let redirectUrl: string;
      
      if (isExpoGo) {
        // In Expo Go: Use web callback URL
        // We'll extract the code from the callback URL before Supabase processes it
        redirectUrl = `${supabaseUrl}/auth/v1/callback`;
      } else {
        // In production: use glowcheck:// scheme for deep linking
        redirectUrl = 'glowcheck://auth/callback';
      }
      
      console.log('Starting Google OAuth');
      console.log('Environment:', isExpoGo ? 'Expo Go' : 'Production');
      console.log('Redirect URL:', redirectUrl);
      console.log('Supabase URL:', supabaseUrl);
      
      // Get the OAuth URL from Supabase
      const { data, error: urlError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // We handle the browser redirect manually
        },
      });

      if (urlError) {
        console.error('Error getting OAuth URL:', urlError);
        return { error: urlError };
      }

      if (!data?.url) {
        return { error: { message: 'Failed to get OAuth URL' } };
      }

      console.log('Opening OAuth URL in browser...');
      console.log('OAuth URL:', data.url.substring(0, 100) + '...');
      
      // For Expo Go, we need to intercept the callback URL that Google redirects to
      // This will be the Supabase callback URL with the code parameter
      // We'll extract the code before Supabase processes it and tries to redirect
      const expectedCallbackPattern = isExpoGo 
        ? `${supabaseUrl}/auth/v1/callback`  // Match the web callback URL
        : 'glowcheck://auth/callback';        // Match the app scheme
      
      // Open browser and wait for OAuth callback
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        expectedCallbackPattern
      );

      // Handle the OAuth callback result
      if (result.type === 'success') {
        // TypeScript type narrowing: when type is 'success', url is guaranteed to exist
        const callbackUrl = (result as { type: 'success'; url: string }).url;
        console.log('OAuth callback received:', callbackUrl);
        console.log('Callback URL length:', callbackUrl.length);
        console.log('Callback URL starts with http:', callbackUrl.startsWith('http'));
        console.log('Callback URL starts with glowcheck:', callbackUrl.startsWith('glowcheck'));
        
        // Check if this is an error page from Supabase
        if (callbackUrl.includes('error_code') || callbackUrl.includes('unexpected_failure')) {
          console.error('Supabase returned an error page');
          try {
            // Try to parse the error from the page
            const errorMatch = callbackUrl.match(/"msg":\s*"([^"]+)"/);
            const errorMsg = errorMatch ? errorMatch[1] : 'Supabase server error (500)';
            return { error: { message: `Authentication failed: ${errorMsg}. Please check your Supabase configuration.` } };
          } catch {
            return { error: { message: 'Supabase server error (500). Please check your Supabase Google OAuth configuration.' } };
          }
        }
        
        // Parse the callback URL to extract authentication data
        try {
          // For web callback URLs, we need to parse as URL, not as deep link
          let code: string | null = null;
          let accessToken: string | null = null;
          let refreshToken: string | null = null;
          let error: string | null = null;
          let errorDescription: string | null = null;
          
          if (isExpoGo && callbackUrl.startsWith('http')) {
            // Parse as web URL for Expo Go
            // The callback URL should be: https://...supabase.co/auth/v1/callback?code=...
            // We need to extract the code before Supabase processes it
            try {
              const urlObj = new URL(callbackUrl);
              code = urlObj.searchParams.get('code');
              accessToken = urlObj.searchParams.get('access_token');
              refreshToken = urlObj.searchParams.get('refresh_token');
              error = urlObj.searchParams.get('error');
              errorDescription = urlObj.searchParams.get('error_description');
              
              console.log('Extracted from web URL:', { 
                hasCode: !!code, 
                hasToken: !!accessToken, 
                hasError: !!error 
              });
            } catch (urlParseError) {
              console.error('Error parsing web URL:', urlParseError);
              // Try to extract code manually from the URL string
              const codeMatch = callbackUrl.match(/[?&]code=([^&?#]+)/);
              if (codeMatch) {
                code = decodeURIComponent(codeMatch[1]);
                console.log('Extracted code manually from URL');
              }
            }
          } else {
            // Parse as deep link for production
            const parsedUrl = Linking.parse(callbackUrl);
            code = parsedUrl.queryParams?.code as string || null;
            accessToken = parsedUrl.queryParams?.access_token as string || null;
            refreshToken = parsedUrl.queryParams?.refresh_token as string || null;
            error = parsedUrl.queryParams?.error as string || null;
            errorDescription = parsedUrl.queryParams?.error_description as string || null;
            
            console.log('Extracted from deep link:', { 
              hasCode: !!code, 
              hasToken: !!accessToken, 
              hasError: !!error 
            });
          }
          
          // Check for OAuth errors
          if (error) {
            console.error('OAuth error:', error, errorDescription);
            return { error: { message: errorDescription || error } };
          }
          
          // Exchange authorization code for session (preferred method)
          if (code) {
            console.log('Exchanging authorization code for session...');
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('Error exchanging code for session:', exchangeError);
              return { error: exchangeError };
            }
            
            console.log('✅ Google sign-in successful (via code exchange)');
            return { error: null };
          }
          
          // Fallback: Use access token and refresh token directly
          if (accessToken && refreshToken) {
            console.log('Setting session with tokens...');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              console.error('Error setting session:', sessionError);
              return { error: sessionError };
            }
            
            console.log('✅ Google sign-in successful (via tokens)');
            return { error: null };
          }
          
          // Try to extract tokens from URL hash fragment (some OAuth flows use this)
          const hashMatch = callbackUrl.match(/#access_token=([^&]+).*refresh_token=([^&]+)/);
          if (hashMatch) {
            const [, token, refresh] = hashMatch;
            console.log('Setting session from hash fragment...');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: decodeURIComponent(token),
              refresh_token: decodeURIComponent(refresh),
            });
            
            if (sessionError) {
              console.error('Error setting session from hash:', sessionError);
              return { error: sessionError };
            }
            
            console.log('✅ Google sign-in successful (via hash fragment)');
            return { error: null };
          }
          
          // If we reach here, no authentication data was found
          console.error('No authentication data found in callback URL');
          return { error: { message: 'No authentication code or token found in callback URL. Please try again.' } };
          
        } catch (parseError: any) {
          console.error('Error parsing callback URL:', parseError);
          return { error: { message: `Failed to parse OAuth callback: ${parseError.message || 'Unknown error'}` } };
        }
      } 
      
      // Handle user cancellation
      else if (result.type === 'cancel') {
        console.log('User cancelled Google sign-in');
        return { error: { message: 'Sign-in cancelled' } };
      } 
      
      // Handle browser dismissal
      else if (result.type === 'dismiss') {
        console.log('Google sign-in dismissed');
        return { error: { message: 'Sign-in dismissed' } };
      }
      
      // Unknown result type
      console.error('Unknown OAuth result type:', result.type);
      return { error: { message: 'Authentication failed. Please try again.' } };
    } catch (error: any) {
      console.error('Google sign-in exception:', error);
      return { error: { message: error.message || 'Failed to sign in with Google' } };
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        return { error: { message: 'Supabase is not configured. Please set up your Supabase credentials.' } };
      }

      // Apple Sign In is only available on iOS
      if (Platform.OS !== 'ios') {
        return { error: { message: 'Apple Sign In is only available on iOS devices.' } };
      }

      // Use Supabase callback URL - Supabase handles the OAuth flow
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const redirectUrl = `${supabaseUrl}/auth/v1/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Apple sign in error:', error);
        return { error };
      }

      if (data?.url) {
        // Complete any pending auth session first
        WebBrowser.maybeCompleteAuthSession();
        
        // Open the OAuth URL - Supabase will redirect back to redirectUrl with session
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success') {
          // Extract the URL from the result
          const url = result.url;
          if (url) {
            // Parse the URL to get the code or access_token
            const parsedUrl = Linking.parse(url);
            const code = parsedUrl.queryParams?.code as string;
            const accessToken = parsedUrl.queryParams?.access_token as string;
            const errorParam = parsedUrl.queryParams?.error as string;
            
            if (errorParam) {
              return { error: { message: `Authentication error: ${errorParam}` } };
            }
            
            if (code) {
              const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              if (exchangeError) {
                console.error('Error exchanging code for session:', exchangeError);
                return { error: exchangeError };
              }
            } else if (accessToken) {
              // If we have an access token directly, set the session
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: parsedUrl.queryParams?.refresh_token as string || '',
              });
              if (sessionError) {
                console.error('Error setting session:', sessionError);
                return { error: sessionError };
              }
            } else {
              // Wait for auth state change to pick up the session
              // The redirect URL should contain the session info
              await new Promise(resolve => setTimeout(resolve, 2000));
              // Check if we have a session now
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) {
                return { error: { message: 'Failed to establish session. Please try again.' } };
              }
            }
          } else {
            // Wait for auth state change
            await new Promise(resolve => setTimeout(resolve, 2000));
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              return { error: { message: 'Failed to establish session. Please try again.' } };
            }
          }
        } else if (result.type === 'cancel') {
          return { error: { message: 'Authentication cancelled' } };
        } else {
          return { error: { message: 'Authentication failed. Please try again.' } };
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('Apple sign in exception:', error);
      return { error: { message: error.message || 'Failed to sign in with Apple' } };
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
  }), [user, session, loading, signUp, signIn, signInWithGoogle, signInWithApple, signOut, resetPassword]);
});