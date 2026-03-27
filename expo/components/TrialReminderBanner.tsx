import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Crown, ArrowRight, Sparkles } from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function TrialReminderBanner() {
  const subscription = useSubscription();
  const { state, inTrial, needsPremium } = subscription || {};

  if (!subscription || state?.isPremium || inTrial) {
    return null;
  }

  const handlePress = () => {
    router.push('/start-trial');
  };

  if (needsPremium) {
    return (
      <TouchableOpacity 
        style={styles.container} 
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.iconContainer}>
            <Crown size={24} color="#1A1A1A" fill="#1A1A1A" strokeWidth={2.5} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>You&apos;ve Used Your Free Scan!</Text>
            <Text style={styles.subtitle}>
              $0 to start • Access everything for free
            </Text>
          </View>
          <ArrowRight size={20} color="#1A1A1A" strokeWidth={3} />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const scansRemaining = state?.maxScansInTrial - (state?.scanCount || 0);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#1A1A1A', '#2D1B2E']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.iconContainer}>
          <Sparkles size={20} color="#FFD700" fill="#FFD700" strokeWidth={2.5} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.lightTitle}>
            {scansRemaining === 1 ? 'Last Free Scan' : `${scansRemaining} Free Scan${scansRemaining > 1 ? 's' : ''} Left`}
          </Text>
          <Text style={styles.lightSubtitle}>
            Try free for 7 days • Unlock unlimited scans
          </Text>
        </View>
        <ArrowRight size={20} color="#FFD700" strokeWidth={3} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(26, 26, 26, 0.8)',
  },
  lightTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  lightSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
