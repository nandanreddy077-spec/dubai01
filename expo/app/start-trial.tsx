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
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Sparkles, 
  Camera, 
  Heart, 
  TrendingUp, 
  CheckCircle2,
  Crown,
  Zap,
  Shield,
  Clock,
  CreditCard,
  X,
  ArrowRight,
} from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';



interface Feature {
  icon: React.ReactNode;
  title: string;
  value: string;
}

const PREMIUM_FEATURES: Feature[] = [
  {
    icon: <Camera size={20} color="#FFFFFF" strokeWidth={2.5} />,
    title: 'Unlimited AI Scans',
    value: '$29/month value',
  },
  {
    icon: <TrendingUp size={20} color="#FFFFFF" strokeWidth={2.5} />,
    title: 'Progress Tracking',
    value: '$19/month value',
  },
  {
    icon: <Heart size={20} color="#FFFFFF" strokeWidth={2.5} />,
    title: 'Custom Plans',
    value: '$39/month value',
  },
];

export default function StartTrialScreen() {
  const insets = useSafeAreaInsets();
  const subscription = useSubscription();
  const { processInAppPurchase } = subscription || {};
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [timerSeconds, setTimerSeconds] = useState(600);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTrial = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);

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
        Alert.alert(
          '💳 Mobile App Required',
          'To subscribe, please use our mobile app from the App Store or Google Play.',
          [{ text: 'OK', style: 'default' }]
        );
        setIsProcessing(false);
        return;
      }

      console.log(`Starting ${selectedPlan} subscription (card required)...`);
      const result = await processInAppPurchase(selectedPlan);

      if (result.success) {
        Alert.alert(
          '🎉 Subscribed!',
          `You're now subscribed! You'll be charged ${
            selectedPlan === 'yearly' ? '$99/year' : '$8.99/month'
          }.\n\nCancel anytime in your device settings.`,
          [
            {
              text: 'Start Glowing ✨',
              onPress: () => router.replace('/(tabs)/home'),
            },
          ]
        );
      } else if (result.error === 'STORE_REDIRECT') {
        console.log('User redirected to store');
      } else {
        const errorMessage = result.cancelled 
          ? "💳 Card Required to Subscribe\n\nAdd your payment method to subscribe. You'll be charged immediately.\n\nCancel anytime in your device settings."
          : result.error || 'Please add a payment method to subscribe.';
        
        Alert.alert(
          result.cancelled ? '💳 Payment Method Required' : 'Unable to Subscribe',
          errorMessage,
          [
            { text: 'Not Now', style: 'cancel', onPress: () => router.back() },
            { text: 'Add Card & Subscribe', style: 'default', onPress: () => handleStartTrial() },
          ]
        );
      }
    } catch (error) {
      console.error('Trial start error:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect. Please check your internet and try again.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
          { text: 'Retry', onPress: () => handleStartTrial() },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPlan, processInAppPurchase, isProcessing, scaleAnim]);

  const handleClose = useCallback(() => {
    Alert.alert(
      '⚠️ Missing Out?',
      'Without a subscription, you\'ll only get 1 free scan. Subscribe to unlock everything!',
      [
        { text: 'Subscribe Now', onPress: handleStartTrial, style: 'default' },
        { text: 'Maybe Later', onPress: () => router.back(), style: 'cancel' },
      ]
    );
  }, [handleStartTrial]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={['#1A1A1A', '#2D1B2E', '#1A1A1A']}
        style={StyleSheet.absoluteFillObject}
      />

      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <View style={styles.closeCircle}>
          <X size={20} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Urgency Timer */}
        <View style={styles.urgencyBar}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.urgencyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Clock size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.urgencyText}>
              Special Offer Expires in {formatTime(timerSeconds)}
            </Text>
          </LinearGradient>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.premiumBadge}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.premiumBadgeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Crown size={40} color="#1A1A1A" fill="#1A1A1A" strokeWidth={2.5} />
            </LinearGradient>
          </View>

          <Text style={styles.heroTitle}>
            You&apos;ve Used Your{'\n'}Free Scan
          </Text>
          <Text style={styles.heroSubtitle}>
            See your results + get unlimited access
          </Text>

          {/* Social Proof */}
          <View style={styles.socialProof}>
            <View style={styles.avatarStack}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.avatar, { marginLeft: i === 1 ? 0 : -10 }]}>
                  <LinearGradient
                    colors={['#FFB6C1', '#FFA07A']}
                    style={styles.avatarGradient}
                  >
                    <Sparkles size={10} color="#FFFFFF" fill="#FFFFFF" />
                  </LinearGradient>
                </View>
              ))}
            </View>
            <Text style={styles.socialProofText}>
              <Text style={styles.socialProofBold}>Join others</Text> transforming their skin today
            </Text>
          </View>
        </View>

        {/* Value Stack */}
        <View style={styles.valueSection}>
          <View style={styles.valueBadge}>
            <Text style={styles.valueBadgeText}>$87/MONTH VALUE</Text>
          </View>
          <Text style={styles.valueTitle}>Everything Included</Text>
          
          <View style={styles.featuresList}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.featureIconGradient}
                  >
                    {feature.icon}
                  </LinearGradient>
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureValue}>{feature.value}</Text>
                </View>
                <CheckCircle2 size={20} color="#4CAF50" strokeWidth={2.5} />
              </View>
            ))}
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
              colors={selectedPlan === 'yearly' ? ['#FFD700', '#FFA500'] : ['#2A2A2A', '#2A2A2A']}
              style={styles.planCardGradient}
            >
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR 🔥</Text>
              </View>
              <View style={styles.planContent}>
                <View style={styles.planHeader}>
                  <View>
                    <Text style={[styles.planName, { color: selectedPlan === 'yearly' ? '#1A1A1A' : '#FFFFFF' }]}>
                      Yearly Plan
                    </Text>
                    <Text style={[styles.planSaving, { color: selectedPlan === 'yearly' ? '#1A1A1A' : '#4CAF50' }]}>
                      Save $8.88/mo
                    </Text>
                  </View>
                  <View style={styles.planPricing}>
                    <Text style={[styles.planPrice, { color: selectedPlan === 'yearly' ? '#1A1A1A' : '#FFFFFF' }]}>
                      $99
                    </Text>
                    <Text style={[styles.planPeriod, { color: selectedPlan === 'yearly' ? 'rgba(26,26,26,0.7)' : 'rgba(255,255,255,0.7)' }]}>
                      /year
                    </Text>
                  </View>
                </View>
                <Text style={[styles.planEquivalent, { color: selectedPlan === 'yearly' ? 'rgba(26,26,26,0.8)' : 'rgba(255,255,255,0.6)' }]}>
                  Just $8.25/month
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
            <View style={[styles.planCardGradient, { backgroundColor: '#2A2A2A' }]}>
              <View style={styles.planContent}>
                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>Monthly Plan</Text>
                    <Text style={[styles.planSaving, { color: 'rgba(255,255,255,0.6)' }]}>
                      Flexible billing
                    </Text>
                  </View>
                  <View style={styles.planPricing}>
                    <Text style={styles.planPrice}>$8.99</Text>
                    <Text style={styles.planPeriod}>/month</Text>
                  </View>
                </View>
                <Text style={styles.planEquivalent}>
                  $8.99/month
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Trust Indicators */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <CreditCard size={16} color="#4CAF50" strokeWidth={2.5} />
            <Text style={styles.trustText}>Secure payment • Instant access</Text>
          </View>
          <View style={styles.trustItem}>
            <Shield size={16} color="#2196F3" strokeWidth={2.5} />
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
              <Text style={styles.startButtonText}>
                {isProcessing ? 'Processing...' : 'Subscribe Now'}
              </Text>
              <View style={styles.subscribeArrow}>
                <ArrowRight size={20} color="#000000" strokeWidth={3} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.trialInfo}>
          💳 Card required to subscribe. You'll be charged {selectedPlan === 'yearly' ? '$99/year' : '$8.99/month'} immediately.{'\n'}
          <Text style={styles.boldText}>Cancel anytime</Text> in device settings.
        </Text>

        <Text style={styles.legalText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
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
  scrollContent: {
    paddingBottom: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgencyBar: {
    marginHorizontal: 20,
    marginTop: 60,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  urgencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  premiumBadge: {
    marginBottom: 24,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
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
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialProofText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  socialProofBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  valueSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  valueBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    marginBottom: 16,
  },
  valueBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
    letterSpacing: 1,
  },
  valueTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featureIcon: {
    marginRight: 12,
  },
  featureIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureValue: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  planSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  planSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
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
    padding: 24,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 10,
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
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planSaving: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  planEquivalent: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  trustSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
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
  trialInfo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  legalText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 14,
  },
  subscribeArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
