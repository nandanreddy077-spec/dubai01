import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import { paymentService, PRODUCT_IDS, trackPurchaseEvent, trackTrialStartEvent } from '@/lib/payments';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionState {
  isPremium: boolean;
  trialStartedAt?: string;
  trialEndsAt?: string;
  subscriptionType?: 'monthly' | 'yearly';
  subscriptionPrice?: number;
  nextBillingDate?: string;
  scanCount: number;
  maxScansInTrial: number;
  hasStartedTrial: boolean;
  purchaseToken?: string;
  originalTransactionId?: string;
}

export interface SubscriptionContextType {
  state: SubscriptionState;
  inTrial: boolean;
  daysLeft: number;
  hoursLeft: number;
  canScan: boolean;
  scansLeft: number;
  isTrialExpired: boolean;
  canViewResults: boolean;
  needsPremium: boolean;
  startLocalTrial: (days?: number) => Promise<void>;
  setPremium: (value: boolean, type?: 'monthly' | 'yearly') => Promise<void>;
  setSubscriptionData: (data: Partial<SubscriptionState>) => Promise<void>;
  incrementScanCount: () => Promise<void>;
  reset: () => Promise<void>;
  processInAppPurchase: (type: 'monthly' | 'yearly') => Promise<{ success: boolean; purchaseToken?: string; originalTransactionId?: string; error?: string; cancelled?: boolean; }>;
}

const STORAGE_KEY = 'glowcheck_subscription_state';

const DEFAULT_STATE: SubscriptionState = {
  isPremium: true, // All features free - no monetization
  scanCount: 0,
  maxScansInTrial: Infinity, // Unlimited scans
  hasStartedTrial: false,
};

export const [SubscriptionProvider, useSubscription] = createContextHook<SubscriptionContextType>(() => {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const { user } = useAuth();
  const subscriptionListenerRef = useRef<(() => void) | null>(null);
  const isInitializingRef = useRef(false);

  const persist = useCallback(async (next: SubscriptionState) => {
    setState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.log('Failed to save subscription state', e);
    }
  }, []);

  const setSubscriptionData = useCallback(async (data: Partial<SubscriptionState>) => {
    const next: SubscriptionState = { ...state, ...data };
    await persist(next);
  }, [persist, state]);

  // Sync subscription state from RevenueCat customer info
  const syncFromRevenueCat = useCallback((customerInfo: any) => {
    try {
      if (!customerInfo) return;
      
      const entitlement = customerInfo.entitlements?.active?.['premium'];
      
      if (entitlement && entitlement.isActive) {
        const isTrial = entitlement.isTrialPeriod || 
                       (entitlement.expirationDate && 
                        new Date(entitlement.expirationDate) > new Date() &&
                        entitlement.willRenew);
        
        const productId = entitlement.productIdentifier || '';
        const isYearly = productId.includes('yearly') || productId.includes('annual');
        
        const updatedState: Partial<SubscriptionState> = {
          isPremium: true,
          subscriptionType: isYearly ? 'yearly' : 'monthly',
          subscriptionPrice: isYearly ? 99 : 8.99,
          nextBillingDate: entitlement.expirationDate || undefined,
          purchaseToken: customerInfo.originalAppUserId || undefined,
          originalTransactionId: entitlement.originalTransactionId || undefined,
        };
        
        // If in trial, also set trial dates
        if (isTrial && entitlement.expirationDate) {
          const trialEnd = new Date(entitlement.expirationDate);
          const trialStart = new Date(entitlement.latestPurchaseDate || trialEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          updatedState.trialStartedAt = trialStart.toISOString();
          updatedState.trialEndsAt = trialEnd.toISOString();
          updatedState.hasStartedTrial = true;
        }
        
        setSubscriptionData(updatedState);
      } else {
        // No active subscription
        setSubscriptionData({
          isPremium: false,
          subscriptionType: undefined,
          subscriptionPrice: undefined,
          nextBillingDate: undefined,
        });
      }
    } catch (error) {
      console.error('Error syncing from RevenueCat:', error);
    }
  }, [setSubscriptionData]);

  const startLocalTrial = useCallback(async (days: number = 7) => {
    const now = new Date();
    const ends = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const next: SubscriptionState = {
      ...state,
      trialStartedAt: now.toISOString(),
      trialEndsAt: ends.toISOString(),
      hasStartedTrial: true,
      scanCount: 0, // Reset scan count when starting trial
      isPremium: true, // Grant premium access during trial
    };
    await persist(next);
    trackTrialStartEvent();
  }, [persist, state]);

  const setPremium = useCallback(async (value: boolean, type: 'monthly' | 'yearly' = 'monthly') => {
    const price = type === 'yearly' ? 99 : 8.99;
    const nextBillingDate = new Date();
    if (type === 'yearly') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }
    
    const next: SubscriptionState = { 
      ...state, 
      isPremium: value,
      subscriptionType: type,
      subscriptionPrice: price,
      nextBillingDate: nextBillingDate.toISOString(),
    };
    await persist(next);
  }, [persist, state]);

  const reset = useCallback(async () => {
    await persist(DEFAULT_STATE);
  }, [persist]);

  const inTrial = useMemo(() => {
    if (!state.trialEndsAt) return false;
    return new Date(state.trialEndsAt).getTime() > Date.now();
  }, [state.trialEndsAt]);

  const daysLeft = useMemo(() => {
    if (!state.trialEndsAt) return 0;
    const ms = new Date(state.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  }, [state.trialEndsAt]);

  const hoursLeft = useMemo(() => {
    if (!state.trialEndsAt) return 0;
    const ms = new Date(state.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (60 * 60 * 1000)));
  }, [state.trialEndsAt]);

  const isTrialExpired = useMemo(() => {
    if (!state.hasStartedTrial) return false;
    return !inTrial; // Trial is expired if it was started but is no longer active
  }, [inTrial, state.hasStartedTrial]);

  const canScan = useMemo(() => {
    return true; // All features free - unlimited scans
  }, []);

  const scansLeft = useMemo(() => {
    return Infinity; // All features free - unlimited scans
  }, []);

  const incrementScanCount = useCallback(async () => {
    // Increment scan count (applies to trial and premium users)
    const next: SubscriptionState = { 
      ...state, 
      scanCount: state.scanCount + 1 
    };
    await persist(next);
  }, [persist, state]);

  // Sync subscription status with RevenueCat and backend
  const syncSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('Syncing subscription status...');
      
      // First, try to get subscription status from RevenueCat (with error handling)
      if (Platform.OS !== 'web') {
        try {
          const subscriptionInfo = await paymentService.getSubscriptionStatus();
          
          if (subscriptionInfo && subscriptionInfo.isActive) {
            console.log('Active subscription found in RevenueCat:', subscriptionInfo);
            
            const isYearly = subscriptionInfo.productId.includes('yearly') || 
                            subscriptionInfo.productId.includes('annual');
            
            const updatedState: Partial<SubscriptionState> = {
              isPremium: true,
              subscriptionType: isYearly ? 'yearly' : 'monthly',
              subscriptionPrice: isYearly ? 99 : 8.99,
              nextBillingDate: subscriptionInfo.expiryDate || undefined,
              purchaseToken: subscriptionInfo.purchaseToken || undefined,
              originalTransactionId: subscriptionInfo.originalTransactionId || undefined,
            };
            
            // If in trial, set trial dates
            if (subscriptionInfo.isTrialPeriod && subscriptionInfo.expiryDate) {
              const trialEnd = new Date(subscriptionInfo.expiryDate);
              const trialStart = new Date(subscriptionInfo.purchaseDate);
              
              updatedState.trialStartedAt = trialStart.toISOString();
              updatedState.trialEndsAt = trialEnd.toISOString();
              updatedState.hasStartedTrial = true;
            }
            
            await setSubscriptionData(updatedState);
            
            // Also sync with backend
            try {
              await supabase
                .from('profiles')
                .update({
                  revenuecat_user_id: user.id,
                  subscription_status: 'premium',
                  subscription_product_id: subscriptionInfo.productId,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);
            } catch (backendError) {
              console.error('Failed to update backend subscription status:', backendError);
            }
            
            return;
          } else {
            console.log('No active subscription in RevenueCat');
          }
        } catch (revenueCatError) {
          // RevenueCat not available or not configured - this is OK, continue to backend sync
          console.log('RevenueCat sync unavailable (OK in development):', revenueCatError);
        }
      }
      
      // Fallback: Check backend (Supabase) if RevenueCat doesn't have subscription
      try {
        const { data, error } = await supabase.rpc('get_user_subscription_status', { user_uuid: user.id });
        
        if (error) {
          console.log('Backend RPC call failed, using local state:', error.message);
          return;
        }
        
        if (data && data.length > 0) {
          const subscription = data[0];
          
          const backendState: Partial<SubscriptionState> = {
            isPremium: subscription.is_premium || false,
            subscriptionType: subscription.subscription_product_id?.includes('yearly') || 
                            subscription.subscription_product_id?.includes('annual') 
                            ? 'yearly' : 'monthly',
            subscriptionPrice: subscription.subscription_product_id?.includes('yearly') || 
                              subscription.subscription_product_id?.includes('annual') 
                              ? 99 : 8.99,
            nextBillingDate: subscription.expires_at,
          };
          
          // If in trial, set trial dates
          if (subscription.is_trial && subscription.expires_at) {
            const trialEnd = new Date(subscription.expires_at);
            const trialStart = new Date(trialEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            backendState.trialStartedAt = trialStart.toISOString();
            backendState.trialEndsAt = trialEnd.toISOString();
            backendState.hasStartedTrial = true;
          }
          
          await setSubscriptionData(backendState);
        }
      } catch (error) {
        // Silently fail - app will use local AsyncStorage state
        // This is expected when backend sync is not available
        console.log('Backend subscription sync unavailable, using local state');
      }
    } catch (error) {
      // Silently fail - app will use local AsyncStorage state
      console.log('Subscription sync failed, using local state:', error);
    }
  }, [user?.id, setSubscriptionData]);

  // Initialize RevenueCat when user is available
  useEffect(() => {
    if (user?.id && !isInitializingRef.current) {
      isInitializingRef.current = true;
      (async () => {
        try {
          // Initialize RevenueCat with user ID
          await paymentService.initialize(user.id);
          
          // Sync user ID with RevenueCat
          await paymentService.syncUser(user.id);
          
          // Set up subscription status listener
          const unsubscribe = paymentService.addSubscriptionListener((customerInfo: any) => {
            console.log('RevenueCat subscription updated, syncing...');
            syncFromRevenueCat(customerInfo);
          });
          
          subscriptionListenerRef.current = unsubscribe;
          
          // Get initial subscription status
          await syncSubscriptionStatus();
        } catch (error) {
          console.error('Failed to initialize RevenueCat:', error);
        } finally {
          isInitializingRef.current = false;
        }
      })();
    } else if (!user?.id && subscriptionListenerRef.current) {
      // Clean up listener when user logs out
      subscriptionListenerRef.current();
      subscriptionListenerRef.current = null;
    }
    
    return () => {
      if (subscriptionListenerRef.current) {
        subscriptionListenerRef.current();
        subscriptionListenerRef.current = null;
      }
    };
  }, [user?.id, syncFromRevenueCat, syncSubscriptionStatus]);

  // Load local state and sync on mount
  useEffect(() => {
    (async () => {
      try {
        // Load local state first
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setState(JSON.parse(raw) as SubscriptionState);
        }
      } catch (e) {
        console.log('Failed to load subscription state', e);
      }
    })();
  }, []);
  
  const processInAppPurchase = useCallback(async (type: 'monthly' | 'yearly'): Promise<{ success: boolean; purchaseToken?: string; originalTransactionId?: string; error?: string }> => {
    try {
      console.log(`Processing ${type} in-app purchase...`);
      
      if (Platform.OS === 'web') {
        console.log('In-app purchases not available on web');
        return { success: false, error: 'In-app purchases not supported on web. Please use the mobile app.' };
      }
      
      // Initialize payment service with user ID
      const initialized = await paymentService.initialize(user?.id || null);
      if (!initialized) {
        return { success: false, error: 'Payment service unavailable. Please try again later.' };
      }
      
      // Sync user ID if not already synced
      if (user?.id) {
        await paymentService.syncUser(user.id);
      }
      
      // Get the product ID for the subscription type
      const productId = type === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.YEARLY;
      
      // Attempt the purchase
      const result = await paymentService.purchaseProduct(productId);
      
      if (result.success && result.transactionId && result.purchaseToken) {
        console.log('Purchase successful:', result);
        
        // Track the purchase event
        const price = type === 'yearly' ? 99 : 8.99;
        trackPurchaseEvent(productId, price, 'USD');
        
        // Sync subscription status from RevenueCat (this will update state automatically)
        await syncSubscriptionStatus();
        
        // Also sync with backend after successful purchase
        if (user?.id) {
          try {
            // Update user's RevenueCat user ID in Supabase
            await supabase
              .from('user_profiles')
              .update({ 
                revenuecat_user_id: user.id,
                subscription_status: 'premium',
                subscription_product_id: productId,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);
          } catch (backendError) {
            console.error('Failed to update backend subscription status:', backendError);
            // Don't fail the purchase if backend update fails
          }
        }
        
        return { 
          success: true, 
          purchaseToken: result.purchaseToken,
          originalTransactionId: result.transactionId 
        };
      } else if (result.cancelled) {
        console.log('Purchase cancelled by user');
        return { 
          success: false, 
          error: 'Purchase cancelled' 
        };
      } else if (result.error === 'STORE_REDIRECT') {
        console.log('User redirected to app store');
        return { 
          success: false, 
          error: 'STORE_REDIRECT' 
        };
      } else {
        console.log('Purchase failed:', result.error);
        return { 
          success: false, 
          error: result.error || 'Payment failed. Please try again.' 
        };
      }
      
    } catch (error) {
      console.error('In-app purchase error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' 
      };
    }
  }, [user?.id, syncSubscriptionStatus]);

  // Can view results (not blurred)
  const canViewResults = useMemo(() => {
    return true; // All features free - always can view results
  }, []);

  // Needs premium (show paywall)
  const needsPremium = useMemo(() => {
    return false; // All features free - no paywall needed
  }, []);

  return useMemo(() => ({
    state,
    inTrial,
    daysLeft,
    hoursLeft,
    canScan,
    scansLeft,
    isTrialExpired,
    canViewResults,
    needsPremium,
    startLocalTrial,
    setPremium,
    setSubscriptionData,
    incrementScanCount,
    reset,
    processInAppPurchase,
  }), [
    state,
    inTrial,
    daysLeft,
    hoursLeft,
    canScan,
    scansLeft,
    isTrialExpired,
    canViewResults,
    needsPremium,
    startLocalTrial,
    setPremium,
    setSubscriptionData,
    incrementScanCount,
    reset,
    processInAppPurchase,
  ]);
});