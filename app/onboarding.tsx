import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, StatusBar, TextInput, Easing, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronRight, Sparkles, Star, Zap, Heart, Check, ArrowLeft, Crown, TrendingUp, Users } from 'lucide-react-native';
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
  { id: 'acne', label: 'Acne', emoji: '🔴' },
  { id: 'dryness', label: 'Dryness', emoji: '💧' },
  { id: 'aging', label: 'Fine Lines', emoji: '⏳' },
  { id: 'dark-spots', label: 'Dark Spots', emoji: '⚫' },
  { id: 'redness', label: 'Redness', emoji: '🌹' },
  { id: 'texture', label: 'Texture', emoji: '✨' },
  { id: 'pores', label: 'Large Pores', emoji: '🔍' },
  { id: 'dullness', label: 'Dullness', emoji: '🌙' },
];

const goals = [
  { id: 'clear-skin', label: 'Clear Skin', icon: Sparkles },
  { id: 'anti-aging', label: 'Anti-Aging', icon: Star },
  { id: 'hydration', label: 'Hydration', icon: Heart },
  { id: 'glow', label: 'Natural Glow', icon: Zap },
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
  
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0));
  const [floatAnim] = useState(new Animated.Value(0));
  const [scaleInAnim] = useState(new Animated.Value(0));
  const [slideInAnim] = useState(new Animated.Value(0));
  const [splashFadeIn] = useState(new Animated.Value(0));
  const [splashScale] = useState(new Animated.Value(0.8));
  const [rotateAnim] = useState(new Animated.Value(0));
  const particleAnims = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (loading) return;
      
      if (user && session) {
        console.log('✅ User already authenticated, redirecting to home');
        router.replace('/(tabs)');
        return;
      }
      
      const hasCompletedOnboarding = await AsyncStorage.getItem('@onboarding_completed');
      if (hasCompletedOnboarding === 'true') {
        console.log('⚠️ Onboarding completed, redirecting to login');
        router.replace('/login');
        return;
      }
    };
    
    checkAuthStatus();
  }, [user, session, loading]);
  
  useEffect(() => {
    if (step === -1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.parallel([
        Animated.timing(splashFadeIn, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(splashScale, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      particleAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000 + index * 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 2000 + index * 200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }

    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    
    sparkleAnimation.start();
    pulseAnimation.start();
    floatAnimation.start();
    rotateAnimation.start();
    
    return () => {
      sparkleAnimation.stop();
      pulseAnimation.stop();
      floatAnimation.stop();
      rotateAnimation.stop();
    };
  }, [step, sparkleAnim, pulseAnim, floatAnim, splashFadeIn, splashScale, rotateAnim, particleAnims]);

  useEffect(() => {
    if (step >= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scaleInAnim.setValue(0);
      slideInAnim.setValue(0);

      slideInAnim.setValue(1);

      Animated.parallel([
        Animated.spring(scaleInAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(slideInAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [step, scaleInAnim, slideInAnim]);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setData(prev => ({
      ...prev,
      skinConcerns: prev.skinConcerns.includes(id)
        ? prev.skinConcerns.filter(c => c !== id)
        : [...prev.skinConcerns, id]
    }));
  };

  const toggleGoal = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 10],
  });

  const scaleIn = scaleInAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const slideIn = slideInAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const styles = createStyles(palette, height);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderStep = () => {
    switch(step) {
      case -1:
        return (
          <Animated.View style={[styles.splashContainer, { opacity: splashFadeIn }]}>
            <Animated.View style={[styles.splashContent, { transform: [{ scale: splashScale }] }]}>
              <View style={styles.splashLogoWrapper}>
                <Animated.View style={[styles.splashGlowRing, { transform: [{ rotate: rotation }] }]}>
                  <LinearGradient
                    colors={gradient.gold}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.splashGlowGradient}
                  />
                </Animated.View>
                <Logo size={140} />
              </View>
              
              <View style={styles.splashTextSection}>
                <Text style={styles.splashTitle}>GlowCheck</Text>
                <Text style={styles.splashSubtitle}>Your AI-Powered Beauty Companion</Text>
                <View style={styles.splashTagline}>
                  <Crown size={18} color={palette.gold} strokeWidth={2.5} />
                  <Text style={styles.splashTaglineText}>Unlock Your Best Self</Text>
                </View>
              </View>

              <View style={styles.splashFeatures}>
                <View style={styles.splashFeature}>
                  <View style={styles.splashFeatureIcon}>
                    <Sparkles size={20} color={palette.gold} strokeWidth={2.5} />
                  </View>
                  <View style={styles.splashFeatureText}>
                    <Text style={styles.splashFeatureTitle}>AI-Powered Analysis</Text>
                    <Text style={styles.splashFeatureDesc}>Get instant personalized insights</Text>
                  </View>
                </View>
                <View style={styles.splashFeature}>
                  <View style={styles.splashFeatureIcon}>
                    <TrendingUp size={20} color={palette.gold} strokeWidth={2.5} />
                  </View>
                  <View style={styles.splashFeatureText}>
                    <Text style={styles.splashFeatureTitle}>Track Progress</Text>
                    <Text style={styles.splashFeatureDesc}>See your glow-up journey unfold</Text>
                  </View>
                </View>
                <View style={styles.splashFeature}>
                  <View style={styles.splashFeatureIcon}>
                    <Users size={20} color={palette.gold} strokeWidth={2.5} />
                  </View>
                  <View style={styles.splashFeatureText}>
                    <Text style={styles.splashFeatureTitle}>Join Community</Text>
                    <Text style={styles.splashFeatureDesc}>Connect with beauty enthusiasts</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {particleAnims.map((anim, index) => {
              const angle = (index / particleAnims.length) * Math.PI * 2;
              const radius = width * 0.35;
              const translateY = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -30],
              });
              const particleOpacity = anim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0],
              });
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.particle,
                    {
                      left: width / 2 + Math.cos(angle) * radius,
                      top: height / 2 + Math.sin(angle) * radius,
                      opacity: particleOpacity,
                      transform: [{ translateY }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[palette.gold, 'transparent']}
                    style={styles.particleGradient}
                  />
                </Animated.View>
              );
            })}
          </Animated.View>
        );
      
      case 0:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: slideInAnim, transform: [{ translateY: slideIn }] }]}>
            <View style={styles.logoSection}>
              <Animated.View style={{ transform: [{ scale: scaleIn }] }}>
                <Logo size={120} />
              </Animated.View>
            </View>
            <View style={styles.contentCenter}>
              <Text style={styles.stepTitle}>Transform Your{' \n'}Beauty Journey</Text>
              <Text style={styles.stepSubtitle}>
                Join thousands who unlocked their glow with personalized AI insights
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>Expert</Text>
                  <Text style={styles.statLabel}>AI Tech</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>24/7</Text>
                  <Text style={styles.statLabel}>Access</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>89%</Text>
                  <Text style={styles.statLabel}>See Results</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        );
      
      case 1:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: slideInAnim, transform: [{ translateY: slideIn }] }]}>
            <View style={styles.contentTop}>
              <Text style={styles.stepTitle}>Welcome to Your{' \n'}Glow Journey</Text>
              <Text style={styles.stepSubtitle}>First, what&apos;s your name?</Text>
            </View>
            <View style={styles.inputSection}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Your name"
                  placeholderTextColor={palette.textMuted}
                  value={data.name}
                  onChangeText={(text) => setData(prev => ({ ...prev, name: text }))}
                  autoFocus={false}
                  returnKeyType="next"
                />
              </View>
              <Text style={styles.inputHint}>We&apos;ll use this to personalize your experience</Text>
            </View>
          </Animated.View>
        );
      
      case 2:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: slideInAnim, transform: [{ translateY: slideIn }] }]}>
            <View style={styles.contentTop}>
              <Text style={styles.stepTitle}>Perfect, {data.name}! 👋</Text>
              <Text style={styles.stepSubtitle}>How do you identify? This helps us personalize your experience.</Text>
            </View>
            <View style={styles.optionsGrid}>
              {['Woman', 'Man', 'Non-binary', 'Prefer not to say'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionCard,
                    data.gender === option && styles.optionCardSelected
                  ]}
                  onPress={() => setData(prev => ({ ...prev, gender: option }))}
                  activeOpacity={0.7}
                >
                  {data.gender === option && (
                    <View style={styles.checkBadge}>
                      <Check size={16} color={palette.textLight} strokeWidth={3} />
                    </View>
                  )}
                  <Text style={[
                    styles.optionText,
                    data.gender === option && styles.optionTextSelected
                  ]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );
      
      case 3:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: slideInAnim, transform: [{ translateY: slideIn }] }]}>
            <View style={styles.contentTop}>
              <Text style={styles.stepTitle}>Tell Us Your Age Range</Text>
              <Text style={styles.stepSubtitle}>Age-appropriate skincare is the secret to lasting results</Text>
            </View>
            <View style={styles.optionsGrid}>
              {['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionCard,
                    data.ageRange === option && styles.optionCardSelected
                  ]}
                  onPress={() => setData(prev => ({ ...prev, ageRange: option }))}
                  activeOpacity={0.7}
                >
                  {data.ageRange === option && (
                    <View style={styles.checkBadge}>
                      <Check size={16} color={palette.textLight} strokeWidth={3} />
                    </View>
                  )}
                  <Text style={[
                    styles.optionText,
                    data.ageRange === option && styles.optionTextSelected
                  ]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );
      
      case 4:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: slideInAnim, transform: [{ translateY: slideIn }] }]}>
            <View style={styles.contentTop}>
              <Text style={styles.stepTitle}>What Are Your{' \n'}Skin Goals?</Text>
              <Text style={styles.stepSubtitle}>Choose everything you want to improve—we&apos;ve got you covered</Text>
            </View>
            <View style={styles.concernsGrid}>
              {skinConcerns.map((concern) => (
                <TouchableOpacity
                  key={concern.id}
                  style={[
                    styles.concernCard,
                    data.skinConcerns.includes(concern.id) && styles.concernCardSelected
                  ]}
                  onPress={() => toggleSkinConcern(concern.id)}
                  activeOpacity={0.7}
                >
                  {data.skinConcerns.includes(concern.id) && (
                    <View style={styles.checkBadge}>
                      <Check size={14} color={palette.textLight} strokeWidth={3} />
                    </View>
                  )}
                  <Text style={styles.concernEmoji}>{concern.emoji}</Text>
                  <Text style={[
                    styles.concernText,
                    data.skinConcerns.includes(concern.id) && styles.concernTextSelected
                  ]}>{concern.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );
      
      case 5:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: slideInAnim, transform: [{ translateY: slideIn }] }]}>
            <View style={styles.contentTop}>
              <Text style={styles.stepTitle}>Your Dream{' \n'}Skin Results</Text>
              <Text style={styles.stepSubtitle}>Pick what matters most to you right now</Text>
            </View>
            <View style={styles.goalsContainer}>
              {goals.map((goal) => {
                const IconComponent = goal.icon;
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalCard,
                      data.goals.includes(goal.id) && styles.goalCardSelected
                    ]}
                    onPress={() => toggleGoal(goal.id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={data.goals.includes(goal.id) ? gradient.primary : [palette.surface, palette.surfaceAlt]}
                      style={styles.goalCardGradient}
                    >
                      {data.goals.includes(goal.id) && (
                        <View style={styles.checkBadgeGoal}>
                          <Check size={16} color={palette.textLight} strokeWidth={3} />
                        </View>
                      )}
                      <View style={[
                        styles.goalIcon,
                        data.goals.includes(goal.id) && styles.goalIconSelected
                      ]}>
                        <IconComponent 
                          size={28} 
                          color={data.goals.includes(goal.id) ? palette.textLight : palette.textSecondary}
                          strokeWidth={2}
                        />
                      </View>
                      <Text style={[
                        styles.goalText,
                        data.goals.includes(goal.id) && styles.goalTextSelected
                      ]}>{goal.label}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        );
      
      case 6:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: slideInAnim, transform: [{ translateY: slideIn }] }]}>
            <View style={styles.contentTop}>
              <Text style={styles.stepTitle}>Ready to{' \n'}Transform?</Text>
              <Text style={styles.stepSubtitle}>Your commitment level helps us create your perfect plan</Text>
            </View>
            <View style={styles.commitmentContainer}>
              {[
                { id: 'casual', label: 'Curious Explorer', subtitle: 'Just starting my journey', emoji: '🌱' },
                { id: 'serious', label: 'Results Focused', subtitle: 'Ready for real change', emoji: '🎯' },
                { id: 'dedicated', label: 'All-In Transformer', subtitle: 'Nothing stops me!', emoji: '🔥' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.commitmentCard,
                    data.commitment === option.id && styles.commitmentCardSelected
                  ]}
                  onPress={() => setData(prev => ({ ...prev, commitment: option.id }))}
                  activeOpacity={0.7}
                >
                  <View style={styles.commitmentContent}>
                    <Text style={styles.commitmentEmoji}>{option.emoji}</Text>
                    <View style={styles.commitmentTextContainer}>
                      <Text style={[
                        styles.commitmentLabel,
                        data.commitment === option.id && styles.commitmentLabelSelected
                      ]}>{option.label}</Text>
                      <Text style={styles.commitmentSubtitle}>{option.subtitle}</Text>
                    </View>
                  </View>
                  {data.commitment === option.id && (
                    <View style={styles.checkBadgeCommitment}>
                      <Check size={16} color={palette.textLight} strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        );
      
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <View style={styles.container} testID="onboarding-screen">
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
        <LinearGradient 
          colors={[palette.backgroundStart, palette.backgroundEnd]} 
          style={StyleSheet.absoluteFillObject}
        />

        <Animated.View 
          style={[
            styles.floatingElement,
            styles.floatingElement1,
            { transform: [{ translateY: floatY }] },
          ]}
        >
          <LinearGradient 
            colors={gradient.gold} 
            style={styles.decorCircle}
          />
        </Animated.View>

        <Animated.View 
          style={[
            styles.floatingElement,
            styles.floatingElement2,
            { transform: [{ translateY: floatAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, -10],
            }) }] },
          ]}
        >
          <View style={styles.decorRing} />
        </Animated.View>

        <View style={styles.header}>
          {step >= 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
              <ArrowLeft size={24} color={palette.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          )}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: step === -1 ? '0%' : `${((step + 1) / 7) * 100}%` }
                ]} 
              >
                <LinearGradient 
                  colors={gradient.primary} 
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            </View>
            <Text style={styles.progressText}>{step + 1} of 7</Text>
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {renderStep()}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <TouchableOpacity 
            onPress={handleNext} 
            style={[
              styles.primaryButton,
              !canProceed() && styles.primaryButtonDisabled
            ]}
            activeOpacity={0.85}
            disabled={!canProceed()}
            testID="onboarding-next"
          >
            <LinearGradient 
              colors={canProceed() ? gradient.primary : [palette.disabled, palette.disabled]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }} 
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryButtonText}>
                {step === -1 ? 'Start Your Journey' : step === 6 ? 'Complete' : 'Continue'}
              </Text>
              <ChevronRight color={palette.textLight} size={24} strokeWidth={3} />
            </LinearGradient>
          </TouchableOpacity>

          {step === -1 && (
            <TouchableOpacity 
              style={styles.signinButton} 
              onPress={() => router.replace('/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.signinText}>
                Already have an account?{' '}
                <Text style={styles.signinTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ErrorBoundary>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>, height: number) => StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  splashContent: {
    alignItems: 'center',
    gap: spacing.xxxl + spacing.lg,
  },
  splashLogoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashGlowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    opacity: 0.3,
  },
  splashGlowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
  },
  splashTextSection: {
    alignItems: 'center',
    gap: spacing.md,
  },
  splashTitle: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: palette.textPrimary,
    letterSpacing: -2,
    textAlign: 'center',
  },
  splashSubtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: palette.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  splashTagline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: palette.overlayGold,
    borderRadius: radii.pill,
  },
  splashTaglineText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: palette.gold,
    letterSpacing: 0.5,
  },
  splashFeatures: {
    width: '100%',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  splashFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  splashFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.overlayGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashFeatureText: {
    flex: 1,
    gap: spacing.xs,
  },
  splashFeatureTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  splashFeatureDesc: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: palette.textSecondary,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  particleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  container: { 
    flex: 1, 
  },
  floatingElement: {
    position: 'absolute',
    zIndex: 0,
  },
  floatingElement1: {
    top: height * 0.15,
    right: -40,
  },
  floatingElement2: {
    top: height * 0.5,
    left: -30,
  },
  decorCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.1,
  },
  decorRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: palette.gold,
    opacity: 0.15,
  },
  header: {
    paddingTop: spacing.xxl + 20,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  progressContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: palette.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: palette.textMuted,
    letterSpacing: 0.5,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    minHeight: '100%',
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 400,
  },
  contentCenter: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  contentTop: {
    marginBottom: spacing.xxxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -1,
    lineHeight: 38,
  },
  stepSubtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500' as const,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: palette.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: palette.divider,
  },
  inputSection: {
    gap: spacing.md,
  },
  inputWrapper: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: palette.border,
    ...shadow.soft,
  },
  textInput: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg + 4,
    fontSize: 17,
    fontWeight: '600' as const,
    color: palette.textPrimary,
  },
  inputHint: {
    fontSize: 13,
    color: palette.textMuted,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  optionsGrid: {
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.lg + 4,
    borderWidth: 2,
    borderColor: palette.border,
    ...shadow.soft,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primary,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: palette.textLight,
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  concernsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  concernCard: {
    width: '47%',
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.soft,
    position: 'relative',
  },
  concernCardSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.surfaceAlt,
  },
  concernEmoji: {
    fontSize: 32,
  },
  concernText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    textAlign: 'center',
  },
  concernTextSelected: {
    color: palette.primary,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  goalCard: {
    width: '47%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadow.medium,
  },
  goalCardSelected: {
    ...shadow.glow,
  },
  goalCardGradient: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 140,
    position: 'relative',
  },
  checkBadgeGoal: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  goalText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    textAlign: 'center',
  },
  goalTextSelected: {
    color: palette.textLight,
  },
  commitmentContainer: {
    gap: spacing.md,
  },
  commitmentCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    padding: spacing.lg + 4,
    borderWidth: 2,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.soft,
  },
  commitmentCardSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.surfaceAlt,
  },
  commitmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
  },
  commitmentEmoji: {
    fontSize: 36,
  },
  commitmentTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  commitmentLabel: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: palette.textPrimary,
  },
  commitmentLabelSelected: {
    color: palette.primary,
  },
  commitmentSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: palette.textMuted,
  },
  checkBadgeCommitment: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + spacing.lg,
    gap: spacing.md,
  },
  primaryButton: { 
    width: '100%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadow.medium,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryGradient: { 
    paddingVertical: 20, 
    paddingHorizontal: spacing.xl, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.md, 
    justifyContent: 'center',
  },
  primaryButtonText: { 
    color: palette.textLight, 
    fontWeight: '800' as const, 
    fontSize: 17,
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  signinButton: { 
    alignSelf: 'center',
    paddingVertical: spacing.lg,
  },
  signinText: { 
    color: palette.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  signinTextBold: { 
    color: palette.primary, 
    fontWeight: '700' as const,
  },
});
