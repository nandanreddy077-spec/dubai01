import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, Heart, Sparkles, Star, ArrowLeft, Check, Crown } from 'lucide-react-native';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [floatingAnim] = useState(new Animated.Value(0));
  const [shimmerAnim] = useState(new Animated.Value(0));
  const { signUp } = useAuth();
  const { theme } = useTheme();
  
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
    shimmerAnimation.start();
    
    return () => {
      sparkleAnimation.stop();
      floatingAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [sparkleAnim, floatingAnim, shimmerAnim]);

  const handleSignup = async () => {
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
    } else {
      Alert.alert(
        'Welcome to Your Glow Journey! ✨',
        'Account created! Next, add a profile picture to personalize your experience.',
        [{ text: 'Continue', onPress: () => router.replace('/(tabs)') }]
      );
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  const navigateBack = () => {
    router.back();
  };

  const styles = createStyles(palette);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH * 2, SCREEN_WIDTH * 2],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.meshGradientContainer}>
        <LinearGradient 
          colors={['rgba(255, 223, 234, 0.3)', 'rgba(255, 245, 248, 0.2)']} 
          style={[styles.meshOrb, { top: '5%', left: '5%', width: 280, height: 280 }]}
        />
        <LinearGradient 
          colors={['rgba(239, 216, 255, 0.25)', 'rgba(252, 243, 255, 0.15)']} 
          style={[styles.meshOrb, { top: '25%', right: '0%', width: 320, height: 320 }]}
        />
        <LinearGradient 
          colors={['rgba(255, 236, 217, 0.2)', 'rgba(255, 249, 245, 0.15)']} 
          style={[styles.meshOrb, { bottom: '10%', left: '10%', width: 250, height: 250 }]}
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
            colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      </View>
      
      <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
        <View style={styles.backButtonCircle}>
          <ArrowLeft size={22} color={palette.textPrimary} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
      
      <Animated.View 
        style={[
          styles.floatingSparkle1,
          {
            opacity: sparkleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.4, 0.9],
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
        <Sparkles color={palette.primary} size={18} fill={palette.primary} strokeWidth={2} />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.floatingSparkle2,
          {
            opacity: floatingAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
          }
        ]}
      >
        <Star color={palette.blush} size={14} fill={palette.blush} />
      </Animated.View>
        
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.header,
              {
                transform: [{
                  translateY: floatingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  })
                }]
              }
            ]}
          >
            <View style={styles.iconContainer}>
              <LinearGradient 
                colors={gradient.primary} 
                style={styles.iconGradient}
              >
                <Crown size={44} color={palette.textLight} strokeWidth={2} />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Begin Your{'\n'}Glow Journey</Text>
            <Text style={styles.subtitle}>Join our exclusive beauty community</Text>
            
            <View style={styles.badge}>
              <Sparkles color={palette.primary} size={14} fill={palette.primary} strokeWidth={2} />
              <Text style={styles.badgeText}>Premium access included</Text>
            </View>
          </Animated.View>

          <Animated.View 
            style={[
              styles.formCard,
              {
                transform: [{
                  translateY: floatingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  })
                }]
              }
            ]}
          >
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <User size={20} color={palette.primary} strokeWidth={2.5} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={palette.textMuted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
                testID="fullname-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Mail size={20} color={palette.primary} strokeWidth={2.5} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={palette.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="email-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Lock size={20} color={palette.primary} strokeWidth={2.5} />
              </View>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Create password"
                placeholderTextColor={palette.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                testID="password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                testID="toggle-password"
              >
                {showPassword ? (
                  <EyeOff size={20} color={palette.textMuted} strokeWidth={2} />
                ) : (
                  <Eye size={20} color={palette.textMuted} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Lock size={20} color={palette.primary} strokeWidth={2.5} />
              </View>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Confirm password"
                placeholderTextColor={palette.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                testID="confirm-password-input"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
                testID="toggle-confirm-password"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={palette.textMuted} strokeWidth={2} />
                ) : (
                  <Eye size={20} color={palette.textMuted} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.termsContainer} 
              onPress={() => setAcceptTerms(!acceptTerms)}
              activeOpacity={0.8}
              testID="terms-checkbox"
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Check size={14} color={palette.textLight} strokeWidth={3} />}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>I accept the </Text>
                <TouchableOpacity onPress={(e) => {
                  e.stopPropagation();
                  router.push('/terms-of-service');
                }}>
                  <Text style={styles.termsLink}>Terms</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> & </Text>
                <TouchableOpacity onPress={(e) => {
                  e.stopPropagation();
                  router.push('/privacy-policy');
                }}>
                  <Text style={styles.termsLink}>Privacy</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signupButton, (isLoading || !acceptTerms) && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={isLoading || !acceptTerms}
              activeOpacity={0.9}
              testID="signup-button"
            >
              <LinearGradient
                colors={gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signupButtonGradient}
              >
                <Heart color={palette.textLight} size={18} fill={palette.textLight} strokeWidth={2} />
                <Text style={styles.signupButtonText}>
                  {isLoading ? 'Creating Your Journey...' : 'Begin My Journey'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin} testID="login-link">
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH * 2,
  },
  shimmerGradient: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl + 10,
    left: spacing.xl,
    zIndex: 100,
  },
  backButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -1.5,
    lineHeight: 42,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: spacing.lg,
    opacity: 0.85,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    gap: spacing.sm,
    ...shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.primary,
    letterSpacing: 0.3,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: radii.xxl,
    padding: spacing.xl,
    ...shadow.elevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  inputContainer: {
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
  inputIconContainer: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: palette.textPrimary,
    fontWeight: '600',
  },
  passwordInput: {
    paddingRight: spacing.xxxxl,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.lg,
    padding: spacing.sm,
  },
  signupButton: {
    borderRadius: radii.lg,
    height: 60,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  signupButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signupButtonDisabled: {
    opacity: 0.5,
  },
  signupButtonText: {
    color: palette.textLight,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
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
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  termsLink: {
    fontSize: 13,
    color: palette.primary,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: palette.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  loginLink: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  
  floatingSparkle1: {
    position: 'absolute',
    top: 100,
    right: 30,
    zIndex: 10,
  },
  floatingSparkle2: {
    position: 'absolute',
    top: 160,
    left: 30,
    zIndex: 10,
  },
});
