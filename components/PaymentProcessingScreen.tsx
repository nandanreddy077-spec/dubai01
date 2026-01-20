import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, CreditCard } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient } from '@/constants/theme';

interface PaymentProcessingScreenProps {
  visible: boolean;
  message?: string;
  showExtendedMessage?: boolean; // Show message about switching to payment app
}

export default function PaymentProcessingScreen({
  visible,
  message = 'Setting up your payment...',
  showExtendedMessage = false,
}: PaymentProcessingScreenProps) {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    // Pulse animation for icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotate animation for sparkles
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, [visible, pulseAnim, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.8)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Animated Icon */}
            <View style={styles.iconContainer}>
              <Animated.View
                style={[
                  styles.iconWrapper,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={gradient.rose}
                  style={styles.iconGradient}
                >
                  <CreditCard size={48} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </Animated.View>
              <Animated.View
                style={[
                  styles.sparkleContainer,
                  {
                    transform: [{ rotate }],
                  },
                ]}
              >
                <Sparkles size={24} color={palette.blush} fill={palette.blush} />
              </Animated.View>
            </View>

            {/* Message */}
            <Text style={[styles.message, { color: palette.textPrimary }]}>
              {message}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              {showExtendedMessage 
                ? 'If you switched to another app to complete payment, please return here when done. We\'ll wait for your payment to complete...'
                : 'Please wait while we process your payment...'}
            </Text>

            {/* Loading Indicator */}
            <ActivityIndicator
              size="large"
              color={palette.primary}
              style={styles.loader}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  content: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A574',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  message: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loader: {
    marginTop: 8,
  },
});

