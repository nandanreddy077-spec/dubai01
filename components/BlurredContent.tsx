import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Sparkles, Lock } from 'lucide-react-native';
import { getPalette } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { router } from 'expo-router';

interface BlurredContentProps {
  children: React.ReactNode;
  message?: string;
  showUpgrade?: boolean;
  testID?: string;
}

export default function BlurredContent({ 
  children, 
  message = "Upgrade to Premium to view your results",
  showUpgrade = true,
  testID
}: BlurredContentProps) {
  const { theme } = useTheme();
  const { canViewResults, isTrialExpired, inTrial, daysLeft } = useSubscription();
  const palette = getPalette(theme);

  // If user can view results, show content normally
  if (canViewResults) {
    return <>{children}</>;
  }

  const getTrialMessage = () => {
    if (isTrialExpired) {
      return "Your 3-day trial has ended";
    }
    if (inTrial) {
      return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in trial`;
    }
    return "Start your 3-day free trial";
  };

  const upgradeMessage = isTrialExpired 
    ? "Upgrade to Premium to continue your glow journey!"
    : message;

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.blurredContent, { opacity: 0.3 }]}>
        {children}
      </View>
      
      <View style={styles.overlay}>
        <LinearGradient 
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']} 
          style={styles.overlayGradient}
        >
          <View style={styles.upgradeCard}>
            <View style={styles.iconContainer}>
              <View style={styles.lockIcon}>
                <Lock color={palette.gold} size={32} strokeWidth={2} />
              </View>
              <Sparkles 
                color={palette.blush} 
                size={24} 
                style={styles.sparkle1}
              />
              <Sparkles 
                color={palette.lavender} 
                size={20} 
                style={styles.sparkle2}
              />
            </View>
            
            <Text style={[styles.trialStatus, { color: palette.gold }]}>
              {getTrialMessage()}
            </Text>
            
            <Text style={[styles.upgradeTitle, { color: palette.textLight }]}>
              Premium Required
            </Text>
            
            <Text style={[styles.upgradeMessage, { color: palette.textSecondary }]}>
              {upgradeMessage}
            </Text>
            
            {showUpgrade && (
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={() => router.push('/unlock-glow')}
                activeOpacity={0.8}
                testID="upgrade-button"
              >
                <LinearGradient 
                  colors={[palette.gold, palette.blush]} 
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 1 }} 
                  style={styles.upgradeButtonGradient}
                >
                  <Crown color="#000" size={20} strokeWidth={2.5} />
                  <Text style={styles.upgradeButtonText}>
                    {isTrialExpired ? 'Upgrade Now' : 'Start Free Trial'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            <Text style={[styles.legalText, { color: palette.textMuted }]}>
              {!isTrialExpired ? '3-day free trial • ' : ''}Cancel anytime
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  blurredContent: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle1: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  sparkle2: {
    position: 'absolute',
    bottom: -4,
    left: -12,
  },
  trialStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  upgradeMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});