import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, gradient, shadow, typography, spacing } from '@/constants/theme';
import {
  X,
  Star,
  Crown,
  Sparkles,
  Trophy,
  Gift,
  Zap,
  Heart,
  Award,
  Gem,
} from 'lucide-react-native';

// const { width, height } = Dimensions.get('window');

interface DailyReward {
  id: string;
  type: 'points' | 'badge' | 'streak_bonus' | 'level_up';
  title: string;
  description: string;
  value: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface DailyRewardsModalProps {
  visible: boolean;
  rewards: DailyReward[];
  onClose: () => void;
}

const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  visible,
  rewards,
  onClose,
}) => {
  const [animatedValues, setAnimatedValues] = useState<Animated.Value[]>([]);
  const [, setCurrentRewardIndex] = useState(0);
  const [showAllRewards, setShowAllRewards] = useState(false);

  useEffect(() => {
    if (visible && rewards.length > 0) {
      // Create new animated values for current rewards
      const newAnimatedValues = rewards.map(() => new Animated.Value(0));
      setAnimatedValues(newAnimatedValues);
      setCurrentRewardIndex(0);
      setShowAllRewards(false);
      
      // Start sequential animations
      const animateRewards = () => {
        rewards.forEach((_, index) => {
          setTimeout(() => {
            if (newAnimatedValues[index]) {
              Animated.spring(newAnimatedValues[index], {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
              }).start(() => {
                if (index === rewards.length - 1) {
                  setTimeout(() => setShowAllRewards(true), 500);
                }
              });
            }
            setCurrentRewardIndex(index);
          }, index * 800);
        });
      };
      
      setTimeout(animateRewards, 300);
    } else if (!visible) {
      // Reset when modal is closed
      setAnimatedValues([]);
      setCurrentRewardIndex(0);
      setShowAllRewards(false);
    }
  }, [visible, rewards]);

  const getRarityGradient = (rarity: string): readonly [string, string, ...string[]] => {
    switch (rarity) {
      case 'legendary':
        return ['#FFD700', '#FFA500', '#FF6B35'] as const;
      case 'epic':
        return ['#9333EA', '#C084FC', '#E879F9'] as const;
      case 'rare':
        return ['#3B82F6', '#60A5FA', '#93C5FD'] as const;
      default:
        return gradient.primary;
    }
  };

  const getRarityIcon = (type: string, rarity: string) => {
    if (type === 'level_up') return Star;
    if (type === 'badge') return Award;
    if (rarity === 'legendary') return Crown;
    if (rarity === 'epic') return Gem;
    if (rarity === 'rare') return Trophy;
    return Gift;
  };

  const getTotalPoints = () => {
    return rewards.reduce((sum, reward) => sum + reward.value, 0);
  };

  if (!visible || rewards.length === 0) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent

    >
      <View style={styles.overlay}>
        <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
        
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <LinearGradient colors={gradient.glow} style={styles.headerIcon}>
                <Sparkles color={palette.textLight} size={24} />
              </LinearGradient>
              <Text style={styles.headerTitle}>Daily Rewards</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <X color={palette.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Celebration Message */}
            <View style={styles.celebrationSection}>
              <LinearGradient colors={gradient.shimmer} style={styles.celebrationCard}>
                <Text style={styles.celebrationTitle}>🎉 Routine Complete! 🎉</Text>
                <Text style={styles.celebrationSubtitle}>
                  You&apos;ve earned {getTotalPoints()} points today!
                </Text>
              </LinearGradient>
            </View>

            {/* Rewards List */}
            <View style={styles.rewardsSection}>
              {rewards.map((reward, index) => {
                const IconComponent = getRarityIcon(reward.type, reward.rarity);
                const rarityGradient = getRarityGradient(reward.rarity);
                const animatedValue = animatedValues[index];
                
                // Create safe animated style with fallback
                const animatedStyle = animatedValue ? {
                  opacity: animatedValue,
                  transform: [
                    {
                      scale: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                    {
                      translateY: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                } : { 
                  opacity: 1, 
                  transform: [{ scale: 1 }, { translateY: 0 }] 
                };
                
                return (
                  <Animated.View
                    key={reward.id}
                    style={[
                      styles.rewardItem,
                      animatedStyle,
                    ]}
                  >
                    <LinearGradient colors={gradient.card} style={styles.rewardCard}>
                      {/* Rarity Border */}
                      <LinearGradient 
                        colors={rarityGradient} 
                        style={styles.rarityBorder}
                      >
                        <View style={styles.rewardCardInner}>
                          {/* Icon */}
                          <LinearGradient colors={rarityGradient} style={styles.rewardIcon}>
                            <IconComponent color={palette.textLight} size={24} />
                          </LinearGradient>
                          
                          {/* Content */}
                          <View style={styles.rewardContent}>
                            <View style={styles.rewardHeader}>
                              <Text style={styles.rewardTitle}>{reward.title}</Text>
                              <View style={styles.rewardValue}>
                                <Text style={styles.rewardValueText}>
                                  {reward.type === 'level_up' ? `Lv.${reward.value}` : `+${reward.value}`}
                                </Text>
                                {reward.type === 'points' || reward.type === 'streak_bonus' ? (
                                  <Zap color={palette.primary} size={16} fill={palette.primary} />
                                ) : null}
                              </View>
                            </View>
                            <Text style={styles.rewardDescription}>{reward.description}</Text>
                            
                            {/* Rarity Badge */}
                            <View style={[styles.rarityBadge, { backgroundColor: rarityGradient[0] + '20' }]}>
                              <Text style={[styles.rarityText, { color: rarityGradient[0] }]}>
                                {reward.rarity.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </LinearGradient>
                    </LinearGradient>
                  </Animated.View>
                );
              })}
            </View>

            {/* Summary */}
            {showAllRewards && (
              <Animated.View 
                style={[
                  styles.summarySection,
                  {
                    opacity: showAllRewards ? 1 : 0,
                  }
                ]}
              >
                <LinearGradient colors={gradient.lavender} style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <LinearGradient colors={gradient.glow} style={styles.summaryIcon}>
                      <Heart color={palette.textLight} size={20} fill={palette.textLight} />
                    </LinearGradient>
                    <Text style={styles.summaryTitle}>Keep Glowing!</Text>
                  </View>
                  <Text style={styles.summaryText}>
                    Consistency is the secret to radiant skin. Every day you complete your routine, 
                    you&apos;re one step closer to your glow goals!
                  </Text>
                </LinearGradient>
              </Animated.View>
            )}
          </ScrollView>

          {/* Action Button */}
          {showAllRewards && (
            <View style={styles.actionSection}>
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={onClose}
                activeOpacity={0.9}
              >
                <LinearGradient colors={gradient.primary} style={styles.continueButtonGradient}>
                  <Sparkles color={palette.textLight} size={20} />
                  <Text style={styles.continueButtonText}>Continue Glowing</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
  },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxxl,
  },
  celebrationSection: {
    marginBottom: spacing.xxl,
  },
  celebrationCard: {
    borderRadius: 24,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.borderLight,
    ...shadow.elevated,
  },
  celebrationTitle: {
    fontSize: typography.h2,
    fontWeight: typography.black,
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  celebrationSubtitle: {
    fontSize: typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    fontWeight: typography.medium,
  },
  rewardsSection: {
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
  rewardItem: {
    marginBottom: spacing.md,
  },
  rewardCard: {
    borderRadius: 20,
    ...shadow.elevated,
  },
  rarityBorder: {
    borderRadius: 20,
    padding: 2,
  },
  rewardCardInner: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  rewardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
  },
  rewardContent: {
    flex: 1,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rewardTitle: {
    fontSize: typography.h6,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    letterSpacing: 0.2,
    flex: 1,
  },
  rewardValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardValueText: {
    fontSize: typography.h6,
    fontWeight: typography.extrabold,
    color: palette.primary,
    letterSpacing: 0.3,
  },
  rewardDescription: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
    fontWeight: typography.regular,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: typography.bold,
    letterSpacing: 0.5,
  },
  summarySection: {
    marginBottom: spacing.xl,
  },
  summaryCard: {
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.borderLight,
    ...shadow.card,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
  },
  summaryTitle: {
    fontSize: typography.h5,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    letterSpacing: 0.2,
  },
  summaryText: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    lineHeight: 22,
    fontWeight: typography.regular,
  },
  actionSection: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  continueButton: {
    borderRadius: 28,
    overflow: 'hidden',
    ...shadow.floating,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  continueButtonText: {
    color: palette.textLight,
    fontSize: typography.h6,
    fontWeight: typography.bold,
    letterSpacing: 0.2,
  },
});

export default DailyRewardsModal;