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
import { Eye, EyeOff, Mail, Lock, Heart, Sparkles, Star, Wifi } from 'lucide-react-native';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';
import { testSupabaseConnection } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'connected' | 'failed'>('unknown');
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [floatingAnim] = useState(new Animated.Value(0));
  const { signIn } = useAuth();
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
    
    // Test Supabase connection on component mount
    testConnection();
    
    return () => {
      sparkleAnimation.stop();
      floatingAnimation.stop();
    };
  }, [sparkleAnim, floatingAnim]);
  
  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const isConnected = await testSupabaseConnection();
      setConnectionStatus(isConnected ? 'connected' : 'failed');
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('failed');
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Gentle Reminder', 'Please fill in all fields to continue your beautiful journey.');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email.trim(), password);
    setIsLoading(false);

    if (error) {
      console.log('Login error details:', error);
      let errorMessage = 'Please check your credentials and try again.';
      
      if (error.message?.includes('Failed to fetch')) {
        errorMessage = 'Connection issue. Please check your internet connection and try again.';
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.isRateLimit) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Sign In Issue', errorMessage);
    } else {
      router.replace('/(tabs)');
    }
  };

  const navigateToSignup = () => {
    router.push('/signup');
  };

  const navigateToForgotPassword = () => {
    router.push('/forgot-password');
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
                <Text style={styles.title}>Welcome Back, Beautiful</Text>
              </View>
              <Text style={styles.subtitle}>Continue your radiant journey with us</Text>
              
              <View style={styles.welcomeBadge}>
                <Sparkles color={palette.primary} size={16} fill={palette.blush} />
                <Text style={styles.welcomeBadgeText}>Your glow awaits</Text>
              </View>
              
              {/* Connection Status Indicator */}
              <TouchableOpacity onPress={testConnection} style={styles.connectionStatus}>
                <Wifi 
                  size={16} 
                  color={connectionStatus === 'connected' ? '#10B981' : connectionStatus === 'failed' ? '#EF4444' : palette.textMuted} 
                />
                <Text style={[
                  styles.connectionText,
                  { color: connectionStatus === 'connected' ? '#10B981' : connectionStatus === 'failed' ? '#EF4444' : palette.textMuted }
                ]}>
                  {connectionStatus === 'testing' ? 'Testing...' : 
                   connectionStatus === 'connected' ? 'Connected' : 
                   connectionStatus === 'failed' ? 'Connection Failed' : 'Tap to test'}
                </Text>
              </TouchableOpacity>
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
                  <Mail size={20} color={palette.primary} style={styles.inputIcon} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Your beautiful email"
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
                  placeholder="Your secure password"
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

              <TouchableOpacity
                onPress={navigateToForgotPassword}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Need help remembering?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                testID="login-button"
              >
                <LinearGradient
                  colors={getGradient(theme).primary}
                  style={styles.loginButtonGradient}
                >
                  <Heart color={palette.textLight} size={18} fill={palette.textLight} />
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Welcoming you back...' : 'Continue My Journey'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>New to our beautiful community? </Text>
                <TouchableOpacity onPress={navigateToSignup} testID="signup-link">
                  <Text style={styles.signupLink}>Join Us</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxxl,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
  },
  forgotPasswordText: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: radii.lg,
    height: 60,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  loginButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: palette.textLight,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: palette.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  signupLink: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: '700',
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
  
  // Connection status
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: palette.overlayLight,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});