import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  Camera, 
  Check, 
  Sparkles, 
  TrendingUp, 
  Clock,
  Sun,
  Moon,
  Circle,
  ChevronRight,
  Zap,
  Target,
  Calendar,
  Image as ImageIcon,
} from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSkincare } from "@/contexts/SkincareContext";
import { useGamification } from "@/contexts/GamificationContext";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useProducts } from "@/contexts/ProductContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { getPalette, getGradient, shadow } from "@/constants/theme";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Lock } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING = 20;

const REASSURANCE_MESSAGES = [
  "You're doing great! 💫",
  "Consistency is key ✨",
  "Your skin thanks you 🌸",
  "Small steps, big glow 🌟",
];

export default function SimpleHomeScreen() {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  const { currentPlan, activePlans } = useSkincare();
  const { hasCompletedToday, hasCompletedForPlanDay, dailyCompletions } = useGamification();
  const { analysisHistory } = useAnalysis();
  const { recommendations } = useProducts();
  const { state: subscriptionState } = useSubscription();
  const isPremium = subscriptionState.isPremium;
  
  const currentStreak = user?.stats.dayStreak || 0;
  const totalScans = user?.stats.analyses || 0;
  const [reassuranceIndex, setReassuranceIndex] = useState(0);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  const userName = useMemo(() => {
    if (authUser?.user_metadata && typeof authUser.user_metadata === 'object') {
      const meta = authUser.user_metadata as { full_name?: string; name?: string };
      return meta.full_name?.split(' ')[0] || meta.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'there';
    }
    return user?.name?.split(' ')[0] || 'there';
  }, [authUser, user]);

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Get today's routine steps
  const todayRoutine = useMemo(() => {
    if (!currentPlan) return null;
    
    const currentWeek = Math.ceil(currentPlan.progress.currentDay / 7);
    const currentWeekPlan = currentPlan.weeklyPlans.find((w) => w.week === currentWeek);
    if (!currentWeekPlan) return null;
    
    const hour = new Date().getHours();
    const isMorning = hour < 14;
    const timeOfDay = isMorning ? 'morning' : 'evening';
    
    const steps = currentWeekPlan.steps
      .filter((step) => step.timeOfDay === timeOfDay || step.timeOfDay === 'both')
      .sort((a, b) => a.order - b.order)
      .slice(0, 3); // Show max 3 steps
    
    const completedSteps = currentPlan.progress.completedSteps || [];
    const completedCount = steps.filter(s => completedSteps.includes(s.id)).length;
    const isRoutineDone = hasCompletedForPlanDay(currentPlan.id, currentPlan.progress.currentDay);
    
    return {
      steps,
      completedCount,
      totalCount: steps.length,
      isRoutineDone,
      timeOfDay,
      progress: steps.length > 0 ? completedCount / steps.length : 0,
    };
  }, [currentPlan, hasCompletedForPlanDay]);

  // Get latest analysis
  const latestAnalysis = useMemo(() => {
    if (!analysisHistory || analysisHistory.length === 0) return null;
    return analysisHistory[0];
  }, [analysisHistory]);

  // Get progress insights
  const progressInsight = useMemo(() => {
    if (!analysisHistory || analysisHistory.length < 2) return null;
    const latest = analysisHistory[0];
    const previous = analysisHistory[1];
    
    const improvements = [];
    if (latest.detailedScores.brightnessGlow > previous.detailedScores.brightnessGlow + 3) {
      improvements.push('Brighter Glow');
    }
    if (latest.detailedScores.hydrationLevel > previous.detailedScores.hydrationLevel + 3) {
      improvements.push('Better Hydration');
    }
    if (latest.detailedScores.skinTexture > previous.detailedScores.skinTexture + 3) {
      improvements.push('Smoother Texture');
    }
    
    return improvements.length > 0 ? improvements : null;
  }, [analysisHistory]);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
          toValue: 1,
        duration: 600,
          useNativeDriver: true,
        }),
    ]).start();

    // Pulse animation for scan button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const reassuranceInterval = setInterval(() => {
      setReassuranceIndex((prev) => (prev + 1) % REASSURANCE_MESSAGES.length);
    }, 5000);
    
    return () => clearInterval(reassuranceInterval);
  }, [pulseAnim, glowAnim, slideAnim, fadeAnim]);

  const handleScanPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(tabs)/glow-analysis");
  };

  const handleRoutinePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/glow-coach");
  };

  const handleProgressPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/progress");
  };

  const handleQuickComplete = async () => {
    if (!currentPlan || !todayRoutine || todayRoutine.isRoutineDone) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/(tabs)/glow-coach");
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.4],
  });

  const styles = useMemo(() => createStyles(palette), [palette]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[palette.backgroundStart, palette.backgroundEnd]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingDot, { opacity: glowAnim }]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      {/* Ambient glow effect */}
      <Animated.View style={[styles.ambientGlow, { opacity: glowOpacity }]} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
        <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{timeGreeting}, {userName}</Text>
              <Text style={styles.reassurance}>{REASSURANCE_MESSAGES[reassuranceIndex]}</Text>
              </View>
            {/* Streak Badge */}
            <TouchableOpacity 
              style={styles.streakBadge}
              onPress={handleProgressPress}
              activeOpacity={0.8}
        >
          <LinearGradient
                colors={currentStreak > 0 ? ['#FFD700', '#FFA500'] : [palette.surfaceAlt, palette.surface]}
                style={styles.streakBadgeGradient}
              >
                <Text style={styles.streakBadgeNumber}>{currentStreak}</Text>
                <Text style={styles.streakBadgeLabel}>day</Text>
              </LinearGradient>
          </TouchableOpacity>
        </View>

          {/* Primary Scan Action */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity 
              onPress={handleScanPress}
              activeOpacity={0.9}
              style={styles.scanButton}
              testID="home-scan-button"
        >
          <LinearGradient
                colors={['#1A1A1A', '#000000']}
                style={styles.scanButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
              >
                <View style={styles.scanButtonContent}>
                  <View style={styles.scanIconWrapper}>
                    <Camera color="#FFFFFF" size={32} strokeWidth={2} />
                    <View style={styles.scanIconGlow} />
              </View>
                  <View style={styles.scanButtonText}>
                    <Text style={styles.scanButtonTitle}>Scan Your Skin</Text>
                    <Text style={styles.scanButtonSubtitle}>Get instant AI analysis</Text>
              </View>
                  <Sparkles color="#FFD700" size={20} fill="#FFD700" />
            </View>
          </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Today's Routine Card - Contextual Widget */}
          {todayRoutine && todayRoutine.steps.length > 0 && (
            <TouchableOpacity 
              style={styles.routineCard}
              onPress={handleRoutinePress}
              activeOpacity={0.9}
            >
              <View style={styles.routineCardHeader}>
                <View style={styles.routineCardHeaderLeft}>
                  {todayRoutine.timeOfDay === 'morning' ? (
                    <Sun color={palette.gold} size={20} />
                  ) : (
                    <Moon color={palette.gold} size={20} />
                  )}
                  <Text style={styles.routineCardTitle}>
                    {todayRoutine.timeOfDay === 'morning' ? 'Morning' : 'Evening'} Routine
                  </Text>
            </View>
                <View style={styles.routineCardProgress}>
                  <Text style={styles.routineCardProgressText}>
                    {todayRoutine.completedCount}/{todayRoutine.totalCount}
                  </Text>
                  <ChevronRight color={palette.textSecondary} size={16} />
            </View>
          </View>
                
              {/* Progress Bar */}
              <View style={styles.routineProgressBar}>
                <Animated.View 
                  style={[
                    styles.routineProgressFill,
                    { width: `${todayRoutine.progress * 100}%` }
                  ]} 
                />
                </View>

              {/* Quick Steps Preview */}
              <View style={styles.routineStepsPreview}>
                {todayRoutine.steps.slice(0, 2).map((step, index) => {
                  const isCompleted = currentPlan?.progress.completedSteps.includes(step.id) || false;
                  return (
                    <View key={step.id} style={styles.routineStepPreview}>
                      <View style={[
                        styles.routineStepCheckbox,
                        isCompleted && styles.routineStepCheckboxCompleted
                      ]}>
                        {isCompleted ? (
                          <Check color="#FFFFFF" size={12} strokeWidth={3} />
                        ) : (
                          <Circle color={palette.textMuted} size={12} />
                        )}
                </View>
                      <Text 
                        style={[
                          styles.routineStepText,
                          isCompleted && styles.routineStepTextCompleted
                        ]}
                        numberOfLines={1}
                      >
                        {step.name}
                      </Text>
                  </View>
                  );
                })}
                {todayRoutine.steps.length > 2 && (
                  <Text style={styles.routineStepMore}>
                    +{todayRoutine.steps.length - 2} more
                  </Text>
                )}
                </View>
                
              {/* Quick Complete Button */}
              {!todayRoutine.isRoutineDone && todayRoutine.progress > 0 && (
                <TouchableOpacity
                  style={styles.quickCompleteButton}
                  onPress={handleQuickComplete}
                  activeOpacity={0.8}
                >
                  <Zap color={palette.gold} size={14} />
                  <Text style={styles.quickCompleteText}>Complete Routine</Text>
            </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}

          {/* Progress Insight Card */}
          {progressInsight && progressInsight.length > 0 && (
            <TouchableOpacity 
              style={styles.insightCard}
              onPress={handleProgressPress}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[palette.overlaySuccess, 'rgba(16, 185, 129, 0.05)']}
                style={styles.insightCardGradient}
              >
                <View style={styles.insightCardContent}>
                  <TrendingUp color={palette.success} size={24} />
                  <View style={styles.insightCardText}>
                    <Text style={styles.insightCardTitle}>You're Improving! 🎉</Text>
                    <Text style={styles.insightCardSubtitle}>
                      {progressInsight.join(', ')} improved since last scan
                    </Text>
                </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Quick Actions Grid */}
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleRoutinePress}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <Target color={palette.gold} size={22} />
              </View>
              <Text style={styles.quickActionTitle}>Routine</Text>
              {currentPlan && (
                <Text style={styles.quickActionSubtitle}>
                  Day {currentPlan.progress.currentDay}/{currentPlan.duration}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleProgressPress}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <TrendingUp color={palette.success} size={22} />
                  </View>
              <Text style={styles.quickActionTitle}>Progress</Text>
              {totalScans > 0 && (
                <Text style={styles.quickActionSubtitle}>
                  {totalScans} scan{totalScans > 1 ? 's' : ''}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/progress?tab=photos')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <ImageIcon color={palette.primary} size={22} />
                  </View>
              <Text style={styles.quickActionTitle}>Photos</Text>
              <Text style={styles.quickActionSubtitle}>Track changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/progress?tab=insights')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionIcon}>
                <Sparkles color={palette.gold} size={22} />
          </View>
              <Text style={styles.quickActionTitle}>Insights</Text>
              <Text style={styles.quickActionSubtitle}>AI analysis</Text>
            </TouchableOpacity>
        </View>

          {/* Latest Analysis Summary */}
          {latestAnalysis && (
            <TouchableOpacity
              style={styles.analysisCard}
              onPress={() => router.push('/analysis-results')}
              activeOpacity={0.9}
            >
              <View style={styles.analysisCardHeader}>
                <Text style={styles.analysisCardTitle}>Latest Analysis</Text>
                <Text style={styles.analysisCardScore}>
                  {Math.round(latestAnalysis.overallScore)}/100
                </Text>
          </View>
              <View style={styles.analysisCardMetrics}>
                <View style={styles.analysisMetric}>
                  <Text style={styles.analysisMetricLabel}>Glow</Text>
                  <View style={styles.analysisMetricBar}>
                    <View 
                      style={[
                        styles.analysisMetricFill,
                        { width: `${latestAnalysis.detailedScores.brightnessGlow}%` }
                      ]} 
                    />
              </View>
            </View>
                <View style={styles.analysisMetric}>
                  <Text style={styles.analysisMetricLabel}>Hydration</Text>
                  <View style={styles.analysisMetricBar}>
                    <View 
                      style={[
                        styles.analysisMetricFill,
                        { width: `${latestAnalysis.detailedScores.hydrationLevel}%` }
                      ]} 
                    />
              </View>
            </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Product Recommendations - Moved to Bottom */}
          {recommendations && recommendations.length > 0 && (
            <View style={styles.recommendationsSection}>
              <View style={styles.recommendationsHeader}>
                <Text style={styles.recommendationsTitle}>Your Top Matches</Text>
                {recommendations.length > 5 && (
                  <TouchableOpacity
                    onPress={() => {
                      // Navigate to analysis results to see all products
                      if (analysisHistory && analysisHistory.length > 0) {
                        router.push('/analysis-results');
                      } else {
                        router.push('/(tabs)/glow-analysis');
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.seeAllButton}>See All</Text>
                  </TouchableOpacity>
                )}
              </View>
          
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendationsScroll}
                snapToInterval={SCREEN_WIDTH * 0.75 + 16}
                decelerationRate="fast"
              >
                {recommendations.slice(0, 5).map((rec, index) => {
                  const isLocked = !isPremium && index >= 1;
                  const matchScore = rec.matchScore || 0;
                  
                  return (
                    <TouchableOpacity
                      key={rec.id}
                      style={[
                        styles.productCard,
                        isLocked && styles.productCardLocked,
                      ]}
                      onPress={() => {
                        if (isLocked) {
                          router.push('/beauty-membership');
                        } else {
                          router.push({
                            pathname: '/product-details',
                            params: { id: rec.id },
                          });
                        }
                      }}
                      activeOpacity={0.9}
                    >
                      {isLocked ? (
                        <View style={styles.lockedCardContent}>
                          <View style={styles.lockIconWrapper}>
                            <Lock color={palette.textSecondary} size={32} />
                  </View>
                          <Text style={styles.lockedCardTitle}>UNLOCK PRODUCT</Text>
                          <Text style={styles.lockedCardSubtitle}>with Premium</Text>
              </View>
                      ) : (
                        <>
                          {/* Match Badge */}
                          <View style={styles.matchBadge}>
                            <Text style={styles.matchBadgeText}>{matchScore}%</Text>
                </View>
                          
                          {/* Product Image */}
                          <View style={styles.productImageContainer}>
                            <Image
                              source={{ uri: rec.imageUrl || 'https://images.unsplash.com/photo-1556229010-aa9e36e4e0f9?w=800&h=600&fit=crop&q=80' }}
                              style={styles.productImage}
                              contentFit="cover"
                              transition={200}
                            />
              </View>
                          
                          {/* Product Info */}
                          <View style={styles.productInfo}>
                            {rec.brand && (
                              <Text style={styles.productBrand} numberOfLines={1}>
                                {rec.brand.toUpperCase()}
                              </Text>
                            )}
                            <Text style={styles.productName} numberOfLines={2}>
                              {rec.stepName || rec.description || 'Product Recommendation'}
                            </Text>
                          </View>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: palette.gold,
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: SCREEN_WIDTH + 100,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(201, 169, 97, 0.15)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: CARD_PADDING,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 20,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -1,
    marginBottom: 4,
  },
  reassurance: {
    fontSize: 16,
    color: palette.textSecondary,
    fontWeight: '500' as const,
  },
  streakBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...shadow.medium,
  },
  streakBadgeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakBadgeNumber: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  streakBadgeLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginTop: -2,
  },
  scanButton: {
    borderRadius: 24,
    marginBottom: 20,
    ...shadow.strong,
  },
  scanButtonGradient: {
    borderRadius: 24,
    padding: 20,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scanIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scanIconGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  scanButtonText: {
    flex: 1,
  },
  scanButtonTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  scanButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500' as const,
  },
  routineCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.soft,
  },
  routineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routineCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routineCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  routineCardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routineCardProgressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: palette.textSecondary,
  },
  routineProgressBar: {
    height: 6,
    backgroundColor: palette.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  routineProgressFill: {
    height: '100%',
    backgroundColor: palette.gold,
    borderRadius: 3,
  },
  routineStepsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  routineStepPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routineStepCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routineStepCheckboxCompleted: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  routineStepText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: palette.textPrimary,
    maxWidth: 120,
  },
  routineStepTextCompleted: {
    color: palette.textSecondary,
    textDecorationLine: 'line-through' as const,
  },
  routineStepMore: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: palette.textMuted,
  },
  quickCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: palette.overlayGold,
    borderRadius: 12,
    marginTop: 4,
  },
  quickCompleteText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: palette.gold,
  },
  insightCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...shadow.soft,
  },
  insightCardGradient: {
    padding: 20,
  },
  insightCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  insightCardText: {
    flex: 1,
  },
  insightCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginBottom: 4,
  },
  insightCardSubtitle: {
    fontSize: 13,
    color: palette.textSecondary,
    fontWeight: '500' as const,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - CARD_PADDING * 2 - 12) / 2,
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.soft,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.overlayGold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: palette.textPrimary,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '500' as const,
  },
  analysisCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.soft,
  },
  analysisCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  analysisCardScore: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: palette.gold,
  },
  analysisCardMetrics: {
    gap: 12,
  },
  analysisMetric: {
    gap: 6,
  },
  analysisMetricLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: palette.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  analysisMetricBar: {
    height: 6,
    backgroundColor: palette.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  analysisMetricFill: {
    height: '100%',
    backgroundColor: palette.gold,
    borderRadius: 3,
  },
  recommendationsSection: {
    marginBottom: 20,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.5,
  },
  seeAllButton: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: palette.gold,
  },
  recommendationsScroll: {
    paddingRight: CARD_PADDING,
    gap: 16,
  },
  productCard: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: palette.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: palette.border,
    marginLeft: CARD_PADDING,
    ...shadow.medium,
  },
  productCardLocked: {
    backgroundColor: palette.surfaceAlt,
    opacity: 0.7,
  },
  lockedCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    minHeight: 280,
  },
  lockIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: palette.border,
  },
  lockedCardTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: palette.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  lockedCardSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: palette.textMuted,
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: palette.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
    ...shadow.soft,
  },
  matchBadgeText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  productImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: palette.surfaceAlt,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 16,
  },
  productBrand: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: palette.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: palette.textPrimary,
    lineHeight: 20,
  },
});
