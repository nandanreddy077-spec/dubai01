import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import {
  ArrowLeft,
  Crown,
  Heart,
  Sparkles,
  Camera,
  TrendingUp,
  Users,
  Shield,
  CheckCircle2,
  Calendar,
  CreditCard,
  Gift,
  Star,
  Zap,
  Lock,
  ChevronRight,
} from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';

const PREMIUM_FEATURES = [
  {
    icon: Camera,
    title: 'Unlimited Glow Analyses',
    description: 'Scan your glow anytime, anywhere',
  },
  {
    icon: Sparkles,
    title: 'AI Beauty Coach',
    description: 'Personalized beauty guidance 24/7',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description: 'Watch your transformation over time',
  },
  {
    icon: Users,
    title: 'Exclusive Community',
    description: 'Connect with 100K+ glowing members',
  },
  {
    icon: Star,
    title: 'Custom Skincare Plans',
    description: 'Personalized routines just for you',
  },
  {
    icon: Zap,
    title: 'Priority Support',
    description: 'Get help when you need it',
  },
];

export default function BeautyMembershipScreen() {
  const subscription = useSubscription();
  const { state = { isPremium: false, scanCount: 0, maxScansInTrial: 3, hasStartedTrial: false }, inTrial = false, daysLeft = 0, hoursLeft = 0, processInAppPurchase } = subscription || {};
  const { theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette, gradient);

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
        // User was redirected to store - that's fine
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Beauty Membership',
          headerShown: false,
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={palette.textPrimary} size={24} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Beauty Membership</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
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

        {/* Active Subscription Actions */}
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

        {/* Upgrade Section (if not premium) */}
        {!state.isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>

            {/* Yearly Plan */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selectedPlan === 'yearly' ? gradient.primary : ['#FFFFFF', '#FFFFFF']}
                style={styles.planCardGradient}
              >
                <View style={styles.planHeader}>
                  <View>
                    <Text style={[styles.planName, { color: selectedPlan === 'yearly' ? '#FFFFFF' : palette.textPrimary }]}>
                      Yearly Glow
                    </Text>
                    <Text style={[styles.planBadge, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.9)' : palette.champagne }]}>
                      BEST VALUE 🔥
                    </Text>
                  </View>
                  {selectedPlan === 'yearly' && (
                    <CheckCircle2 color="#FFFFFF" size={24} strokeWidth={2.5} />
                  )}
                </View>
                <Text style={[styles.planPrice, { color: selectedPlan === 'yearly' ? '#FFFFFF' : palette.textPrimary }]}>
                  $99<Text style={styles.planPeriod}>/year</Text>
                </Text>
                <Text style={[styles.planSaving, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.9)' : palette.textSecondary }]}>
                  Save $8.88 • Just $8.25/month
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              <View style={[styles.planCardGradient, { backgroundColor: '#FFFFFF' }]}>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>Monthly Glow</Text>
                  {selectedPlan === 'monthly' && (
                    <CheckCircle2 color={palette.primary} size={24} strokeWidth={2.5} />
                  )}
                </View>
                <Text style={styles.planPrice}>
                  $8.99<Text style={styles.planPeriod}>/month</Text>
                </Text>
                <Text style={[styles.planSaving, { color: palette.textSecondary }]}>
                  Flexible billing
                </Text>
              </View>
            </TouchableOpacity>

            {/* Subscribe Button */}
            <TouchableOpacity
              style={[styles.subscribeButton, isProcessing && styles.subscribeButtonDisabled]}
              onPress={() => handleSubscribe(selectedPlan)}
              disabled={isProcessing}
              activeOpacity={0.9}
            >
              <LinearGradient colors={gradient.primary} style={styles.subscribeButtonGradient}>
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Sparkles color="#FFFFFF" size={20} strokeWidth={2.5} />
                    <Text style={styles.subscribeButtonText}>Start Free Trial</Text>
                    <View style={styles.buttonBadge}>
                      <Text style={styles.buttonBadgeText}>7 DAYS</Text>
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.trialInfo}>
              Free for 7 days, then {selectedPlan === 'yearly' ? '$99/year' : '$8.99/month'}.{'\n'}
              Cancel anytime. No commitment.
            </Text>
          </View>
        )}

        {/* Premium Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Features</Text>
          <View style={styles.featuresGrid}>
            {PREMIUM_FEATURES.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <View key={index} style={styles.featureCard}>
                  <LinearGradient colors={gradient.primary} style={styles.featureIcon}>
                    <FeatureIcon color="#FFFFFF" size={20} strokeWidth={2.5} />
                  </LinearGradient>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                  {state.isPremium ? (
                    <CheckCircle2 color={palette.success} size={20} strokeWidth={2.5} />
                  ) : (
                    <Lock color={palette.textMuted} size={20} strokeWidth={2} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Legal Info */}
        <View style={styles.legalSection}>
          <Text style={styles.legalText}>
            Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.{'\n\n'}
            Manage your subscription in your {Platform.OS === 'ios' ? 'App Store' : 'Play Store'} account settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>, gradient: ReturnType<typeof getGradient>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.backgroundStart,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: palette.surface,
      borderBottomWidth: 1,
      borderBottomColor: palette.borderLight,
    },
    backButton: {
      padding: spacing.sm,
      marginLeft: -spacing.sm,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: palette.textPrimary,
      letterSpacing: 0.3,
    },
    headerSpacer: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    statusCard: {
      borderRadius: radii.xl,
      padding: spacing.xl,
      marginBottom: spacing.lg,
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
    planCard: {
      marginBottom: spacing.md,
      borderRadius: radii.xl,
      overflow: 'hidden',
      borderWidth: 3,
      borderColor: 'transparent',
      ...shadow.card,
    },
    planCardSelected: {
      borderColor: palette.primary,
    },
    planCardGradient: {
      padding: spacing.lg,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    planName: {
      fontSize: 20,
      fontWeight: '800',
      color: palette.textPrimary,
    },
    planBadge: {
      fontSize: 11,
      fontWeight: '800',
      marginTop: spacing.xs,
      letterSpacing: 0.5,
    },
    planPrice: {
      fontSize: 36,
      fontWeight: '900',
      color: palette.textPrimary,
      marginBottom: spacing.xs,
      letterSpacing: -1,
    },
    planPeriod: {
      fontSize: 18,
      fontWeight: '600',
      opacity: 0.8,
    },
    planSaving: {
      fontSize: 14,
      fontWeight: '600',
    },
    subscribeButton: {
      borderRadius: radii.lg,
      overflow: 'hidden',
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      ...shadow.elevated,
    },
    subscribeButtonDisabled: {
      opacity: 0.6,
    },
    subscribeButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    subscribeButtonText: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    buttonBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.sm,
    },
    buttonBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    trialInfo: {
      fontSize: 13,
      color: palette.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      fontWeight: '500',
    },
    featuresGrid: {
      gap: spacing.md,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: palette.borderLight,
      ...shadow.card,
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: palette.textPrimary,
      marginBottom: spacing.xs / 2,
    },
    featureDescription: {
      fontSize: 13,
      color: palette.textSecondary,
      fontWeight: '500',
    },
    legalSection: {
      marginTop: spacing.lg,
      padding: spacing.lg,
      backgroundColor: palette.overlayLight,
      borderRadius: radii.lg,
    },
    legalText: {
      fontSize: 12,
      color: palette.textMuted,
      lineHeight: 18,
      textAlign: 'center',
    },
  });

