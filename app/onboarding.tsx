import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image, TouchableOpacity, StatusBar, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useUser } from '@/contexts/UserContext';
import { ChevronRight, Heart, Sparkles, Star, Camera, TrendingUp, Award, Users, Gift, Zap, Eye, EyeOff, Mail, Lock, User as UserIcon, Crown, Check } from 'lucide-react-native';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { startDailyNotifications } from '@/lib/notifications';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeatureIcon {
  icon: any;
  text: string;
  description: string;
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
  const [shimmerAnim] = useState(new Animated.Value(0));
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
          duration: 3500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    );
    
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 5000,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 5000,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    );
    
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
      ])
    );

    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    
    sparkleAnimation.start();
    floatingAnimation.start();
    pulseAnimation.start();
    shimmerAnimation.start();
    
    return () => {
      sparkleAnimation.stop();
      floatingAnimation.stop();
      pulseAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [sparkleAnim, floatingAnim, pulseAnim, shimmerAnim]);

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

  const styles = createStyles(palette);

  const renderMeshGradient = () => {
    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-SCREEN_WIDTH * 2, SCREEN_WIDTH * 2],
    });

    return (
      <View style={styles.meshGradientContainer}>
        <LinearGradient 
          colors={['rgba(255, 223, 234, 0.3)', 'rgba(255, 245, 248, 0.2)']} 
          style={[styles.meshOrb, { top: '10%', left: '10%', width: 250, height: 250 }]}
        />
        <LinearGradient 
          colors={['rgba(239, 216, 255, 0.25)', 'rgba(252, 243, 255, 0.15)']} 
          style={[styles.meshOrb, { top: '30%', right: '5%', width: 280, height: 280 }]}
        />
        <LinearGradient 
          colors={['rgba(255, 236, 217, 0.2)', 'rgba(255, 249, 245, 0.15)']} 
          style={[styles.meshOrb, { bottom: '15%', left: '15%', width: 220, height: 220 }]}
        />
        
        <Animated.View 
          style={[
            styles.shimmerOverlay,
            {
              transform: [{ translateX: shimmerTranslate }]
            }
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      </View>
    );
  };

  const renderScreen1 = () => {
    const features: FeatureIcon[] = [
      { icon: <Camera size={24} strokeWidth={2.5} />, text: 'AI Analysis', description: 'Professional skin insights' },
      { icon: <TrendingUp size={24} strokeWidth={2.5} />, text: 'Track Progress', description: 'See your transformation' },
      { icon: <Award size={24} strokeWidth={2.5} />, text: 'Personalized', description: 'Plans made for you' },
    ];

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={styles.slideContent}>
          <Animated.View style={[
            styles.heroImageContainer,
            {
              transform: [{
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.03],
                })
              }]
            }
          ]}>
            <View style={styles.heroImageBorderContainer}>
              <LinearGradient 
                colors={gradient.primary} 
                style={styles.heroImageBorder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.heroImageInner}>
                  <LinearGradient 
                    colors={['#FFF5F7', '#FFFFFF']} 
                    style={styles.heroGlowBg}
                  >
                    <Heart size={100} color={palette.primary} fill={palette.blush} strokeWidth={1.5} />
                  </LinearGradient>
                </View>
              </LinearGradient>
              
              <Animated.View 
                style={[
                  styles.heroGlowRing,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.2, 0.4],
                    }),
                    transform: [{
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.08],
                      })
                    }]
                  }
                ]}
              />
            </View>
          </Animated.View>

          <View style={styles.textContent}>
            <Animated.View style={{
              transform: [{
                translateY: floatingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -6],
                })
              }]
            }}>
              <Text style={styles.title}>Your Glow Journey{'\n'}Begins Here</Text>
              <Text style={styles.subtitle}>Unlock your radiant potential with AI-powered beauty intelligence</Text>
            </Animated.View>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((feature, idx) => (
              <Animated.View 
                key={idx} 
                style={[
                  styles.premiumFeatureCard,
                  {
                    opacity: sparkleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: idx === 1 ? [0.95, 1, 0.95] : [1, 0.95, 1],
                    }),
                    transform: [{
                      translateY: floatingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, idx === 1 ? -6 : 3],
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.featureCardGlow}>
                  <View style={styles.featureIconWrapper}>
                    <LinearGradient 
                      colors={gradient.primary} 
                      style={styles.featureIconBg}
                    >
                      {React.cloneElement(feature.icon, { color: palette.textLight })}
                    </LinearGradient>
                  </View>
                  <Text style={styles.featureTitle}>{feature.text}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderScreen2 = () => {
    const features: FeatureIcon[] = [
      { icon: <Heart size={24} strokeWidth={2.5} />, text: 'Daily Care', description: 'Morning & evening rituals' },
      { icon: <Gift size={24} strokeWidth={2.5} />, text: 'Rewards', description: 'Exclusive achievements' },
      { icon: <Zap size={24} strokeWidth={2.5} />, text: 'Pro Tips', description: 'Expert beauty secrets' },
    ];

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={styles.slideContent}>
          <Animated.View style={[
            styles.heroImageContainer,
            {
              transform: [{
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.03],
                })
              }]
            }
          ]}>
            <View style={styles.heroImageBorderContainer}>
              <LinearGradient 
                colors={gradient.rose} 
                style={styles.heroImageBorder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.heroImageInner}>
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800&auto=format&fit=crop' }}
                    style={styles.slideImage}
                    resizeMode="cover"
                  />
                </View>
              </LinearGradient>
              
              <Animated.View 
                style={[
                  styles.heroGlowRing,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.2, 0.4],
                    }),
                    transform: [{
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.08],
                      })
                    }]
                  }
                ]}
              />
            </View>
          </Animated.View>

          <View style={styles.textContent}>
            <Animated.View style={{
              transform: [{
                translateY: floatingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -6],
                })
              }]
            }}>
              <Text style={styles.title}>Beauty That{'\n'}Evolves With You</Text>
              <Text style={styles.subtitle}>Personalized coaching and intelligent routines that adapt to your lifestyle</Text>
            </Animated.View>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((feature, idx) => (
              <Animated.View 
                key={idx} 
                style={[
                  styles.premiumFeatureCard,
                  {
                    opacity: sparkleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: idx === 1 ? [0.95, 1, 0.95] : [1, 0.95, 1],
                    }),
                    transform: [{
                      translateY: floatingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, idx === 1 ? -6 : 3],
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.featureCardGlow}>
                  <View style={styles.featureIconWrapper}>
                    <LinearGradient 
                      colors={gradient.rose} 
                      style={styles.featureIconBg}
                    >
                      {React.cloneElement(feature.icon, { color: palette.textLight })}
                    </LinearGradient>
                  </View>
                  <Text style={styles.featureTitle}>{feature.text}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderScreen3 = () => {
    const features: FeatureIcon[] = [
      { icon: <Users size={24} strokeWidth={2.5} />, text: 'Community', description: 'Connect with beauty lovers' },
      { icon: <Crown size={24} strokeWidth={2.5} />, text: '7-Day Trial', description: 'Full premium access' },
      { icon: <Sparkles size={24} strokeWidth={2.5} />, text: 'Transform', description: 'Visible results fast' },
    ];

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <View style={styles.slideContent}>
          <Animated.View style={[
            styles.heroImageContainer,
            {
              transform: [{
                scale: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.03],
                })
              }]
            }
          ]}>
            <View style={styles.heroImageBorderContainer}>
              <LinearGradient 
                colors={gradient.lavender} 
                style={styles.heroImageBorder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.heroImageInner}>
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?q=80&w=800&auto=format&fit=crop' }}
                    style={styles.slideImage}
                    resizeMode="cover"
                  />
                </View>
              </LinearGradient>
              
              <Animated.View 
                style={[
                  styles.heroGlowRing,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.2, 0.4],
                    }),
                    transform: [{
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.08],
                      })
                    }]
                  }
                ]}
              />
            </View>
          </Animated.View>

          <View style={styles.textContent}>
            <Animated.View style={{
              transform: [{
                translateY: floatingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -6],
                })
              }]
            }}>
              <Text style={styles.title}>Join 100K+{'\n'}Glowing Together</Text>
              <Text style={styles.subtitle}>Be part of an exclusive community celebrating authentic beauty</Text>
            </Animated.View>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((feature, idx) => (
              <Animated.View 
                key={idx} 
                style={[
                  styles.premiumFeatureCard,
                  {
                    opacity: sparkleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: idx === 1 ? [0.95, 1, 0.95] : [1, 0.95, 1],
                    }),
                    transform: [{
                      translateY: floatingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, idx === 1 ? -6 : 3],
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.featureCardGlow}>
                  <View style={styles.featureIconWrapper}>
                    <LinearGradient 
                      colors={gradient.lavender} 
                      style={styles.featureIconBg}
                    >
                      {React.cloneElement(feature.icon, { color: palette.textLight })}
                    </LinearGradient>
                  </View>
                  <Text style={styles.featureTitle}>{feature.text}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
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
          <View style={styles.formContainer}>
            <Animated.View style={[
              styles.formIconContainer,
              {
                transform: [{
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  })
                }]
              }
            ]}>
              <LinearGradient 
                colors={gradient.primary} 
                style={styles.formIcon}
              >
                <Crown size={48} color={palette.textLight} strokeWidth={2} />
              </LinearGradient>
            </Animated.View>
            
            <Text style={styles.formTitle}>Begin Your{'\n'}Glow Journey</Text>
            <Text style={styles.formSubtitle}>Join our exclusive community</Text>

            <View style={styles.formCard}>
              <View style={styles.luxuryInputContainer}>
                <UserIcon size={20} color={palette.primary} strokeWidth={2.5} />
                <TextInput
                  style={styles.luxuryInput}
                  placeholder="Full name"
                  placeholderTextColor={palette.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.luxuryInputContainer}>
                <Mail size={20} color={palette.primary} strokeWidth={2.5} />
                <TextInput
                  style={styles.luxuryInput}
                  placeholder="Email address"
                  placeholderTextColor={palette.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.luxuryInputContainer}>
                <Lock size={20} color={palette.primary} strokeWidth={2.5} />
                <TextInput
                  style={[styles.luxuryInput, styles.inputWithIcon]}
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

              <View style={styles.luxuryInputContainer}>
                <Lock size={20} color={palette.primary} strokeWidth={2.5} />
                <TextInput
                  style={[styles.luxuryInput, styles.inputWithIcon]}
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
                style={styles.premiumTermsContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.premiumCheckbox, acceptTerms && styles.premiumCheckboxChecked]}>
                  {acceptTerms && <Check size={14} color={palette.textLight} strokeWidth={3} />}
                </View>
                <Text style={styles.premiumTermsText}>
                  I accept the <Text style={styles.termsLink}>Terms</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={switchToLogin} style={styles.switchTextContainer}>
              <Text style={styles.switchText}>
                Already have an account? <Text style={styles.switchLink}>Sign In</Text>
              </Text>
            </TouchableOpacity>
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
          <View style={styles.formContainer}>
            <Animated.View style={[
              styles.formIconContainer,
              {
                transform: [{
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  })
                }]
              }
            ]}>
              <LinearGradient 
                colors={gradient.primary} 
                style={styles.formIcon}
              >
                <Heart size={48} color={palette.textLight} fill={palette.textLight} strokeWidth={1.5} />
              </LinearGradient>
            </Animated.View>
            
            <Text style={styles.formTitle}>Welcome{'\n'}Back, Beautiful</Text>
            <Text style={styles.formSubtitle}>Continue your glow journey</Text>

            <View style={styles.formCard}>
              <View style={styles.luxuryInputContainer}>
                <Mail size={20} color={palette.primary} strokeWidth={2.5} />
                <TextInput
                  style={styles.luxuryInput}
                  placeholder="Email address"
                  placeholderTextColor={palette.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.luxuryInputContainer}>
                <Lock size={20} color={palette.primary} strokeWidth={2.5} />
                <TextInput
                  style={[styles.luxuryInput, styles.inputWithIcon]}
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

            <TouchableOpacity onPress={switchToSignup} style={styles.switchTextContainer}>
              <Text style={styles.switchText}>
                New to GlowCheck? <Text style={styles.switchLink}>Join Us</Text>
              </Text>
            </TouchableOpacity>
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
      case 3: return isLoading ? 'Creating Account...' : 'Begin My Journey';
      case 4: return isLoading ? 'Signing In...' : 'Welcome Back';
      default: return 'Continue';
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
        {renderMeshGradient()}
        
        <Animated.View 
          style={[
            styles.floatingDecor1,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0.8],
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
          <Sparkles color={palette.primary} size={20} fill={palette.primary} strokeWidth={2} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.floatingDecor2,
            {
              opacity: floatingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 0.9],
              }),
            }
          ]}
        >
          <Star color={palette.blush} size={16} fill={palette.blush} />
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
            {[0, 1, 2, 3, 4].map((i) => {
              const isActive = currentIndex === i;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    isActive && styles.dotActive,
                    {
                      opacity: isActive ? 1 : 0.3,
                    }
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.ctaContainer}>
            {currentIndex < 3 && (
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              onPress={handleNext} 
              style={[styles.mainButton, currentIndex >= 3 && styles.mainButtonFull]}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              <LinearGradient colors={gradient.primary} style={styles.buttonGradient}>
                <Sparkles size={18} color={palette.textLight} fill={palette.textLight} strokeWidth={2.5} />
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
    backgroundColor: '#FFFFFF',
  },
  meshGradientContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  meshOrb: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 1,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH * 2,
  },
  shimmerGradient: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
  },
  slideContent: {
    flex: 1,
    paddingTop: SCREEN_HEIGHT * 0.08,
    paddingHorizontal: spacing.xl,
    paddingBottom: 200,
    justifyContent: 'space-between',
  },
  
  heroImageContainer: {
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  heroImageBorderContainer: {
    position: 'relative',
  },
  heroImageBorder: {
    padding: 4,
    borderRadius: 140,
    ...shadow.elevated,
  },
  heroImageInner: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  heroGlowBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  heroGlowRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: palette.primary,
    top: -20,
    left: -20,
  },
  
  textContent: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: -1.5,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    paddingHorizontal: spacing.sm,
    opacity: 0.85,
  },
  
  featuresContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  premiumFeatureCard: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  featureCardGlow: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: radii.xl,
    paddingVertical: spacing.lg + 4,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadow.elevated,
  },
  featureIconWrapper: {
    marginBottom: spacing.xs,
  },
  featureIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.textSecondary,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 15,
  },
  
  formScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 200,
  },
  formContainer: {
    alignItems: 'center',
  },
  formIconContainer: {
    marginBottom: spacing.xl,
  },
  formIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
  formTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -1.2,
    lineHeight: 42,
  },
  formSubtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: spacing.xxxl,
    opacity: 0.8,
  },
  formCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: radii.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    ...shadow.elevated,
    marginBottom: spacing.xl,
  },
  luxuryInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    height: 58,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  luxuryInput: {
    flex: 1,
    fontSize: 16,
    color: palette.textPrimary,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
  inputWithIcon: {
    paddingRight: spacing.xxxxl,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.lg,
    padding: spacing.sm,
  },
  premiumTermsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  premiumCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: palette.borderLight,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumCheckboxChecked: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  premiumTermsText: {
    flex: 1,
    fontSize: 13,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  termsLink: {
    color: palette.primary,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
  },
  forgotText: {
    fontSize: 14,
    color: palette.primary,
    fontWeight: '700',
  },
  switchTextContainer: {
    paddingVertical: spacing.md,
  },
  switchText: {
    fontSize: 15,
    color: palette.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  switchLink: {
    color: palette.primary,
    fontWeight: '800',
  },
  
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
  dotActive: {
    width: 28,
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
    fontWeight: '700',
    opacity: 0.6,
  },
  mainButton: {
    flex: 1,
    borderRadius: radii.xxl,
    overflow: 'hidden',
    height: 62,
    ...shadow.elevated,
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
    letterSpacing: 0.5,
  },
  floatingDecor1: {
    position: 'absolute',
    top: 80,
    right: 30,
    zIndex: 10,
  },
  floatingDecor2: {
    position: 'absolute',
    top: 140,
    left: 30,
    zIndex: 10,
  },
});
