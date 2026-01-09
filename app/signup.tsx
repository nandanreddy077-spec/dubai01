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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, Heart, Sparkles, Star } from 'lucide-react-native';
import Logo from '@/components/Logo';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';
import AppleLogo from '@/components/AppleLogo';
import GoogleLogo from '@/components/GoogleLogo';

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
  const [glowAnim] = useState(new Animated.Value(0));
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const { theme } = useTheme();
  
  const palette = getPalette(theme);
  
  React.useEffect(() => {
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
    
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    
    sparkleAnimation.start();
    floatingAnimation.start();
    glowAnimation.start();
    
    return () => {
      sparkleAnimation.stop();
      floatingAnimation.stop();
      glowAnimation.stop();
    };
  }, [sparkleAnim, floatingAnim, glowAnim]);

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
        [{ text: 'Continue', onPress: () => router.replace('/(tabs)/home') }]
      );
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    setIsLoading(false);

    if (error) {
      if (error.message === 'Sign-in cancelled' || error.message === 'Sign-in dismissed') {
        // Don't show alert for user cancellation
        return;
      }
      Alert.alert('Google Sign In', error.message || 'Something went wrong. Please try again.');
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    const { error } = await signInWithApple();
    setIsLoading(false);

    if (error) {
      if (error.message === 'Sign-in cancelled' || error.message === 'Authentication cancelled') {
        // Don't show alert for user cancellation
        return;
      }
      Alert.alert('Apple Sign In', error.message || 'Something went wrong. Please try again.');
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const styles = createStyles(palette);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradient(theme).hero}
        style={styles.gradient}
      >
        {/* Animated Background Orbs */}
        <Animated.View
          style={[
            styles.orb1,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.15, 0.25],
              }),
              transform: [
                {
                  scale: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
        
        <Animated.View
          style={[
            styles.orb2,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.3],
              }),
              transform: [
                {
                  scale: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1.2, 1],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Floating decorative elements */}
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
                }),
              }],
            }
          ]}
        >
          <Sparkles color={palette.primary} size={20} fill={palette.primary} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.floatingSparkle2,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
              transform: [{
                translateY: floatingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10],
                }),
              }],
            }
          ]}
        >
          <Heart color={palette.blush} size={16} fill={palette.blush} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.floatingSparkle3,
            {
              opacity: floatingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
              transform: [{
                translateY: floatingAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 10],
                }),
              }],
            }
          ]}
        >
          <Star color={palette.champagne} size={14} fill={palette.champagne} />
        </Animated.View>
        
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <View style={styles.content}>
              {/* Logo Header */}
              <Animated.View 
                style={[
                  styles.logoContainer,
                  {
                    transform: [{
                      scale: floatingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.05],
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.logoCircle}>
                  <Logo size={100} hideBackground={true} />
                </View>
                
                <Text style={styles.title}>Join GlowCheck</Text>
                <Text style={styles.subtitle}>Begin your radiant journey</Text>
              </Animated.View>

              {/* Compact Form */}
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <User size={18} color={palette.primary} />
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
                  <Mail size={18} color={palette.primary} />
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
                  <Lock size={18} color={palette.primary} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Password"
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
                      <EyeOff size={18} color={palette.textMuted} />
                    ) : (
                      <Eye size={18} color={palette.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Lock size={18} color={palette.primary} />
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
                      <EyeOff size={18} color={palette.textMuted} />
                    ) : (
                      <Eye size={18} color={palette.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.signupButton, (isLoading || !acceptTerms) && styles.signupButtonDisabled]}
                  onPress={handleSignup}
                  disabled={isLoading || !acceptTerms}
                  testID="signup-button"
                >
                  <LinearGradient
                    colors={getGradient(theme).primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.signupButtonGradient}
                  >
                    <Sparkles color={palette.textLight} size={18} />
                    <Text style={styles.signupButtonText}>
                      {isLoading ? 'Creating Account...' : 'Begin My Glow Journey'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.termsContainer} 
                  onPress={() => setAcceptTerms(!acceptTerms)}
                  activeOpacity={0.7}
                  testID="terms-checkbox"
                >
                  <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                    {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text 
                      style={styles.termsLink}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push('/terms-of-service');
                      }}
                    >
                      Terms
                    </Text>
                    {' '}&{' '}
                    <Text 
                      style={styles.termsLink}
                      onPress={(e) => {
                        e.stopPropagation();
                        router.push('/privacy-policy');
                      }}
                    >
                      Privacy
                    </Text>
                  </Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={[styles.appleButton, isLoading && styles.appleButtonDisabled]}
                    onPress={handleAppleSignIn}
                    disabled={isLoading}
                    activeOpacity={0.8}
                    testID="apple-signin-button"
                  >
                    <View style={styles.appleButtonContent}>
                      <View style={styles.appleLogoContainer}>
                        <AppleLogo size={20} color="#FFFFFF" />
                      </View>
                      <Text style={styles.appleButtonText}>
                        {isLoading ? 'Signing in...' : 'Continue with Apple'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                  activeOpacity={0.8}
                  testID="google-signin-button"
                >
                  <View style={styles.googleButtonContent}>
                    <View style={styles.googleLogoContainer}>
                      <GoogleLogo size={20} />
                    </View>
                    <Text style={styles.googleButtonText}>
                      {isLoading ? 'Signing in...' : 'Continue with Google'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={navigateToLogin}
                >
                  <Text style={styles.loginText}>Already have an account? </Text>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  form: {
    backgroundColor: palette.surface,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    ...shadow.elevated,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    height: 52,
    borderWidth: 1,
    borderColor: palette.borderLight,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: palette.textPrimary,
    fontWeight: '500',
  },
  passwordInput: {
    paddingRight: spacing.xl,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.lg,
    padding: spacing.xs,
  },
  signupButton: {
    borderRadius: radii.lg,
    height: 56,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
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
    letterSpacing: 0.3,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
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
    fontSize: 11,
    fontWeight: '900',
  },
  termsText: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  termsLink: {
    color: palette.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.borderLight,
  },
  dividerText: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: palette.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  loginLink: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  appleButton: {
    backgroundColor: '#000000',
    borderRadius: radii.lg,
    height: 56,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appleButtonDisabled: {
    opacity: 0.6,
  },
  appleButtonContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  appleLogoContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    height: 56,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  googleLogoContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  googleButtonText: {
    color: '#3C4043',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  
  // Background orbs
  orb1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: palette.blush,
  },
  orb2: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: palette.lavender,
  },
  
  // Floating elements
  floatingSparkle1: {
    position: 'absolute',
    top: '15%',
    right: '10%',
    zIndex: 1,
  },
  floatingSparkle2: {
    position: 'absolute',
    top: '25%',
    left: '8%',
    zIndex: 1,
  },
  floatingSparkle3: {
    position: 'absolute',
    bottom: '20%',
    right: '15%',
    zIndex: 1,
  },
});
