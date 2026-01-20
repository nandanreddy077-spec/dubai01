import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Camera,
  BookOpen,
  Zap,
  Award,
  Star,
  Droplets,
  Moon,
  Heart,
  Target,
  X,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Sparkles,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WeeklySummary as WeeklySummaryType } from '@/lib/weekly-summary';
import { getPalette, getGradient, shadow, spacing, typography } from '@/constants/theme';

const { width, height: screenHeight } = Dimensions.get('window');

interface WeeklySummaryProps {
  visible: boolean;
  summary: WeeklySummaryType;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export default function WeeklySummaryComponent({ visible, summary, onClose, theme }: WeeklySummaryProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, slideAnim, scaleAnim]);

  const { stats, trends, insights, recommendations } = summary;
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp color={palette.success} size={16} strokeWidth={2.5} />;
      case 'declining':
        return <TrendingDown color={palette.rose} size={16} strokeWidth={2.5} />;
      default:
        return <Minus color={palette.textSecondary} size={16} strokeWidth={2.5} />;
    }
  };

  const getMoodEmoji = (mood: number) => {
    if (mood >= 3.5) return '😊';
    if (mood >= 2.5) return '🙂';
    if (mood >= 1.5) return '😐';
    return '😔';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            <LinearGradient colors={gradient.hero} style={styles.gradientBackground} />
            
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconBadge}>
                  <Calendar color={palette.primary} size={24} strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={styles.weekTitle}>Week {stats.weekNumber} Summary</Text>
                  <Text style={styles.dateRange}>
                    {formatDate(stats.startDate)} - {formatDate(stats.endDate)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                <X color={palette.textPrimary} size={24} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {/* Highlights Banner */}
              {stats.highlights.length > 0 && (
                <View style={styles.highlightsBanner}>
                  <LinearGradient
                    colors={gradient.gold}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.highlightsGradient}
                  >
                    <Trophy color={palette.textLight} size={20} strokeWidth={2.5} />
                    <View style={styles.highlightsContent}>
                      <Text style={styles.highlightsTitle}>This Week's Wins!</Text>
                      {stats.highlights.slice(0, 3).map((highlight, index) => (
                        <Text key={index} style={styles.highlightText}>✨ {highlight}</Text>
                      ))}
                    </View>
                  </LinearGradient>
                </View>
              )}

              {/* Key Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <LinearGradient colors={gradient.rose} style={styles.statCardGradient}>
                    <CheckCircle color={palette.textLight} size={24} strokeWidth={2.5} />
                    <Text style={styles.statNumber}>{stats.daysCompleted}</Text>
                    <Text style={styles.statLabel}>Days Completed</Text>
                    <View style={styles.completionRate}>
                      <Text style={styles.completionRateText}>
                        {Math.round(stats.routineCompletionRate)}%
                      </Text>
                    </View>
                  </LinearGradient>
                </View>

                <View style={styles.statCard}>
                  <LinearGradient colors={gradient.lavender} style={styles.statCardGradient}>
                    <Zap color={palette.textLight} size={24} strokeWidth={2.5} />
                    <Text style={styles.statNumber}>{stats.pointsEarned}</Text>
                    <Text style={styles.statLabel}>Points Earned</Text>
                    {stats.pointsEarned > 0 && (
                      <View style={styles.badge}>
                        <Star color={palette.textLight} size={12} fill={palette.textLight} />
                      </View>
                    )}
                  </LinearGradient>
                </View>

                <View style={styles.statCard}>
                  <LinearGradient colors={gradient.mint} style={styles.statCardGradient}>
                    <Camera color={palette.textLight} size={24} strokeWidth={2.5} />
                    <Text style={styles.statNumber}>{stats.photosTaken}</Text>
                    <Text style={styles.statLabel}>Photos Taken</Text>
                  </LinearGradient>
                </View>

                <View style={styles.statCard}>
                  <LinearGradient colors={gradient.lavender} style={styles.statCardGradient}>
                    <BookOpen color={palette.textLight} size={24} strokeWidth={2.5} />
                    <Text style={styles.statNumber}>{stats.journalEntries}</Text>
                    <Text style={styles.statLabel}>Journal Entries</Text>
                  </LinearGradient>
                </View>
              </View>

              {/* Achievements Section */}
              {(stats.badgesEarned > 0 || stats.achievementsUnlocked > 0) && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Award color={palette.primary} size={20} strokeWidth={2.5} />
                    <Text style={styles.sectionTitle}>Achievements</Text>
                  </View>
                  <View style={styles.achievementsRow}>
                    {stats.badgesEarned > 0 && (
                      <View style={styles.achievementBadge}>
                        <Text style={styles.achievementNumber}>{stats.badgesEarned}</Text>
                        <Text style={styles.achievementLabel}>Badges</Text>
                      </View>
                    )}
                    {stats.achievementsUnlocked > 0 && (
                      <View style={styles.achievementBadge}>
                        <Text style={styles.achievementNumber}>{stats.achievementsUnlocked}</Text>
                        <Text style={styles.achievementLabel}>Achievements</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Weekly Metrics */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Target color={palette.primary} size={20} strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>Weekly Metrics</Text>
                </View>
                <View style={styles.metricsList}>
                  <View style={styles.metricRow}>
                    <View style={styles.metricLeft}>
                      <View style={[styles.metricIcon, { backgroundColor: palette.overlayGold }]}>
                        <Heart color={palette.primary} size={18} strokeWidth={2.5} />
                      </View>
                      <Text style={styles.metricLabel}>Mood</Text>
                    </View>
                    <View style={styles.metricRight}>
                      <Text style={styles.metricValue}>{getMoodEmoji(stats.averageMood)}</Text>
                      <Text style={styles.metricNumber}>{stats.averageMood.toFixed(1)}</Text>
                      {getTrendIcon(trends.moodTrend)}
                    </View>
                  </View>

                  <View style={styles.metricRow}>
                    <View style={styles.metricLeft}>
                      <View style={[styles.metricIcon, { backgroundColor: palette.overlaySage }]}>
                        <Moon color={palette.primary} size={18} strokeWidth={2.5} />
                      </View>
                      <Text style={styles.metricLabel}>Sleep (hrs)</Text>
                    </View>
                    <View style={styles.metricRight}>
                      <Text style={styles.metricNumber}>{stats.averageSleep.toFixed(1)}</Text>
                      {getTrendIcon(trends.sleepTrend)}
                    </View>
                  </View>

                  <View style={styles.metricRow}>
                    <View style={styles.metricLeft}>
                      <View style={[styles.metricIcon, { backgroundColor: palette.overlayLavender }]}>
                        <Droplets color={palette.primary} size={18} strokeWidth={2.5} />
                      </View>
                      <Text style={styles.metricLabel}>Water (glasses)</Text>
                    </View>
                    <View style={styles.metricRight}>
                      <Text style={styles.metricNumber}>{stats.averageWater.toFixed(1)}</Text>
                      {getTrendIcon(trends.waterTrend)}
                    </View>
                  </View>

                  <View style={styles.metricRow}>
                    <View style={styles.metricLeft}>
                      <View style={[styles.metricIcon, { backgroundColor: palette.overlayGold }]}>
                        <Zap color={palette.primary} size={18} strokeWidth={2.5} />
                      </View>
                      <Text style={styles.metricLabel}>Streak</Text>
                    </View>
                    <View style={styles.metricRight}>
                      <Text style={styles.metricNumber}>{stats.streakDays}</Text>
                      {getTrendIcon(trends.consistencyTrend)}
                    </View>
                  </View>
                </View>
              </View>

              {/* Glow Score Change */}
              {stats.glowScoreChange !== undefined && stats.glowScoreChange !== 0 && (
                <View style={styles.section}>
                  <View style={styles.glowScoreCard}>
                    <LinearGradient colors={gradient.shimmer} style={styles.glowScoreGradient}>
                      <Star color={palette.textLight} size={28} fill={palette.textLight} strokeWidth={2.5} />
                      <View style={styles.glowScoreContent}>
                        <Text style={styles.glowScoreLabel}>Glow Score Change</Text>
                        <View style={styles.glowScoreValue}>
                          {stats.glowScoreChange > 0 ? (
                            <ArrowUp color={palette.success} size={24} strokeWidth={3} />
                          ) : (
                            <ArrowDown color={palette.rose} size={24} strokeWidth={3} />
                          )}
                          <Text style={[
                            styles.glowScoreNumber,
                            { color: stats.glowScoreChange > 0 ? palette.success : palette.rose }
                          ]}>
                            {stats.glowScoreChange > 0 ? '+' : ''}{stats.glowScoreChange.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                </View>
              )}

              {/* Insights */}
              {insights.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Sparkles color={palette.primary} size={20} strokeWidth={2.5} />
                    <Text style={styles.sectionTitle}>Insights</Text>
                  </View>
                  {insights.map((insight, index) => (
                    <View key={index} style={styles.insightCard}>
                      <Text style={styles.insightText}>{insight}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Target color={palette.primary} size={20} strokeWidth={2.5} />
                    <Text style={styles.sectionTitle}>Recommendations</Text>
                  </View>
                  {recommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendationCard}>
                      <View style={styles.recommendationBullet} />
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}


const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.92,
    maxWidth: 500,
    maxHeight: screenHeight * 0.85,
    backgroundColor: palette.surface,
    borderRadius: 32,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  safeArea: {
    maxHeight: screenHeight * 0.85,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.overlayGold,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.card,
  },
  weekTitle: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    letterSpacing: -0.5,
  },
  dateRange: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    marginTop: 2,
    fontWeight: typography.medium,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.surfaceElevated,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  highlightsBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  highlightsGradient: {
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  highlightsContent: {
    flex: 1,
  },
  highlightsTitle: {
    fontSize: typography.h6,
    fontWeight: typography.bold,
    color: palette.textLight,
    marginBottom: spacing.sm,
  },
  highlightText: {
    fontSize: typography.bodySmall,
    color: palette.textLight,
    marginTop: spacing.xs,
    lineHeight: 20,
    opacity: 0.95,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: (width * 0.92 - spacing.xl * 2 - spacing.md) / 2,
    maxWidth: 160,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.card,
  },
  statCardGradient: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  statNumber: {
    fontSize: typography.h2,
    fontWeight: typography.black,
    color: palette.textLight,
    marginTop: spacing.xs,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: typography.caption,
    color: palette.textLight,
    opacity: 0.9,
    marginTop: spacing.xs,
    fontWeight: typography.medium,
    textAlign: 'center',
  },
  completionRate: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  completionRateText: {
    fontSize: typography.caption,
    color: palette.textLight,
    fontWeight: typography.bold,
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h6,
    fontWeight: typography.bold,
    color: palette.textPrimary,
  },
  achievementsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  achievementBadge: {
    flex: 1,
    backgroundColor: palette.surfaceElevated,
    padding: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    ...shadow.card,
  },
  achievementNumber: {
    fontSize: typography.h3,
    fontWeight: typography.black,
    color: palette.primary,
    marginBottom: spacing.xs,
  },
  achievementLabel: {
    fontSize: typography.caption,
    color: palette.textSecondary,
    fontWeight: typography.medium,
  },
  metricsList: {
    gap: spacing.sm,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.surfaceElevated,
    padding: spacing.md,
    borderRadius: 16,
    ...shadow.card,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: typography.body,
    color: palette.textPrimary,
    fontWeight: typography.medium,
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metricValue: {
    fontSize: typography.body,
  },
  metricNumber: {
    fontSize: typography.h6,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    minWidth: 40,
    textAlign: 'right',
  },
  glowScoreCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  glowScoreGradient: {
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  glowScoreContent: {
    flex: 1,
  },
  glowScoreLabel: {
    fontSize: typography.bodySmall,
    color: palette.textLight,
    opacity: 0.9,
    marginBottom: spacing.xs,
    fontWeight: typography.medium,
  },
  glowScoreValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  glowScoreNumber: {
    fontSize: typography.h2,
    fontWeight: typography.black,
    letterSpacing: -1,
  },
  insightCard: {
    backgroundColor: palette.surfaceElevated,
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  insightText: {
    fontSize: typography.body,
    color: palette.textPrimary,
    lineHeight: 22,
    fontWeight: typography.medium,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: palette.surfaceElevated,
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadow.card,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.primary,
    marginTop: 6,
  },
  recommendationText: {
    flex: 1,
    fontSize: typography.body,
    color: palette.textPrimary,
    lineHeight: 22,
    fontWeight: typography.medium,
  },
});
