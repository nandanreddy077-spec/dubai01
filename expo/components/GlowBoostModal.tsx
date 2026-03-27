import React, { useState, useEffect } from 'react';
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
import { Sparkles, X, Star, Trophy, Zap, Crown } from 'lucide-react-native';
import { GlowBoost } from '@/types/user';
import { useGamification } from '@/contexts/GamificationContext';

interface GlowBoostModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export default function GlowBoostModal({ visible, onClose }: GlowBoostModalProps) {
  const { unreadGlowBoosts, markGlowBoostSeen, markAllGlowBoostsSeen } = useGamification();
  const [currentBoostIndex, setCurrentBoostIndex] = useState(0);
  const [animatedValue] = useState(new Animated.Value(0));
  const [sparkleAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));

  const currentBoost = unreadGlowBoosts[currentBoostIndex];

  useEffect(() => {
    if (visible && currentBoost) {
      // Start entrance animation
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Mark as seen after a delay
      const timer = setTimeout(() => {
        markGlowBoostSeen(currentBoost.id);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible, currentBoost, animatedValue, sparkleAnimation, pulseAnimation, markGlowBoostSeen]);

  const handleNext = () => {
    if (currentBoostIndex < unreadGlowBoosts.length - 1) {
      setCurrentBoostIndex(currentBoostIndex + 1);
      // Reset animations
      animatedValue.setValue(0);
      sparkleAnimation.setValue(0);
      pulseAnimation.setValue(1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    markAllGlowBoostsSeen();
    setCurrentBoostIndex(0);
    animatedValue.setValue(0);
    sparkleAnimation.setValue(0);
    pulseAnimation.setValue(1);
    onClose();
  };

  const getBoostIcon = (type: GlowBoost['type']) => {
    switch (type) {
      case 'score_improvement':
        return <Star color="#FFD700" size={40} />;
      case 'streak_milestone':
        return <Trophy color="#FF6B35" size={40} />;
      case 'first_analysis':
        return <Sparkles color="#8B5CF6" size={40} />;
      case 'perfect_score':
        return <Crown color="#F59E0B" size={40} />;
      case 'comeback':
        return <Zap color="#10B981" size={40} />;
      default:
        return <Star color="#FFD700" size={40} />;
    }
  };

  const getBoostColor = (type: GlowBoost['type']) => {
    switch (type) {
      case 'score_improvement':
        return '#FFD700';
      case 'streak_milestone':
        return '#FF6B35';
      case 'first_analysis':
        return '#8B5CF6';
      case 'perfect_score':
        return '#F59E0B';
      case 'comeback':
        return '#10B981';
      default:
        return '#FFD700';
    }
  };

  if (!visible || !currentBoost) return null;

  const boostColor = getBoostColor(currentBoost.type);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1.1, 1],
                  }),
                },
                {
                  rotate: animatedValue.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: ['0deg', '5deg', '0deg'],
                  }),
                },
              ],
              opacity: animatedValue,
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X color="#6B7280" size={24} />
          </TouchableOpacity>

          {/* Sparkle Effects */}
          <Animated.View
            style={[
              styles.sparkleContainer,
              {
                opacity: sparkleAnimation,
                transform: [
                  {
                    rotate: sparkleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {[...Array(8)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.sparkle,
                  {
                    transform: [
                      { rotate: `${index * 45}deg` },
                      { translateY: -60 },
                    ],
                  },
                ]}
              >
                <Sparkles color={boostColor} size={16} />
              </View>
            ))}
          </Animated.View>

          {/* Main Content */}
          <View style={styles.content}>
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: `${boostColor}20`,
                  borderColor: boostColor,
                  transform: [{ scale: pulseAnimation }],
                },
              ]}
            >
              {getBoostIcon(currentBoost.type)}
            </Animated.View>

            <Text style={styles.title}>{currentBoost.title}</Text>
            <Text style={styles.message}>{currentBoost.message}</Text>

            <View style={[styles.pointsBadge, { backgroundColor: boostColor }]}>
              <Text style={styles.pointsText}>+{currentBoost.points} points</Text>
            </View>
          </View>

          {/* Progress Indicator */}
          {unreadGlowBoosts.length > 1 && (
            <View style={styles.progressContainer}>
              {unreadGlowBoosts.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index <= currentBoostIndex ? boostColor : '#E5E7EB',
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: boostColor }]}
            onPress={handleNext}
          >
            <Text style={styles.actionButtonText}>
              {currentBoostIndex < unreadGlowBoosts.length - 1 ? 'Next' : 'Awesome!'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: width * 0.9,
    minWidth: width * 0.8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 80,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  pointsBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actionButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});