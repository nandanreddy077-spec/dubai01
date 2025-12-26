import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import * as Linking from 'expo-linking';

export interface ReferralState {
  referralCode: string;
  invitedBy?: string;
  successfulInvites: number;
  pendingInvites: string[];
  hasUnlockedViaReferral: boolean;
  unlockedFeatures: string[];
  shareCount: number;
  lastSharedAt?: string;
}

export interface ReferralContextType {
  state: ReferralState;
  canViewResults: boolean;
  invitesNeeded: number;
  invitesRemaining: number;
  progress: number;
  generateReferralLink: (featureType: 'analysis' | 'style') => Promise<string>;
  trackShare: () => Promise<void>;
  trackInviteClick: (referralCode: string) => Promise<void>;
  checkAndUnlockFeature: (featureType: string) => Promise<boolean>;
  reset: () => Promise<void>;
}

const STORAGE_KEY = 'glowcheck_referral_state';
const INVITES_REQUIRED = 3;

const DEFAULT_STATE: ReferralState = {
  referralCode: '',
  successfulInvites: 0,
  pendingInvites: [],
  hasUnlockedViaReferral: false,
  unlockedFeatures: [],
  shareCount: 0,
};

function generateReferralCode(userId?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const userPart = userId ? userId.substring(0, 6) : 'anon';
  return `${userPart}${timestamp}${random}`.toUpperCase();
}

export const [ReferralProvider, useReferral] = createContextHook<ReferralContextType>(() => {
  const [state, setState] = useState<ReferralState>(DEFAULT_STATE);
  const { user } = useAuth();

  const persist = useCallback(async (next: ReferralState) => {
    setState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      console.log('💾 Referral state saved:', {
        successfulInvites: next.successfulInvites,
        hasUnlockedViaReferral: next.hasUnlockedViaReferral,
        unlockedFeatures: next.unlockedFeatures,
      });
    } catch (e) {
      console.error('Failed to save referral state', e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as ReferralState;
          setState(saved);
          console.log('📂 Loaded referral state:', saved);
        } else if (user?.id) {
          const newCode = generateReferralCode(user.id);
          const newState = { ...DEFAULT_STATE, referralCode: newCode };
          await persist(newState);
        }
      } catch (e) {
        console.error('Failed to load referral state', e);
      }
    })();
  }, [user?.id, persist]);

  useEffect(() => {
    if (!state.referralCode && user?.id) {
      const newCode = generateReferralCode(user.id);
      persist({ ...state, referralCode: newCode });
    }
  }, [state, user?.id, persist]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      console.log('🔗 Deep link received:', url);
      const parsed = Linking.parse(url);
      const referralCode = parsed.queryParams?.ref as string | undefined;
      
      if (referralCode && referralCode !== state.referralCode) {
        console.log('👥 Tracking invite click from:', referralCode);
        await trackInviteClick(referralCode);
      }
    });

    return () => subscription.remove();
  }, [state.referralCode]);

  const generateReferralLink = useCallback(async (featureType: 'analysis' | 'style') => {
    const baseUrl = 'https://glowcheck.ai';
    const appScheme = 'glowcheck://';
    
    const link = `${baseUrl}?ref=${state.referralCode}&feature=${featureType}`;
    const deepLink = `${appScheme}?ref=${state.referralCode}&feature=${featureType}`;
    
    console.log('🔗 Generated referral link:', link);
    
    return link;
  }, [state.referralCode]);

  const trackShare = useCallback(async () => {
    const next: ReferralState = {
      ...state,
      shareCount: state.shareCount + 1,
      lastSharedAt: new Date().toISOString(),
    };
    await persist(next);
    
    console.log('📤 Share tracked:', {
      shareCount: next.shareCount,
      referralCode: state.referralCode,
    });

    if (user?.id) {
      try {
        await supabase
          .from('user_referrals')
          .upsert({
            user_id: user.id,
            referral_code: state.referralCode,
            share_count: next.shareCount,
            last_shared_at: next.lastSharedAt,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          });
      } catch (error) {
        console.log('Backend tracking unavailable (OK):', error);
      }
    }
  }, [state, user?.id, persist]);

  const trackInviteClick = useCallback(async (referralCode: string) => {
    if (!user?.id || referralCode === state.referralCode) {
      console.log('❌ Skipping invite click: same user or not logged in');
      return;
    }

    try {
      const { data: referrer, error: referrerError } = await supabase
        .from('user_referrals')
        .select('user_id, successful_invites')
        .eq('referral_code', referralCode)
        .single();

      if (referrerError || !referrer) {
        console.log('Referrer not found in database');
        return;
      }

      const { data: existingInvite } = await supabase
        .from('referral_invites')
        .select('id')
        .eq('referrer_user_id', referrer.user_id)
        .eq('invited_user_id', user.id)
        .single();

      if (existingInvite) {
        console.log('User already tracked as invite');
        return;
      }

      await supabase
        .from('referral_invites')
        .insert({
          referrer_user_id: referrer.user_id,
          invited_user_id: user.id,
          referral_code: referralCode,
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

      const newInviteCount = (referrer.successful_invites || 0) + 1;
      
      await supabase
        .from('user_referrals')
        .update({
          successful_invites: newInviteCount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', referrer.user_id);

      const next: ReferralState = {
        ...state,
        invitedBy: referralCode,
      };
      await persist(next);

      console.log('✅ Invite tracked successfully:', {
        referrer: referrer.user_id,
        inviteCount: newInviteCount,
      });
    } catch (error) {
      console.log('Failed to track invite (OK in development):', error);
      
      const next: ReferralState = {
        ...state,
        invitedBy: referralCode,
      };
      await persist(next);
    }
  }, [state, user?.id, persist]);

  const syncFromBackend = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .select('successful_invites, unlocked_features')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return;

      const unlockedFeatures = data.unlocked_features || [];
      const hasUnlockedViaReferral = data.successful_invites >= INVITES_REQUIRED || unlockedFeatures.length > 0;

      const next: ReferralState = {
        ...state,
        successfulInvites: data.successful_invites || 0,
        unlockedFeatures,
        hasUnlockedViaReferral,
      };

      await persist(next);
      console.log('🔄 Synced from backend:', next);
    } catch (error) {
      console.log('Backend sync unavailable (OK):', error);
    }
  }, [user?.id, state, persist]);

  useEffect(() => {
    if (user?.id) {
      syncFromBackend();
    }
  }, [user?.id]);

  const checkAndUnlockFeature = useCallback(async (featureType: string): Promise<boolean> => {
    if (!user?.id) {
      console.log('❌ Cannot unlock feature: no user');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('user_referrals')
        .select('successful_invites, unlocked_features')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.log('Backend check failed, using local state');
        
        if (state.successfulInvites >= INVITES_REQUIRED) {
          const unlockedFeatures = [...new Set([...state.unlockedFeatures, featureType])];
          const next: ReferralState = {
            ...state,
            hasUnlockedViaReferral: true,
            unlockedFeatures,
          };
          await persist(next);
          return true;
        }
        return false;
      }

      const currentInvites = data?.successful_invites || 0;
      const unlockedFeatures = data?.unlocked_features || [];

      if (currentInvites >= INVITES_REQUIRED && !unlockedFeatures.includes(featureType)) {
        const newUnlockedFeatures = [...unlockedFeatures, featureType];
        
        await supabase
          .from('user_referrals')
          .update({
            unlocked_features: newUnlockedFeatures,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        const next: ReferralState = {
          ...state,
          successfulInvites: currentInvites,
          hasUnlockedViaReferral: true,
          unlockedFeatures: newUnlockedFeatures,
        };
        await persist(next);

        console.log('🎉 Feature unlocked via referrals!', featureType);
        return true;
      }

      const next: ReferralState = {
        ...state,
        successfulInvites: currentInvites,
        unlockedFeatures,
        hasUnlockedViaReferral: currentInvites >= INVITES_REQUIRED || unlockedFeatures.length > 0,
      };
      await persist(next);

      return currentInvites >= INVITES_REQUIRED || unlockedFeatures.includes(featureType);
    } catch (error) {
      console.error('Feature unlock check failed:', error);
      return false;
    }
  }, [user?.id, state, persist]);

  const reset = useCallback(async () => {
    const newCode = generateReferralCode(user?.id);
    await persist({ ...DEFAULT_STATE, referralCode: newCode });
  }, [user?.id, persist]);

  const canViewResults = useMemo(() => {
    return state.hasUnlockedViaReferral || state.successfulInvites >= INVITES_REQUIRED;
  }, [state.hasUnlockedViaReferral, state.successfulInvites]);

  const invitesRemaining = useMemo(() => {
    return Math.max(0, INVITES_REQUIRED - state.successfulInvites);
  }, [state.successfulInvites]);

  const progress = useMemo(() => {
    return Math.min(100, (state.successfulInvites / INVITES_REQUIRED) * 100);
  }, [state.successfulInvites]);

  return useMemo(() => ({
    state,
    canViewResults,
    invitesNeeded: INVITES_REQUIRED,
    invitesRemaining,
    progress,
    generateReferralLink,
    trackShare,
    trackInviteClick,
    checkAndUnlockFeature,
    reset,
  }), [
    state,
    canViewResults,
    invitesRemaining,
    progress,
    generateReferralLink,
    trackShare,
    trackInviteClick,
    checkAndUnlockFeature,
    reset,
  ]);
});
