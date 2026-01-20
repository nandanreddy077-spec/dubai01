import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Lock,
  Sparkles,
  Camera,
  Palette,
  TrendingUp,
  Users,
  CheckCircle,
  Crown,
  Zap,
  X,
  Clock,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';

interface FeaturePaywallProps {
  featureType: 'skin-analysis' | 'style-check' | 'ai-coach' | 'progress' | 'community';
  onDismiss?: () => void;
  showDismiss?: boolean;
  visible?: boolean;
}

const FEATURE_CONFIG = {
  'skin-analysis': {
    icon: Camera,
    title: 'Unlock Skin Analysis',
    subtitle: 'Get AI-powered skin insights',
    features: [
      'Unlimited skin scans',
      '8 detailed beauty scores',
      'Personalized skincare tips',
      'Product recommendations',
      '30-day transformation plan',
    ],
    color: '#FF6B9D',
    gradient: ['#FF6B9D', '#C239B3'] as const,
  },
  'style-check': {
    icon: Palette,
    title: 'Unlock Style Check',
    subtitle: 'AI fashion & outfit analysis',
    features: [
      'Unlimited outfit scans',
      'Style recommendations',
      'Color analysis',
      'Occasion suggestions',
      'Wardrobe insights',
    ],
    color: '#9B59B6',
    gradient: ['#9B59B6', '#667EEA'] as const,
  },
  'ai-coach': {
    icon: Sparkles,
    title: 'Unlock AI Beauty Coach',
    subtitle: '24/7 personalized guidance',
    features: [
      'Unlimited AI conversations',
      'Personalized advice',
      'Product recommendations',
      'Routine optimization',
      'Expert beauty tips',
    ],
    color: '#F59E0B',
    gradient: ['#F59E0B', '#EF4444'] as const,
  },
  'progress': {
    icon: TrendingUp,
    title: 'Unlock Progress Studio',
    subtitle: 'Track your transformation',
    features: [
      'Unlimited photo uploads',
      'AI progress analysis',
      'Before/after comparisons',
      '30-day insights',
      'Habit correlations',
    ],
    color: '#10B981',
    gradient: ['#10B981', '#059669'] as const,
  },
  'community': {
    icon: Users,
    title: 'Unlock Community',
    subtitle: 'Connect & share results',
    features: [
      'Post transformations',
      'Connect with others',
      'Join challenges',
      'Share & get feedback',
      'Exclusive circles',
    ],
    color: '#3B82F6',
    gradient: ['#3B82F6', '#2563EB'] as const,
  },
};

export default function FeaturePaywall({
  featureType,
  onDismiss,
  showDismiss = true,
  visible = true,
}: FeaturePaywallProps) {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  
  const config = FEATURE_CONFIG[featureType];
  const IconComponent = config.icon;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45 });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59 };
        }
        return prev;
      });
    }, 60000);

    return () => {
      pulseLoop.stop();
      clearInterval(timer);
    };
  }, [fadeAnim, slideAnim, scaleAnim, pulseAnim]);

  const handleStartTrial = () => {
    router.push('/start-trial');
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      router.back();
    }
  };

  const styles = createStyles(palette, gradient, config.gradient);

  const content = (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#FAFAFA']}
          style={styles.contentWrapper}
        >
          {showDismiss && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <X color={palette.textMuted} size={20} strokeWidth={2} />
            </TouchableOpacity>
          )}

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <LinearGradient
                colors={config.gradient}
                style={styles.iconBadge}
              >
                <IconComponent color="#FFFFFF" size={32} strokeWidth={2.5} />
              </LinearGradient>

              <View style={styles.lockOverlay}>
                <Lock color={palette.primary} size={20} strokeWidth={2.5} />
              </View>

              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.subtitle}>{config.subtitle}</Text>
            </View>

            <View style={styles.urgencyBanner}>
              <Clock color={palette.rose} size={16} strokeWidth={2.5} />
              <Text style={styles.urgencyText}>
                Limited offer · {timeLeft.hours}h {timeLeft.minutes}m left
              </Text>
            </View>

            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>What You&apos;ll Get:</Text>
              {config.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <CheckCircle color={palette.success} size={20} strokeWidth={2.5} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.priceSection}>
              <View style={styles.priceRow}>
                <Text style={styles.originalPrice}>$14.99/month</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveText}>40% OFF</Text>
                </View>
              </View>
              <Text style={styles.currentPrice}>
                Only <Text style={styles.priceHighlight}>$8.99</Text>/month
              </Text>
            </View>

            <View style={styles.trustSection}>
              <View style={styles.trustItem}>
                <Shield color={palette.success} size={16} strokeWidth={2.5} />
                <Text style={styles.trustText}>7-day free trial</Text>
              </View>
              <View style={styles.trustItem}>
                <Zap color={palette.warning} size={16} strokeWidth={2.5} />
                <Text style={styles.trustText}>Cancel anytime</Text>
              </View>
            </View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleStartTrial}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.ctaGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Crown color="#000" size={22} strokeWidth={2.5} />
                  <View style={styles.ctaContent}>
                    <Text style={styles.ctaMainText}>Start Free Trial</Text>
                    <Text style={styles.ctaSubText}>Card required • Free for 7 days</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.trialInfo}>
              Start your 7-day free trial with full access to all features. Cancel anytime before Day 8 to avoid charges.
            </Text>

            {showDismiss && (
              <TouchableOpacity
                style={styles.maybeLaterButton}
                onPress={handleDismiss}
                activeOpacity={0.7}
              >
                <Text style={styles.maybeLaterText}>Maybe Later</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </View>
  );

  // Always use Modal for mobile to ensure proper overlay
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleDismiss}
      presentationStyle="overFullScreen"
    >
      {content}
    </Modal>
  );
}

const { height: screenHeight } = Dimensions.get('window');

const createStyles = (
  palette: ReturnType<typeof getPalette>,
  gradient: ReturnType<typeof getGradient>,
  featureGradient: readonly [string, string, ...string[]]
) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    maxHeight: screenHeight * 0.85,
    ...shadow.elevated,
  },
  contentWrapper: {
    width: '100%',
  },
  scrollView: {
    maxHeight: screenHeight * 0.75,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 20,
  },
  dismissButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...shadow.card,
  },
  lockOverlay: {
    position: 'absolute',
    top: 52,
    right: '50%',
    marginRight: -38,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.primary,
    ...shadow.card,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.overlayBlush,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.rose,
  },
  urgencyText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.rose,
  },
  featuresSection: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 15,
    color: palette.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: palette.overlayGold,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.gold,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  originalPrice: {
    fontSize: 16,
    color: palette.textMuted,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  saveBadge: {
    backgroundColor: palette.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  saveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  currentPrice: {
    fontSize: 15,
    color: palette.textPrimary,
    fontWeight: '600',
  },
  priceHighlight: {
    fontSize: 24,
    fontWeight: '900',
    color: palette.primary,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  ctaButton: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 28,
    gap: 12,
  },
  ctaContent: {
    alignItems: 'flex-start',
  },
  ctaMainText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 0.3,
  },
  ctaSubText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.7)',
    marginTop: 2,
  },
  trialInfo: {
    fontSize: 12,
    color: palette.textMuted,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  maybeLaterButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textMuted,
  },
});
