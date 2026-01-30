import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, shadow } from '@/constants/theme';
import { 
  Check,
  Sun,
  Moon,
  Plus,
  X,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react-native';
import { useSkincare } from '@/contexts/SkincareContext';
import { useGamification } from '@/contexts/GamificationContext';
import { SkincareStep, WeeklyPlan } from '@/types/skincare';
import { router } from 'expo-router';
import DailyRewardsModal from '@/components/DailyRewardsModal';
import PressableScale from '@/components/PressableScale';
import { LinearGradient } from 'expo-linear-gradient';

interface DailyReward {
  id: string;
  type: 'points' | 'badge' | 'streak_bonus' | 'level_up';
  title: string;
  description: string;
  value: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export default function GlowCoachScreen() {
  const insets = useSafeAreaInsets();
  const { currentPlan, activePlans, updatePlanProgress, setCurrentPlan } = useSkincare();
  const { completeDailyRoutine, hasCompletedToday, hasCompletedForPlanDay } = useGamification();
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedMood, setSelectedMood] = useState<'great' | 'good' | 'okay' | 'bad' | null>(null);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>([]);

  useEffect(() => {
    if (!currentPlan && activePlans.length > 0) {
      setCurrentPlan(activePlans[0]);
    }
  }, [currentPlan, activePlans, setCurrentPlan]);

  if (activePlans.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Sparkles color="#D97706" size={48} />
          </View>
          <Text style={styles.emptyTitle}>Start Your Journey</Text>
          <Text style={styles.emptySubtitle}>
            We need to know your skin first to create a magic routine for you.
          </Text>
          <PressableScale
            onPress={() => router.push('/glow-analysis')}
            pressedScale={0.97}
            haptics="medium"
            style={styles.startButtonContainer}
          >
            <LinearGradient
              colors={['#1a1a1a', '#4a4a4a']}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>Start Skin Scan</Text>
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
  const allSteps = [...todaySteps.morning, ...todaySteps.evening];
  
  const handleStepComplete = async (stepId: string) => {
    const isCompleted = currentPlan.progress.completedSteps.includes(stepId);
    const updatedSteps = isCompleted
      ? currentPlan.progress.completedSteps.filter((id: string) => id !== stepId)
      : [...currentPlan.progress.completedSteps, stepId];
    
    await updatePlanProgress(currentPlan.id, {
      completedSteps: updatedSteps
    });
  };

  const handleCompleteDay = async () => {
    if (!currentPlan) return;
    
    if (hasCompletedToday()) {
      Alert.alert('All Done!', 'You already completed today. Come back tomorrow!');
      return;
    }
    
    const allStepsCompleted = allSteps.every(step => 
      currentPlan.progress.completedSteps.includes(step.id)
    );
    
    if (!allStepsCompleted) {
      Alert.alert('Almost there!', 'Please check off all steps first.');
      return;
    }
    
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
      Alert.alert('Error', 'Something went wrong. Try again.');
    }
  };

  const renderRoutineSection = (title: string, steps: any[], icon: React.ReactNode, color: string, bgColor: string) => {
    if (steps.length === 0) return null;

    const allCompleted = steps.every(step => currentPlan.progress.completedSteps.includes(step.id));

    return (
      <View style={styles.sectionContainer}>
        <View style={[styles.sectionHeader, { backgroundColor: bgColor }]}>
           <View style={styles.sectionHeaderLeft}>
            {icon}
            <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
           </View>
           {allCompleted && (
             <View style={styles.sectionBadge}>
                <Check color="#FFFFFF" size={14} strokeWidth={3} />
                <Text style={styles.sectionBadgeText}>DONE</Text>
             </View>
           )}
        </View>
        
        <View style={styles.stepsList}>
          {steps.map((step, index) => {
            const isCompleted = currentPlan.progress.completedSteps.includes(step.id);
            return (
              <PressableScale
                key={step.id}
                onPress={() => handleStepComplete(step.id)}
                pressedScale={0.98}
                style={[
                    styles.stepCard, 
                    isCompleted && styles.stepCardCompleted,
                    index === steps.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={[
                    styles.checkbox,
                    isCompleted ? { backgroundColor: color, borderColor: color } : { borderColor: '#E5E7EB' }
                ]}>
                    {isCompleted && <Check color="#FFFFFF" size={16} strokeWidth={3} />}
                </View>
                
                <View style={styles.stepInfo}>
                  <Text style={[styles.stepName, isCompleted && styles.stepNameCompleted]}>
                    {step.name}
                  </Text>
                  {step.description && !isCompleted && (
                    <Text style={styles.stepDesc} numberOfLines={1}>
                        {step.description}
                    </Text>
                  )}
                </View>
              </PressableScale>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.header}>
            <View>
                <Text style={styles.headerSubtitle}>Day {currentPlan.progress.currentDay}</Text>
                <Text style={styles.headerTitle}>My Routine</Text>
            </View>
            <View style={styles.planBadge}>
                <Sparkles color="#D97706" size={16} fill="#D97706" />
                <Text style={styles.planBadgeText}>{currentPlan.title}</Text>
            </View>
        </View>

        {renderRoutineSection(
            "Morning", 
            todaySteps.morning, 
            <Sun color="#D97706" size={24} />, 
            "#D97706",
            "#FEF3C7"
        )}

        {renderRoutineSection(
            "Evening", 
            todaySteps.evening, 
            <Moon color="#7C3AED" size={24} />, 
            "#7C3AED",
            "#EDE9FE"
        )}

        {/* Complete Day Button */}
        <View style={styles.footer}>
             <PressableScale
                onPress={handleCompleteDay}
                pressedScale={0.97}
                haptics="medium"
                style={[
                    styles.completeButton,
                    hasCompletedToday() && styles.completeButtonDone
                ]}
            >
                <LinearGradient
                     colors={hasCompletedToday() ? ['#059669', '#10B981'] : ['#1a1a1a', '#4a4a4a']}
                     style={styles.completeButtonGradient}
                     start={{ x: 0, y: 0 }}
                     end={{ x: 1, y: 1 }}
                >
                    {hasCompletedToday() ? (
                         <>
                            <Check color="#FFFFFF" size={24} strokeWidth={3} />
                            <Text style={styles.completeButtonText}>Day Complete!</Text>
                         </>
                    ) : (
                        <>
                            <Sparkles color="#FFFFFF" size={20} />
                            <Text style={styles.completeButtonText}>Finish Day {currentPlan.progress.currentDay}</Text>
                        </>
                    )}
                </LinearGradient>
            </PressableScale>
        </View>

      </ScrollView>

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
    backgroundColor: '#F3F4F6', // Light gray bg for better contrast
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    ...shadow.small,
  },
  planBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    ...shadow.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  sectionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#059669',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
  },
  sectionBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
  },
  stepsList: {
    padding: 8,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stepCardCompleted: {
      opacity: 0.6,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  stepNameCompleted: {
      textDecorationLine: 'line-through',
      color: '#9CA3AF',
  },
  stepDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
      marginTop: 12,
  },
  completeButton: {
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow.medium,
  },
  completeButtonDone: {
      ...shadow.none,
  },
  completeButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      gap: 12,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontSize: 28,
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
      ...shadow.medium,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 20,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
