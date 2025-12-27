import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import {
  Crown,
  Heart,
  Sparkles,
  Camera,
  TrendingUp,
  Users,
  Shield,
  CheckCircle2,
  Lock,
  ChevronRight,
  X,
  Check,
  Flame,
  Clock,
  Calendar,
  CreditCard,
  Gift,
  Star,
  Zap,
} from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';

const PREMIUM_FEATURES = [
  {
    icon: Camera,
    title: 'Unlimited Glow Analyses',
    description: 'Scan your glow anytime, anywhere',
    value: '$47/mo value',
  },
  {
    icon: Sparkles,
    title: 'AI Beauty Coach',
    description: 'Personalized beauty guidance 24/7',
    value: '$29/mo value',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description: 'Watch your transformation over time',
    value: '$19/mo value',
  },
  {
    icon: Star,
    title: 'Custom Skincare Plans',
    description: 'Personalized routines just for you',
    value: '$39/mo value',
  },
  {
    icon: Users,
    title: 'Exclusive Community',
    description: 'Connect with 150K+ glowing members',
    value: 'Priceless',
  },
  {
    icon: Zap,
    title: 'Priority Support',
    description: 'Get help when you need it',
    value: '$15/mo value',
  },
];

const SOCIAL_PROOF = [
  { count: '150K+', label: 'Active Users' },
  { count: '4.9', label: 'App Rating' },
  { count: '2M+', label: 'Glow Scans' },
];

export default function BeautyMembershipScreen() {
  const subscription = useSubscription();
  const { state = { isPremium: false, scanCount: 0, maxScansInTrial: 3, hasStartedTrial: false }, inTrial = false, daysLeft = 0, processInAppPurchase } = subscription || {};
  const { theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showOffer] = useState(true);

  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette, gradient);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const totalValue = useMemo(() => {
    return PREMIUM_FEATURES.reduce((sum, feature) => {
      if (feature.value === 'Priceless') return sum;
      const value = parseFloat(feature.value.replace(/[^0-9.]/g, ''));
      return sum + value;
    }, 0);
  }, []);

  const savingsPercentage = useMemo(() => {
    if (selectedPlan === 'yearly') {
      const monthlyTotal = 8.99 * 12;
      const yearlyPrice = 99;
      return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
    }
    return 0;
  }, [selectedPlan]);

  const handleManageSubscription = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        const url = 'https://apps.apple.com/account/subscriptions';
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert(
            'Manage Subscription',
            'To manage your subscription:\n\n1. Open Settings\n2. Tap your Apple ID\n3. Tap Subscriptions\n4. Find GlowCheck',
            [{ text: 'Got it' }]
          );
        }
      } else {
        const url = 'https://play.google.com/store/account/subscriptions';
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert(
            'Manage Subscription',
            'To manage your subscription:\n\n1. Open Google Play Store\n2. Tap Menu (☰)\n3. Tap Subscriptions\n4. Find GlowCheck',
            [{ text: 'Got it' }]
          );
        }
      }
    } catch (error) {
      console.error('Error opening subscription management:', error);
      Alert.alert(
        'Manage Subscription',
        Platform.OS === 'ios'
          ? 'Go to Settings > Apple ID > Subscriptions to manage your subscription.'
          : 'Open Google Play Store > Menu > Subscriptions to manage your subscription.',
        [{ text: 'Got it' }]
      );
    }
  }, []);

  const handleSubscribe = useCallback(async (type: 'monthly' | 'yearly') => {
    if (isProcessing) return;

    if (Platform.OS === 'web') {
      Alert.alert(
        'Mobile App Required',
        'Subscriptions are only available in the mobile app. Please download our app from the App Store or Google Play to subscribe.',
        [{ text: 'Got it' }]
      );
      return;
    }

    setIsProcessing(true);
    try {
      const result = await processInAppPurchase(type);

      if (result.success) {
        Alert.alert(
          '🎉 Welcome to Premium!',
          `Your ${type} subscription is now active! Enjoy unlimited access to all premium features.`,
          [{ text: 'Start Glowing ✨', onPress: () => router.back() }]
        );
      } else if (result.error === 'STORE_REDIRECT') {
        return;
      } else {
        const errorMessage = result.error || 'Unable to process subscription. Please try again.';
        Alert.alert('Subscription Failed', errorMessage, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: () => handleSubscribe(type) },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, processInAppPurchase]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getSubscriptionStatus = () => {
    if (state.isPremium && !inTrial) {
      return {
        title: 'Premium Member',
        subtitle: 'All features unlocked',
        icon: Crown,
        color: palette.champagne,
      };
    } else if (inTrial) {
      return {
        title: 'Free Trial Active',
        subtitle: `${daysLeft} days remaining`,
        icon: Gift,
        color: palette.blush,
      };
    } else {
      return {
        title: 'Free Member',
        subtitle: 'Upgrade to unlock all features',
        icon: Lock,
        color: palette.textMuted,
      };
    }
  };

  const status = getSubscriptionStatus();
  const StatusIcon = status.icon;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Beauty Membership',
          headerShown: false,
        }}
      />

      <SafeAreaView edges={['top']} style={styles.safeHeader}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color={palette.textSecondary} size={24} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {!state.isPremium && (
          <View style={styles.heroSection}>
            <View style={styles.crownContainer}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.crownGradient}>
                <Crown color="#FFFFFF" size={40} strokeWidth={2.5} />
              </LinearGradient>
            </View>
            
            <Text style={styles.heroTitle}>Unlock Your{"\n"}Best Glow Yet</Text>
            <Text style={styles.heroSubtitle}>
              Join 150,000+ people transforming their skin with AI
            </Text>

            <View style={styles.socialProofBar}>
              {SOCIAL_PROOF.map((item, index) => (
                <View key={index} style={styles.socialProofItem}>
                  <Text style={styles.socialProofCount}>{item.count}</Text>
                  <Text style={styles.socialProofLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {showOffer && (
              <Animated.View style={[styles.offerBadge, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient
                  colors={['#FF6B6B', '#EE5A6F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.offerBadgeGradient}
                >
                  <Flame color="#FFFFFF" size={16} strokeWidth={2.5} />
                  <Text style={styles.offerBadgeText}>🔥 7-Day Free Trial • Card Required</Text>
                </LinearGradient>
              </Animated.View>
            )}
          </View>
        )}

        {state.isPremium && (
          <LinearGradient colors={gradient.card} style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <LinearGradient
                colors={[status.color, status.color + '80']}
                style={styles.statusIconContainer}
              >
                <StatusIcon color="#FFFFFF" size={32} strokeWidth={2.5} />
              </LinearGradient>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>{status.title}</Text>
                <Text style={styles.statusSubtitle}>{status.subtitle}</Text>
              </View>
            </View>

            {state.isPremium && (
              <View style={styles.subscriptionDetails}>
                <View style={styles.detailRow}>
                  <Calendar color={palette.textSecondary} size={18} strokeWidth={2} />
                  <Text style={styles.detailLabel}>Plan:</Text>
                  <Text style={styles.detailValue}>
                    {state.subscriptionType === 'yearly' ? 'Yearly' : 'Monthly'} Glow
                  </Text>
                </View>
                {state.nextBillingDate && (
                  <View style={styles.detailRow}>
                    <CreditCard color={palette.textSecondary} size={18} strokeWidth={2} />
                    <Text style={styles.detailLabel}>Next billing:</Text>
                    <Text style={styles.detailValue}>{formatDate(state.nextBillingDate)}</Text>
                  </View>
                )}
                {inTrial && state.trialEndsAt && (
                  <View style={styles.detailRow}>
                    <Gift color={palette.textSecondary} size={18} strokeWidth={2} />
                    <Text style={styles.detailLabel}>Trial ends:</Text>
                    <Text style={styles.detailValue}>{formatDate(state.trialEndsAt)}</Text>
                  </View>
                )}
              </View>
            )}
          </LinearGradient>
        )}

        {state.isPremium && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleManageSubscription}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Shield color={palette.primary} size={22} strokeWidth={2.5} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Manage Subscription</Text>
                <Text style={styles.actionSubtitle}>
                  Cancel or change your plan in {Platform.OS === 'ios' ? 'App Store' : 'Play Store'} settings
                </Text>
              </View>
              <ChevronRight color={palette.textMuted} size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}

        {!state.isPremium && (
          <View style={styles.section}>
            <View style={styles.valueCard}>
              <Text style={styles.valueTitle}>Total Value: ${totalValue}/month</Text>
              <Text style={styles.valueSubtitle}>Get it all for just $8.25/month</Text>
            </View>

            <Text style={styles.sectionTitle}>Choose Your Plan</Text>

            <View style={styles.popularBadgeContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.popularBadge}
              >
                <Star color="#FFFFFF" size={12} strokeWidth={2.5} fill="#FFFFFF" />
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </LinearGradient>
            </View>

            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selectedPlan === 'yearly' ? ['#1A1A1A', '#000000'] : ['#FFFFFF', '#FFFFFF']}
                style={styles.planCardGradient}
              >
                {selectedPlan === 'yearly' && (
                  <View style={styles.planSelectedIndicator}>
                    <CheckCircle2 color="#FFD700" size={24} strokeWidth={2.5} fill="#FFD700" />
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <View style={styles.planHeaderLeft}>
                    <Text style={[styles.planName, { color: selectedPlan === 'yearly' ? '#FFFFFF' : palette.textPrimary }]}>
                      Yearly Glow
                    </Text>
                    <View style={styles.savingBadge}>
                      <Text style={[styles.savingBadgeText, { color: selectedPlan === 'yearly' ? '#FFD700' : '#FF6B6B' }]}>
                        Save {savingsPercentage}%
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.planPriceRow}>
                  <View>
                    <Text style={[styles.planPrice, { color: selectedPlan === 'yearly' ? '#FFFFFF' : palette.textPrimary }]}>
                      $8.25<Text style={styles.planPeriod}>/mo</Text>
                    </Text>
                    <Text style={[styles.planOriginalPrice, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.5)' : palette.textMuted }]}>
                      $8.99/mo
                    </Text>
                  </View>
                  <View style={styles.planBilledContainer}>
                    <Text style={[styles.planBilledText, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.8)' : palette.textSecondary }]}>
                      Billed $99/year
                    </Text>
                  </View>
                </View>

                <View style={styles.planBenefits}>
                  <View style={styles.planBenefit}>
                    <Check color={selectedPlan === 'yearly' ? '#FFD700' : palette.success} size={16} strokeWidth={3} />
                    <Text style={[styles.planBenefitText, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.9)' : palette.textSecondary }]}>
                      Save $8.88 vs monthly
                    </Text>
                  </View>
                  <View style={styles.planBenefit}>
                    <Check color={selectedPlan === 'yearly' ? '#FFD700' : palette.success} size={16} strokeWidth={3} />
                    <Text style={[styles.planBenefitText, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.9)' : palette.textSecondary }]}>
                      Best value for your glow journey
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.planCard, styles.planCardMonthly, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              <View style={[styles.planCardGradient, { backgroundColor: palette.surface }]}>
                {selectedPlan === 'monthly' && (
                  <View style={styles.planSelectedIndicator}>
                    <CheckCircle2 color={palette.primary} size={24} strokeWidth={2.5} fill={palette.primary} />
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <View style={styles.planHeaderLeft}>
                    <Text style={styles.planName}>Monthly Glow</Text>
                    <Text style={styles.planFlexible}>Flexible</Text>
                  </View>
                </View>
                
                <View style={styles.planPriceRow}>
                  <View>
                    <Text style={styles.planPrice}>
                      $8.99<Text style={styles.planPeriod}>/month</Text>
                    </Text>
                  </View>
                  <View style={styles.planBilledContainer}>
                    <Text style={[styles.planBilledText, { color: palette.textSecondary }]}>
                      Billed monthly
                    </Text>
                  </View>
                </View>

                <View style={styles.planBenefits}>
                  <View style={styles.planBenefit}>
                    <Check color={palette.success} size={16} strokeWidth={3} />
                    <Text style={[styles.planBenefitText, { color: palette.textSecondary }]}>
                      Cancel anytime
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.ctaSection}>
              <TouchableOpacity
                style={[styles.subscribeButton, isProcessing && styles.subscribeButtonDisabled]}
                onPress={() => handleSubscribe(selectedPlan)}
                disabled={isProcessing}
                activeOpacity={0.9}
              >
                <LinearGradient 
                  colors={['#FFD700', '#FFA500']} 
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.subscribeButtonGradient}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#000000" size="small" />
                  ) : (
                    <>
                      <Text style={styles.subscribeButtonText}>Start 7-Day Free Trial</Text>
                      <View style={styles.subscribeArrow}>
                        <ChevronRight color="#000000" size={24} strokeWidth={3} />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.trialInfoContainer}>
                <View style={styles.trialInfoRow}>
                  <Shield color={palette.success} size={16} strokeWidth={3} />
                  <Text style={styles.trialInfo}>
                    Card required • Won&apos;t charge until Day 8
                  </Text>
                </View>
                <View style={styles.trialInfoRow}>
                  <Check color={palette.success} size={16} strokeWidth={3} />
                  <Text style={styles.trialInfo}>
                    Free for 7 days, then {selectedPlan === 'yearly' ? '$99/year ($8.25/mo)' : '$8.99/month'}
                  </Text>
                </View>
                <View style={styles.trialInfoRow}>
                  <Check color={palette.success} size={16} strokeWidth={3} />
                  <Text style={styles.trialInfo}>
                    Cancel anytime • No commitment
                  </Text>
                </View>
              </View>

              <View style={styles.trustSignals}>
                <View style={styles.trustSignal}>
                  <Shield color={palette.success} size={16} strokeWidth={2.5} />
                  <Text style={styles.trustSignalText}>Secure Payment</Text>
                </View>
                <View style={styles.trustSignalDivider} />
                <View style={styles.trustSignal}>
                  <Clock color={palette.success} size={16} strokeWidth={2.5} />
                  <Text style={styles.trustSignalText}>Cancel Anytime</Text>
                </View>
                <View style={styles.trustSignalDivider} />
                <View style={styles.trustSignal}>
                  <Heart color={palette.success} size={16} strokeWidth={2.5} />
                  <Text style={styles.trustSignalText}>150K+ Happy Users</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {!state.isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What You&apos;ll Get</Text>
            <View style={styles.featuresGrid}>
              {PREMIUM_FEATURES.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <View key={index} style={styles.featureCard}>
                    <View style={styles.featureIconContainer}>
                      <LinearGradient 
                        colors={['#FFD700', '#FFA500']} 
                        style={styles.featureIcon}
                      >
                        <FeatureIcon color="#FFFFFF" size={20} strokeWidth={2.5} />
                      </LinearGradient>
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                      <Text style={styles.featureValue}>{feature.value}</Text>
                    </View>
                    <CheckCircle2 color={palette.success} size={20} strokeWidth={2.5} />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {state.isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Premium Features</Text>
            <View style={styles.featuresGrid}>
              {PREMIUM_FEATURES.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <View key={index} style={styles.featureCard}>
                    <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.featureIcon}>
                      <FeatureIcon color="#FFFFFF" size={20} strokeWidth={2.5} />
                    </LinearGradient>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                    <CheckCircle2 color={palette.success} size={20} strokeWidth={2.5} />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.legalSection}>
          <Text style={styles.legalText}>
            Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period.{'\n\n'}
            Manage your subscription in your {Platform.OS === 'ios' ? 'App Store' : 'Play Store'} account settings.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>, gradient: ReturnType<typeof getGradient>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.backgroundStart,
    },
    safeHeader: {
      backgroundColor: palette.backgroundStart,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: palette.overlayLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.xxxxl,
    },
    heroSection: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },
    crownContainer: {
      marginBottom: spacing.lg,
    },
    crownGradient: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadow.glow,
    },
    heroTitle: {
      fontSize: 36,
      fontWeight: '900',
      color: palette.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
      letterSpacing: -0.5,
      lineHeight: 42,
    },
    heroSubtitle: {
      fontSize: 17,
      fontWeight: '500',
      color: palette.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
      lineHeight: 24,
    },
    socialProofBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      width: '100%',
      backgroundColor: palette.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadow.card,
    },
    socialProofItem: {
      alignItems: 'center',
    },
    socialProofCount: {
      fontSize: 24,
      fontWeight: '900',
      color: palette.textPrimary,
      marginBottom: spacing.xs / 2,
    },
    socialProofLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    offerBadge: {
      borderRadius: radii.pill,
      overflow: 'hidden',
      ...shadow.medium,
    },
    offerBadgeGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    offerBadgeText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    statusCard: {
      borderRadius: radii.xl,
      padding: spacing.xl,
      marginBottom: spacing.lg,
      marginHorizontal: spacing.lg,
      ...shadow.card,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    statusIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    statusTextContainer: {
      flex: 1,
    },
    statusTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: palette.textPrimary,
      marginBottom: spacing.xs,
    },
    statusSubtitle: {
      fontSize: 16,
      color: palette.textSecondary,
      fontWeight: '600',
    },
    subscriptionDetails: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: palette.borderLight,
      gap: spacing.sm,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    detailLabel: {
      fontSize: 14,
      color: palette.textSecondary,
      fontWeight: '600',
      marginRight: spacing.xs,
    },
    detailValue: {
      fontSize: 14,
      color: palette.textPrimary,
      fontWeight: '700',
      flex: 1,
    },
    section: {
      marginBottom: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: palette.textPrimary,
      marginBottom: spacing.md,
      letterSpacing: 0.3,
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      ...shadow.card,
      borderWidth: 1,
      borderColor: palette.borderLight,
    },
    actionIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: palette.overlayBlush,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    actionContent: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: palette.textPrimary,
      marginBottom: spacing.xs,
    },
    actionSubtitle: {
      fontSize: 13,
      color: palette.textSecondary,
      fontWeight: '500',
    },
    valueCard: {
      backgroundColor: palette.overlayGold,
      borderRadius: radii.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 2,
      borderColor: '#FFD700',
    },
    valueTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: palette.textPrimary,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    valueSubtitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.textSecondary,
      textAlign: 'center',
    },
    popularBadgeContainer: {
      alignItems: 'center',
      marginBottom: -spacing.sm,
      zIndex: 1,
      paddingHorizontal: spacing.lg,
    },
    popularBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: radii.pill,
      ...shadow.card,
    },
    popularBadgeText: {
      fontSize: 11,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: 0.8,
    },
    planCard: {
      marginBottom: spacing.lg,
      borderRadius: radii.xl,
      overflow: 'hidden',
      borderWidth: 3,
      borderColor: 'transparent',
      ...shadow.elevated,
    },
    planCardSelected: {
      borderColor: '#FFD700',
      ...shadow.glow,
    },
    planCardMonthly: {
      marginTop: spacing.md,
    },
    planCardGradient: {
      padding: spacing.xl,
      position: 'relative',
    },
    planSelectedIndicator: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      zIndex: 1,
    },
    planHeader: {
      marginBottom: spacing.md,
    },
    planHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    planName: {
      fontSize: 22,
      fontWeight: '800',
      color: palette.textPrimary,
    },
    savingBadge: {
      backgroundColor: 'rgba(255, 107, 107, 0.15)',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs / 2,
      borderRadius: radii.sm,
    },
    savingBadgeText: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    planFlexible: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    planPriceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: spacing.md,
    },
    planPrice: {
      fontSize: 40,
      fontWeight: '900',
      color: palette.textPrimary,
      letterSpacing: -1.5,
    },
    planPeriod: {
      fontSize: 20,
      fontWeight: '600',
      opacity: 0.7,
    },
    planOriginalPrice: {
      fontSize: 16,
      fontWeight: '600',
      textDecorationLine: 'line-through',
      marginTop: spacing.xs,
    },
    planBilledContainer: {
      alignItems: 'flex-end',
    },
    planBilledText: {
      fontSize: 13,
      fontWeight: '600',
    },
    planBenefits: {
      gap: spacing.sm,
    },
    planBenefit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    planBenefitText: {
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    ctaSection: {
      marginTop: spacing.lg,
    },
    subscribeButton: {
      borderRadius: radii.xl,
      overflow: 'hidden',
      marginBottom: spacing.lg,
      ...shadow.strong,
    },
    subscribeButtonDisabled: {
      opacity: 0.6,
    },
    subscribeButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    subscribeButtonText: {
      fontSize: 19,
      fontWeight: '900',
      color: '#000000',
      letterSpacing: 0.3,
    },
    subscribeArrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    trialInfoContainer: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    trialInfoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    trialInfo: {
      fontSize: 14,
      color: palette.textSecondary,
      lineHeight: 20,
      fontWeight: '500',
      flex: 1,
    },
    trustSignals: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.overlayLight,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    trustSignal: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    trustSignalText: {
      fontSize: 11,
      fontWeight: '700',
      color: palette.textSecondary,
    },
    trustSignalDivider: {
      width: 1,
      height: 16,
      backgroundColor: palette.border,
    },
    featuresGrid: {
      gap: spacing.sm,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: palette.borderLight,
      ...shadow.soft,
    },
    featureIconContainer: {
      marginRight: spacing.md,
    },
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadow.card,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: palette.textPrimary,
      marginBottom: spacing.xs / 2,
    },
    featureDescription: {
      fontSize: 14,
      color: palette.textSecondary,
      fontWeight: '500',
      marginBottom: spacing.xs / 2,
    },
    featureValue: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFD700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    legalSection: {
      marginTop: spacing.lg,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      backgroundColor: palette.overlayLight,
      borderRadius: radii.lg,
    },
    legalText: {
      fontSize: 11,
      color: palette.textMuted,
      lineHeight: 16,
      textAlign: 'center',
    },
    bottomSpacer: {
      height: spacing.xxl,
    },
  });
