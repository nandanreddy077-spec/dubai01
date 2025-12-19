import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image, TouchableOpacity, StatusBar, ScrollView, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useUser } from '@/contexts/UserContext';
import { ChevronRight, Sparkles, Star, Zap, Heart, Camera, TrendingUp, Users, Award, Wand2 } from 'lucide-react-native';
import Logo from '@/components/Logo';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  features: { icon: React.ReactNode; title: string; description: string }[];
  ctaText: string;
  gradientColors: readonly string[];
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Your Glow Journey\nStarts Here',
    subtitle: 'Discover your unique beauty potential with AI-powered insights',
    image: '',
    features: [
      { 
        icon: <Camera size={20} />, 
        title: 'AI Analysis', 
        description: 'Instant skin assessment' 
      },
      { 
        icon: <Wand2 size={20} />, 
        title: 'Personalized', 
        description: 'Plans made for you' 
      },
      { 
        icon: <TrendingUp size={20} />, 
        title: 'Track Progress', 
        description: 'See your transformation' 
      },
    ],
    ctaText: 'Discover Your Glow',
    gradientColors: ['#FDF8F5', '#F9F1EC'],
  },
  {
    id: '2',
    title: 'Beauty That\nEvolves With You',
    subtitle: 'Daily coaching and smart routines that adapt to your lifestyle',
    image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=1080&auto=format&fit=crop',
    features: [
      { 
        icon: <Heart size={20} />, 
        title: 'Daily Care', 
        description: 'Morning & evening routines' 
      },
      { 
        icon: <Award size={20} />, 
        title: 'Rewards', 
        description: 'Earn points & achievements' 
      },
      { 
        icon: <Star size={20} />, 
        title: 'Pro Tips', 
        description: 'Expert beauty advice' 
      },
    ],
    ctaText: 'Start Your Routine',
    gradientColors: ['#FFF5F7', '#FDF0F5'],
  },
  {
    id: '3',
    title: 'Join 100K+\nGlowing Together',
    subtitle: 'Share your journey, inspire others, celebrate authentic beauty',
    image: 'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?q=80&w=1080&auto=format&fit=crop',
    features: [
      { 
        icon: <Users size={20} />, 
        title: 'Community', 
        description: 'Connect & share tips' 
      },
      { 
        icon: <Sparkles size={20} />, 
        title: '7-Day Trial', 
        description: 'All premium features free' 
      },
      { 
        icon: <Zap size={20} />, 
        title: 'Transform', 
        description: 'See results in days' 
      },
    ],
    ctaText: 'Begin Free Trial',
    gradientColors: ['#F9F0FF', '#FFF5F7'],
  },
];

export default function OnboardingScreen() {
  const { setIsFirstTime } = useUser();
  const { theme } = useTheme();
  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState<number>(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0));
  const [floatAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [scaleInAnim] = useState(new Animated.Value(0));
  const [slideInAnim] = useState(new Animated.Value(0));
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  
  useEffect(() => {
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
  }, [sparkleAnim, pulseAnim, floatAnim, rotateAnim]);

  useEffect(() => {
    scaleInAnim.setValue(0);
    slideInAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleInAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(slideInAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, scaleInAnim, slideInAnim]);

  const handleNext = useCallback(async () => {
    const next = index + 1;
    if (next < slides.length) {
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      setIsFirstTime(false);
      router.replace('/login');
    }
  }, [index, width, setIsFirstTime]);

  const handleSkip = useCallback(async () => {
    setIsFirstTime(false);
    router.replace('/login');
  }, [setIsFirstTime]);

  const dotPosition = Animated.divide(scrollX, width);

  const styles = createStyles(palette, height);

  return (
    <ErrorBoundary>
      <View style={styles.container} testID="onboarding-screen">
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />

        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(newIndex);
          }}
        >
          {slides.map((s, i) => {
            const scale = dotPosition.interpolate({
              inputRange: [i - 1, i, i + 1],
              outputRange: [0.85, 1, 0.85],
              extrapolate: 'clamp',
            });

            const floatY = floatAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-10, 10],
            });

            const rotate = rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            });

            const scaleIn = scaleInAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            });

            const slideIn = slideInAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            });
            
            return (
              <View key={s.id} style={[styles.slide, { width }]}>
                <LinearGradient 
                  colors={s.gradientColors as any} 
                  style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.slideContent}>
                  <Animated.View 
                    style={[
                      styles.floatingElement,
                      styles.floatingElement1,
                      {
                        transform: [
                          { translateY: floatY },
                          { rotate },
                        ],
                      },
                    ]}
                  >
                    <LinearGradient 
                      colors={gradient.primary} 
                      style={styles.decorCircle}
                    />
                  </Animated.View>

                  <Animated.View 
                    style={[
                      styles.floatingElement,
                      styles.floatingElement2,
                      {
                        transform: [
                          { translateY: floatAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, -10],
                          }) },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.decorRing} />
                  </Animated.View>
                  
                  <Animated.View 
                    style={[
                      styles.imageSection,
                      { 
                        transform: [
                          { scale: i === index ? scale : 0.9 },
                          { scale: scaleIn },
                        ] 
                      }
                    ]}
                  >
                    <View style={styles.imageContainer}>
                      <View style={styles.imageWrapper}>
                        <LinearGradient 
                          colors={i === 0 ? gradient.primary : i === 1 ? gradient.rose : gradient.lavender} 
                          style={styles.imageBorder}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.imageInner}>
                            {i === 0 ? (
                              <View style={styles.logoContainer}>
                                <Logo size={260} />
                              </View>
                            ) : (
                              <>
                                <Image 
                                  source={{ uri: s.image }} 
                                  style={styles.heroImage} 
                                  resizeMode="cover" 
                                />
                                <LinearGradient 
                                  colors={['transparent', 'rgba(0,0,0,0.2)']} 
                                  style={styles.imageGradient} 
                                />
                              </>
                            )}
                          </View>
                        </LinearGradient>
                        
                        <Animated.View 
                          style={[
                            styles.glowRing,
                            {
                              opacity: pulseAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.2, 0.4],
                              }),
                              transform: [{
                                scale: pulseAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.15],
                                })
                              }]
                            }
                          ]}
                        />
                        <Animated.View 
                          style={[
                            styles.glowRing,
                            styles.glowRing2,
                            {
                              opacity: pulseAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.15, 0.3],
                              }),
                              transform: [{
                                scale: pulseAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1.1, 1.25],
                                })
                              }]
                            }
                          ]}
                        />
                      </View>
                    </View>
                  </Animated.View>

                  <Animated.View 
                    style={[
                      styles.contentSection,
                      {
                        opacity: slideInAnim,
                        transform: [{ translateY: slideIn }],
                      },
                    ]}
                  >
                    <View style={styles.textContent}>
                      <Text style={styles.title}>{s.title}</Text>
                      <Text style={styles.subtitle}>{s.subtitle}</Text>
                    </View>

                    <View style={styles.featuresGrid}>
                      {s.features.map((feature, idx) => (
                        <Animated.View 
                          key={idx}
                          style={[
                            styles.featureCard,
                            {
                              opacity: sparkleAnim.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: idx === 1 ? [0.95, 1, 0.95] : [1, 0.95, 1],
                              }),
                            }
                          ]}
                        >
                          <LinearGradient 
                            colors={[palette.surface, palette.surfaceAlt]} 
                            style={styles.featureCardGradient}
                          >
                            <View style={styles.featureIconContainer}>
                              <LinearGradient 
                                colors={gradient.primary} 
                                style={styles.featureIconBg}
                              >
                                {React.cloneElement(feature.icon as React.ReactElement<any>, {
                                  color: palette.textLight,
                                } as any)}
                              </LinearGradient>
                            </View>
                            <Text style={styles.featureCardTitle}>{feature.title}</Text>
                            <Text style={styles.featureCardDescription}>{feature.description}</Text>
                          </LinearGradient>
                        </Animated.View>
                      ))}
                    </View>
                  </Animated.View>
                </View>
              </View>
            );
          })}
        </Animated.ScrollView>

        <View style={styles.bottomNav}>
          <View style={styles.pagination}>
            {slides.map((_, i) => {
              const opacity = dotPosition.interpolate({
                inputRange: [i - 1, i, i + 1],
                outputRange: [0.25, 1, 0.25],
                extrapolate: 'clamp',
              });
              const scaleAnim = dotPosition.interpolate({
                inputRange: [i - 1, i, i + 1],
                outputRange: [1, 1.4, 1],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View 
                  key={i} 
                  style={[
                    styles.dot,
                    { 
                      opacity,
                      transform: [{ scale: scaleAnim }]
                    }
                  ]} 
                />
              );
            })}
          </View>

          <View style={styles.ctaContainer}>
            <TouchableOpacity 
              onPress={handleNext} 
              style={styles.primaryButton}
              activeOpacity={0.85}
              accessibilityRole="button" 
              testID="onboarding-next"
            >
              <LinearGradient 
                colors={gradient.primary} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={styles.primaryGradient}
              >
                <Sparkles color={palette.textLight} size={22} fill={palette.textLight} />
                <Text style={styles.primaryButtonText}>
                  {slides[index].ctaText}
                </Text>
                <ChevronRight color={palette.textLight} size={24} strokeWidth={3} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleSkip} 
              style={styles.skipButton}
              activeOpacity={0.7}
              accessibilityRole="button" 
              testID="onboarding-skip"
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>

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
        </View>
      </View>
    </ErrorBoundary>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>, height: number) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: palette.backgroundStart 
  },
  slide: { 
    flex: 1,
    position: 'relative',
  },
  slideContent: {
    flex: 1,
    paddingTop: height * 0.08,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  
  floatingElement: {
    position: 'absolute',
    zIndex: 0,
  },
  floatingElement1: {
    top: height * 0.15,
    right: spacing.xl,
  },
  floatingElement2: {
    top: height * 0.25,
    left: spacing.xl,
  },
  decorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.15,
  },
  decorRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: palette.primary,
    opacity: 0.2,
  },
  
  imageSection: {
    alignItems: 'center',
    marginVertical: spacing.lg,
    zIndex: 1,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBorder: {
    padding: 5,
    borderRadius: 160,
    ...shadow.elevated,
  },
  imageInner: {
    width: 260,
    height: 260,
    borderRadius: 130,
    overflow: 'hidden',
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  sparkleContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  heroImage: { 
    width: '100%', 
    height: '100%' 
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  glowRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 3,
    borderColor: palette.primary,
  },
  glowRing2: {
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 2,
  },
  
  contentSection: {
    zIndex: 1,
    paddingBottom: spacing.lg,
  },
  textContent: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -1.2,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: spacing.lg,
  },
  
  featuresGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  featureCard: {
    flex: 1,
    minWidth: '30%',
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  featureCardGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 100,
  },
  featureIconContainer: {
    marginBottom: spacing.xs,
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
  featureCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 14,
    marginBottom: 2,
  },
  featureCardDescription: {
    fontSize: 9,
    fontWeight: '500',
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 12,
  },
  
  bottomNav: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
    gap: spacing.md,
    backgroundColor: 'transparent',
  },
  pagination: { 
    flexDirection: 'row', 
    gap: spacing.sm, 
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
  
  ctaContainer: {
    gap: spacing.md,
  },
  primaryButton: { 
    width: '100%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadow.elevated,
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
    fontWeight: '800', 
    fontSize: 17,
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipButtonText: { 
    color: palette.textMuted, 
    fontSize: 16, 
    fontWeight: '600' 
  },
  
  signinButton: { 
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  signinText: { 
    color: palette.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  signinTextBold: { 
    color: palette.primary, 
    fontWeight: '700' 
  },
});
