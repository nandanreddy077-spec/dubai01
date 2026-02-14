import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { validateAndCleanStorage } from "@/lib/storage-cleanup";
import { UserProvider } from "@/contexts/UserContext";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import { SkincareProvider } from "@/contexts/SkincareContext";
import { StyleProvider } from "@/contexts/StyleContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CommunityProvider } from "@/contexts/CommunityContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { ReferralProvider } from "@/contexts/ReferralContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

import * as Notifications from 'expo-notifications';
import { initializeNotifications, startDailyNotifications, type GlowNotificationData } from "@/lib/notifications";
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notifications are handled in the simplified notification system
// TrialStarter removed - trials now only start through RevenueCat purchase flow


SplashScreen.preventAutoHideAsync();

// Optimized QueryClient configuration for scalability
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - cache for 30 minutes
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
      refetchOnReconnect: true, // Refetch when connection is restored
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="trial-offer" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="analysis-loading" options={{ headerShown: false }} />
      <Stack.Screen name="analysis-results" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="routine-goal-setup" options={{ headerShown: true, title: "Set Your Goals", headerBackTitle: "Back" }} />
      <Stack.Screen name="skincare-plan-selection" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="skincare-plan-overview" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="style-check" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="occasion-selection" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="style-loading" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="style-results" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="subscribe" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="privacy-care" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="product-details" options={{ headerShown: true, title: "Product Details", headerBackTitle: "Back" }} />
      <Stack.Screen name="user-profile" options={{ headerShown: false }} />
      <Stack.Screen name="post-detail" options={{ headerShown: false }} />
      <Stack.Screen name="notification-settings" options={{ headerShown: true, title: 'Notification Settings', headerBackTitle: 'Back' }} />
      <Stack.Screen name="ai-advisor" options={{ headerShown: true, headerBackTitle: 'Back' }} />
      <Stack.Screen name="beauty-membership" options={{ headerShown: false }} />
      <Stack.Screen name="plan-selection" options={{ headerShown: true, headerBackTitle: 'Back' }} />
      <Stack.Screen name="promo-code" options={{ headerShown: true, headerBackTitle: 'Back' }} />
      <Stack.Screen name="start-trial" options={{ headerShown: false }} />
      <Stack.Screen name="trends" options={{ headerShown: true, headerBackTitle: 'Back' }} />
      <Stack.Screen name="unlock-glow" options={{ headerShown: true, headerBackTitle: 'Back' }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: true, title: 'Privacy Policy', headerBackTitle: 'Back' }} />
      <Stack.Screen name="terms-of-service" options={{ headerShown: true, title: 'Terms of Service', headerBackTitle: 'Back' }} />
    </Stack>
  );
}



export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // One-time cleanup: Clear old Supabase sessions when switching projects
        const cleanupDone = await AsyncStorage.getItem('@cleanup_done');
        const currentSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const OLD_SUPABASE_URL = 'kvwshebdezzoetmaqndc';
        
        if (!cleanupDone && currentSupabaseUrl && !currentSupabaseUrl.includes(OLD_SUPABASE_URL)) {
          const allKeys = await AsyncStorage.getAllKeys();
          const supabaseKeys = allKeys.filter(key => 
            (key.includes('supabase') || 
            key.includes('auth') ||
            key.includes('sb-') ||
            key.startsWith('@supabase')) &&
            !key.includes('@cleanup_done') &&
            !key.includes('@onboarding_completed')
          );
          
          if (supabaseKeys.length > 0) {
            console.log('🔄 One-time cleanup: Clearing old Supabase cache...');
            await AsyncStorage.multiRemove(supabaseKeys);
            console.log('✅ Cleared old Supabase cache');
          }
          await AsyncStorage.setItem('@cleanup_done', 'true');
        }
        
        // Validate and clean corrupted storage data on app start
        await validateAndCleanStorage();
        console.log('✅ Storage validated and cleaned successfully');
      } catch (error) {
        console.error('❌ Storage cleanup failed:', error);
      } finally {
        await initializeNotifications();
        await startDailyNotifications();
        SplashScreen.hideAsync();
      }
    };
    
    initializeApp();

    // Handle deep links for OAuth redirects
    const handleDeepLink = async (url: string) => {
      console.log('🔗 Deep link received:', url);
      
      // Check if this is an OAuth callback from Supabase
      // Supabase redirects to: https://your-project.supabase.co/auth/v1/callback?code=...
      // We need to extract the code and exchange it
      if (url.includes('/auth/v1/callback') || url.includes('auth/callback') || url.includes('code=') || url.includes('access_token=')) {
        try {
          const parsedUrl = Linking.parse(url);
          
          // Extract code from query params or hash
          let code: string | undefined = parsedUrl.queryParams?.code as string;
          if (!code && url.includes('code=')) {
            const codeMatch = url.match(/[?&#]code=([^&?#]+)/);
            code = codeMatch ? decodeURIComponent(codeMatch[1]) : undefined;
          }
          
          // Extract access token
          let accessToken: string | undefined = parsedUrl.queryParams?.access_token as string;
          if (!accessToken && url.includes('access_token=')) {
            const tokenMatch = url.match(/[?&#]access_token=([^&?#]+)/);
            accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1]) : undefined;
          }
          
          const error = parsedUrl.queryParams?.error as string || 
                       (url.match(/[?&#]error=([^&?#]+)/)?.[1]);
          const errorDescription = parsedUrl.queryParams?.error_description as string;
          
          console.log('📋 OAuth params:', { 
            code: code ? 'present' : 'missing', 
            accessToken: accessToken ? 'present' : 'missing', 
            error,
            urlPreview: url.substring(0, 150)
          });
          
          if (error) {
            console.error('❌ OAuth error in deep link:', error, errorDescription);
            return;
          }
          
          if (code) {
            console.log('🔄 Exchanging code for session...');
            // Exchange code for session
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error('❌ Error exchanging code for session:', exchangeError);
            } else {
              console.log('✅ OAuth session established via deep link:', data.session?.user?.email);
            }
          } else if (accessToken) {
            console.log('🔄 Setting session with access token...');
            // Set session with access token
            const refreshToken = parsedUrl.queryParams?.refresh_token as string || 
                               (url.match(/[?&#]refresh_token=([^&?#]+)/)?.[1]) || '';
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) {
              console.error('❌ Error setting session:', sessionError);
            } else {
              console.log('✅ OAuth session established via deep link:', data.session?.user?.email);
            }
          } else {
            // Try to let Supabase handle it automatically (detectSessionInUrl is enabled)
            console.log('⚠️ No code or access_token found, checking if Supabase auto-detected session...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              console.log('✅ Session auto-detected by Supabase:', session.user?.email);
            } else {
              console.log('⚠️ Still no session found - OAuth may have failed');
            }
          }
        } catch (error) {
          console.error('❌ Error handling OAuth deep link:', error);
        }
      }
    };

    // Handle initial URL (if app was opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    const onNotificationTap = (data: unknown) => {
      try {
        const payload = data as GlowNotificationData | undefined;
        const deepLink = payload?.deepLink;
        console.log('[Notifications] tap payload', payload);

        if (deepLink) {
          console.log('[Notifications] navigating to deepLink', deepLink);
          router.push(deepLink as any);
        }
      } catch (e) {
        console.log('[Notifications] onNotificationTap error', e);
      }
    };

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Notifications] received', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Notifications] response', {
        actionIdentifier: response.actionIdentifier,
        data: response.notification.request.content.data,
      });

      const data = response.notification.request.content.data;
      onNotificationTap(data);
    });

    Notifications.getLastNotificationResponseAsync()
      .then((resp) => {
        if (!resp) return;
        console.log('[Notifications] last response', {
          actionIdentifier: resp.actionIdentifier,
          data: resp.notification.request.content.data,
        });
        onNotificationTap(resp.notification.request.content.data);
      })
      .catch((e) => console.log('[Notifications] getLastNotificationResponseAsync error', e));

    return () => {
      subscription.remove();
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <AuthProvider>
              <UserProvider>
                <GamificationProvider>
                  <AnalysisProvider>
                    <SkincareProvider>
                      <StyleProvider>
                        <SubscriptionProvider>
                          <ReferralProvider>
                            <ProductProvider>
                              <GestureHandlerRootView style={styles.container}>
                                <CommunityProvider>
                                  <RootLayoutNav />
                                </CommunityProvider>
                              </GestureHandlerRootView>
                            </ProductProvider>
                          </ReferralProvider>
                        </SubscriptionProvider>
                      </StyleProvider>
                    </SkincareProvider>
                  </AnalysisProvider>
                </GamificationProvider>
              </UserProvider>
            </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
