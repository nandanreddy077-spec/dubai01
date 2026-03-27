import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, StatusBar, TextInput, Easing, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronRight, Sparkles, Star, Zap, Heart, Check, ArrowLeft, Crown, Award } from 'lucide-react-native';
import Logo from '@/components/Logo';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

interface OnboardingData {
  name: string;
  gender: string;
  ageRange: string;
  skinConcerns: string[];
  goals: string[];
  commitment: string;
}

const skinConcerns = [
  { id: 'acne', label: 'Acne & Blemishes', emoji: '🔴' },
  { id: 'dryness', label: 'Dryness & Flaking', emoji: '💧' },
  { id: 'aging', label: 'Fine Lines & Wrinkles', emoji: '⏳' },
  { id: 'dark-spots', label: 'Dark Spots & Scars', emoji: '⚫' },
  { id: 'redness', label: 'Redness & Sensitivity', emoji: '🌹' },
  { id: 'texture', label: 'Uneven Texture', emoji: '✨' },
  { id: 'pores', label: 'Enlarged Pores', emoji: '🔍' },
  { id: 'dullness', label: 'Dullness & Fatigue', emoji: '🌙' },
];

const goals = [
  { id: 'clear-skin', label: 'Glass Skin', icon: Sparkles, desc: 'Achieve flawless, transparent texture' },
  { id: 'anti-aging', label: 'Youthful Radiance', icon: Star, desc: 'Reverse signs of aging effectively' },
  { id: 'hydration', label: 'Deep Hydration', icon: Heart, desc: 'Restore moisture barrier balance' },
  { id: 'glow', label: 'Natural Glow', icon: Zap, desc: 'Radiate health from within' },
];

const commitmentLevels = [
  { id: 'casual', label: 'The Explorer', subtitle: 'Curious about skincare basics', emoji: '🌱' },
  { id: 'serious', label: 'The Enthusiast', subtitle: 'Ready to build a solid routine', emoji: '✨' },
  { id: 'dedicated', label: 'The Perfectionist', subtitle: 'Committed to flawless results', emoji: '👑' },
];

export default function OnboardingScreen() {
  const { setIsFirstTime } = useUser();
  const { user, session, loading } = useAuth();
  const { theme } = useTheme();
  const { width, height } = Dimensions.get('window');
  const [step, setStep] = useState<number>(-1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    gender: '',
    ageRange: '',
    skinConcerns: [],
    goals: [],
    commitment: '',
  });
  
  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const bgFloatAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const contentSlideAnim = useRef(new Animated.Value(30)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;

  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  // Authentication Check
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (loading) return;
      if (user && session) {
        router.replace('/(tabs)/home');
        return;
      }
      const hasCompletedOnboarding = await AsyncStorage.getItem('@onboarding_completed');
      if (hasCompletedOnboarding === 'true') {
        router.replace('/login');
        return;
      }
    };
    checkAuthStatus();
  }, [user, session, loading]);

  // Background Floating Animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgFloatAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bgFloatAnim, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle logo rotation
    Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Button pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bgFloatAnim, logoRotateAnim, buttonPulseAnim]);

  // Intro Animation
  useEffect(() => {
    if (step === -1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [step, fadeAnim, logoScaleAnim]);

  // Step Transition Animation
  useEffect(() => {
    if (step >= 0) {
      contentFadeAnim.setValue(0);
      contentSlideAnim.setValue(30);
      scaleAnim.setValue(0.95);

      Animated.parallel([
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(contentSlideAnim, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [step, contentFadeAnim, contentSlideAnim, scaleAnim]);

  const handleNext = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 6) {
      setStep(step + 1);
    } else {
      await AsyncStorage.setItem('onboarding_data', JSON.stringify(data));
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      setIsFirstTime(false);
      router.replace('/login');
    }
  }, [step, data, setIsFirstTime]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) {
      setStep(step - 1);
    } else if (step === 0) {
      setStep(-1);
    }
  }, [step]);

  const toggleSkinConcern = (id: string) => {
    Haptics.selectionAsync();
    setData(prev => ({
      ...prev,
      skinConcerns: prev.skinConcerns.includes(id)
        ? prev.skinConcerns.filter(c => c !== id)
        : [...prev.skinConcerns, id]
    }));
  };

  const toggleGoal = (id: string) => {
    Haptics.selectionAsync();
    setData(prev => ({
      ...prev,
      goals: prev.goals.includes(id)
        ? prev.goals.filter(g => g !== id)
        : [...prev.goals, id]
    }));
  };

  const canProceed = () => {
    switch(step) {
      case -1: return true;
      case 0: return true;
      case 1: return data.name.trim().length > 0;
      case 2: return data.gender.length > 0;
      case 3: return data.ageRange.length > 0;
      case 4: return data.skinConcerns.length > 0;
      case 5: return data.goals.length > 0;
      case 6: return data.commitment.length > 0;
      default: return false;
    }
  };

  // Styles
  const styles = createStyles(palette, height, width);

  // Render Helpers
  const renderOption = (label: string, isSelected: boolean, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.optionContent}>
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{label}</Text>
        {isSelected && (
          <View style={styles.checkIcon}>
            <Check size={14} color={palette.textInverse} strokeWidth={3} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch(step) {
      case -1:
        return (
          <View style={styles.splashContainer}>
            <Animated.View style={[styles.splashContent, { opacity: fadeAnim, transform: [{ scale: logoScaleAnim }] }]}>
              <View style={styles.logoWrapper}>
                <Animated.View style={[styles.logoGlow, { 
                  transform: [
                    { rotate: logoRotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                    { scale: bgFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }
                  ] 
                }]}>
                  <LinearGradient colors={gradient.gold} style={StyleSheet.absoluteFillObject} start={{x:0, y:0}} end={{x:1, y:1}} />
                </Animated.View>
                <Logo size={160} />
              </View>
              
              <View style={styles.splashTextContainer}>
                <Text style={styles.appName}>GlowCheck</Text>
                <Text style={styles.appTagline}>Track What Works for YOUR Skin</Text>
                <View style={styles.premiumBadge}>
                  <Crown size={14} color={palette.gold} fill={palette.gold} />
                  <Text style={styles.premiumBadgeText}>PREMIUM EXPERIENCE</Text>
                </View>
              </View>

              <View style={styles.featurePills}>
                <View style={styles.pill}>
                  <Sparkles size={14} color={palette.gold} />
                  <Text style={styles.pillText}>AI Analysis</Text>
                </View>
                <View style={styles.pill}>
                  <Award size={14} color={palette.gold} />
                  <Text style={styles.pillText}>Expert Plans</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        );

      case 0: // Welcome
        return (
          <View style={styles.stepContent}>
            <View style={styles.heroImageContainer}>
              <Logo size={120} />
              <View style={styles.heroBadge}>
                <Award size={16} color={palette.gold} />
                <Text style={styles.heroBadgeText}>#1 Beauty AI</Text>
              </View>
            </View>
            <Text style={styles.title}>Discover What Works{"\n"}for YOUR Skin</Text>
            <Text style={styles.subtitle}>
              Track your journey, spot patterns, and see real results with consistent progress tracking.
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>30 Day</Text>
                <Text style={styles.statLabel}>Tracking</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>Daily</Text>
                <Text style={styles.statLabel}>Progress</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>Real</Text>
                <Text style={styles.statLabel}>Results</Text>
              </View>
            </View>
          </View>
        );

      case 1: // Name
        return (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Let&apos;s Make This Personal</Text>
            <Text style={styles.subtitle}>What should we call you on your journey?</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                placeholderTextColor={palette.textMuted}
                value={data.name}
                onChangeText={(t) => setData(p => ({ ...p, name: t }))}
                autoFocus
              />
            </View>
          </View>
        );

      case 2: // Gender
        return (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Personal Profile</Text>
            <Text style={styles.subtitle}>To tailor your analysis perfectly.</Text>
            <View style={styles.optionsList}>
              {['Woman', 'Man', 'Non-binary', 'Prefer not to say'].map(opt => 
                renderOption(opt, data.gender === opt, () => setData(p => ({ ...p, gender: opt })))
              )}
            </View>
          </View>
        );

      case 3: // Age
        return (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Age Range</Text>
            <Text style={styles.subtitle}>Skincare needs evolve with time.</Text>
            <View style={styles.optionsList}>
              {['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'].map(opt => 
                renderOption(opt, data.ageRange === opt, () => setData(p => ({ ...p, ageRange: opt })))
              )}
            </View>
          </View>
        );

      case 4: // Concerns
        return (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Target Your Troubles</Text>
            <Text style={styles.subtitle}>Select areas you&apos;d like to improve.</Text>
            <View style={styles.grid}>
              {skinConcerns.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.gridItem, data.skinConcerns.includes(c.id) && styles.gridItemSelected]}
                  onPress={() => toggleSkinConcern(c.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.gridEmoji}>{c.emoji}</Text>
                  <Text style={[styles.gridLabel, data.skinConcerns.includes(c.id) && styles.gridLabelSelected]}>
                    {c.label}
                  </Text>
                  {data.skinConcerns.includes(c.id) && (
                    <View style={styles.checkBadge}>
                      <Check size={10} color={palette.textInverse} strokeWidth={4} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 5: // Goals
        return (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Your Aspirations</Text>
            <Text style={styles.subtitle}>What does your dream skin look like?</Text>
            <View style={styles.cardsList}>
              {goals.map(g => {
                const Icon = g.icon;
                const isSelected = data.goals.includes(g.id);
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.card, isSelected && styles.cardSelected]}
                    onPress={() => toggleGoal(g.id)}
                    activeOpacity={0.9}
                  >
                    <View style={[styles.cardIcon, isSelected && styles.cardIconSelected]}>
                      <Icon size={24} color={isSelected ? palette.gold : palette.textSecondary} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{g.label}</Text>
                      <Text style={styles.cardDesc}>{g.desc}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.cardCheck}>
                        <Check size={16} color={palette.textInverse} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 6: // Commitment
        return (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Commitment Level</Text>
            <Text style={styles.subtitle}>How dedicated are you to your transformation?</Text>
            <View style={styles.cardsList}>
              {commitmentLevels.map(c => {
                const isSelected = data.commitment === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.bigCard, isSelected && styles.bigCardSelected]}
                    onPress={() => setData(p => ({ ...p, commitment: c.id }))}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.bigCardEmoji}>{c.emoji}</Text>
                    <View style={styles.bigCardContent}>
                      <Text style={[styles.bigCardTitle, isSelected && styles.bigCardTitleSelected]}>{c.label}</Text>
                      <Text style={styles.bigCardSubtitle}>{c.subtitle}</Text>
                    </View>
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const translateY = bgFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20]
  });

  const translateYReverse = bgFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20]
  });

  return (
    <ErrorBoundary>
      <View style={styles.container} testID="onboarding-screen">
        <StatusBar barStyle="dark-content" />
        {/* Cinematic Background */}
        <LinearGradient
          colors={[palette.background, palette.surfaceAlt, '#FDFBF7']}
          style={StyleSheet.absoluteFillObject}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
        />
        
        {/* Decorative Elements */}
        <Animated.View style={[styles.orb, styles.orb1, { transform: [{ translateY }] }]} />
        <Animated.View style={[styles.orb, styles.orb2, { transform: [{ translateY: translateYReverse }] }]} />

        {/* Header */}
        <View style={styles.header}>
          {step > -1 && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={palette.textPrimary} />
            </TouchableOpacity>
          )}
          {step > -1 && (
             <View style={styles.progressBarContainer}>
               <View style={[styles.progressBarFill, { width: `${((step + 1) / 7) * 100}%` }]} />
             </View>
          )}
        </View>

        {/* Content Area */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View 
              style={[
                styles.contentWrapper, 
                step >= 0 && { 
                  opacity: contentFadeAnim, 
                  transform: [
                    { translateY: contentSlideAnim }, 
                    { scale: scaleAnim }
                  ] 
                }
              ]}
            >
              {renderContent()}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer */}
        <View style={styles.footer}>
          <Animated.View style={canProceed() ? { transform: [{ scale: buttonPulseAnim }] } : {}}>
            <TouchableOpacity 
              style={[styles.primaryButton, !canProceed() && styles.primaryButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed()}
              activeOpacity={0.9}
              testID="onboarding-next"
            >
              <LinearGradient
                colors={canProceed() ? [palette.textPrimary, '#2A2A2A'] : [palette.disabled, palette.disabled]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>
                  {step === -1 ? 'Start Your Journey' : step === 6 ? 'Complete Profile' : 'Continue'}
                </Text>
                <ChevronRight size={20} color={palette.textInverse} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {step === -1 && (
            <TouchableOpacity 
              style={styles.loginLink}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.loginText}>Already a member? <Text style={styles.loginTextBold}>Log In</Text></Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ErrorBoundary>
  );
}

const createStyles = (palette: any, height: number, width: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.4,
    backgroundColor: palette.gold,
    // Note: blurRadius is not standard on View, using low opacity for soft look
  },
  orb1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.2,
    right: -width * 0.2,
    backgroundColor: 'rgba(212, 165, 116, 0.15)',
  },
  orb2: {
    width: width,
    height: width,
    bottom: -width * 0.3,
    left: -width * 0.3,
    backgroundColor: 'rgba(201, 175, 233, 0.1)',
  },
  header: {
    height: 100,
    paddingTop: 50,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    backgroundColor: palette.border,
    borderRadius: 2,
    marginLeft: spacing.lg,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: palette.gold,
    borderRadius: 2,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxxl,
    marginTop: -40,
  },
  splashContent: {
    alignItems: 'center',
    width: '100%',
  },
  logoWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  logoGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    opacity: 0.2,
  },
  splashTextContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    color: palette.textPrimary,
    letterSpacing: -1.5,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  appTagline: {
    fontSize: 18,
    color: palette.textSecondary,
    letterSpacing: 0.5,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.3)',
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.gold,
    letterSpacing: 1,
  },
  featurePills: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: palette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.2)',
    ...shadow.soft,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  stepContent: {
    gap: spacing.xl,
  },
  heroImageContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroBadge: {
    position: 'absolute',
    bottom: -15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.3)',
    ...shadow.soft,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: palette.textPrimary,
    letterSpacing: -1,
    lineHeight: 40,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 17,
    color: palette.textSecondary,
    lineHeight: 24,
    textAlign: 'left',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    padding: spacing.xl,
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.soft,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: palette.divider,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  inputContainer: {
    marginTop: spacing.md,
  },
  input: {
    fontSize: 28,
    fontWeight: '600',
    color: palette.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: palette.gold,
    paddingVertical: spacing.md,
  },
  optionsList: {
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: palette.surface,
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.minimal,
  },
  optionCardSelected: {
    borderColor: palette.gold,
    backgroundColor: '#FFFBF5', // Very light gold tint
    ...shadow.soft,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  optionTextSelected: {
    color: '#9A7D46', // Darker gold/brown
  },
  checkIcon: {
    backgroundColor: palette.gold,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: '47%',
    backgroundColor: palette.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.minimal,
  },
  gridItemSelected: {
    borderColor: palette.gold,
    backgroundColor: '#FFFBF5',
  },
  gridEmoji: {
    fontSize: 32,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
    textAlign: 'center',
  },
  gridLabelSelected: {
    color: '#9A7D46',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: palette.gold,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsList: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: palette.border,
    gap: spacing.md,
    ...shadow.minimal,
  },
  cardSelected: {
    borderColor: palette.gold,
    backgroundColor: '#FFFBF5',
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconSelected: {
    backgroundColor: '#F5E6D3',
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  cardTitleSelected: {
    color: '#9A7D46',
  },
  cardDesc: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  cardCheck: {
    backgroundColor: palette.gold,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigCard: {
    padding: spacing.xl,
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.soft,
  },
  bigCardSelected: {
    borderColor: palette.gold,
    backgroundColor: '#FFFBF5',
    ...shadow.medium,
  },
  bigCardEmoji: {
    fontSize: 36,
  },
  bigCardContent: {
    flex: 1,
    gap: 4,
  },
  bigCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  bigCardTitleSelected: {
    color: '#9A7D46',
  },
  bigCardSubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: palette.gold,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.gold,
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: radii.pill,
    overflow: 'hidden',
    ...shadow.glow,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
    ...shadow.minimal,
  },
  primaryButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.textInverse,
    letterSpacing: 0.5,
  },
  loginLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 15,
    color: palette.textSecondary,
  },
  loginTextBold: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
});
