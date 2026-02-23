import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Crown,
  Sparkles,
  Check,
  X,
  Lock,
  Zap,
  Star,
  Shield,
  TrendingUp,
  Heart,
  Gift,
  Eye,
} from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { palette, gradient, shadow } from '@/constants/theme';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HardPaywallProps {
  visible: boolean;
  onClose?: () => void;
  feature?: string;
  message?: string;
  showCloseButton?: boolean;
  onSubscribe?: (type: 'monthly' | 'yearly') => void;
}

export default function HardPaywall({
  visible,
  onClose,
  feature = 'Premium Features',
  message,
  showCloseButton = false,
  onSubscribe,
}: HardPaywallProps) {
  const subscription = useSubscription();
  const { state, processInAppPurchase, inTrial, isTrialExpired } = subscription || {};
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (onSubscribe) {
        onSubscribe(selectedPlan);
      } else {
        const result = await processInAppPurchase(selectedPlan);
        
        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (onClose) onClose();
        } else if (result.cancelled) {
          // User cancelled - don't show error
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          // Show error to user
          console.error('Purchase failed:', result.error);
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const features = useMemo(() => [
    { icon: Sparkles, text: 'See Your Complete Skin Analysis', color: palette.gold },
    { icon: Eye, text: 'Detailed Beauty Scores & Insights', color: '#8B5CF6' },
    { icon: Star, text: 'Personalized Product Matches', color: '#F59E0B' },
    { icon: Zap, text: 'AI-Powered Skincare Routine', color: '#10B981' },
    { icon: TrendingUp, text: 'Track Your Glow Journey', color: '#3B82F6' },
    { icon: Heart, text: 'Unlimited Scans Anytime', color: '#EC4899' },
  ], []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={showCloseButton ? onClose : undefined}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient
          colors={gradient.hero}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Header */}
        <View style={styles.header}>
          {showCloseButton && onClose && (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color={palette.textPrimary} size={24} />
            </TouchableOpacity>
          )}
          <View style={styles.headerContent}>
            <View style={styles.crownContainer}>
              <Crown color={palette.gold} size={32} fill={palette.gold} />
            </View>
            <Text style={styles.title}>Your Perfect Glow Awaits ✨</Text>
            <Text style={styles.subtitle}>
              {message || `Discover what your skin is really capable of. Join thousands unlocking their best skin ever.`}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Features List */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View key={index} style={styles.featureRow}>
                  <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}15` }]}>
                    <Icon color={feature.color} size={20} />
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                  <Check color={palette.gold} size={20} />
                </View>
              );
            })}
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansContainer}>
            <Text style={styles.plansTitle}>Choose Your Plan</Text>
            
            {/* Yearly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected,
              ]}
              onPress={() => {
                setSelectedPlan('yearly');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.planHeader}>
                <View style={styles.planRadio}>
                  {selectedPlan === 'yearly' && (
                    <View style={styles.planRadioSelected} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <View style={styles.planBadge}>
                    <Gift color={palette.gold} size={14} />
                    <Text style={styles.planBadgeText}>Best Value</Text>
                  </View>
                  <Text style={styles.planName}>Yearly</Text>
                  <Text style={styles.planDescription}>Save 89% • $8.25/month</Text>
                </View>
                <View style={styles.planPrice}>
                  <Text style={styles.planPriceAmount}>$99</Text>
                  <Text style={styles.planPricePeriod}>/year</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => {
                setSelectedPlan('monthly');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.planHeader}>
                <View style={styles.planRadio}>
                  {selectedPlan === 'monthly' && (
                    <View style={styles.planRadioSelected} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planDescription}>Flexible billing</Text>
                </View>
                <View style={styles.planPrice}>
                  <Text style={styles.planPriceAmount}>$8.99</Text>
                  <Text style={styles.planPricePeriod}>/month</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.subscribeButton, isProcessing && styles.subscribeButtonDisabled]}
            onPress={handleSubscribe}
            disabled={isProcessing}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={isProcessing ? ['#666666', '#555555'] : [palette.gold, palette.blush]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.subscribeButtonGradient}
            >
              <Lock color="#000" size={20} />
              <Text style={styles.subscribeButtonText}>
                {isProcessing ? 'Processing...' : `Subscribe ${selectedPlan === 'yearly' ? '$99/year' : '$8.99/month'}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Emotional CTA */}
          <View style={styles.emotionalSection}>
            <Text style={styles.emotionalText}>
              💎 Join thousands discovering their perfect glow
            </Text>
            <Text style={styles.emotionalSubtext}>
              Your personalized beauty journey starts now
            </Text>
          </View>

          {/* Legal Text */}
          <Text style={styles.legalText}>
            {selectedPlan === 'yearly' ? '$99/year' : '$8.99/month'}. Cancel anytime.
          </Text>

          {/* Restore Purchases */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={() => {
              // TODO: Implement restore purchases
              console.log('Restore purchases');
            }}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 169, 97, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: palette.gold,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  featuresContainer: {
    marginTop: 24,
    marginBottom: 32,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.soft,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  plansContainer: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: palette.border,
    ...shadow.soft,
  },
  planCardSelected: {
    borderColor: palette.gold,
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.border,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planRadioSelected: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: palette.gold,
  },
  planInfo: {
    flex: 1,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201, 169, 97, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.gold,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  planPrice: {
    alignItems: 'flex-end',
  },
  planPriceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  planPricePeriod: {
    fontSize: 14,
    color: palette.textSecondary,
    marginTop: 2,
  },
  subscribeButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadow.medium,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  legalText: {
    fontSize: 12,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.gold,
  },
  emotionalSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 97, 0.3)',
  },
  emotionalText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  emotionalSubtext: {
    fontSize: 13,
    color: palette.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

