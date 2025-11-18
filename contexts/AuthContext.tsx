import { Session, User } from '@supabase/supabase-js';
import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { supabase, testSupabaseConnection } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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

      try {
        // Test connection first
        console.log('Testing Supabase connection in AuthContext...');
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
      }
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

  return useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }), [user, session, loading, signUp, signIn, signOut, resetPassword]);
});