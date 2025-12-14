import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import UpgradePrompt from './UpgradePrompt';
import PremiumPaywall from './PremiumPaywall';
import { router } from 'expo-router';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiresPremium?: boolean;
  showPaywall?: boolean;
  accessMode?: 'scan' | 'view';
  feature?: string;
  message?: string;
}

/**
 * SubscriptionGuard - Gates premium features
 * 
 * If requiresPremium is true:
 * - Shows paywall if user is not premium and not in trial
 * - Blocks access to children
 * 
 * If showPaywall is true:
 * - Shows PremiumPaywall component instead of children
 */
export default function SubscriptionGuard({ 
  children,
  requiresPremium = false,
  showPaywall = false,
  accessMode,
  feature = 'this feature',
  message
}: SubscriptionGuardProps) {
  // All features free - always allow access
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
