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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, User, Heart, Sparkles, Star, ArrowLeft } from 'lucide-react-native';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';

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
  const { signUp } = useAuth();
  const { theme } = useTheme();
  
  const palette = getPalette(theme);
  
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
    
    sparkleAnimation.start();
    floatingAnimation.start();
    
    return () => {
      sparkleAnimation.stop();
      floatingAnimation.stop();
    };
  }, [sparkleAnim, floatingAnim]);

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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={getGradient(theme).hero}
        style={styles.gradient}
      >
        {/* Floating decorative elements */}
        <Animated.View 
          style={[
            styles.floatingSparkle1,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
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
          <Sparkles color={palette.blush} size={16} fill={palette.blush} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.floatingSparkle2,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0.9],
              }),
            }
          ]}
        >
          <Heart color={palette.lavender} size={14} fill={palette.lavender} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.floatingSparkle3,
            {
              opacity: floatingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            }
          ]}
        >
          <Star color={palette.champagne} size={12} fill={palette.champagne} />
        </Animated.View>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity onPress={navigateBack} style={styles.backButton}>
              <ArrowLeft size={24} color={palette.textLight} />
            </TouchableOpacity>
            
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
              <View style={styles.titleContainer}>
                <Heart color={palette.primary} size={32} fill={palette.blush} />
                <Text style={styles.title}>Begin Your Glow Journey</Text>
              </View>
              <Text style={styles.subtitle}>Join our beautiful community and discover your radiant self</Text>
              
              <View style={styles.welcomeBadge}>
                <Sparkles color={palette.primary} size={16} fill={palette.blush} />
                <Text style={styles.welcomeBadgeText}>Your transformation starts here</Text>
              </View>
            </Animated.View>

            <Animated.View 
              style={[
                styles.form,
                shadow.elevated,
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
                  <User size={20} color={palette.primary} style={styles.inputIcon} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Your beautiful name"
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
                  <Mail size={20} color={palette.primary} style={styles.inputIcon} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Your radiant email"
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
                  <Lock size={20} color={palette.primary} style={styles.inputIcon} />
                </View>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Create secure password"
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
                    <EyeOff size={20} color={palette.textMuted} />
                  ) : (
                    <Eye size={20} color={palette.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Lock size={20} color={palette.primary} style={styles.inputIcon} />
                </View>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Confirm your password"
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
                    <EyeOff size={20} color={palette.textMuted} />
                  ) : (
                    <Eye size={20} color={palette.textMuted} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.termsContainer}>
                <TouchableOpacity 
                  style={styles.checkbox} 
                  onPress={() => setAcceptTerms(!acceptTerms)}
                  testID="terms-checkbox"
                >
                  <View style={[styles.checkboxInner, acceptTerms && styles.checkboxChecked]}>
                    {acceptTerms && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>I accept the </Text>
                  <TouchableOpacity onPress={() => router.push('/terms-of-service')}>
                    <Text style={styles.termsLink}>Terms of Service</Text>
                  </TouchableOpacity>
                  <Text style={styles.termsText}> and </Text>
                  <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.signupButton, (isLoading || !acceptTerms) && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={isLoading || !acceptTerms}
                testID="signup-button"
              >
                <LinearGradient
                  colors={getGradient(theme).primary}
                  style={styles.signupButtonGradient}
                >
                  <Heart color={palette.textLight} size={18} fill={palette.textLight} />
                  <Text style={styles.signupButtonText}>
                    {isLoading ? 'Creating your beautiful journey...' : 'Begin My Glow Journey'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already part of our beautiful community? </Text>
                <TouchableOpacity onPress={navigateToLogin} testID="login-link">
                  <Text style={styles.loginLink}>Welcome Back</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    padding: spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxxl,
    marginTop: 60,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: palette.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    color: palette.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  welcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.overlayLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    gap: spacing.sm,
  },
  welcomeBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.primary,
    letterSpacing: 0.5,
  },
  form: {
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    height: 60,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  inputIconContainer: {
    marginRight: spacing.md,
  },
  inputIcon: {
    // Icon styling handled by container
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: palette.textPrimary,
    fontWeight: '500',
  },
  passwordInput: {
    paddingRight: spacing.xxxxl,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.lg,
    padding: spacing.xs,
  },
  signupButton: {
    borderRadius: radii.lg,
    height: 60,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  signupButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: palette.textLight,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: palette.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  loginLink: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  checkbox: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkboxInner: {
    width: 20,
    height: 20,
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
    fontSize: 12,
    fontWeight: '700',
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  termsLink: {
    fontSize: 14,
    color: palette.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  
  // Floating elements
  floatingSparkle1: {
    position: 'absolute',
    top: 100,
    right: 40,
    zIndex: 1,
  },
  floatingSparkle2: {
    position: 'absolute',
    top: 160,
    left: 30,
    zIndex: 1,
  },
  floatingSparkle3: {
    position: 'absolute',
    top: 220,
    right: 80,
    zIndex: 1,
  },
});