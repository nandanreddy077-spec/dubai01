import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useReferral } from '@/contexts/ReferralContext';
import ResultsPaywallOverlay from './ResultsPaywallOverlay';
import MiniPaywallBanner from './MiniPaywallBanner';
import ShareInviteModal from './ShareInviteModal';

interface BlurredContentProps {
  children: React.ReactNode;
  message?: string;
  showUpgrade?: boolean;
  testID?: string;
  // Props for paywall overlay
  score?: number;
  rating?: string;
  badge?: string;
  skinType?: string;
  topConcern?: string;
  featureType?: 'analysis' | 'style';
  onStartTrial?: () => void;
  onViewPlans?: () => void;
  onDismiss?: () => void;
  // Control whether to show paywall or just blur
  showPaywall?: boolean;
  showDismiss?: boolean;
  showReferralOption?: boolean;
}

/**
 * BlurredContent - Psychology-driven paywall component
 * 
 * Shows blurred content with paywall overlay for non-subscribers.
 * Uses loss aversion psychology - users see their results exist but are blurred.
 * 
 * Flow:
 * 1. Non-subscriber sees full paywall overlay on blurred content
 * 2. If they press "Maybe Later", paywall closes but content stays blurred
 * 3. A mini floating banner appears at bottom
 * 4. User can tap banner or explore (with blurred content)
 * 5. Banner has option to expand back to full paywall
 */
export default function BlurredContent({ 
  children,
  score,
  rating,
  badge,
  skinType,
  topConcern,
  featureType = 'analysis',
  onStartTrial,
  onViewPlans,
  onDismiss,
  showPaywall = true,
  showDismiss = true,
  showReferralOption = true,
  testID,
}: BlurredContentProps) {
  const subscription = useSubscription();
  const referral = useReferral();
  
  // Track if user dismissed the full paywall
  const [isPaywallDismissed, setIsPaywallDismissed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Check if user has access - canViewResults returns true for premium, trial, OR referral unlock
  const hasSubscriptionAccess = subscription?.canViewResults === true;
  const hasReferralAccess = referral?.canViewResults === true;
  const hasAccess = hasSubscriptionAccess || hasReferralAccess;
  
  // Handle paywall dismiss - don't navigate away, just hide full paywall
  const handleDismiss = useCallback(() => {
    setIsPaywallDismissed(true);
    // Call custom onDismiss if provided (for analytics etc)
    if (onDismiss) {
      onDismiss();
    }
  }, [onDismiss]);
  
  // Handle expanding mini banner back to full paywall
  const handleExpandPaywall = useCallback(() => {
    setIsPaywallDismissed(false);
  }, []);
  
  // Handle share invite action
  const handleShareInvite = useCallback(() => {
    setShowShareModal(true);
  }, []);
  
  // Handle share modal close
  const handleShareModalClose = useCallback(() => {
    setShowShareModal(false);
  }, []);
  
  // If user has access, show content without blur
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Determine what to show based on dismissal state
  const showFullPaywall = showPaywall && !isPaywallDismissed;
  const showMiniBanner = showPaywall && isPaywallDismissed;
  
  // User doesn't have access - show blurred content with paywall overlay
  return (
    <View style={styles.container} testID={testID}>
      {/* Blurred Content Layer */}
      <View style={styles.contentWrapper}>
        {children}
        
        {/* Blur Overlay */}
        {Platform.OS === 'web' ? (
          // Web fallback - CSS blur
          <View style={styles.webBlurOverlay} />
        ) : (
          // Native blur using expo-blur
          <BlurView
            intensity={25}
            tint="light"
            style={styles.blurOverlay}
          />
        )}
      </View>
      
      {/* Full Paywall Overlay - shown initially */}
      {showFullPaywall && (
        <ResultsPaywallOverlay
          score={score}
          rating={rating}
          badge={badge}
          skinType={skinType}
          topConcern={topConcern}
          onStartTrial={onStartTrial}
          onViewPlans={onViewPlans}
          onDismiss={handleDismiss}
          onShareInvite={handleShareInvite}
          showDismiss={showDismiss}
          invitesRemaining={referral?.invitesRemaining}
          showReferralOption={showReferralOption}
        />
      )}
      
      {/* Share Invite Modal */}
      <ShareInviteModal
        visible={showShareModal}
        onClose={handleShareModalClose}
        score={score}
        featureType={featureType}
      />
      
      {/* Mini Banner - shown after dismiss */}
      {showMiniBanner && (
        <MiniPaywallBanner
          score={score}
          onStartTrial={onStartTrial}
          onExpand={handleExpandPaywall}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  webBlurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 10,
  },
});
