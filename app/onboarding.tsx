import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image, TouchableOpacity, StatusBar, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useUser } from '@/contexts/UserContext';
import { ChevronRight, Heart, Sparkles, Star, Camera, TrendingUp, Award, Users, Gift, Zap, Eye, EyeOff, Mail, Lock, User as UserIcon } from 'lucide-react-native';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { startDailyNotifications } from '@/lib/notifications';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeatureIcon {
  icon: any;
  text: string;
  bgColor: string;
}

export default function OnboardingScreen() {
  const { setIsFirstTime } = useUser();
  const { theme } = useTheme();
  const { signUp, signIn } = useAuth();
  const scrollRef = useRef<ScrollView | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [floatingAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0));
  const scrollX = useRef(new Animated.Value(0)).current;
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  React.useEffect(() => {
    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    
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
    
    sparkleAnimation.start();
    floatingAnimation.start();
    pulseAnimation.start();
    
    return () => {
      sparkleAnimation.stop();
      floatingAnimation.stop();
      pulseAnimation.stop();
    };
  }, [sparkleAnim, floatingAnim, pulseAnim]);

  const handleNext = useCallback(async () => {
    if (currentIndex === 3) {
      if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        Alert.alert('Beautiful Journey Awaits', 'Please fill in all fields to begin your radiant transformation.');
        return;
      }
      if (!acceptTerms) {
        Alert.alert('Terms & Conditions', 'Please accept our terms and conditions to continue your beautiful journey.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Almost There', 'Your passwords don\'t match. Let\'s make sure they\'re perfectly aligned.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Secure Your Beauty', 'Please choose a password with at least 6 characters to protect your glow journey.');
        return;
      }
      
      setIsLoading(true);
      const { error } = await signUp(email.trim(), password, fullName.trim());
      setIsLoading(false);
      
      if (error) {
        Alert.alert('Welcome Beautiful', 'Something went wrong, but don\'t worry - your glow journey is still waiting for you. Please try again.');
        return;
      }
      
      setIsFirstTime(false);
      await startDailyNotifications();
      router.replace('/(tabs)');
      return;
    }
    
    if (currentIndex === 4) {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Gentle Reminder', 'Please fill in all fields to continue your beautiful journey.');
        return;
      }
      
      setIsLoading(true);
      const { error } = await signIn(email.trim(), password);
      setIsLoading(false);
      
      if (error) {
        let errorMessage = 'Please check your credentials and try again.';
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        }
        Alert.alert('Sign In Issue', errorMessage);
        return;
      }
      
      setIsFirstTime(false);
      router.replace('/(tabs)');
      return;
    }
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < 5) {
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
    }
  }, [currentIndex, fullName, email, password, confirmPassword, acceptTerms, signUp, signIn, setIsFirstTime]);

  const handleSkip = useCallback(() => {
    setCurrentIndex(3);
    scrollRef.current?.scrollTo({ x: 3 * SCREEN_WIDTH, animated: true });
  }, []);

  const switchToLogin = useCallback(() => {
    setCurrentIndex(4);
    scrollRef.current?.scrollTo({ x: 4 * SCREEN_WIDTH, animated: true });
  }, []);
  
  const switchToSignup = useCallback(() => {
    setCurrentIndex(3);
    scrollRef.current?.scrollTo({ x: 3 * SCREEN_WIDTH, animated: true });
  }, []);

  const getIconComponent = (iconName: string) => {
    const iconProps = { size: 24, color: palette.primary };
    switch (iconName) {
      case 'camera': return <Camera {...iconProps} />;
      case 'sparkles': return <Sparkles {...iconProps} />;
      case 'trending': return <TrendingUp {...iconProps} />;
      case 'heart': return <Heart {...iconProps} />;
      case 'gift': return <Gift {...iconProps} />;
      case 'zap': return <Zap {...iconProps} />;
      case 'users': return <Users {...iconProps} />;
      case 'award': return <Award {...iconProps} />;
      default: return <Star {...iconProps} />;
    }
  };

  const styles = createStyles(palette);

  const renderConcentricCircles = () => (
    <View style={styles.concentricContainer}>
      {[1, 2, 3, 4].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.concentricCircle,
            {
              width: 200 + i * 100,
              height: 200 + i * 100,
              borderRadius: (200 + i * 100) / 2,
              opacity: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.05 + i * 0.02, 0.02 + i * 0.015],
              }),
              transform: [{
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.02],
                }),
              }],
            },
          ]}
        />
      ))}
    </View>
  );

  const renderScreen1 = () => {
    const features: FeatureIcon[] = [
      { icon: 'camera', text: 'AI Analysis', bgColor: palette.blush },
      { icon: 'sparkles', text: 'Personalized Plans', bgColor: palette.peach },
      { icon: 'trending', text: 'Track Progress', bgColor: palette.mint },
    ];

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {renderConcentricCircles()}
        
        <Animated.View style={[styles.iconCircle, {
          transform: [{
            scale: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.05],
            }),
          }],
        }]}>
          <LinearGradient colors={gradient.primary} style={styles.iconCircleGradient}>
            <View style={styles.silhouetteContainer}>
              <Heart size={80} color={palette.textLight} fill={palette.textLight} />
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.content}>
          <Text style={styles.title}>Your Glow Journey{'\n'}Starts Here</Text>
          <Text style={styles.subtitle}>Unlock your radiant potential with personalized beauty insights powered by AI</Text>
          
          <View style={styles.featuresRow}>
            {features.map((feature, idx) => (
              <Animated.View 
                key={idx} 
                style={[
                  styles.featureCard,
                  {
                    transform: [{
                      translateY: floatingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5 + idx * 2],
                      }),
                    }],
                  },
                ]}
              >
                <View style={[styles.featureIconContainer, { backgroundColor: feature.bgColor }]}>
                  {getIconComponent(feature.icon)}
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderScreen2 = () => {
    const features: FeatureIcon[] = [
      { icon: 'heart', text: 'Daily Care', bgColor: palette.rose },
      { icon: 'gift', text: 'Rewards', bgColor: palette.lavender },
      { icon: 'zap', text: 'Pro Tips', bgColor: palette.champagne },
    ];

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {renderConcentricCircles()}
        
        <Animated.View style={[styles.imageCircle, {
          transform: [{
            scale: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.03],
            }),
          }],
        }]}>
          <LinearGradient colors={gradient.rose} style={styles.imageCircleBorder}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800&auto=format&fit=crop' }}
              style={styles.circleImage}
              resizeMode="cover"
            />
          </LinearGradient>
        </Animated.View>

        <View style={styles.content}>
          <Text style={styles.title}>Beauty That{'\n'}Evolves With You</Text>
          <Text style={styles.subtitle}>Your personalized beauty companion that grows with your journey</Text>
          
          <View style={styles.featuresRow}>
            {features.map((feature, idx) => (
              <Animated.View 
                key={idx} 
                style={[
                  styles.featureCard,
                  {
                    transform: [{
                      translateY: floatingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5 + idx * 2],
                      }),
                    }],
                  },
                ]}
              >
                <View style={[styles.featureIconContainer, { backgroundColor: feature.bgColor }]}>
                  {getIconComponent(feature.icon)}
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderScreen3 = () => {
    const features: FeatureIcon[] = [
      { icon: 'users', text: 'Community', bgColor: palette.mint },
      { icon: 'gift', text: 'Free Trial', bgColor: palette.peach },
      { icon: 'award', text: 'Transform', bgColor: palette.blush },
    ];

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        {renderConcentricCircles()}
        
        <Animated.View style={[styles.imageCircle, {
          transform: [{
            scale: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.03],
            }),
          }],
        }]}>
          <LinearGradient colors={gradient.gold} style={styles.imageCircleBorder}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?q=80&w=800&auto=format&fit=crop' }}
              style={styles.circleImage}
              resizeMode="cover"
            />
          </LinearGradient>
        </Animated.View>

        <View style={styles.content}>
          <Text style={styles.title}>Join 100K+{'\n'}Glowing Together</Text>
          <Text style={styles.subtitle}>Be part of a supportive community on the same beautiful journey</Text>
          
          <View style={styles.featuresRow}>
            {features.map((feature, idx) => (
              <Animated.View 
                key={idx} 
                style={[
                  styles.featureCard,
                  {
                    transform: [{
                      translateY: floatingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5 + idx * 2],
                      }),
                    }],
                  },
                ]}
              >
                <View style={[styles.featureIconContainer, { backgroundColor: feature.bgColor }]}>
                  {getIconComponent(feature.icon)}
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderScreen4 = () => {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.slide, { width: SCREEN_WIDTH }]}
      >
        <ScrollView 
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderConcentricCircles()}
          
          <View style={styles.formContent}>
            <View style={styles.formHeader}>
              <Animated.View style={[styles.formIconContainer, {
                transform: [{
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                }],
              }]}>
                <LinearGradient colors={gradient.primary} style={styles.formIconGradient}>
                  <Sparkles size={40} color={palette.textLight} fill={palette.textLight} />
                </LinearGradient>
              </Animated.View>
              
              <Text style={styles.formTitle}>Join GlowCheck</Text>
              <Text style={styles.formSubtitle}>Create your account and start your transformation</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <UserIcon size={20} color={palette.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your beautiful name"
                  placeholderTextColor={palette.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Mail size={20} color={palette.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={palette.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color={palette.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Password"
                  placeholderTextColor={palette.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  {showPassword ? <EyeOff size={20} color={palette.textMuted} /> : <Eye size={20} color={palette.textMuted} />}
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color={palette.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Confirm password"
                  placeholderTextColor={palette.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  {showConfirmPassword ? <EyeOff size={20} color={palette.textMuted} /> : <Eye size={20} color={palette.textMuted} />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.termsContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  I accept the <Text style={styles.termsLink}>Terms</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formFooter}>
              <TouchableOpacity onPress={switchToLogin}>
                <Text style={styles.switchText}>
                  Already have an account? <Text style={styles.switchLink}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderScreen5 = () => {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.slide, { width: SCREEN_WIDTH }]}
      >
        <ScrollView 
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderConcentricCircles()}
          
          <View style={styles.formContent}>
            <View style={styles.formHeader}>
              <Animated.View style={[styles.formIconContainer, {
                transform: [{
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                }],
              }]}>
                <LinearGradient colors={gradient.primary} style={styles.formIconGradient}>
                  <Heart size={40} color={palette.textLight} fill={palette.textLight} />
                </LinearGradient>
              </Animated.View>
              
              <Text style={styles.formTitle}>Welcome to GlowCheck</Text>
              <Text style={styles.formSubtitle}>Sign in to continue your glow journey</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Mail size={20} color={palette.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={palette.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock size={20} color={palette.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputWithIcon]}
                  placeholder="Password"
                  placeholderTextColor={palette.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  {showPassword ? <EyeOff size={20} color={palette.textMuted} /> : <Eye size={20} color={palette.textMuted} />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>Need help remembering?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formFooter}>
              <TouchableOpacity onPress={switchToSignup}>
                <Text style={styles.switchText}>
                  New to our beautiful community? <Text style={styles.switchLink}>Join Us</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const getButtonText = () => {
    switch (currentIndex) {
      case 0: return 'Discover Your Glow';
      case 1: return 'Continue';
      case 2: return 'Begin Free Trial';
      case 3: return isLoading ? 'Creating Your Journey...' : 'Begin My Glow Journey';
      case 4: return isLoading ? 'Signing In...' : 'Continue My Journey';
      default: return 'Continue';
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
        <LinearGradient colors={gradient.hero} style={styles.backgroundGradient} />
        
        <Animated.View 
          style={[
            styles.floatingDecor1,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.7],
              }),
              transform: [{
                rotate: sparkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }
          ]}
        >
          <Sparkles color={palette.primary} size={18} fill={palette.primary} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.floatingDecor2,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0.8],
              }),
            }
          ]}
        >
          <Heart color={palette.blush} size={16} fill={palette.blush} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.floatingDecor3,
            {
              opacity: floatingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 0.9],
              }),
            }
          ]}
        >
          <Star color={palette.champagne} size={14} fill={palette.champagne} />
        </Animated.View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {renderScreen1()}
          {renderScreen2()}
          {renderScreen3()}
          {renderScreen4()}
          {renderScreen5()}
        </ScrollView>

        <View style={styles.bottomContainer}>
          <View style={styles.pagination}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  currentIndex === i && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.ctaContainer}>
            {currentIndex < 3 && (
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              onPress={handleNext} 
              style={[styles.mainButton, currentIndex >= 3 && styles.mainButtonFull]}
              disabled={isLoading}
            >
              <LinearGradient colors={gradient.primary} style={styles.buttonGradient}>
                <Sparkles size={18} color={palette.textLight} fill={palette.textLight} />
                <Text style={styles.buttonText}>{getButtonText()}</Text>
                <ChevronRight size={20} color={palette.textLight} strokeWidth={3} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxxxl,
    paddingBottom: 180,
  },
  concentricContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    top: -100,
  },
  concentricCircle: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: palette.primary,
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: spacing.xxxl,
  },
  iconCircleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.elevated,
  },
  silhouetteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    marginBottom: spacing.xxxl,
  },
  imageCircleBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 110,
    padding: 6,
    ...shadow.elevated,
  },
  circleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 104,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 40,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxxl,
    paddingHorizontal: spacing.md,
    fontWeight: '500',
  },
  featuresRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  featureCard: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    ...shadow.card,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textPrimary,
    textAlign: 'center',
  },
  formScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  formContent: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  formIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: spacing.lg,
  },
  formIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
  formTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    height: 58,
    borderWidth: 1.5,
    borderColor: palette.borderLight,
    ...shadow.card,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: palette.textPrimary,
    fontWeight: '500',
  },
  inputWithIcon: {
    paddingRight: spacing.xxxxl,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.lg,
    padding: spacing.xs,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.borderLight,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  checkmark: {
    color: palette.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  termsLink: {
    color: palette.primary,
    fontWeight: '700',
  },
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 14,
    color: palette.primary,
    fontWeight: '600',
  },
  formFooter: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  switchText: {
    fontSize: 15,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  switchLink: {
    color: palette.primary,
    fontWeight: '700',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.borderLight,
  },
  dotActive: {
    width: 24,
    backgroundColor: palette.primary,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    fontSize: 16,
    color: palette.textMuted,
    fontWeight: '600',
  },
  mainButton: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
    height: 60,
    ...shadow.glow,
  },
  mainButtonFull: {
    flex: 1,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
    color: palette.textLight,
    letterSpacing: 0.3,
  },
  floatingDecor1: {
    position: 'absolute',
    top: 100,
    right: 30,
    zIndex: 10,
  },
  floatingDecor2: {
    position: 'absolute',
    top: 160,
    left: 30,
    zIndex: 10,
  },
  floatingDecor3: {
    position: 'absolute',
    top: 220,
    right: 70,
    zIndex: 10,
  },
});
