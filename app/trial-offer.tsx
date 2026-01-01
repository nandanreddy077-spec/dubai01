import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Sparkles, 
  Camera, 
  Heart, 
  TrendingUp, 
  Users, 
  Star,
  CheckCircle2,
  Lock,
  Crown,
  Zap,
  Shield
} from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Logo from '@/components/Logo';



interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const PREMIUM_FEATURES: Feature[] = [
  {
    icon: <Camera size={24} color="#FFFFFF" strokeWidth={2.5} />,
    title: 'Unlimited AI Scans',
    description: 'Analyze your glow anytime, anywhere',
  },
  {
    icon: <Sparkles size={24} color="#FFFFFF" strokeWidth={2.5} />,
    title: 'Personal AI Coach',
    description: '24/7 beauty guidance & routines',
  },
  {
    icon: <TrendingUp size={24} color="#FFFFFF" strokeWidth={2.5} />,
    title: 'Progress Tracking',
    description: 'Watch your transformation daily',
  },
  {
    icon: <Users size={24} color="#FFFFFF" strokeWidth={2.5} />,
    title: 'Exclusive Community',
    description: 'Join 100K+ glowing members',
  },
  {
    icon: <Heart size={24} color="#FFFFFF" strokeWidth={2.5} />,
    title: 'Custom Skincare Plans',
    description: 'Personalized just for you',
  },
  {
    icon: <Star size={24} color="#FFFFFF" strokeWidth={2.5} />,
    title: 'Expert Style Advice',
    description: 'Look your best every day',
  },
];

export default function TrialOfferScreen() {
  const insets = useSafeAreaInsets();
  const subscription = useSubscription();
  const { processInAppPurchase } = subscription || {};
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Pulse animation for premium badge
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  const handleStartTrial = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      if (Platform.OS === 'web') {
        // Web: Card required - redirect to mobile app
        Alert.alert(
          '💳 Payment Required',
          'To start your 7-day free trial, please download our mobile app and add a payment method. The trial only starts after your card is added.\n\nYour card won\'t be charged until after the 7-day trial period ends.',
          [
            { text: 'OK', style: 'default' },
          ]
        );
        setIsProcessing(false);
        return;
      }

      // Mobile: Process in-app purchase with trial (REQUIRES CARD)
      console.log(`Starting ${selectedPlan} subscription with 7-day trial (card required)...`);
      const result = await processInAppPurchase(selectedPlan);

      if (result.success) {
        // Payment succeeded = card added = trial starts automatically via RevenueCat
        Alert.alert(
          '🎉 Trial Started!',
          `Your 7-day free trial has started! You'll be charged ${
            selectedPlan === 'yearly' ? '$99/year' : '$8.99/month'
          } after the trial ends. Cancel anytime in your device settings.`,
          [
            {
              text: 'Start Glowing ✨',
              onPress: () => router.replace('/(tabs)/home'),
            },
          ]
        );
      } else if (result.error === 'STORE_REDIRECT') {
        // User was redirected to store
        console.log('User redirected to store');
      } else {
        const errorMessage = result.cancelled 
          ? 'To start your free trial, please add a payment method. Your card won\'t be charged until after the 7-day trial period ends.'
          : result.error || 'Please add a payment method to start your trial.';
        
        Alert.alert(
          result.cancelled ? 'Payment Required' : 'Payment Required',
          errorMessage,
          [
            { text: 'Maybe Later', style: 'cancel', onPress: () => router.replace('/(tabs)/home') },
            { text: 'Try Again', style: 'default', onPress: () => handleStartTrial() },
          ]
        );
      }
    } catch (error) {
      console.error('Trial start error:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect. Please check your internet and try again.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => router.replace('/(tabs)/home') },
          { text: 'Retry', onPress: () => handleStartTrial() },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPlan, processInAppPurchase, isProcessing, scaleAnim]);

  const handleSkip = useCallback(() => {
    Alert.alert(
      '⚠️ Limited Access',
      'Without premium, you\'ll have limited scans and features. Start your free trial anytime!',
      [
        { text: 'Start Free Trial', onPress: handleStartTrial, style: 'default' },
        { text: 'Continue Anyway', onPress: () => router.replace('/(tabs)/home'), style: 'cancel' },
      ]
    );
  }, [handleStartTrial]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#FFFFFF', '#FFF5F7', '#FDF0F5']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Logo size={60} />
          </View>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Animated.View 
            style={[
              styles.premiumBadge,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={['#D4A574', '#C8956D']}
              style={styles.premiumBadgeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown size={32} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.heroTitle}>
            $0 - Start Free
          </Text>
          <Text style={styles.heroSubtitle}>
            7 days free, then {selectedPlan === 'yearly' ? '$99/year' : '$8.99/month'}
            {'\n'}
            <Text style={styles.trustSubtext}>
              Card required • Won&apos;t charge until Day 8
            </Text>
          </Text>

          {/* Social Proof */}
          <View style={styles.socialProof}>
            <View style={styles.avatarStack}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.avatar, { marginLeft: i === 1 ? 0 : -12 }]}>
                  <LinearGradient
                    colors={['#FFB6C1', '#FFA07A']}
                    style={styles.avatarGradient}
                  >
                    <Heart size={12} color="#FFFFFF" fill="#FFFFFF" />
                  </LinearGradient>
                </View>
              ))}
            </View>
            <Text style={styles.socialProofText}>
              <Text style={styles.socialProofBold}>12,487 women</Text> started glowing this week
            </Text>
          </View>
        </View>

        {/* Plan Selection */}
        <View style={styles.planSection}>
          <Text style={styles.planSectionTitle}>Choose Your Plan</Text>

          {/* Yearly Plan */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedPlan === 'yearly' ? ['#1A1A1A', '#000000'] : ['#FFFFFF', '#FFFFFF']}
              style={styles.planCardGradient}
            >
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>MOST POPULAR 🔥</Text>
              </View>
              <View style={styles.planContent}>
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, { color: selectedPlan === 'yearly' ? '#FFFFFF' : '#1A1A1A' }]}>
                    Yearly Glow
                  </Text>
                  <View style={[styles.checkCircle, { backgroundColor: selectedPlan === 'yearly' ? '#FFFFFF' : 'transparent' }]}>
                    {selectedPlan === 'yearly' && <CheckCircle2 size={20} color="#D4A574" strokeWidth={3} />}
                  </View>
                </View>
                <Text style={[styles.planPrice, { color: selectedPlan === 'yearly' ? '#FFFFFF' : '#1A1A1A' }]}>
                  $99<Text style={styles.planPeriod}>/year</Text>
                </Text>
                <Text style={[styles.planSaving, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.9)' : '#D4A574' }]}>
                  Save $8.88 • Just $8.25/month
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
          >
            <View style={[styles.planCardGradient, { backgroundColor: '#FFFFFF' }]}>
              <View style={styles.planContent}>
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>Monthly Glow</Text>
                  <View style={styles.checkCircle}>
                    {selectedPlan === 'monthly' && <CheckCircle2 size={20} color="#D4A574" strokeWidth={3} />}
                  </View>
                </View>
                <Text style={styles.planPrice}>
                  $8.99<Text style={styles.planPeriod}>/month</Text>
                </Text>
                <Text style={[styles.planSaving, { color: '#666666' }]}>
                  Flexible billing
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresSectionTitle}>Everything Included</Text>
          <View style={styles.featuresGrid}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <LinearGradient
                  colors={['#D4A574', '#C8956D']}
                  style={styles.featureIcon}
                >
                  {feature.icon}
                </LinearGradient>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Trust Indicators */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <Shield size={16} color="#4CAF50" strokeWidth={2.5} />
            <Text style={styles.trustText}>Card required • Won&apos;t charge until Day 8</Text>
          </View>
          <View style={styles.trustItem}>
            <Lock size={16} color="#2196F3" strokeWidth={2.5} />
            <Text style={styles.trustText}>Cancel anytime • No commitment</Text>
          </View>
          <View style={styles.trustItem}>
            <Zap size={16} color="#FF9800" strokeWidth={2.5} />
            <Text style={styles.trustText}>Instant access • Secure payment</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16 }]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartTrial}
            disabled={isProcessing}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.startButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Sparkles size={22} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
              <Text style={styles.startButtonText}>
                {isProcessing ? 'Processing...' : 'Start Free Trial'}
              </Text>
              <View style={styles.buttonBadge}>
                <Text style={styles.buttonBadgeText}>7 DAYS</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.trialInfo}>
          Card required to start trial. Free for 7 days, then {selectedPlan === 'yearly' ? '$99 charged yearly' : '$8.99 charged monthly'}.{'\n'}
          Cancel anytime in device settings. No commitment.
        </Text>

        <Text style={styles.legalText}>
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666666',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  premiumBadge: {
    marginBottom: 24,
    shadowColor: '#D4A574',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  premiumBadgeGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  trustSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 8,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialProofText: {
    fontSize: 13,
    color: '#666666',
    flex: 1,
  },
  socialProofBold: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  planSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  planSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  planCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  planCardSelected: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  planCardGradient: {
    padding: 20,
    position: 'relative',
  },
  planBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planContent: {
    paddingTop: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: -1,
  },
  planPeriod: {
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.8,
  },
  planSaving: {
    fontSize: 15,
    fontWeight: '600',
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  featuresGrid: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 24,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  startButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    gap: 12,
  },
  startButtonText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.3,
  },
  buttonBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  buttonBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  trialInfo: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 18,
    fontWeight: '500',
  },
  legalText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    color: '#D4A574',
    fontWeight: '600',
  },
});

