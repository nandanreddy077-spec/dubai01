import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, gradient, shadow } from '@/constants/theme';
import { 
  Sun,
  Moon,
  Check,
  Sparkles,
  ChevronRight,
  Circle,
  PartyPopper,
} from 'lucide-react-native';
import { useSkincare } from '@/contexts/SkincareContext';
import { useGamification } from '@/contexts/GamificationContext';
import { SkincareStep, WeeklyPlan } from '@/types/skincare';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';



const COMPLETION_MESSAGES = [
  "Amazing work! 🌟",
  "You're glowing! ✨",
  "Skin goals! 💫",
  "Consistency queen! 👑",
  "Keep shining! 🌸",
];

export default function SimpleGlowCoachScreen() {
  const { currentPlan, activePlans, updatePlanProgress, setCurrentPlan } = useSkincare();
  const { completeDailyRoutine, hasCompletedForPlanDay } = useGamification();
  
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!currentPlan && activePlans.length > 0) {
      setCurrentPlan(activePlans[0]);
    }
  }, [currentPlan, activePlans, setCurrentPlan]);

  useEffect(() => {
    if (currentPlan) {
      const progress = currentPlan.progress.currentDay / currentPlan.duration;
      Animated.spring(progressAnim, {
        toValue: progress,
        tension: 50,
        friction: 7,
        useNativeDriver: false,
      }).start();
    }
  }, [currentPlan, progressAnim]);

  const todaySteps = useMemo(() => {
    if (!currentPlan) return { morning: [], evening: [] };
    
    const currentWeek = Math.ceil(currentPlan.progress.currentDay / 7);
    const currentWeekPlan = currentPlan.weeklyPlans.find((w: WeeklyPlan) => w.week === currentWeek);
    
    if (!currentWeekPlan) return { morning: [], evening: [] };
    
    return {
      morning: currentWeekPlan.steps
        .filter((step: SkincareStep) => step.timeOfDay === 'morning' || step.timeOfDay === 'both')
        .map((step: SkincareStep) => ({
          ...step,
          id: step.timeOfDay === 'both' ? `${step.id}_morning` : step.id
        }))
        .sort((a: SkincareStep, b: SkincareStep) => a.order - b.order),
      evening: currentWeekPlan.steps
        .filter((step: SkincareStep) => step.timeOfDay === 'evening' || step.timeOfDay === 'both')
        .map((step: SkincareStep) => ({
          ...step,
          id: step.timeOfDay === 'both' ? `${step.id}_evening` : step.id
        }))
        .sort((a: SkincareStep, b: SkincareStep) => a.order - b.order)
    };
  }, [currentPlan]);

  const allSteps = [...todaySteps.morning, ...todaySteps.evening];
  const completedCount = currentPlan?.progress.completedSteps.filter(
    (id: string) => allSteps.some(s => s.id === id)
  ).length || 0;
  const totalSteps = allSteps.length;
  const allCompleted = completedCount === totalSteps && totalSteps > 0;
  const isAlreadyDone = currentPlan ? hasCompletedForPlanDay(currentPlan.id, currentPlan.progress.currentDay) : false;

  const handleStepToggle = async (stepId: string) => {
    if (!currentPlan || isAlreadyDone) return;
    
    const isCompleted = currentPlan.progress.completedSteps.includes(stepId);
    
    Haptics.impactAsync(
      isCompleted ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    
    const updatedSteps = isCompleted
      ? currentPlan.progress.completedSteps.filter((id: string) => id !== stepId)
      : [...currentPlan.progress.completedSteps, stepId];
    
    await updatePlanProgress(currentPlan.id, {
      completedSteps: updatedSteps
    });
  };

  const handleCompleteDay = async () => {
    if (!currentPlan || !allCompleted || isAlreadyDone) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setShowCelebration(true);
    Animated.sequence([
      Animated.spring(celebrationAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(celebrationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowCelebration(false));

    await completeDailyRoutine(currentPlan.id, currentPlan.progress.currentDay);
    
    const isLastDay = currentPlan.progress.currentDay >= currentPlan.duration;
    if (!isLastDay) {
      await updatePlanProgress(currentPlan.id, {
        currentDay: currentPlan.progress.currentDay + 1,
        completedSteps: []
      });
    }
  };

  

  if (activePlans.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Sparkles color={palette.gold} size={48} />
          </View>
          <Text style={styles.emptyTitle}>No Routine Yet</Text>
          <Text style={styles.emptySubtitle}>
            Scan your skin to get a personalized daily routine
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/glow-analysis')}
            activeOpacity={0.9}
          >
            <LinearGradient colors={['#1A1A1A', '#000000']} style={styles.emptyButtonGradient}>
              <Text style={styles.emptyButtonText}>Get My Routine</Text>
              <ChevronRight color="#FFFFFF" size={20} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentPlan) return null;

  const renderStepItem = (step: SkincareStep, index: number) => {
    const isCompleted = currentPlan.progress.completedSteps.includes(step.id);
    
    return (
      <TouchableOpacity
        key={step.id}
        onPress={() => handleStepToggle(step.id)}
        activeOpacity={0.8}
        disabled={isAlreadyDone}
        style={[
          styles.stepCard,
          isCompleted && styles.stepCardCompleted,
          isAlreadyDone && styles.stepCardDone,
        ]}
      >
        <View style={[styles.stepCheckbox, isCompleted && styles.stepCheckboxCompleted]}>
          {isCompleted ? (
            <Check color="#FFFFFF" size={16} strokeWidth={3} />
          ) : (
            <Circle color={palette.textMuted} size={16} />
          )}
        </View>
        
        <View style={styles.stepContent}>
          <Text style={[styles.stepName, isCompleted && styles.stepNameCompleted]}>
            {step.name}
          </Text>
          {!isCompleted && (
            <Text style={styles.stepHint}>Tap to complete</Text>
          )}
        </View>
        
        <Text style={styles.stepNumber}>{index + 1}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Simple Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today&apos;s Routine</Text>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>Day {currentPlan.progress.currentDay}</Text>
          </View>
        </View>

        {/* Progress Bar - Simple and visual */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>
              {isAlreadyDone ? "Completed! 🎉" : `${completedCount} of ${totalSteps} steps`}
            </Text>
            <Text style={styles.progressPercent}>
              {totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: `${(completedCount / totalSteps) * 100}%` }]} />
          </View>
        </View>

        {/* Morning Routine */}
        {todaySteps.morning.length > 0 && (
          <View style={styles.routineSection}>
            <View style={styles.routineHeader}>
              <View style={styles.routineIconWrapper}>
                <Sun color="#F59E0B" size={20} />
              </View>
              <Text style={styles.routineTitle}>Morning</Text>
            </View>
            {todaySteps.morning.map((step, index) => renderStepItem(step, index))}
          </View>
        )}

        {/* Evening Routine */}
        {todaySteps.evening.length > 0 && (
          <View style={styles.routineSection}>
            <View style={styles.routineHeader}>
              <View style={[styles.routineIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <Moon color="#6366F1" size={20} />
              </View>
              <Text style={styles.routineTitle}>Evening</Text>
            </View>
            {todaySteps.evening.map((step, index) => renderStepItem(step, todaySteps.morning.length + index))}
          </View>
        )}

        {/* Complete Button */}
        <View style={styles.completeSection}>
          {isAlreadyDone ? (
            <View style={styles.completedBanner}>
              <Check color={palette.success} size={24} />
              <Text style={styles.completedText}>All done for today!</Text>
              <Text style={styles.completedHint}>Come back tomorrow ✨</Text>
            </View>
          ) : allCompleted ? (
            <TouchableOpacity
              onPress={handleCompleteDay}
              activeOpacity={0.9}
              style={styles.completeButton}
            >
              <LinearGradient 
                colors={['#10B981', '#059669']} 
                style={styles.completeButtonGradient}
              >
                <PartyPopper color="#FFFFFF" size={24} />
                <Text style={styles.completeButtonText}>Complete Day!</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.incompleteHint}>
              <Text style={styles.incompleteText}>
                Complete all steps to finish your day
              </Text>
            </View>
          )}
        </View>

        {/* Reassurance Message */}
        <View style={styles.reassuranceSection}>
          <Text style={styles.reassuranceText}>
            {isAlreadyDone 
              ? "You're building great habits! 🌟"
              : completedCount === 0 
                ? "Small steps lead to big glow ✨"
                : completedCount < totalSteps / 2
                  ? "You're doing great, keep going! 💪"
                  : "Almost there, you got this! 🔥"
            }
          </Text>
        </View>
      </ScrollView>

      {/* Celebration Overlay */}
      {showCelebration && (
        <Animated.View 
          style={[
            styles.celebrationOverlay,
            { 
              opacity: celebrationAnim,
              transform: [{ scale: celebrationAnim }]
            }
          ]}
        >
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>
              {COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)]}
            </Text>
            <Text style={styles.celebrationSubtitle}>Day {currentPlan.progress.currentDay} complete</Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    letterSpacing: -0.8,
  },
  dayBadge: {
    backgroundColor: palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dayBadgeText: {
    color: palette.textLight,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '500' as const,
  },
  progressPercent: {
    fontSize: 14,
    color: palette.textPrimary,
    fontWeight: '700' as const,
  },
  progressTrack: {
    height: 8,
    backgroundColor: palette.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.gold,
    borderRadius: 4,
  },
  routineSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routineIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.soft,
  },
  stepCardCompleted: {
    backgroundColor: 'rgba(201, 169, 97, 0.08)',
    borderColor: palette.gold,
  },
  stepCardDone: {
    opacity: 0.7,
  },
  stepCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepCheckboxCompleted: {
    backgroundColor: palette.gold,
  },
  stepContent: {
    flex: 1,
  },
  stepName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: palette.textPrimary,
  },
  stepNameCompleted: {
    textDecorationLine: 'line-through',
    color: palette.textSecondary,
  },
  stepHint: {
    fontSize: 12,
    color: palette.textMuted,
    marginTop: 2,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: palette.textMuted,
    marginLeft: 8,
  },
  completeSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  completeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.medium,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  completedBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  completedText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: palette.success,
    marginTop: 8,
  },
  completedHint: {
    fontSize: 14,
    color: palette.textSecondary,
    marginTop: 4,
  },
  incompleteHint: {
    alignItems: 'center',
    padding: 16,
  },
  incompleteText: {
    fontSize: 14,
    color: palette.textMuted,
    fontWeight: '500' as const,
  },
  reassuranceSection: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    alignItems: 'center',
  },
  reassuranceText: {
    fontSize: 15,
    color: palette.textSecondary,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: palette.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.medium,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  celebrationContent: {
    alignItems: 'center',
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
