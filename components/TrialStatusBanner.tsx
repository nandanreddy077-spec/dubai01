import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Clock, Crown, Sparkles } from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';

/**
 * TrialStatusBanner - Shows trial status and time remaining
 * Can be placed at the top of key screens to remind users of their trial
 */
export default function TrialStatusBanner() {
  const subscription = useSubscription();
  const { inTrial = false, daysLeft = 0, hoursLeft = 0, state = { isPremium: false, scanCount: 0, maxScansInTrial: 3, hasStartedTrial: false } } = subscription || {};

  // Don't show if already premium (not in trial)
  if (state?.isPremium && !inTrial) {
    return null;
  }

  // Don't show if not in trial and not premium (shouldn't happen, but safety)
  if (!inTrial && !state.isPremium) {
    return null;
  }

  const handleUpgrade = () => {
    router.push('/plan-selection');
  };

  // Show different messages based on time remaining
  const getUrgencyLevel = () => {
    if (daysLeft <= 1) return 'high'; // Last day
    if (daysLeft <= 3) return 'medium'; // 2-3 days left
    return 'low'; // 4+ days
  };

  const urgency = getUrgencyLevel();

  const getMessage = () => {
    if (daysLeft === 0 && hoursLeft > 0) {
      return `${hoursLeft} hours left in trial`;
    }
    if (daysLeft === 1) {
      return 'Last day of your trial';
    }
    if (daysLeft <= 3) {
      return `${daysLeft} days left in trial`;
    }
    return `${daysLeft} days of trial remaining`;
  };

  const getGradientColors = (): readonly [string, string] => {
    switch (urgency) {
      case 'high':
        return ['#FF6B6B', '#FF8E53'] as const; // Red/Orange - urgent
      case 'medium':
        return ['#FFB800', '#FFA000'] as const; // Yellow/Orange - warning
      default:
        return ['#D4A574', '#C8956D'] as const; // Gold - normal
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleUpgrade}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          {urgency === 'high' ? (
            <Clock size={20} color="#FFFFFF" strokeWidth={2.5} />
          ) : (
            <Crown size={20} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.message}>{getMessage()}</Text>
          <Text style={styles.cta}>Tap to upgrade • Keep your progress</Text>
        </View>

        <View style={styles.sparkleContainer}>
          <Sparkles size={18} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cta: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sparkleContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

