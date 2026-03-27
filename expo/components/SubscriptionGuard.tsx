import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import HardPaywall from './HardPaywall';
import { router } from 'expo-router';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiresPremium?: boolean;
  showPaywall?: boolean;
  accessMode?: 'scan' | 'view';
  feature?: string;
  message?: string;
  onSubscribe?: (type: 'monthly' | 'yearly') => void;
}

/**
 * SubscriptionGuard - Hard paywall for premium features
 * 
 * If requiresPremium is true:
 * - Shows hard paywall if user is not premium and not in trial
 * - Blocks access to children completely
 * 
 * If showPaywall is true:
 * - Shows HardPaywall component instead of children
 */
export default function SubscriptionGuard({ 
  children,
  requiresPremium = false,
  showPaywall = false,
  accessMode,
  feature = 'this feature',
  message,
  onSubscribe,
}: SubscriptionGuardProps) {
  const subscription = useSubscription();
  const { state, hasAnyAccess, inTrial, isTrialExpired } = subscription || {};
  const [showPaywallModal, setShowPaywallModal] = useState(false);

  // Check if user has access (premium or active trial)
  const hasAccess = state?.isPremium || (inTrial && !isTrialExpired) || hasAnyAccess;

  useEffect(() => {
    // If requires premium and user doesn't have access, show paywall
    if (requiresPremium && !hasAccess) {
      setShowPaywallModal(true);
    } else if (showPaywall && !hasAccess) {
      setShowPaywallModal(true);
    } else {
      setShowPaywallModal(false);
    }
  }, [requiresPremium, showPaywall, hasAccess]);

  // If paywall should be shown, render it instead of children
  if (showPaywallModal) {
    return (
      <>
        <View style={styles.blockedContent}>
          {/* Optionally show blurred/blocked content */}
        </View>
        <HardPaywall
          visible={true}
          feature={feature}
          message={message || `Subscribe to access ${feature}`}
          showCloseButton={false} // Hard paywall - no close button
          onSubscribe={async (type) => {
            if (onSubscribe) {
              onSubscribe(type);
            } else {
              const result = await subscription?.processInAppPurchase(type);
              if (result?.success) {
                setShowPaywallModal(false);
              }
            }
          }}
        />
      </>
    );
  }

  // User has access, show children
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blockedContent: {
    flex: 1,
    opacity: 0.3,
  },
});
