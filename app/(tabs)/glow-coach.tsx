import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Modal,
  TextInput,
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
  Plus,
  X,
} from 'lucide-react-native';
import { useSkincare } from '@/contexts/SkincareContext';
import { useGamification } from '@/contexts/GamificationContext';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import HardPaywall from '@/components/HardPaywall';
import BlurredContentOverlay from '@/components/BlurredContentOverlay';
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
  const { currentPlan, activePlans, updatePlanProgress, setCurrentPlan, addCustomStep } = useSkincare();
  const { completeDailyRoutine, hasCompletedForPlanDay } = useGamification();
  const { currentResult } = useAnalysis();
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [newStep, setNewStep] = useState({
    name: '',
    description: '',
    timeOfDay: 'morning' as 'morning' | 'evening' | 'both',
    products: '',
  });
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const celebrationMessage = useRef<string>('');

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
    
    // Store the celebration message so it doesn't change during animation
    celebrationMessage.current = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
    
    // Reset animation value and show celebration
    celebrationAnim.setValue(0);
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
    ]).start(() => {
      setShowCelebration(false);
      celebrationAnim.setValue(0);
      celebrationMessage.current = '';
    });

    await completeDailyRoutine(currentPlan.id, currentPlan.progress.currentDay);
    
      const isLastDay = currentPlan.progress.currentDay >= currentPlan.duration;
      if (!isLastDay) {
    await updatePlanProgress(currentPlan.id, {
        currentDay: currentPlan.progress.currentDay + 1,
        completedSteps: []
      });
    }
  };

  const handleAddStep = async () => {
    if (!currentPlan || !newStep.name.trim()) {
      Alert.alert('Error', 'Please enter a step name');
      return;
    }

    try {
      await addCustomStep(currentPlan.id, {
        name: newStep.name.trim(),
        description: newStep.description.trim() || newStep.name.trim(),
        timeOfDay: newStep.timeOfDay,
        products: newStep.products.trim() ? newStep.products.split(',').map(p => p.trim()) : [],
        frequency: 'daily',
        instructions: [],
        benefits: [],
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddStepModal(false);
      setNewStep({
        name: '',
        description: '',
        timeOfDay: 'morning',
        products: '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to add step. Please try again.');
      console.error('Error adding step:', error);
    }
  };

  const renderStepItem = (step: SkincareStep, index: number) => {
    if (!currentPlan) return null;
    
    const isCompleted = currentPlan.progress.completedSteps.includes(step.id);
    const isAlreadyDone = hasCompletedForPlanDay(currentPlan.id, currentPlan.progress.currentDay);
    
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

  // Check if user has analysis but no plan - redirect to goal setup
  React.useEffect(() => {
    if (activePlans.length === 0 && currentResult) {
      // User has analysis but no plan - redirect to goal setup
      router.replace('/routine-goal-setup');
    }
  }, [activePlans.length, currentResult]);

  const subscription = useSubscription();
  const { state: subscriptionState } = subscription || {};
  const isPremium = subscriptionState?.isPremium || false;
  const isFreeUser = !isPremium && (subscriptionState?.scanCount || 0) >= 1;
  const [showPaywall, setShowPaywall] = useState(false);

  // For free users, show limited content with blur overlay
  // For premium users, show full content
  return (
    <>
      {activePlans.length === 0 ? (
        <SafeAreaView style={styles.container}>
          <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Sparkles color={palette.gold} size={48} />
            </View>
            <Text style={styles.emptyTitle}>No Routine Yet</Text>
            <Text style={styles.emptySubtitle}>
              {currentResult 
                ? 'Set your goals to create a personalized routine'
                : 'Scan your skin to get a personalized daily routine'}
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => {
                if (currentResult) {
                  router.push('/routine-goal-setup');
                } else {
                  router.push('/(tabs)/glow-analysis');
                }
              }}
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#1A1A1A', '#000000']} style={styles.emptyButtonGradient}>
                <Text style={styles.emptyButtonText}>
                  {currentResult ? 'Set My Goals' : 'Get My Routine'}
                </Text>
                <ChevronRight color="#FFFFFF" size={20} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : !currentPlan ? null : (
        <RoutineContent 
          currentPlan={currentPlan}
          updatePlanProgress={updatePlanProgress}
          completeDailyRoutine={completeDailyRoutine}
          hasCompletedForPlanDay={hasCompletedForPlanDay}
          currentResult={currentResult}
          styles={styles}
          palette={palette}
          gradient={gradient}
          celebrationAnim={celebrationAnim}
          showCelebration={showCelebration}
          setShowCelebration={setShowCelebration}
          celebrationMessage={celebrationMessage}
          todaySteps={todaySteps}
          allSteps={allSteps}
          completedCount={completedCount}
          totalSteps={totalSteps}
          allCompleted={allCompleted}
          isAlreadyDone={isAlreadyDone}
          handleStepToggle={handleStepToggle}
          handleCompleteDay={handleCompleteDay}
          renderStepItem={renderStepItem}
          showAddStepModal={showAddStepModal}
          setShowAddStepModal={setShowAddStepModal}
          newStep={newStep}
          setNewStep={setNewStep}
          handleAddStep={handleAddStep}
        />
      )}
      
      {/* Blurred overlay for free users */}
      {isFreeUser && activePlans.length > 0 && currentPlan && (
        // #region agent log
        (() => {
          fetch('http://127.0.0.1:7242/ingest/fd66806e-0754-4560-90ad-e93bfb4e5cc9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'glow-coach.tsx:331',message:'Rendering BlurredContentOverlay',data:{isFreeUser,activePlansLength:activePlans.length,hasCurrentPlan:!!currentPlan},timestamp:Date.now(),runId:'debug-1',hypothesisId:'D'})}).catch(()=>{});
          return null;
        })(),
        // #endregion
        <BlurredContentOverlay
          visible={true}
          onUnlock={() => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/fd66806e-0754-4560-90ad-e93bfb4e5cc9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'glow-coach.tsx:336',message:'onUnlock called',data:{},timestamp:Date.now(),runId:'debug-1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            setShowPaywall(true);
          }}
          title="Unlock Your Routine"
          message="Get personalized daily skincare routines tailored to your skin goals"
          features={[
            'Complete daily routine steps',
            'Track your progress over time',
            'AI-powered personalized coaching',
            'Add custom steps to your routine',
          ]}
        />
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <HardPaywall
          visible={true}
          feature="Personalized Routines"
          message="Unlock personalized skincare routines and daily coaching"
          showCloseButton={true}
          onClose={() => setShowPaywall(false)}
          onSubscribe={async (type) => {
            const result = await subscription?.processInAppPurchase(type);
            if (result?.success) {
              setShowPaywall(false);
            }
          }}
        />
      )}
    </>
  );
}

// Extract routine content to separate component for cleaner code
function RoutineContent({
  currentPlan,
  updatePlanProgress,
  completeDailyRoutine,
  hasCompletedForPlanDay,
  currentResult,
  styles,
  palette,
  gradient,
  celebrationAnim,
  showCelebration,
  setShowCelebration,
  celebrationMessage,
  todaySteps,
  allSteps,
  completedCount,
  totalSteps,
  allCompleted,
  isAlreadyDone,
  handleStepToggle,
  handleCompleteDay,
  renderStepItem,
  showAddStepModal,
  setShowAddStepModal,
  newStep,
  setNewStep,
  handleAddStep,
}: any) {
  if (!currentPlan) return null;

  return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Simple Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Today&apos;s Routine</Text>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Day {currentPlan.progress.currentDay}</Text>
            </View>
          </View>
          {/* Create New Routine Button - always visible */}
            <TouchableOpacity 
            style={styles.newRoutineButton}
            onPress={() => {
              if (currentResult) {
                router.push('/routine-goal-setup');
              } else {
                // If no analysis, navigate to scan first
                Alert.alert(
                  'Scan Required',
                  'Please scan your skin first to create a personalized routine.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Scan Now', 
                      onPress: () => router.push('/(tabs)/glow-analysis')
                    }
                  ]
                );
              }
            }}
              activeOpacity={0.8}
            >
            <Sparkles color={palette.gold} size={16} />
            <Text style={styles.newRoutineButtonText}>New Routine</Text>
            </TouchableOpacity>
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
            {todaySteps.morning.map((step: SkincareStep, index: number) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/fd66806e-0754-4560-90ad-e93bfb4e5cc9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'glow-coach.tsx:465',message:'Rendering morning step',data:{stepId:step.id,index},timestamp:Date.now(),runId:'debug-1',hypothesisId:'F'})}).catch(()=>{});
              // #endregion
              return renderStepItem(step, index);
            })}
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
            {todaySteps.evening.map((step: SkincareStep, index: number) => renderStepItem(step, todaySteps.morning.length + index))}
        </View>
        )}

        {/* Add Custom Step Button */}
        {!isAlreadyDone && (
          <View style={styles.addStepSection}>
            <TouchableOpacity
              style={styles.addStepButton}
              onPress={() => setShowAddStepModal(true)}
              activeOpacity={0.8}
            >
              <Plus color={palette.gold} size={20} />
              <Text style={styles.addStepButtonText}>Add Custom Step</Text>
            </TouchableOpacity>
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

        {/* Reassurance Message - Hide when celebration is showing */}
        {!showCelebration && (
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
        )}
      </ScrollView>

      {/* Celebration Overlay - Only show when celebration is active */}
      {showCelebration && celebrationMessage.current && (
        <Animated.View 
          style={[
            styles.celebrationOverlay,
            { 
              opacity: celebrationAnim,
              transform: [{ scale: celebrationAnim }]
            }
          ]}
          pointerEvents="none"
        >
          <View style={styles.celebrationContent}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>
              {celebrationMessage.current}
            </Text>
            <Text style={styles.celebrationSubtitle}>Day {currentPlan.progress.currentDay} complete</Text>
          </View>
        </Animated.View>
      )}

      {/* Add Step Modal */}
      <Modal
        visible={showAddStepModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddStepModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Step</Text>
              <TouchableOpacity
                onPress={() => setShowAddStepModal(false)}
                style={styles.modalCloseButton}
              >
                <X color={palette.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Step Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Face Mask"
                  placeholderTextColor={palette.textMuted}
                  value={newStep.name}
                  onChangeText={(text) => setNewStep({ ...newStep, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Optional description"
                  placeholderTextColor={palette.textMuted}
                  value={newStep.description}
                  onChangeText={(text) => setNewStep({ ...newStep, description: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Time of Day</Text>
                <View style={styles.timeOfDayButtons}>
                  {(['morning', 'evening', 'both'] as const).map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOfDayButton,
                        newStep.timeOfDay === time && styles.timeOfDayButtonActive
                      ]}
                      onPress={() => setNewStep({ ...newStep, timeOfDay: time })}
                    >
                      <Text style={[
                        styles.timeOfDayButtonText,
                        newStep.timeOfDay === time && styles.timeOfDayButtonTextActive
                      ]}>
                        {time.charAt(0).toUpperCase() + time.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Products (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Product 1, Product 2"
                  placeholderTextColor={palette.textMuted}
                  value={newStep.products}
                  onChangeText={(text) => setNewStep({ ...newStep, products: text })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddStepModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalAddButton, !newStep.name.trim() && styles.modalAddButtonDisabled]}
                onPress={handleAddStep}
                disabled={!newStep.name.trim()}
              >
                <LinearGradient
                  colors={newStep.name.trim() ? ['#C9A961', '#A68B4F'] : ['#666666', '#555555']}
                  style={styles.modalAddButtonGradient}
                >
                  <Plus color="#FFFFFF" size={18} />
                  <Text style={styles.modalAddButtonText}>Add Step</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newRoutineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    borderWidth: 1,
    borderColor: palette.gold,
  },
  newRoutineButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: palette.gold,
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
    zIndex: 1000,
    elevation: 1000,
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
  addStepSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    borderWidth: 1.5,
    borderColor: palette.gold,
    borderStyle: 'dashed',
  },
  addStepButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: palette.gold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: palette.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: palette.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: palette.textPrimary,
    borderWidth: 1,
    borderColor: palette.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  timeOfDayButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  timeOfDayButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1.5,
    borderColor: palette.border,
    alignItems: 'center',
  },
  timeOfDayButtonActive: {
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    borderColor: palette.gold,
  },
  timeOfDayButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: palette.textSecondary,
  },
  timeOfDayButtonTextActive: {
    color: palette.gold,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: palette.textPrimary,
  },
  modalAddButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalAddButtonDisabled: {
    opacity: 0.5,
  },
  modalAddButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  modalAddButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
