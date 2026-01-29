import { Session, User } from '@supabase/supabase-js';
import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
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

WebBrowser.maybeCompleteAuthSession();

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

      try {
        // Get initial session with comprehensive error handling
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Session error detected:', error.message);
          
          // Handle any refresh token errors by clearing session
          if (error.message?.includes('Invalid Refresh Token') || 
              error.message?.includes('Refresh Token Not Found') ||
              error.message?.includes('refresh_token') ||
              error.message?.includes('JWT') ||
              error.status === 400) {
            console.log('🔄 Clearing invalid session...');
            try {
              // Clear all auth-related storage
              await supabase.auth.signOut({ scope: 'local' });
              const allKeys = await AsyncStorage.getAllKeys();
              const authKeys = allKeys.filter(key => 
                key.includes('supabase') || 
                key.includes('auth') ||
                key.includes('sb-') ||
                key.startsWith('@supabase')
              );
              if (authKeys.length > 0) {
                await AsyncStorage.multiRemove(authKeys);
              }
              console.log('✅ Session cleared');
            } catch (clearError) {
              console.warn('Error clearing session:', clearError);
            }
            
            // Continue with no session
            if (mounted) {
              setSession(null);
              setUser(null);
              setLoading(false);
            }
            return;
          }
          
          // Network errors - retry
          if (error.message?.includes('Failed to fetch') && retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying... (${retryCount}/${maxRetries})`);
            setTimeout(() => {
              if (mounted) initializeAuth();
            }, 2000 * retryCount);
            return;
          }
          
          // For other errors, continue without session
          console.log('Continuing without session due to error');
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error: any) {
        console.log('Auth init exception:', error.message);
        // Clear session on any exception
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {}
        
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes with error handling
    let subscription: any;
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email || 'no user');
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            
            if (event === 'SIGNED_IN' && session) {
              console.log('✅ User signed in:', session.user.email);
            } else if (event === 'SIGNED_OUT') {
              console.log('User signed out, clearing storage...');
              try {
                const allKeys = await AsyncStorage.getAllKeys();
                const authKeys = allKeys.filter(key => 
                  key.includes('supabase') || 
                  key.includes('auth') ||
                  key.includes('sb-') ||
                  key.startsWith('@supabase')
                );
                if (authKeys.length > 0) {
                  await AsyncStorage.multiRemove(authKeys);
                }
              } catch (err) {
                console.warn('Error clearing storage:', err);
              }
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('✅ Token refreshed');
            } else if (event === 'USER_UPDATED') {
              console.log('User updated');
            }
          }
        }
      );
      subscription = data.subscription;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
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

      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        return { error: { message: 'Supabase is not configured. Please set up your Supabase credentials.' } };
      }

      const executionEnv = Constants.executionEnvironment;
      const isStandalone = executionEnv === ExecutionEnvironment.Standalone;

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

      const nativeRedirectTo = 'glowcheck://auth/callback';
      const expoRedirectTo = makeRedirectUri({
        scheme: 'glowcheck',
        path: 'auth/callback',
      });

      const redirectTo = isStandalone ? nativeRedirectTo : expoRedirectTo;

      console.log('[Auth] Starting Google OAuth');
      console.log('[Auth] Platform:', Platform.OS);
      console.log('[Auth] ExecutionEnvironment:', executionEnv);
      console.log('[Auth] Supabase URL:', supabaseUrl);
      console.log('[Auth] redirectTo:', redirectTo);
      console.log('[Auth] IMPORTANT: Supabase Auth → URL Configuration → Redirect URLs must include redirectTo above');
      console.log('[Auth] Google Cloud Console (Web client) Authorized redirect URI must be:', `${supabaseUrl.replace(/\/$/, '')}/auth/v1/callback`);

      const skipBrowserRedirect = Platform.OS !== 'web';

      const { data, error: urlError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (urlError) {
        console.error('[Auth] Error getting Google OAuth URL:', urlError);
        return { error: urlError };
      }

      const oAuthUrl = data?.url;
      if (!oAuthUrl) {
        return { error: { message: 'Failed to start Google sign-in (missing OAuth URL).' } };
      }

      if (Platform.OS === 'web') {
        console.log('[Auth] Web: letting browser redirect to complete OAuth');
        return { error: null };
      }

      console.log('[Auth] Opening OAuth URL...');
      console.log('[Auth] OAuth URL preview:', oAuthUrl.substring(0, 120) + '...');

      const result = await WebBrowser.openAuthSessionAsync(oAuthUrl, redirectTo);

      if (result.type === 'success') {
        const callbackUrl = (result as { type: 'success'; url: string }).url;
        console.log('[Auth] OAuth callback received:', callbackUrl);

        const parsedUrl = Linking.parse(callbackUrl);

        const queryParams = (parsedUrl.queryParams ?? {}) as Record<string, string | string[] | undefined>;

        const hashIndex = callbackUrl.indexOf('#');
        const hashParams: Record<string, string> = {};
        if (hashIndex >= 0) {
          const hash = callbackUrl.slice(hashIndex + 1);
          const pairs = hash.split('&').map((p) => p.trim()).filter(Boolean);
          for (const pair of pairs) {
            const [k, v] = pair.split('=');
            if (k) hashParams[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
          }
        }

        const errorParam = (queryParams.error as string | undefined) ?? hashParams.error;
        const errorDescription =
          (queryParams.error_description as string | undefined) ??
          hashParams.error_description ??
          hashParams.error_description;

        if (errorParam) {
          console.error('[Auth] OAuth error:', errorParam, errorDescription);
          return { error: { message: errorDescription || errorParam } };
        }

        const code = (queryParams.code as string | undefined) ?? hashParams.code;
        const accessToken = (queryParams.access_token as string | undefined) ?? hashParams.access_token;
        const refreshToken = (queryParams.refresh_token as string | undefined) ?? hashParams.refresh_token;

        if (accessToken) {
          console.log('[Auth] Setting session from access_token (implicit grant)...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });
          if (sessionError) {
            console.error('[Auth] setSession error:', sessionError);
            return { error: sessionError };
          }

          console.log('[Auth] ✅ Google sign-in successful');
          return { error: null };
        }

        if (!code) {
          console.error('[Auth] No code or access_token found in callback URL');
          return {
            error: {
              message:
                'Google sign-in completed, but no authorization code was returned. Please verify your Supabase Redirect URLs and Google authorized redirect URIs.',
            },
          };
        }

        console.log('[Auth] Exchanging code for Supabase session...');
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('[Auth] exchangeCodeForSession error:', exchangeError);
          return { error: exchangeError };
        }

        console.log('[Auth] ✅ Google sign-in successful');
        return { error: null };
      }

      if (result.type === 'cancel') {
        console.log('[Auth] User cancelled Google sign-in');
        return { error: { message: 'Sign-in cancelled' } };
      }

      if (result.type === 'dismiss') {
        console.log('[Auth] Google sign-in dismissed');
        return { error: { message: 'Sign-in dismissed' } };
      }

      console.error('[Auth] Unknown OAuth result type:', result.type);
      return { error: { message: 'Authentication failed. Please try again.' } };
    } catch (error: any) {
      console.error('[Auth] Google sign-in exception:', error);
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