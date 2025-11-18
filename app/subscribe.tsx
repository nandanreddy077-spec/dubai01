import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '@/contexts/SubscriptionContext';

import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { 
  Crown, 
  Star, 
  Shield, 
  ArrowLeft,
  Smartphone,
  Heart,
  Sparkles,
  Camera,
  Palette,
  Users,
  TrendingUp,
  Gift
} from 'lucide-react-native';
import { getPalette, getGradient } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function SubscribeScreen() {
  const { startLocalTrial, processInAppPurchase, inTrial, state, setSubscriptionData } = useSubscription();

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const handleStartTrial = useCallback(async () => {
    try {
      await startLocalTrial(3);
      Alert.alert(
        '🌟 Trial Started!', 
        'Your 3-day free trial has started! You can now scan and view results for 3 days.',
        [{ text: 'Start Glowing ✨', style: 'default', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Error', 'Could not start trial. Please try again.');
    }
  }, [startLocalTrial]);

  const handleSubscribe = useCallback(async (type: 'monthly' | 'yearly') => {
    if (isProcessing) return;
    
    if (Platform.OS === 'web') {
      Alert.alert(
        'Mobile App Required',
        'Subscriptions are only available in the mobile app. Please download our app from the App Store or Google Play to subscribe.',
        [{ text: 'Got it', style: 'default' }]
      );
      return;
    }
    
    setIsProcessing(true);
    console.log(`Starting ${type} subscription process...`);
    
    try {
      const result = await processInAppPurchase(type);
      console.log('Purchase result:', result);
      
      if (result.success) {
        Alert.alert(
          '🎉 Welcome to Premium!', 
          `Your ${type} subscription is now active. Enjoy unlimited access to all premium features!`,
          [{ 
            text: 'Start Your Journey ✨', 
            style: 'default', 
            onPress: () => {
              console.log('User confirmed premium activation');
              router.back();
            }
          }]
        );
      } else if (result.error === 'STORE_REDIRECT') {
        Alert.alert(
          '🏪 Redirected to Store', 
          `You've been redirected to the ${Platform.OS === 'ios' ? 'App Store' : 'Google Play Store'} to complete your subscription. After subscribing, return to the app to enjoy premium features!`,
          [{ 
            text: 'Got it! ✨', 
            style: 'default', 
            onPress: () => {
              console.log('User acknowledged store redirect');
              router.back();
            }
          }]
        );
      } else {
        const errorMessage = result.error || 'We couldn\'t process your purchase. Please try again.';
        console.log('Purchase failed:', errorMessage);
        Alert.alert(
          'Purchase Failed', 
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', style: 'default', onPress: () => handleSubscribe(type) }
          ]
        );
      }
    } catch (err) {
      console.error('Subscription error:', err);
      Alert.alert(
        'Connection Error', 
        'Unable to connect to the payment service. Please check your internet connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', style: 'default', onPress: () => handleSubscribe(type) }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, processInAppPurchase, router]);

  const handleManage = useCallback(async () => {
    Alert.alert(
      'Manage Subscription',
      Platform.OS === 'ios' 
        ? 'To manage your subscription, go to Settings > Apple ID > Subscriptions on your device.'
        : 'To manage your subscription, open the Google Play Store app and go to Menu > Subscriptions.',
      [{ text: 'OK', style: 'default' }]
    );
  }, []);

  const handleRestorePurchases = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available on Web',
        'Restore purchases is only available in the mobile app.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setIsProcessing(true);
    console.log('Restoring purchases...');

    try {
      const { paymentService } = await import('@/lib/payments');
      const restored = await paymentService.restorePurchases();
      
      console.log('Restore result:', restored);

      if (restored && restored.length > 0) {
        const activeSubscription = restored[0];
        console.log('Active subscription found:', activeSubscription);
        
        await setSubscriptionData({
          isPremium: true,
          subscriptionType: activeSubscription.productId?.includes('annual') ? 'yearly' : 'monthly',
          subscriptionPrice: activeSubscription.productId?.includes('annual') ? 99 : 8.99,
          nextBillingDate: activeSubscription.expiryDate,
          purchaseToken: activeSubscription.purchaseToken,
          originalTransactionId: activeSubscription.originalTransactionId,
        });
        
        Alert.alert(
          '✨ Purchases Restored!',
          'Your premium subscription has been successfully restored.',
          [{ 
            text: 'Continue', 
            style: 'default',
            onPress: () => router.back()
          }]
        );
      } else {
        console.log('No purchases found to restore');
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any purchases associated with this account. If you believe this is an error, please contact support.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Restore purchases error:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again or contact support if the problem persists.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [setSubscriptionData]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={gradient.hero} 
        style={StyleSheet.absoluteFillObject} 
      />
      
      <Stack.Screen options={{ 
        title: '', 
        headerShown: false
      }} />
      
      {/* Custom Header */}
      <View style={[styles.safeHeader, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <View style={styles.backCircle}>
              <ArrowLeft color={palette.textPrimary} size={20} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Unlock Your Glow</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient 
            colors={gradient.rose} 
            style={styles.heroIcon}
          >
            <Heart color={palette.pearl} size={32} fill={palette.pearl} strokeWidth={2} />
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>
            Start Your Beauty Journey
          </Text>
          <Text style={[styles.heroText, { color: palette.textSecondary }]}>
            3-day free trial, then choose your perfect plan
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <View style={[styles.featureCard, { backgroundColor: palette.surface }]}>
            <LinearGradient colors={gradient.primary} style={styles.featureIconBg}>
              <Camera color={palette.pearl} size={20} strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>Unlimited Scans</Text>
            <Text style={[styles.featureDesc, { color: palette.textMuted }]}>Analyze your glow anytime</Text>
          </View>
          
          <View style={[styles.featureCard, { backgroundColor: palette.surface }]}>
            <LinearGradient colors={gradient.rose} style={styles.featureIconBg}>
              <Sparkles color={palette.pearl} size={20} strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>AI Coach</Text>
            <Text style={[styles.featureDesc, { color: palette.textMuted }]}>Personal beauty guide</Text>
          </View>
          
          <View style={[styles.featureCard, { backgroundColor: palette.surface }]}>
            <LinearGradient colors={gradient.lavender} style={styles.featureIconBg}>
              <Palette color={palette.pearl} size={20} strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>Style Check</Text>
            <Text style={[styles.featureDesc, { color: palette.textMuted }]}>Perfect looks daily</Text>
          </View>
          
          <View style={[styles.featureCard, { backgroundColor: palette.surface }]}>
            <LinearGradient colors={gradient.gold} style={styles.featureIconBg}>
              <Users color={palette.pearl} size={20} strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>Community</Text>
            <Text style={[styles.featureDesc, { color: palette.textMuted }]}>Connect & share</Text>
          </View>
        </View>

        {/* Trial Button */}
        {!state.hasStartedTrial && !state.isPremium && (
          <TouchableOpacity 
            style={styles.trialButton} 
            onPress={handleStartTrial}
            disabled={isProcessing}
            activeOpacity={0.8}
            testID="start-trial-button"
          >
            <LinearGradient 
              colors={gradient.primary} 
              style={styles.buttonGradient}
            >
              <Gift color={palette.textPrimary} size={20} strokeWidth={2.5} />
              <Text style={[styles.buttonText, { color: palette.textPrimary }]}>Start Free Trial</Text>
              <Text style={[styles.buttonSubtext, { color: palette.textPrimary }]}>3 days free • No payment required</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        {/* Trial Status */}
        {(inTrial || state.isPremium) && (
          <View style={[styles.statusContainer, { backgroundColor: palette.surfaceElevated }]}>
            <LinearGradient colors={gradient.gold} style={styles.statusBadge}>
              {state.isPremium ? (
                <Crown color={palette.textPrimary} size={16} strokeWidth={2.5} />
              ) : (
                <Star color={palette.textPrimary} size={16} strokeWidth={2.5} />
              )}
            </LinearGradient>
            <View style={styles.statusContent}>
              <Text style={[styles.statusTitle, { color: palette.textPrimary }]}>
                {state.isPremium ? 'Premium Active' : 'Trial Active'}
              </Text>
              {!state.isPremium && (
                <Text style={[styles.statusText, { color: palette.textSecondary }]}>
                  {state.scanCount}/3 scans used • {state.trialStartedAt ? `${3 - Math.floor((Date.now() - Number(state.trialStartedAt)) / (1000 * 60 * 60 * 24))} days left` : '3 days left'}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Plans Section */}
        <View style={styles.plansSection}>
          <Text style={[styles.plansTitle, { color: palette.textPrimary }]}>Choose Your Plan</Text>
          
          {/* Yearly Plan - Recommended */}
          <TouchableOpacity 
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={selectedPlan === 'yearly' ? gradient.gold : [palette.surface, palette.surface]}
              style={[styles.planGradient, selectedPlan === 'yearly' && styles.selectedPlanGradient]}
            >
              {selectedPlan === 'yearly' && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>MOST POPULAR</Text>
                </View>
              )}
              <View style={styles.planContent}>
                <View style={styles.planHeader}>
                  <View style={[styles.planRadio, { borderColor: selectedPlan === 'yearly' ? palette.pearl : palette.divider }]}>
                    {selectedPlan === 'yearly' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planName, { color: selectedPlan === 'yearly' ? palette.textPrimary : palette.textPrimary }]}>Yearly Glow</Text>
                    <View style={styles.savingBadge}>
                      <Text style={[styles.savingText, { color: selectedPlan === 'yearly' ? palette.textPrimary : palette.gold }]}>Save $7.80</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.planPricing}>
                  <Text style={[styles.planPrice, { color: selectedPlan === 'yearly' ? palette.textPrimary : palette.textPrimary }]}>$99</Text>
                  <Text style={[styles.planPeriod, { color: selectedPlan === 'yearly' ? palette.textSecondary : palette.textMuted }]}>/year</Text>
                </View>
                <Text style={[styles.planEquivalent, { color: selectedPlan === 'yearly' ? palette.textSecondary : palette.textMuted }]}>Just $8.25/month</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity 
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={selectedPlan === 'monthly' ? gradient.rose : [palette.surface, palette.surface]}
              style={[styles.planGradient, selectedPlan === 'monthly' && styles.selectedPlanGradient]}
            >
              <View style={styles.planContent}>
                <View style={styles.planHeader}>
                  <View style={[styles.planRadio, { borderColor: selectedPlan === 'monthly' ? palette.pearl : palette.divider }]}>
                    {selectedPlan === 'monthly' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planName, { color: selectedPlan === 'monthly' ? palette.textPrimary : palette.textPrimary }]}>Monthly Glow</Text>
                    <Text style={[styles.planFlexible, { color: selectedPlan === 'monthly' ? palette.textSecondary : palette.textMuted }]}>Flexible billing</Text>
                  </View>
                </View>
                <View style={styles.planPricing}>
                  <Text style={[styles.planPrice, { color: selectedPlan === 'monthly' ? palette.textPrimary : palette.textPrimary }]}>$8.99</Text>
                  <Text style={[styles.planPeriod, { color: selectedPlan === 'monthly' ? palette.textSecondary : palette.textMuted }]}>/month</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity 
          style={styles.subscribeButton} 
          onPress={() => handleSubscribe(selectedPlan)}
          disabled={isProcessing || state.isPremium}
          activeOpacity={0.8}
          testID="subscribe-button"
        >
          <LinearGradient 
            colors={state.isPremium ? [palette.surfaceAlt, palette.surfaceAlt] : gradient.primary} 
            style={styles.subscribeGradient}
          >
            <Text style={[styles.subscribeText, { color: state.isPremium ? palette.textMuted : palette.textPrimary }]}>
              {state.isPremium ? 'Already Premium' : isProcessing ? 'Processing...' : 'Continue'}
            </Text>
            {!state.isPremium && !isProcessing && (
              <Text style={[styles.subscribePrice, { color: palette.textSecondary }]}>
                {selectedPlan === 'yearly' ? '$99/year after trial' : '$8.99/month after trial'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Benefits */}
        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <Shield color={palette.mint} size={16} strokeWidth={2.5} />
            <Text style={[styles.benefitText, { color: palette.textSecondary }]}>Secure payment</Text>
          </View>
          <View style={styles.benefitItem}>
            <TrendingUp color={palette.lavender} size={16} strokeWidth={2.5} />
            <Text style={[styles.benefitText, { color: palette.textSecondary }]}>Cancel anytime</Text>
          </View>
        </View>

        {/* Restore Purchases */}
        <TouchableOpacity 
          style={styles.restoreButton} 
          onPress={handleRestorePurchases}
          disabled={isProcessing}
          activeOpacity={0.7}
          testID="restore-purchases-button"
        >
          <Shield color={palette.lavender} size={18} strokeWidth={2.5} />
          <Text style={[styles.restoreText, { color: palette.textSecondary }]}>
            {isProcessing ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>

        {/* Manage Subscription */}
        {state.isPremium && (
          <TouchableOpacity style={styles.manageButton} onPress={handleManage} activeOpacity={0.7}>
            <Smartphone color={palette.textMuted} size={18} strokeWidth={2} />
            <Text style={[styles.manageText, { color: palette.textMuted }]}>Manage via {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}</Text>
          </TouchableOpacity>
        )}

        {/* Legal Text */}
        <Text style={[styles.legalText, { color: palette.textMuted }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
          {!state.hasStartedTrial && !state.isPremium ? ' Your 3-day free trial starts immediately. No payment required during trial.' : ''}
          {Platform.OS !== 'web' ? ' Subscription will be charged to your App Store/Play Store account.' : ''}
        </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  safeHeader: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 32,
  },
  featureCard: {
    width: (width - 52) / 2,
    margin: 6,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  trialButton: {
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'column',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  buttonSubtext: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
  plansSection: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  planCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: 'transparent',
  },
  planGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  selectedPlanGradient: {
    borderColor: 'transparent',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planContent: {
    flexDirection: 'column',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  savingBadge: {
    alignSelf: 'flex-start',
  },
  savingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  planFlexible: {
    fontSize: 13,
    fontWeight: '500',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  planPeriod: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  planEquivalent: {
    fontSize: 13,
    fontWeight: '500',
  },
  subscribeButton: {
    marginBottom: 20,
  },
  subscribeGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  subscribeText: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subscribePrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  benefits: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '600',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 12,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  manageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
});