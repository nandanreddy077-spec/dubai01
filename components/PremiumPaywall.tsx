import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Smartphone, Check, Sparkles, Star, Zap, Shield } from 'lucide-react-native';
import { palette, gradient } from '@/constants/theme';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PremiumPaywallProps {
  onStartTrial: () => void;
  onSubscribe: (type: 'monthly' | 'yearly') => void;
  testID?: string;
}

export default function PremiumPaywall({ onStartTrial, onSubscribe, testID }: PremiumPaywallProps) {
  const { inTrial, daysLeft, hoursLeft, scansLeft, isTrialExpired, canScan } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const headline = useMemo(() => {
    if (isTrialExpired) return 'Trial expired - Upgrade to continue';
    if (inTrial) {
      if (daysLeft > 0) {
        return `Trial active — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
      } else {
        return `Trial ending — ${hoursLeft} hour${hoursLeft === 1 ? '' : 's'} left`;
      }
    }
    return 'Start your 3-day free trial';
  }, [inTrial, daysLeft, hoursLeft, isTrialExpired]);

  const scanStatus = useMemo(() => {
    if (!canScan && !isTrialExpired) {
      return `${scansLeft} scan${scansLeft === 1 ? '' : 's'} remaining in trial`;
    }
    return null;
  }, [canScan, scansLeft, isTrialExpired]);

  return (
    <View style={styles.container} testID={testID ?? 'premium-paywall'}>
      <LinearGradient colors={[...gradient.paywall]} style={styles.card}>
        <View style={styles.headerRow}>
          <Crown color={palette.gold} size={24} />
          <Text style={styles.headline}>{headline}</Text>
        </View>
        <Text style={styles.sub}>Unlock the full power of your beauty journey</Text>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <Star color={palette.gold} size={16} />
            <Text style={styles.featureText}>Unlimited glow analyses</Text>
          </View>
          <View style={styles.featureRow}>
            <Zap color={palette.gold} size={16} />
            <Text style={styles.featureText}>AI-powered beauty coaching</Text>
          </View>
          <View style={styles.featureRow}>
            <Shield color={palette.gold} size={16} />
            <Text style={styles.featureText}>Premium skincare recommendations</Text>
          </View>
          <View style={styles.featureRow}>
            <Crown color={palette.gold} size={16} />
            <Text style={styles.featureText}>Exclusive filters & effects</Text>
          </View>
        </View>
        
        {scanStatus && (
          <View style={styles.scanStatus}>
            <Sparkles color={palette.gold} size={16} />
            <Text style={styles.scanStatusText}>{scanStatus}</Text>
          </View>
        )}

        {!inTrial && !isTrialExpired && (
          <TouchableOpacity accessibilityRole="button" style={styles.cta} onPress={onStartTrial} testID="start-trial">
            <LinearGradient colors={[palette.gold, palette.blush]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGradient}>
              <Text style={styles.ctaText}>Start 3-day free trial</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.plansContainer}>
          <TouchableOpacity 
            style={[styles.planOption, selectedPlan === 'yearly' && styles.planOptionSelected]} 
            onPress={() => setSelectedPlan('yearly')}
            testID="yearly-plan"
          >
            <View style={styles.planHeader}>
              <View style={styles.planRadio}>
                {selectedPlan === 'yearly' && <Check color={palette.gold} size={16} strokeWidth={3} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>Yearly Plan</Text>
                <Text style={styles.planSavings}>Save 89%</Text>
              </View>
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>$99</Text>
                <Text style={styles.planPeriod}>/year</Text>
              </View>
            </View>
            <Text style={styles.planDescription}>$8.25/month • Best value</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.planOption, selectedPlan === 'monthly' && styles.planOptionSelected]} 
            onPress={() => setSelectedPlan('monthly')}
            testID="monthly-plan"
          >
            <View style={styles.planHeader}>
              <View style={styles.planRadio}>
                {selectedPlan === 'monthly' && <Check color={palette.gold} size={16} strokeWidth={3} />}
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>Monthly Plan</Text>
              </View>
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>$8.90</Text>
                <Text style={styles.planPeriod}>/month</Text>
              </View>
            </View>
            <Text style={styles.planDescription}>Flexible monthly billing</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          accessibilityRole="button" 
          style={styles.subscribeCta} 
          onPress={() => onSubscribe(selectedPlan)} 
          testID="subscribe-button"
        >
          <LinearGradient colors={[palette.gold, palette.blush]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGradient}>
            <Text style={styles.ctaText}>
              {isTrialExpired ? 'Upgrade Now' : inTrial ? 'Continue with Premium' : `Subscribe ${selectedPlan === 'yearly' ? '$99/year' : '$8.90/month'}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity accessibilityRole="button" style={styles.manage} testID="manage-subscription">
          <Smartphone color={palette.textSecondary} size={18} />
          <Text style={styles.manageText}>Manage via App Store/Play Store</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          {!inTrial && !isTrialExpired ? '3-day free trial, then ' : ''}
          {selectedPlan === 'yearly' ? '$99/year' : '$8.90/month'}. Cancel anytime.
          {!inTrial && !isTrialExpired ? ' No charge within the first 3 days.' : ''}
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginBottom: 16 },
  card: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#2B2530' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  headline: { color: palette.textPrimary, fontSize: 18, fontWeight: '700' },
  sub: { color: palette.textSecondary, marginBottom: 16, lineHeight: 20 },
  featuresContainer: { marginBottom: 16, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: palette.textSecondary, fontSize: 14, fontWeight: '500' },
  scanStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: 8 },
  scanStatusText: { color: palette.gold, fontSize: 14, fontWeight: '600' },
  cta: { marginBottom: 16 },
  plansContainer: { marginBottom: 16, gap: 12 },
  planOption: { borderWidth: 2, borderColor: palette.divider, borderRadius: 12, padding: 16, backgroundColor: palette.surface },
  planOptionSelected: { borderColor: palette.gold, backgroundColor: 'rgba(255, 215, 0, 0.05)' },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  planRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: palette.gold, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  planInfo: { flex: 1 },
  planTitle: { color: palette.textPrimary, fontSize: 16, fontWeight: '700' },
  planSavings: { color: palette.gold, fontSize: 12, fontWeight: '600', marginTop: 2 },
  planPricing: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { color: palette.textPrimary, fontSize: 20, fontWeight: '800' },
  planPeriod: { color: palette.textSecondary, fontSize: 14, fontWeight: '500' },
  planDescription: { color: palette.textSecondary, fontSize: 14, marginLeft: 32 },
  subscribeCta: { marginBottom: 12 },
  ctaGradient: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  ctaText: { color: '#000', fontWeight: '800', fontSize: 16 },
  manage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  manageText: { color: palette.textSecondary, fontSize: 14, fontWeight: '600' },
  legal: { color: palette.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 16 },
});