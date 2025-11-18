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
import { Mail, ArrowLeft, Heart, Sparkles, Star, RotateCcw } from 'lucide-react-native';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [floatingAnim] = useState(new Animated.Value(0));
  const { resetPassword } = useAuth();
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

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Gentle Reminder', 'Please enter your beautiful email address so we can help you return to your glow journey.');
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(email.trim());
    setIsLoading(false);

    if (error) {
      Alert.alert('We\'re Here to Help', 'Something went wrong, but don\'t worry - we\'ll help you get back to your beautiful journey. Please try again.');
    } else {
      Alert.alert(
        'Help is On the Way! ✨',
        'We\'ve sent you a beautiful email with instructions to reset your password. Check your inbox and we\'ll have you back to glowing in no time!',
        [{ text: 'Perfect!', onPress: () => router.push('/login') }]
      );
    }
  };

  const navigateBack = () => {
    router.push('/login');
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
                <RotateCcw color={palette.primary} size={32} fill={palette.blush} />
                <Text style={styles.title}>Restore Your Glow</Text>
              </View>
              <Text style={styles.subtitle}>
                Don&apos;t worry, beautiful! Enter your email and we&apos;ll send you gentle instructions to restore access to your radiant journey.
              </Text>
              
              <View style={styles.welcomeBadge}>
                <Heart color={palette.primary} size={16} fill={palette.blush} />
                <Text style={styles.welcomeBadgeText}>We&apos;re here to help</Text>
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

              <TouchableOpacity
                style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
                testID="reset-button"
              >
                <LinearGradient
                  colors={getGradient(theme).primary}
                  style={styles.resetButtonGradient}
                >
                  <Heart color={palette.textLight} size={18} fill={palette.textLight} />
                  <Text style={styles.resetButtonText}>
                    {isLoading ? 'Sending your beautiful reset...' : 'Send Reset Instructions'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={navigateBack} style={styles.backToLogin}>
                <Text style={styles.backToLoginText}>Return to Sign In</Text>
              </TouchableOpacity>
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
    lineHeight: 26,
    paddingHorizontal: spacing.md,
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
    marginBottom: spacing.xl,
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
  resetButton: {
    borderRadius: radii.lg,
    height: 60,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  resetButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: palette.textLight,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  backToLogin: {
    alignItems: 'center',
  },
  backToLoginText: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: '600',
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