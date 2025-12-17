import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Lock, Sparkles, ChevronUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface MiniPaywallBannerProps {
  score?: number;
  onStartTrial?: () => void;
  onExpand?: () => void;
}

/**
 * MiniPaywallBanner - A less intrusive floating banner
 * 
 * Shown after user dismisses the full paywall.
 * Stays visible but doesn't block interaction with blurred content.
 */
export default function MiniPaywallBanner({
  score = 85,
  onStartTrial,
  onExpand,
}: MiniPaywallBannerProps) {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  
  // Animations
  const slideAnim = useRef(new Animated.Value(100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Slide in from bottom
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
    
    // Subtle pulse on CTA
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    
    return () => pulseLoop.stop();
  }, [slideAnim, pulseAnim]);
  
  const handleStartTrial = () => {
    if (onStartTrial) {
      onStartTrial();
    } else {
      router.push('/trial-offer');
    }
  };
  
  const handleExpand = () => {
    if (onExpand) {
      onExpand();
    }
  };
  
  const styles = createStyles(palette, gradient);
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.95)']}
        style={styles.banner}
      >
        {/* Expand Handle */}
        <TouchableOpacity 
          style={styles.expandHandle}
          onPress={handleExpand}
          activeOpacity={0.7}
        >
          <ChevronUp color={palette.textMuted} size={18} strokeWidth={2.5} />
        </TouchableOpacity>
        
        <View style={styles.content}>
          {/* Left: Lock + Message */}
          <View style={styles.leftSection}>
            <View style={styles.lockIcon}>
              <Lock color={palette.primary} size={16} strokeWidth={2.5} />
            </View>
            <View style={styles.textSection}>
              <Text style={styles.title}>Results Locked</Text>
              <Text style={styles.subtitle}>Score: {score}/100 • Tap to unlock</Text>
            </View>
          </View>
          
          {/* Right: CTA Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleStartTrial}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={gradient.primary}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Sparkles color="#FFF" size={14} fill="#FFF" strokeWidth={2} />
                <Text style={styles.ctaText}>Free Trial</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* Progress indicator - shows they're missing out */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${score}%` }]} />
          <View style={styles.progressLock}>
            <Lock color={palette.textMuted} size={10} strokeWidth={3} />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>, gradient: ReturnType<typeof getGradient>) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  banner: {
    borderRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    ...shadow.elevated,
    shadowColor: palette.primary,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
  },
  expandHandle: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lockIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.overlayBlush,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: palette.primary,
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '500',
  },
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
    ...shadow.card,
    shadowColor: palette.primary,
    shadowOpacity: 0.3,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  progressBar: {
    height: 4,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.primary,
    borderRadius: 2,
    opacity: 0.4,
  },
  progressLock: {
    position: 'absolute',
    right: 0,
    top: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
});


















