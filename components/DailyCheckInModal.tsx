import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Sparkles, Gift, Flame, Star, Trophy, Zap, Heart, Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette } from '@/constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DailyCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  streak: number;
  points: number;
  level: number;
  isFirstCheckIn?: boolean;
}

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
}

export default function DailyCheckInModal({
  visible,
  onClose,
  streak,
  points,
  level,
  isFirstCheckIn = false,
}: DailyCheckInModalProps) {
  const { theme } = useTheme();
  const palette = getPalette(theme);

  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      createParticles();
      startAnimations();
    } else {
      scaleAnim.setValue(0);
      confettiAnim.setValue(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const createParticles = () => {
    const newParticles: FloatingParticle[] = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * screenWidth,
        y: screenHeight + 50,
        scale: new Animated.Value(0),
        opacity: new Animated.Value(1),
        rotation: new Animated.Value(0),
      });
    }
    setParticles(newParticles);
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    particles.forEach((particle, index) => {
      Animated.parallel([
        Animated.timing(particle.scale, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 2000,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotation, {
          toValue: 1,
          duration: 2000,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const getStreakMessage = () => {
    if (streak === 1) return "Your glow journey begins!";
    if (streak < 3) return "Building momentum!";
    if (streak < 7) return "You're on fire!";
    if (streak < 14) return "Incredible consistency!";
    if (streak < 30) return "You're unstoppable!";
    return "Legendary status!";
  };

  const getStreakBonus = () => {
    if (streak >= 30) return 500;
    if (streak >= 14) return 250;
    if (streak >= 7) return 150;
    if (streak >= 3) return 50;
    return 0;
  };

  const totalPoints = points + getStreakBonus();
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = createStyles(palette);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
        )}

        {particles.map((particle) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                bottom: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [particle.y, -100],
                }),
                transform: [
                  { scale: particle.scale },
                  {
                    rotate: particle.rotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '720deg'],
                    }),
                  },
                ],
                opacity: particle.opacity,
              },
            ]}
          >
            {particle.id % 4 === 0 && <Sparkles color="#FFD700" size={16} fill="#FFD700" />}
            {particle.id % 4 === 1 && <Star color="#FF69B4" size={14} fill="#FF69B4" />}
            {particle.id % 4 === 2 && <Heart color="#87CEEB" size={14} fill="#87CEEB" />}
            {particle.id % 4 === 3 && <Zap color="#FFA500" size={16} fill="#FFA500" />}
          </Animated.View>
        ))}

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#FFE5D9', '#E8D5F0', '#D4F0E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ rotate: rotation }, { scale: pulseAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.iconBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {streak >= 30 && <Crown color={palette.textLight} size={48} strokeWidth={2.5} />}
                  {streak >= 7 && streak < 30 && <Trophy color={palette.textLight} size={48} strokeWidth={2.5} />}
                  {streak >= 3 && streak < 7 && <Flame color={palette.textLight} size={48} strokeWidth={2.5} />}
                  {streak < 3 && <Gift color={palette.textLight} size={48} strokeWidth={2.5} />}
                </LinearGradient>
              </Animated.View>

              <Text style={styles.title}>Daily Check-In!</Text>
              <Text style={styles.message}>{getStreakMessage()}</Text>
            </View>

            <View style={styles.rewardsSection}>
              <View style={styles.rewardCard}>
                <View style={styles.rewardIconWrapper}>
                  <Flame color="#FF6B6B" size={28} fill="#FF6B6B" />
                </View>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardLabel}>STREAK</Text>
                  <Text style={styles.rewardValue}>{streak} Days</Text>
                </View>
              </View>

              <View style={styles.rewardCard}>
                <View style={styles.rewardIconWrapper}>
                  <Sparkles color="#FFD700" size={28} fill="#FFD700" />
                </View>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardLabel}>POINTS</Text>
                  <Text style={styles.rewardValue}>+{totalPoints}</Text>
                </View>
              </View>

              {getStreakBonus() > 0 && (
                <View style={[styles.rewardCard, styles.bonusCard]}>
                  <View style={styles.rewardIconWrapper}>
                    <Zap color="#FFD700" size={28} fill="#FFD700" />
                  </View>
                  <View style={styles.rewardContent}>
                    <Text style={styles.rewardLabel}>BONUS</Text>
                    <Text style={styles.rewardValue}>+{getStreakBonus()}</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.levelBadge}>
              <Star color="#FFD700" size={16} fill="#FFD700" />
              <Text style={styles.levelText}>Level {level}</Text>
            </View>

            {isFirstCheckIn && (
              <View style={styles.firstTimeBanner}>
                <Sparkles color={palette.textLight} size={18} fill={palette.textLight} />
                <Text style={styles.firstTimeText}>First check-in of the day!</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.8}
              style={styles.closeButton}
            >
              <LinearGradient
                colors={['#FF6B9D', '#C44569']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeButtonText}>Claim Rewards</Text>
                <Sparkles color={palette.textLight} size={20} fill={palette.textLight} />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  container: {
    width: screenWidth * 0.9,
    maxWidth: 400,
  },
  card: {
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#2C2C2C',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#666',
    textAlign: 'center',
  },
  rewardsSection: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  bonusCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  rewardIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  rewardContent: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#999',
    letterSpacing: 1,
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#2C2C2C',
    letterSpacing: -0.5,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    marginBottom: 24,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#D4A574',
    letterSpacing: 0.5,
  },
  firstTimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 157, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 10,
    marginBottom: 24,
  },
  firstTimeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#C44569',
  },
  closeButton: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  closeButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: palette.textLight,
    letterSpacing: 0.5,
  },
  particle: {
    position: 'absolute',
  },
});
