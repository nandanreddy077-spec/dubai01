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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, shadow } from '@/constants/theme';
import { 
  CheckCircle,
  Circle,
  Sun,
  Moon,
  Plus,
  X,
  ChevronRight,
  Calendar,
  Sparkles,
} from 'lucide-react-native';
import { useSkincare } from '@/contexts/SkincareContext';
import { useGamification } from '@/contexts/GamificationContext';
import { SkincareStep, WeeklyPlan } from '@/types/skincare';
import { router } from 'expo-router';
import DailyRewardsModal from '@/components/DailyRewardsModal';
import PressableScale from '@/components/PressableScale';

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
          <Text style={styles.emptyEmoji}>✨</Text>
          <Text style={styles.emptyTitle}>No Plan Yet</Text>
          <Text style={styles.emptySubtitle}>
            Scan your face first to get a personalized skincare routine!
          </Text>
          <PressableScale
            onPress={() => router.push('/glow-analysis')}
            pressedScale={0.97}
            haptics="medium"
          >
            <View style={styles.startButton}>
              <Text style={styles.startButtonText}>Scan My Face</Text>
              <ChevronRight color="#FFFFFF" size={20} />
            </View>
          </PressableScale>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentPlan) {
    return null;
  }

  const currentWeek = Math.ceil(currentPlan.progress.currentDay / 7);
  const currentWeekPlan = currentPlan.weeklyPlans.find((w: WeeklyPlan) => w.week === currentWeek);
  const progressPercentage = Math.round((currentPlan.progress.currentDay / currentPlan.duration) * 100);
  const daysRemaining = currentPlan.duration - currentPlan.progress.currentDay + 1;

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
  const completedCount = allSteps.filter(step => 
    currentPlan.progress.completedSteps.includes(step.id)
  ).length;
  const totalSteps = allSteps.length;

  const handleStepComplete = async (stepId: string) => {
    const isCompleted = currentPlan.progress.completedSteps.includes(stepId);
    const updatedSteps = isCompleted
      ? currentPlan.progress.completedSteps.filter((id: string) => id !== stepId)
      : [...currentPlan.progress.completedSteps, stepId];
    
    await updatePlanProgress(currentPlan.id, {
      completedSteps: updatedSteps
    });
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    
    const newNote = {
      day: currentPlan.progress.currentDay,
      content: noteText,
      mood: selectedMood || undefined
    };
    
    await updatePlanProgress(currentPlan.id, {
      notes: [...currentPlan.progress.notes, newNote]
    });
    
    setNoteText('');
    setSelectedMood(null);
    setShowNoteModal(false);
  };

  const handleCompleteDailyRoutine = async () => {
    if (!currentPlan) return;
    
    if (hasCompletedToday()) {
      Alert.alert('All Done!', 'You already completed today. Come back tomorrow!');
      return;
    }
    
    const allStepsCompleted = allSteps.every(step => 
      currentPlan.progress.completedSteps.includes(step.id)
    );
    
    if (!allStepsCompleted) {
      const incompleteSteps = allSteps.filter(step => 
        !currentPlan.progress.completedSteps.includes(step.id)
      );
      Alert.alert(
        'Not Done Yet',
        `Tap each step to mark it complete:\n\n${incompleteSteps.map(s => `• ${s.name}`).join('\n')}`
      );
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
      } else {
        Alert.alert(
          isLastDay ? 'Plan Complete! 🎉' : 'Day Complete! ✨',
          isLastDay 
            ? 'Amazing! You finished your entire plan!' 
            : `Great job! Ready for Day ${nextDay}?`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Try again.');
    }
  };

  const renderStep = (step: SkincareStep, isCompleted: boolean) => (
    <TouchableOpacity
      key={step.id}
      style={[styles.stepItem, isCompleted && styles.stepItemCompleted]}
      onPress={() => handleStepComplete(step.id)}
      activeOpacity={0.7}
    >
      <View style={styles.stepCheckbox}>
        {isCompleted ? (
          <View style={styles.checkboxDone}>
            <CheckCircle color="#FFFFFF" size={20} />
          </View>
        ) : (
          <View style={styles.checkboxEmpty}>
            <Circle color="#D1D5DB" size={20} />
          </View>
        )}
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepName, isCompleted && styles.stepNameDone]}>
          {step.name}
        </Text>
        <Text style={styles.stepDesc}>{step.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const isRoutineComplete = hasCompletedForPlanDay(currentPlan.id, currentPlan.progress.currentDay);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Plan</Text>
            <Text style={styles.headerSubtitle}>{currentPlan.title}</Text>
          </View>
          <View style={styles.dayBadge}>
            <Calendar color="#D97706" size={16} />
            <Text style={styles.dayText}>Day {currentPlan.progress.currentDay}</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <Text style={styles.progressPercent}>{progressPercentage}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressDays}>{daysRemaining} days left</Text>
        </View>

        <View style={styles.todaySection}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayTitle}>Today's Routine</Text>
            <Text style={styles.todayCount}>{completedCount}/{totalSteps} done</Text>
          </View>

          {todaySteps.morning.length > 0 && (
            <View style={styles.routineBlock}>
              <View style={styles.routineHeader}>
                <View style={[styles.routineIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Sun color="#D97706" size={20} />
                </View>
                <Text style={styles.routineTitle}>Morning</Text>
              </View>
              {todaySteps.morning.map((step: SkincareStep) => 
                renderStep(step, currentPlan.progress.completedSteps.includes(step.id))
              )}
            </View>
          )}

          {todaySteps.evening.length > 0 && (
            <View style={styles.routineBlock}>
              <View style={styles.routineHeader}>
                <View style={[styles.routineIcon, { backgroundColor: '#EDE9FE' }]}>
                  <Moon color="#7C3AED" size={20} />
                </View>
                <Text style={styles.routineTitle}>Evening</Text>
              </View>
              {todaySteps.evening.map((step: SkincareStep) => 
                renderStep(step, currentPlan.progress.completedSteps.includes(step.id))
              )}
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.noteButton}
          onPress={() => setShowNoteModal(true)}
          activeOpacity={0.7}
        >
          <Plus color="#6B7280" size={20} />
          <Text style={styles.noteButtonText}>Add Note</Text>
        </TouchableOpacity>

        {isRoutineComplete ? (
          <View style={styles.completedBanner}>
            <Text style={styles.completedEmoji}>✅</Text>
            <Text style={styles.completedText}>Today's routine complete!</Text>
          </View>
        ) : (
          <PressableScale
            onPress={handleCompleteDailyRoutine}
            pressedScale={0.98}
            haptics="medium"
          >
            <View style={styles.completeButton}>
              <Sparkles color="#FFFFFF" size={22} />
              <Text style={styles.completeButtonText}>Complete Day {currentPlan.progress.currentDay}</Text>
            </View>
          </PressableScale>
        )}
      </ScrollView>

      <Modal
        visible={showNoteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TouchableOpacity onPress={() => setShowNoteModal(false)}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.moodLabel}>How do you feel?</Text>
            <View style={styles.moodRow}>
              {[
                { mood: 'great' as const, emoji: '😍' },
                { mood: 'good' as const, emoji: '😊' },
                { mood: 'okay' as const, emoji: '😐' },
                { mood: 'bad' as const, emoji: '😞' }
              ].map(({ mood, emoji }) => (
                <TouchableOpacity
                  key={mood}
                  style={[styles.moodButton, selectedMood === mood && styles.moodButtonSelected]}
                  onPress={() => setSelectedMood(mood)}
                >
                  <Text style={styles.moodEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.moodLabel}>Your notes</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="How did your routine go?"
              value={noteText}
              onChangeText={setNoteText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={[styles.saveButton, { opacity: noteText.trim() ? 1 : 0.5 }]}
              onPress={handleAddNote}
              disabled={!noteText.trim()}
            >
              <Text style={styles.saveButtonText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  progressCard: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 5,
  },
  progressDays: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 10,
    fontWeight: '500',
  },
  todaySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  todayCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  routineBlock: {
    marginBottom: 20,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  routineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routineTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepItemCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  stepCheckbox: {
    marginRight: 14,
    marginTop: 2,
  },
  checkboxDone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  stepContent: {
    flex: 1,
  },
  stepName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  stepNameDone: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  stepDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  noteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    marginBottom: 16,
  },
  noteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  completedEmoji: {
    fontSize: 24,
  },
  completedText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#059669',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    ...shadow.soft,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  moodButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodButtonSelected: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  moodEmoji: {
    fontSize: 28,
  },
  noteInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 120,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
