import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Check,
  Sun,
  Moon,
  Sparkles,
  ChevronRight,
  Droplets,
  Shield,
  Pipette,
  Leaf,
} from 'lucide-react-native';
import { useSkincare } from '@/contexts/SkincareContext';
import { useGamification } from '@/contexts/GamificationContext';
import { SkincareStep, WeeklyPlan } from '@/types/skincare';
import { router } from 'expo-router';
import DailyRewardsModal from '@/components/DailyRewardsModal';
import PressableScale from '@/components/PressableScale';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 60;

interface DailyReward {
  id: string;
  type: 'points' | 'badge' | 'streak_bonus' | 'level_up';
  title: string;
  description: string;
  value: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const getStepIcon = (stepName: string, color: string) => {
  const lowerName = stepName.toLowerCase();
  if (lowerName.includes('cleanse') || lowerName.includes('wash')) {
    return <Droplets color={color} size={28} />;
  }
  if (lowerName.includes('serum') || lowerName.includes('vitamin')) {
    return <Pipette color={color} size={28} />;
  }
  if (lowerName.includes('sunscreen') || lowerName.includes('spf') || lowerName.includes('protect')) {
    return <Shield color={color} size={28} />;
  }
  if (lowerName.includes('moistur')) {
    return <Leaf color={color} size={28} />;
  }
  return <Sparkles color={color} size={28} />;
};

export default function GlowCoachScreen() {
  const insets = useSafeAreaInsets();
  const { currentPlan, activePlans, updatePlanProgress, setCurrentPlan } = useSkincare();
  const { completeDailyRoutine, hasCompletedToday } = useGamification();
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>([]);
  const [activeSection, setActiveSection] = useState<'morning' | 'evening'>('morning');
  
  const checkAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;

  useEffect(() => {
    if (!currentPlan && activePlans.length > 0) {
      setCurrentPlan(activePlans[0]);
    }
  }, [currentPlan, activePlans, setCurrentPlan]);

  useEffect(() => {
    const hour = new Date().getHours();
    setActiveSection(hour < 17 ? 'morning' : 'evening');
  }, []);

  if (activePlans.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Sparkles color="#D97706" size={48} />
          </View>
          <Text style={styles.emptyTitle}>No Routine Yet</Text>
          <Text style={styles.emptySubtitle}>
            Scan your skin first, and we will create a simple routine just for you.
          </Text>
          <PressableScale
            onPress={() => router.push('/glow-analysis')}
            pressedScale={0.97}
            haptics="medium"
            style={styles.startButtonContainer}
          >
            <LinearGradient
              colors={['#0A0A0A', '#1F2937']}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>Scan My Skin</Text>
              <ChevronRight color="#FFFFFF" size={20} />
            </LinearGradient>
          </PressableScale>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentPlan) return null;

  const currentWeek = Math.ceil(currentPlan.progress.currentDay / 7);
  const currentWeekPlan = currentPlan.weeklyPlans.find((w: WeeklyPlan) => w.week === currentWeek);

  const getTodaySteps = () => {
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
  };

  const todaySteps = getTodaySteps();
  const currentSteps = activeSection === 'morning' ? todaySteps.morning : todaySteps.evening;
  const allSteps = [...todaySteps.morning, ...todaySteps.evening];
  
  const completedCount = currentSteps.filter(
    step => currentPlan.progress.completedSteps.includes(step.id)
  ).length;

  const handleStepComplete = async (stepId: string) => {
    const isCompleted = currentPlan.progress.completedSteps.includes(stepId);
    
    if (!isCompleted && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    if (!checkAnimations[stepId]) {
      checkAnimations[stepId] = new Animated.Value(0);
    }
    
    if (!isCompleted) {
      Animated.spring(checkAnimations[stepId], {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }).start();
    } else {
      checkAnimations[stepId].setValue(0);
    }

    const updatedSteps = isCompleted
      ? currentPlan.progress.completedSteps.filter((id: string) => id !== stepId)
      : [...currentPlan.progress.completedSteps, stepId];
    
    await updatePlanProgress(currentPlan.id, {
      completedSteps: updatedSteps
    });
  };

  const handleFinishDay = async () => {
    if (hasCompletedToday()) return;
    
    const allStepsCompleted = allSteps.every(step => 
      currentPlan.progress.completedSteps.includes(step.id)
    );
    
    if (!allStepsCompleted) return;
    
    try {
      const rewards = await completeDailyRoutine(currentPlan.id, currentPlan.progress.currentDay);
      const isLastDay = currentPlan.progress.currentDay >= currentPlan.duration;
      const nextDay = isLastDay ? currentPlan.progress.currentDay : currentPlan.progress.currentDay + 1;
      
      if (!isLastDay) {
        await updatePlanProgress(currentPlan.id, {
          currentDay: nextDay,
          completedSteps: []
        });
      }
      
      if (rewards && rewards.length > 0) {
        setDailyRewards(rewards);
        setShowRewardsModal(true);
      }
    } catch (error) {
      console.log('Error completing day:', error);
    }
  };

  const allDone = allSteps.every(step => currentPlan.progress.completedSteps.includes(step.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Day {currentPlan.progress.currentDay}</Text>
          <Text style={styles.headerTitle}>My Routine</Text>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>{completedCount}/{currentSteps.length}</Text>
        </View>
      </View>

      <View style={styles.sectionToggle}>
        <PressableScale
          onPress={() => setActiveSection('morning')}
          style={[
            styles.toggleButton,
            activeSection === 'morning' && styles.toggleButtonActive,
          ]}
        >
          <Sun color={activeSection === 'morning' ? '#D97706' : '#9CA3AF'} size={20} />
          <Text style={[
            styles.toggleText,
            activeSection === 'morning' && styles.toggleTextActive,
          ]}>Morning</Text>
        </PressableScale>
        <PressableScale
          onPress={() => setActiveSection('evening')}
          style={[
            styles.toggleButton,
            activeSection === 'evening' && styles.toggleButtonActive,
          ]}
        >
          <Moon color={activeSection === 'evening' ? '#7C3AED' : '#9CA3AF'} size={20} />
          <Text style={[
            styles.toggleText,
            activeSection === 'evening' && styles.toggleTextActive,
          ]}>Evening</Text>
        </PressableScale>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 16}
        pagingEnabled={false}
      >
        {currentSteps.map((step, index) => {
          const isCompleted = currentPlan.progress.completedSteps.includes(step.id);
          const accentColor = activeSection === 'morning' ? '#D97706' : '#7C3AED';
          const bgColor = activeSection === 'morning' ? '#FEF3C7' : '#EDE9FE';
          
          const checkScale = checkAnimations[step.id] || new Animated.Value(isCompleted ? 1 : 0);

          return (
            <PressableScale
              key={step.id}
              onPress={() => handleStepComplete(step.id)}
              pressedScale={0.97}
              style={[
                styles.stepCard,
                index === 0 && { marginLeft: 24 },
                index === currentSteps.length - 1 && { marginRight: 24 },
                isCompleted && styles.stepCardCompleted,
              ]}
            >
              <View style={[styles.stepIconContainer, { backgroundColor: bgColor }]}>
                {getStepIcon(step.name, accentColor)}
              </View>
              
              <Text style={[styles.stepNumber, { color: accentColor }]}>
                Step {index + 1}
              </Text>
              
              <Text style={[
                styles.stepName,
                isCompleted && styles.stepNameCompleted
              ]}>
                {step.name}
              </Text>
              
              {step.duration && (
                <Text style={styles.stepDuration}>{step.duration}</Text>
              )}

              <View style={[
                styles.checkCircle,
                isCompleted && { backgroundColor: accentColor, borderColor: accentColor }
              ]}>
                {isCompleted && (
                  <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                    <Check color="#FFFFFF" size={20} strokeWidth={3} />
                  </Animated.View>
                )}
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {allDone && !hasCompletedToday() ? (
          <PressableScale
            onPress={handleFinishDay}
            pressedScale={0.97}
            haptics="medium"
            style={styles.finishButtonContainer}
          >
            <LinearGradient
              colors={['#059669', '#10B981']}
              style={styles.finishButton}
            >
              <Sparkles color="#FFFFFF" size={24} />
              <Text style={styles.finishButtonText}>Complete Day {currentPlan.progress.currentDay}</Text>
            </LinearGradient>
          </PressableScale>
        ) : hasCompletedToday() ? (
          <View style={styles.completedBadge}>
            <Check color="#059669" size={24} strokeWidth={3} />
            <Text style={styles.completedText}>All done for today!</Text>
          </View>
        ) : (
          <Text style={styles.hintText}>
            Tap each card to mark it done
          </Text>
        )}
      </View>

      <DailyRewardsModal
        visible={showRewardsModal}
        rewards={dailyRewards}
        onClose={() => setShowRewardsModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  progressPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  sectionToggle: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  toggleTextActive: {
    color: '#1a1a1a',
  },
  cardsScrollContent: {
    paddingVertical: 8,
  },
  stepCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  stepCardCompleted: {
    borderColor: '#D1FAE5',
    backgroundColor: '#F0FDF4',
  },
  stepIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  stepName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepNameCompleted: {
    color: '#059669',
  },
  stepDuration: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  checkCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  finishButtonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  completedText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#059669',
  },
  hintText: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startButtonContainer: {
    width: '100%',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
