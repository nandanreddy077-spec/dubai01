import { Session, User } from '@supabase/supabase-js';
import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform, AppState, AppStateStatus } from 'react-native';
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
          
          // Try to refresh the session before clearing it
          // This handles cases where access token expired but refresh token is still valid
          if (error.message?.includes('JWT') || error.status === 400) {
            console.log('🔄 Attempting to refresh session...');
            try {
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
              
              if (!refreshError && refreshedSession) {
                console.log('✅ Session refreshed successfully');
                if (mounted) {
                  setSession(refreshedSession);
                  setUser(refreshedSession.user);
                  setLoading(false);
                }
                return;
              }
              
              // If refresh failed, check if it's a real refresh token error
              if (refreshError && (
                refreshError.message?.includes('Invalid Refresh Token') || 
                refreshError.message?.includes('Refresh Token Not Found')
              )) {
                console.log('🔄 Refresh token is invalid, clearing session...');
                try {
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
                
                if (mounted) {
                  setSession(null);
                  setUser(null);
                  setLoading(false);
                }
                return;
              }
            } catch (refreshException) {
              console.log('Error during refresh attempt:', refreshException);
            }
          }
          
          // Handle refresh token errors (only if refresh attempt failed)
          if (error.message?.includes('Invalid Refresh Token') || 
              error.message?.includes('Refresh Token Not Found')) {
            console.log('🔄 Clearing invalid session...');
            try {
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
          
          // For other errors, try to refresh session before giving up
          console.log('⚠️ Session error, attempting to refresh before giving up...');
          try {
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError && refreshedSession) {
              console.log('✅ Session restored after error');
              if (mounted) {
                setSession(refreshedSession);
                setUser(refreshedSession.user);
                setLoading(false);
              }
              return;
            }
            
            // Only clear if refresh token is truly invalid
            if (refreshError && (
              refreshError.message?.includes('Invalid Refresh Token') || 
              refreshError.message?.includes('Refresh Token Not Found')
            )) {
              console.log('🔄 Refresh token invalid, clearing session...');
              try {
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
              } catch (clearError) {
                console.warn('Error clearing session:', clearError);
              }
              
              if (mounted) {
                setSession(null);
                setUser(null);
                setLoading(false);
              }
              return;
            }
            
            // If refresh failed but it's not a refresh token error, keep trying with existing session
            console.log('⚠️ Refresh failed but not a token error, keeping existing session state');
          } catch (refreshException) {
            console.log('Error during refresh attempt:', refreshException);
            // Don't clear on refresh exception - might be temporary
          }
          
          // Continue with existing session if available, or null if truly no session
          if (mounted) {
            // Try to get session one more time
            const { data: { session: finalSession } } = await supabase.auth.getSession();
            setSession(finalSession);
            setUser(finalSession?.user ?? null);
            setLoading(false);
          }
          return; // Don't continue to set session below since we handled error case
        }
        
        // No error - set the session normally
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error: any) {
        console.log('Auth init exception:', error.message);
        // Don't clear session on exception - try to restore it instead
        try {
          // Try to get session from storage
          const { data: { session: restoredSession }, error: restoreError } = await supabase.auth.getSession();
          
          if (!restoreError && restoredSession) {
            console.log('✅ Session restored after exception');
            if (mounted) {
              setSession(restoredSession);
              setUser(restoredSession.user);
              setLoading(false);
            }
            return;
          }
          
          // Try to refresh if we have a refresh token
          if (restoreError) {
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError && refreshedSession) {
              console.log('✅ Session refreshed after exception');
              if (mounted) {
                setSession(refreshedSession);
                setUser(refreshedSession.user);
                setLoading(false);
              }
              return;
            }
            
            // Only clear if refresh token is truly invalid
            if (refreshError && (
              refreshError.message?.includes('Invalid Refresh Token') || 
              refreshError.message?.includes('Refresh Token Not Found')
            )) {
              console.log('🔄 Refresh token invalid after exception, clearing...');
              try {
                await supabase.auth.signOut({ scope: 'local' });
              } catch {}
            }
          }
        } catch (recoveryError) {
          console.log('Error during session recovery:', recoveryError);
          // Don't clear - might be temporary network issue
        }
        
        if (mounted) {
          // Don't set to null unless we're absolutely sure there's no session
          // Let the auth state change listener handle it
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

    // Add AppState listener to refresh session when app comes to foreground
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && mounted) {
        console.log('📱 App came to foreground, checking session...');
        try {
          // Get current session
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          
          // If we have a session but it might be expired, try to refresh it
          if (currentSession) {
            // Check if access token is expired (expires_at is in seconds)
            const expiresAt = currentSession.expires_at ? currentSession.expires_at * 1000 : null;
            const now = Date.now();
            
            // If token expires in less than 5 minutes, refresh it proactively
            if (expiresAt && (expiresAt - now) < 5 * 60 * 1000) {
              console.log('🔄 Access token expiring soon, refreshing...');
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
              
              if (!refreshError && refreshedSession && mounted) {
                console.log('✅ Session refreshed on foreground');
                setSession(refreshedSession);
                setUser(refreshedSession.user);
              } else if (refreshError) {
                console.log('⚠️ Refresh failed on foreground:', refreshError.message);
                // Only clear if refresh token is actually invalid - retry a few times first
                if (refreshError.message?.includes('Invalid Refresh Token') || 
                    refreshError.message?.includes('Refresh Token Not Found')) {
                  // Double-check by trying one more time after a short delay
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  const { data: { session: retrySession }, error: retryError } = await supabase.auth.refreshSession();
                  
                  if (!retryError && retrySession && mounted) {
                    console.log('✅ Session restored on retry');
                    setSession(retrySession);
                    setUser(retrySession.user);
                  } else if (retryError && (
                    retryError.message?.includes('Invalid Refresh Token') || 
                    retryError.message?.includes('Refresh Token Not Found')
                  )) {
                    // Only clear after confirmed failure
                    console.log('🔄 Refresh token confirmed invalid, clearing session...');
                    await supabase.auth.signOut({ scope: 'local' });
                    if (mounted) {
                      setSession(null);
                      setUser(null);
                    }
                  } else {
                    // Network or other temporary error - keep existing session
                    console.log('⚠️ Temporary error, keeping existing session');
                  }
                } else {
                  // Not a refresh token error - might be network, keep existing session
                  console.log('⚠️ Non-token error, keeping existing session');
                }
              }
            } else {
              // Session is still valid, just update state
              if (mounted) {
                setSession(currentSession);
                setUser(currentSession.user);
              }
            }
          } else if (sessionError) {
            // No session or error - try to refresh if we have a refresh token stored
            console.log('⚠️ No session on foreground, attempting refresh...');
            try {
              const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
              
              if (!refreshError && refreshedSession && mounted) {
                console.log('✅ Session restored on foreground');
                setSession(refreshedSession);
                setUser(refreshedSession.user);
              } else if (refreshError) {
                // Retry once more before giving up
                if (refreshError.message?.includes('Invalid Refresh Token') || 
                    refreshError.message?.includes('Refresh Token Not Found')) {
                  console.log('⚠️ Refresh token error, retrying once...');
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  const { data: { session: retrySession }, error: retryError } = await supabase.auth.refreshSession();
                  
                  if (!retryError && retrySession && mounted) {
                    console.log('✅ Session restored on retry');
                    setSession(retrySession);
                    setUser(retrySession.user);
                  } else if (retryError && (
                    retryError.message?.includes('Invalid Refresh Token') || 
                    retryError.message?.includes('Refresh Token Not Found')
                  )) {
                    // Only clear after confirmed failure
                    console.log('🔄 Refresh token confirmed invalid, clearing session...');
                    await supabase.auth.signOut({ scope: 'local' });
                    if (mounted) {
                      setSession(null);
                      setUser(null);
                    }
                  } else {
                    // Network or other temporary error - try to get existing session
                    const { data: { session: existingSession } } = await supabase.auth.getSession();
                    if (existingSession && mounted) {
                      setSession(existingSession);
                      setUser(existingSession.user);
                    }
                  }
                } else {
                  // Not a refresh token error - might be network, try to get existing session
                  const { data: { session: existingSession } } = await supabase.auth.getSession();
                  if (existingSession && mounted) {
                    setSession(existingSession);
                    setUser(existingSession.user);
                  }
                }
              }
            } catch (refreshException) {
              console.log('Error refreshing on foreground:', refreshException);
            }
          }
        } catch (error) {
          console.log('Error checking session on foreground:', error);
        }
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      appStateSubscription?.remove();
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

      // Use the app's deep link scheme for redirect - must match Supabase Redirect URLs exactly
      const redirectTo = isStandalone ? 'glowcheck://auth/callback' : makeRedirectUri({
        scheme: 'glowcheck',
        path: 'auth/callback',
      });

      console.log('[Auth] Starting Google OAuth');
      console.log('[Auth] Platform:', Platform.OS);
      console.log('[Auth] ExecutionEnvironment:', executionEnv);
      console.log('[Auth] Supabase URL:', supabaseUrl);
      console.log('[Auth] redirectTo:', redirectTo);
      console.log('[Auth] IMPORTANT: Supabase Auth → URL Configuration → Redirect URLs must include:', redirectTo);
      console.log('[Auth] Google Cloud Console (Web client) Authorized redirect URI must be:', `${supabaseUrl.replace(/\/$/, '')}/auth/v1/callback`);

      // Complete any pending auth session first
      WebBrowser.maybeCompleteAuthSession();

      // Don't use skipBrowserRedirect - let Supabase handle OAuth flow completely
      // OAuth provider redirects to Supabase callback URL, Supabase processes it,
      // then Supabase redirects to our app with tokens
      const { data, error: urlError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
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
        if (typeof window !== 'undefined') {
          window.location.href = oAuthUrl;
        }
        return { error: null };
      }

      console.log('[Auth] Opening OAuth URL...');
      console.log('[Auth] OAuth URL preview:', oAuthUrl.substring(0, 120) + '...');

      // Expect the app deep link as the final redirect (after Supabase processes OAuth)
      const result = await WebBrowser.openAuthSessionAsync(oAuthUrl, redirectTo);

      if (result.type === 'success') {
        const callbackUrl = (result as { type: 'success'; url: string }).url;
        console.log('[Auth] OAuth callback received:', callbackUrl);

        // Parse the callback URL
        const parsedUrl = Linking.parse(callbackUrl);
        const queryParams = (parsedUrl.queryParams ?? {}) as Record<string, string | string[] | undefined>;

        // Check for hash parameters (some OAuth flows use hash fragments)
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

        // Check for errors first
        const errorParam = (queryParams.error as string | undefined) ?? hashParams.error;
        const errorDescription =
          (queryParams.error_description as string | undefined) ??
          hashParams.error_description;

        if (errorParam) {
          console.error('[Auth] OAuth error:', errorParam, errorDescription);
          return { error: { message: errorDescription || errorParam } };
        }

        // Extract code or tokens
        const code = (queryParams.code as string | undefined) ?? hashParams.code;
        const accessToken = (queryParams.access_token as string | undefined) ?? hashParams.access_token;
        const refreshToken = (queryParams.refresh_token as string | undefined) ?? hashParams.refresh_token;

        // If we have an access token directly (implicit flow), set session
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

        // If we have a code, Supabase should have processed it at its callback URL
        // Wait a moment and check if session was auto-created
        if (code) {
          console.log('[Auth] Code found - Supabase should have processed it, checking session...');
          // Wait for Supabase to process the session
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (session) {
            console.log('[Auth] ✅ Google sign-in successful (session auto-created)');
            return { error: null };
          }
          
          if (sessionError) {
            console.error('[Auth] getSession error:', sessionError);
            return { error: sessionError };
          }
          
          // If no session found, return error
          return { error: { message: 'OAuth callback received but session not established. Please try again.' } };
        }

        // If no code or token, wait a bit for Supabase to auto-detect the session
        console.log('[Auth] No code or token found, waiting for auto-detection...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Auth] getSession error:', sessionError);
          return { error: sessionError };
        }

        if (session) {
          console.log('[Auth] ✅ Google sign-in successful (auto-detected session)');
          return { error: null };
        }

        console.error('[Auth] No code, token, or session found in callback URL');
        return {
          error: {
            message:
              'Google sign-in completed, but no authorization code was returned. Please verify your Supabase Redirect URLs and Google authorized redirect URIs.',
          },
        };
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

      const executionEnv = Constants.executionEnvironment;
      const isStandalone = executionEnv === ExecutionEnvironment.Standalone;

      // Use the app's deep link scheme for redirect - must match Supabase Redirect URLs exactly
      const redirectTo = isStandalone ? 'glowcheck://auth/callback' : makeRedirectUri({
        scheme: 'glowcheck',
        path: 'auth/callback',
      });

      console.log('[Auth] Starting Apple OAuth');
      console.log('[Auth] Platform:', Platform.OS);
      console.log('[Auth] ExecutionEnvironment:', executionEnv);
      console.log('[Auth] redirectTo:', redirectTo);
      console.log('[Auth] IMPORTANT: Supabase Auth → URL Configuration → Redirect URLs must include redirectTo above');

      // Complete any pending auth session first
      WebBrowser.maybeCompleteAuthSession();

      // Don't use skipBrowserRedirect - let Supabase handle OAuth flow completely
      // OAuth provider redirects to Supabase callback URL, Supabase processes it,
      // then Supabase redirects to our app with tokens
      const { data, error: urlError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
        },
      });

      if (urlError) {
        console.error('[Auth] Error getting Apple OAuth URL:', urlError);
        return { error: urlError };
      }

      const oAuthUrl = data?.url;
      if (!oAuthUrl) {
        return { error: { message: 'Failed to start Apple sign-in (missing OAuth URL).' } };
      }

      console.log('[Auth] Opening OAuth URL...');
      console.log('[Auth] OAuth URL preview:', oAuthUrl.substring(0, 120) + '...');

      // Expect the app deep link as the final redirect (after Supabase processes OAuth)
      const result = await WebBrowser.openAuthSessionAsync(oAuthUrl, redirectTo);

      if (result.type === 'success') {
        const callbackUrl = (result as { type: 'success'; url: string }).url;
        console.log('[Auth] OAuth callback received:', callbackUrl);

        // Parse the callback URL
        const parsedUrl = Linking.parse(callbackUrl);
        const queryParams = (parsedUrl.queryParams ?? {}) as Record<string, string | string[] | undefined>;

        // Check for hash parameters (some OAuth flows use hash fragments)
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

        // Check for errors first
        const errorParam = (queryParams.error as string | undefined) ?? hashParams.error;
        const errorDescription =
          (queryParams.error_description as string | undefined) ??
          hashParams.error_description;

        if (errorParam) {
          console.error('[Auth] OAuth error:', errorParam, errorDescription);
          return { error: { message: errorDescription || errorParam } };
        }

        // Extract code or tokens
        const code = (queryParams.code as string | undefined) ?? hashParams.code;
        const accessToken = (queryParams.access_token as string | undefined) ?? hashParams.access_token;
        const refreshToken = (queryParams.refresh_token as string | undefined) ?? hashParams.refresh_token;

        // If we have an access token directly (implicit flow), set session
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

          console.log('[Auth] ✅ Apple sign-in successful');
          return { error: null };
        }

        // If we have a code, Supabase should have processed it at its callback URL
        // Wait a moment and check if session was auto-created
        if (code) {
          console.log('[Auth] Code found - Supabase should have processed it, checking session...');
          // Wait for Supabase to process the session
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (session) {
            console.log('[Auth] ✅ Apple sign-in successful (session auto-created)');
            return { error: null };
          }
          
          if (sessionError) {
            console.error('[Auth] getSession error:', sessionError);
            return { error: sessionError };
          }
          
          // If no session found, return error
          return { error: { message: 'OAuth callback received but session not established. Please try again.' } };
        }

        // If no code or token, wait a bit for Supabase to auto-detect the session
        console.log('[Auth] No code or token found, waiting for auto-detection...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Auth] getSession error:', sessionError);
          return { error: sessionError };
        }

        if (session) {
          console.log('[Auth] ✅ Apple sign-in successful (auto-detected session)');
          return { error: null };
        }

        console.error('[Auth] No code, token, or session found in callback URL');
        return {
          error: {
            message:
              'Apple sign-in completed, but no authorization code was returned. Please verify your Supabase Redirect URLs and Apple return URLs.',
          },
        };
      }

      if (result.type === 'cancel') {
        console.log('[Auth] User cancelled Apple sign-in');
        return { error: { message: 'Sign-in cancelled' } };
      }

      if (result.type === 'dismiss') {
        console.log('[Auth] Apple sign-in dismissed');
        return { error: { message: 'Sign-in dismissed' } };
      }

      console.error('[Auth] Unknown OAuth result type:', result.type);
      return { error: { message: 'Authentication failed. Please try again.' } };
    } catch (error: any) {
      console.error('[Auth] Apple sign-in exception:', error);
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