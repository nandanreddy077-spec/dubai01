import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, gradient, shadow, typography, spacing } from '@/constants/theme';
import { 
  Calendar,
  CheckCircle,
  Circle,
  Camera,
  Plus,
  Target,
  TrendingUp,
  Award,
  Clock,
  Droplets,
  Sun,
  Moon,
  X,
  Settings,
  Trash2,
  Play,
  Pause,
  Crown,
  Sparkles,
  Heart,
  Star,
  Gem,
  ArrowRight,
  ShoppingBag
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
import { useSkincare } from '@/contexts/SkincareContext';
import { useGamification } from '@/contexts/GamificationContext';
import { SkincareStep, WeeklyPlan, SkincarePlan } from '@/types/skincare';
import { router } from 'expo-router';
import DailyRewardsModal from '@/components/DailyRewardsModal';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
import { useProducts } from '@/contexts/ProductContext';
import { Linking } from 'react-native';

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
  const { 
    currentPlan, 
    activePlans, 
    updatePlanProgress, 
    setCurrentPlan, 
    deactivatePlan, 
    canAddMorePlans 
  } = useSkincare();
  const { completeDailyRoutine, hasCompletedToday, hasCompletedForPlanDay } = useGamification();
  const { recommendations, generateRecommendations, trackAffiliateTap } = useProducts();
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedMood, setSelectedMood] = useState<'great' | 'good' | 'okay' | 'bad' | null>(null);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>([]);

  useEffect(() => {
    if (!currentPlan && activePlans.length > 0) {
      setCurrentPlan(activePlans[0]);
    }
  }, [currentPlan, activePlans, setCurrentPlan]);

  useEffect(() => {
    if (currentPlan) {
      generateRecommendations();
    }
  }, [currentPlan, generateRecommendations]);

  // Auto-advance day progression based on time
  useEffect(() => {
    const checkDayProgression = async () => {
      if (!currentPlan) return;
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = now.getHours();
      
      // Check if we should auto-advance to next day
      // Auto-advance at midnight if user hasn't completed routine
      if (currentHour === 0 && !hasCompletedToday()) {
        console.log('🕛 Auto-advancing to next day at midnight');
        
        // Only advance if not at the end of the plan
        if (currentPlan.progress.currentDay < currentPlan.duration) {
          const nextDay = currentPlan.progress.currentDay + 1;
          await updatePlanProgress(currentPlan.id, {
            currentDay: nextDay,
            completedSteps: [] // Reset for new day
          });
          console.log(`📅 Auto-advanced to day ${nextDay}`);
        }
      }
    };

    // Check immediately and then every hour
    checkDayProgression();
    const interval = setInterval(checkDayProgression, 60 * 60 * 1000); // Every hour
    
    return () => clearInterval(interval);
  }, [currentPlan, hasCompletedToday, updatePlanProgress]);

  const handlePlanSwitch = (plan: SkincarePlan) => {
    setCurrentPlan(plan);
    setShowPlansModal(false);
  };

  const handleDeactivatePlan = async (planId: string) => {
    Alert.alert(
      'Deactivate Plan',
      'Are you sure you want to deactivate this plan? You can reactivate it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivatePlan(planId);
              setShowPlansModal(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate plan');
            }
          }
        }
      ]
    );
  };



  if (activePlans.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
        <View style={styles.emptyState}>
          <LinearGradient colors={gradient.shimmer} style={styles.emptyIcon}>
            <Crown color={palette.primary} size={48} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Your Glow Journey Awaits</Text>
          <Text style={styles.emptySubtitle}>
            Discover your skin's potential with our AI-powered analysis. Create up to 3 personalized beauty plans and watch your radiance transform.
          </Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push('/glow-analysis')}
            activeOpacity={0.9}
          >
            <LinearGradient colors={gradient.primary} style={styles.startButtonGradient}>
              <Sparkles color={palette.textLight} size={20} />
              <Text style={styles.startButtonText}>Begin Your Glow</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentPlan) {
    return null;
  }

  const currentWeek = Math.ceil(currentPlan.progress.currentDay / 7);
  const currentWeekPlan = currentPlan.weeklyPlans.find((w: WeeklyPlan) => w.week === currentWeek);
  const progressPercentage = (currentPlan.progress.currentDay / currentPlan.duration) * 100;
  const daysRemaining = currentPlan.duration - currentPlan.progress.currentDay + 1;

  const getTodaySteps = () => {
    if (!currentWeekPlan) return { morning: [], evening: [] };
    
    return {
      morning: currentWeekPlan.steps
        .filter((step: SkincareStep) => step.timeOfDay === 'morning' || step.timeOfDay === 'both')
        .map((step: SkincareStep) => ({
          ...step,
          // Create unique IDs for steps that appear in both routines
          id: step.timeOfDay === 'both' ? `${step.id}_morning` : step.id
        }))
        .sort((a: SkincareStep, b: SkincareStep) => a.order - b.order),
      evening: currentWeekPlan.steps
        .filter((step: SkincareStep) => step.timeOfDay === 'evening' || step.timeOfDay === 'both')
        .map((step: SkincareStep) => ({
          ...step,
          // Create unique IDs for steps that appear in both routines
          id: step.timeOfDay === 'both' ? `${step.id}_evening` : step.id
        }))
        .sort((a: SkincareStep, b: SkincareStep) => a.order - b.order)
    };
  };

  const todaySteps = getTodaySteps();

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
    if (!currentPlan) {
      console.log('❌ No current plan available');
      Alert.alert('Error', 'No active plan found. Please create a plan first.');
      return;
    }
    
    console.log('🚀 Starting daily routine completion...');
    console.log('📊 Current plan:', { id: currentPlan.id, title: currentPlan.title, currentDay: currentPlan.progress.currentDay });
    
    try {
      // Check if already completed today
      if (hasCompletedToday()) {
        console.log('✅ Already completed today');
        Alert.alert(
          'Already Complete!',
          'You have already completed your routine today. Come back tomorrow for your next session!',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
      
      // Check if all steps are completed
      const allSteps = [...todaySteps.morning, ...todaySteps.evening];
      const completedSteps = currentPlan.progress.completedSteps;
      
      console.log('📝 All steps:', allSteps.map(s => ({ id: s.id, name: s.name })));
      console.log('✅ Completed steps:', completedSteps);
      
      const allStepsCompleted = allSteps.every(step => completedSteps.includes(step.id));
      console.log('🎯 All steps completed:', allStepsCompleted);
      
      if (!allStepsCompleted) {
        const incompleteSteps = allSteps.filter(step => !completedSteps.includes(step.id));
        console.log('❌ Incomplete steps:', incompleteSteps.map(s => s.name));
        
        Alert.alert(
          'Complete Your Routine First',
          `Please complete these remaining steps to earn your rewards:\n\n${incompleteSteps.map(s => `• ${s.name}`).join('\n')}\n\nTap each step above to mark it as complete!`,
          [{ text: 'Got it!', style: 'default' }]
        );
        return;
      }
      
      console.log('✨ All steps completed, proceeding with daily routine completion...');
      
      // Complete the daily routine and get rewards
      console.log('🎁 Calling completeDailyRoutine...');
      const rewards = await completeDailyRoutine(currentPlan.id, currentPlan.progress.currentDay);
      console.log('🎉 Rewards received:', rewards);
      
      // Update plan progress - advance to next day ONLY if not at the end
      console.log('📈 Updating plan progress...');
      const isLastDay = currentPlan.progress.currentDay >= currentPlan.duration;
      const nextDay = isLastDay 
        ? currentPlan.progress.currentDay // Don't advance past the end
        : currentPlan.progress.currentDay + 1;
      
      if (!isLastDay) {
        await updatePlanProgress(currentPlan.id, {
          currentDay: nextDay,
          completedSteps: [] // Reset for new day
        });
        console.log('✅ Plan progress updated to day', nextDay);
      } else {
        console.log('🏁 Plan completed! Not advancing day.');
      }
      
      // Show rewards with day progression message
      if (rewards && rewards.length > 0) {
        console.log('🎊 Showing rewards modal with', rewards.length, 'rewards');
        setDailyRewards(rewards);
        setShowRewardsModal(true);
      } else {
        console.log('💫 No rewards, showing completion alert');
        Alert.alert(
          isLastDay ? 'Plan Complete! 🎉' : 'Day Complete! ✨',
          isLastDay 
            ? 'Congratulations! You\'ve completed your entire skincare plan. Your dedication to glowing skin is inspiring!' 
            : `Great job completing Day ${currentPlan.progress.currentDay}! Ready for Day ${nextDay}? Keep up the consistency.`,
          [{ text: 'Continue', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('❌ Error completing daily routine:', error);
      Alert.alert('Error', 'Failed to complete daily routine. Please try again.');
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'great': return '😍';
      case 'good': return '😊';
      case 'okay': return '😐';
      case 'bad': return '😞';
      default: return '📝';
    }
  };

  const renderStepItem = (step: SkincareStep, isCompleted: boolean) => (
    <TouchableOpacity
      key={step.id}
      style={[styles.stepItem, isCompleted && styles.completedStep]}
      onPress={() => handleStepComplete(step.id)}
      activeOpacity={0.8}
    >
      <View style={styles.stepCheckbox}>
        {isCompleted ? (
          <LinearGradient colors={gradient.success} style={styles.checkboxCompleted}>
            <CheckCircle color={palette.textLight} size={18} />
          </LinearGradient>
        ) : (
          <View style={styles.checkboxEmpty}>
            <Circle color={palette.textMuted} size={18} />
          </View>
        )}
      </View>
      
      <View style={styles.stepContent}>
        <Text style={[styles.stepName, isCompleted && styles.completedStepText]}>
          {step.name}
        </Text>
        <Text style={styles.stepDescription}>{step.description}</Text>
        {step.products.length > 0 && (
          <View style={styles.productsContainer}>
            <Droplets color={palette.primary} size={12} />
            <Text style={styles.stepProducts}>{step.products.join(' • ')}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Luxurious Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.titleContainer}>
              <LinearGradient colors={gradient.glow} style={styles.titleIcon}>
                <Crown color={palette.textLight} size={20} />
              </LinearGradient>
              <Text style={styles.headerTitle}>Your Glow Coach</Text>
            </View>
            <TouchableOpacity 
              style={styles.plansButton}
              onPress={() => setShowPlansModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient colors={gradient.shimmer} style={styles.plansButtonGradient}>
                <Gem color={palette.primary} size={16} />
                <Text style={styles.plansButtonText}>{activePlans.length}/3 Plans</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          {activePlans.length > 1 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.planTabs}
              contentContainerStyle={styles.planTabsContent}
            >
              {activePlans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planTab,
                    currentPlan.id === plan.id && styles.activePlanTab
                  ]}
                  onPress={() => handlePlanSwitch(plan)}
                >
                  <Text style={[
                    styles.planTabText,
                    currentPlan.id === plan.id && styles.activePlanTabText
                  ]}>
                    {plan.title}
                  </Text>
                  <Text style={[
                    styles.planTabDay,
                    currentPlan.id === plan.id && styles.activePlanTabDay
                  ]}>
                    Day {plan.progress.currentDay}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Elegant Progress Section */}
        <View style={styles.progressSection}>
          <LinearGradient colors={gradient.card} style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.planTitleRow}>
                <Text style={styles.planTitle}>{currentPlan.title}</Text>
                <View style={styles.weekBadge}>
                  <Star color={palette.primary} size={12} fill={palette.primary} />
                  <Text style={styles.weekBadgeText}>Week {currentWeek}</Text>
                </View>
              </View>
              <Text style={styles.dayCounter}>Day {currentPlan.progress.currentDay} of {currentPlan.duration}</Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <AnimatedProgressBar 
                  progress={progressPercentage}
                  height={8}
                  borderRadius={4}
                  gradientColors={gradient.primary}
                  duration={800}
                />
              </View>
              <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
            </View>
            
            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Calendar color={palette.primary} size={16} />
                <Text style={styles.statText}>{daysRemaining} days remaining</Text>
              </View>
              <View style={styles.statItem}>
                <Heart color={palette.rose} size={16} fill={palette.rose} />
                <Text style={styles.statText}>Glowing journey</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Elegant Week Focus */}
        {currentWeekPlan && (
          <View style={styles.weekFocusSection}>
            <LinearGradient colors={gradient.lavender} style={styles.weekFocusCard}>
              <View style={styles.weekFocusHeader}>
                <LinearGradient colors={gradient.glow} style={styles.focusIcon}>
                  <Target color={palette.textLight} size={16} />
                </LinearGradient>
                <Text style={styles.weekFocusTitle}>This Week&apos;s Focus</Text>
              </View>
              <Text style={styles.weekFocusText}>{currentWeekPlan.focus}</Text>
              <Text style={styles.weekFocusDescription}>{currentWeekPlan.description}</Text>
            </LinearGradient>
          </View>
        )}

        {/* Beautiful Routine Section */}
        <View style={styles.routineSection}>
          <View style={styles.routineSectionHeader}>
            <Sparkles color={palette.primary} size={20} />
            <Text style={styles.routineTitle}>Today&apos;s Ritual</Text>
          </View>
          
          {/* Morning Routine */}
          {todaySteps.morning.length > 0 && (
            <View style={styles.routineTimeSection}>
              <LinearGradient colors={gradient.mint} style={styles.routineTimeCard}>
                <View style={styles.routineTimeHeader}>
                  <LinearGradient colors={['#FEF3C7', '#F59E0B']} style={styles.timeIcon}>
                    <Sun color={palette.textLight} size={16} />
                  </LinearGradient>
                  <Text style={styles.routineTimeTitle}>Morning Glow</Text>
                </View>
                
                {todaySteps.morning.map((step: SkincareStep) => 
                  renderStepItem(step, currentPlan.progress.completedSteps.includes(step.id))
                )}
              </LinearGradient>
            </View>
          )}

          {/* Evening Routine */}
          {todaySteps.evening.length > 0 && (
            <View style={styles.routineTimeSection}>
              <LinearGradient colors={gradient.rose} style={styles.routineTimeCard}>
                <View style={styles.routineTimeHeader}>
                  <LinearGradient colors={['#E0E7FF', '#6366F1']} style={styles.timeIcon}>
                    <Moon color={palette.textLight} size={16} />
                  </LinearGradient>
                  <Text style={styles.routineTimeTitle}>Evening Renewal</Text>
                </View>
                
                {todaySteps.evening.map((step: SkincareStep) => 
                  renderStepItem(step, currentPlan.progress.completedSteps.includes(step.id))
                )}
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Product Recommendations Button */}
        {recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <TouchableOpacity 
              style={styles.recommendationsButton}
              onPress={() => router.push('/product-tracking')}
              activeOpacity={0.9}
            >
              <LinearGradient colors={gradient.glow} style={styles.recommendationsButtonGradient}>
                <View style={styles.recommendationsButtonContent}>
                  <View style={styles.recommendationsButtonLeft}>
                    <View style={styles.recommendationsIconWrapper}>
                      <ShoppingBag color={palette.textLight} size={24} />
                    </View>
                    <View>
                      <Text style={styles.recommendationsButtonTitle}>Product Recommendations</Text>
                      <Text style={styles.recommendationsButtonSubtitle}>
                        {recommendations.length} personalized picks for you
                      </Text>
                    </View>
                  </View>
                  <ArrowRight color={palette.textLight} size={20} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowNoteModal(true)}
          >
            <Plus color="#D4A574" size={20} />
            <Text style={styles.actionButtonText}>Add Note</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Photo Feature', 'Progress photo feature coming soon!')}
          >
            <Camera color="#D4A574" size={20} />
            <Text style={styles.actionButtonText}>Progress Photo</Text>
          </TouchableOpacity>
          
          {canAddMorePlans && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.addPlanButton]}
              onPress={() => router.push('/glow-analysis')}
            >
              <Plus color="white" size={20} />
              <Text style={styles.addPlanButtonText}>Add Plan</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Notes */}
        {currentPlan.progress.notes.length > 0 && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Recent Notes</Text>
            {currentPlan.progress.notes
              .slice(-3)
              .reverse()
              .map((note: any, index: number) => (
                <View key={index} style={styles.noteItem}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteDay}>Day {note.day}</Text>
                    {note.mood && (
                      <Text style={styles.noteMood}>{getMoodEmoji(note.mood)}</Text>
                    )}
                  </View>
                  <Text style={styles.noteContent}>{note.content}</Text>
                </View>
              ))
            }
          </View>
        )}



        {/* Complete Day Button */}
        <View style={styles.completeDaySection}>
          {hasCompletedForPlanDay(currentPlan.id, currentPlan.progress.currentDay) ? (
            <View style={[styles.completeDayButton, styles.completedDayButton]}>
              <CheckCircle color={palette.success} size={20} fill={palette.success} />
              <Text style={[styles.completeDayButtonText, styles.completedDayButtonText]}>
                {currentPlan.progress.currentDay >= currentPlan.duration 
                  ? 'Plan Complete! 🎉' 
                  : `Day ${currentPlan.progress.currentDay} Complete! ✨`}
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.completeDayButton, {
                opacity: currentPlan.progress.currentDay > currentPlan.duration ? 0.6 : 1
              }]}
              onPress={handleCompleteDailyRoutine}
              disabled={currentPlan.progress.currentDay > currentPlan.duration}
              activeOpacity={0.8}
            >
              <LinearGradient colors={gradient.success} style={styles.completeDayButtonGradient}>
                <CheckCircle color={palette.textLight} size={20} />
                <Text style={styles.completeDayButtonText}>
                  {currentPlan.progress.currentDay > currentPlan.duration 
                    ? 'Plan Completed!' 
                    : `Complete Day ${currentPlan.progress.currentDay} & Earn Rewards`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Plans Management Modal */}
      <Modal
        visible={showPlansModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Plans ({activePlans.length}/3)</Text>
            <TouchableOpacity onPress={() => setShowPlansModal(false)}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {activePlans.map((plan) => (
              <View key={plan.id} style={styles.planItem}>
                <TouchableOpacity 
                  style={styles.planItemContent}
                  onPress={() => handlePlanSwitch(plan)}
                >
                  <View style={styles.planItemInfo}>
                    <Text style={styles.planItemTitle}>{plan.title}</Text>
                    <Text style={styles.planItemProgress}>
                      Day {plan.progress.currentDay} of {plan.duration} • Week {Math.ceil(plan.progress.currentDay / 7)}
                    </Text>
                    <View style={styles.planItemProgressBar}>
                      <View 
                        style={[
                          styles.planItemProgressFill, 
                          { width: `${(plan.progress.currentDay / plan.duration) * 100}%` }
                        ]} 
                      />
                    </View>
                  </View>
                  
                  {currentPlan.id === plan.id && (
                    <View style={styles.activePlanIndicator}>
                      <Play color="#10B981" size={16} fill="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deactivateButton}
                  onPress={() => handleDeactivatePlan(plan.id)}
                >
                  <Pause color="#EF4444" size={16} />
                </TouchableOpacity>
              </View>
            ))}
            
            {canAddMorePlans && (
              <TouchableOpacity 
                style={styles.addNewPlanButton}
                onPress={() => {
                  setShowPlansModal(false);
                  router.push('/glow-analysis');
                }}
              >
                <Plus color="#D4A574" size={20} />
                <Text style={styles.addNewPlanButtonText}>Create New Plan</Text>
              </TouchableOpacity>
            )}
            
            {!canAddMorePlans && (
              <View style={styles.maxPlansNotice}>
                <Text style={styles.maxPlansNoticeText}>
                  You have reached the maximum of 3 active plans. Deactivate a plan to add a new one.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Daily Note</Text>
            <TouchableOpacity onPress={() => setShowNoteModal(false)}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>How are you feeling today?</Text>
            <View style={styles.moodSelector}>
              {[{ mood: 'great', emoji: '😍' }, { mood: 'good', emoji: '😊' }, { mood: 'okay', emoji: '😐' }, { mood: 'bad', emoji: '😞' }].map(({ mood, emoji }) => (
                <TouchableOpacity
                  key={mood}
                  style={[styles.moodButton, selectedMood === mood && styles.selectedMood]}
                  onPress={() => setSelectedMood(mood as any)}
                >
                  <Text style={styles.moodEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="How did your routine go? Any observations about your skin?"
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

      {/* Daily Rewards Modal */}
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
    backgroundColor: palette.backgroundStart,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
  },
  headerTitle: {
    fontSize: typography.h2,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  plansButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.card,
  },
  plansButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  plansButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: typography.semibold,
    color: palette.primary,
    letterSpacing: 0.3,
  },
  planTabs: {
    marginBottom: 8,
  },
  planTabsContent: {
    paddingRight: 20,
  },
  planTab: {
    backgroundColor: '#1C1820',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  activePlanTab: {
    backgroundColor: '#D4A574',
  },
  planTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  activePlanTabText: {
    color: '#FFFFFF',
  },
  planTabDay: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  activePlanTabDay: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxxl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    ...shadow.floating,
  },
  emptyTitle: {
    fontSize: typography.h1,
    fontWeight: typography.black,
    color: palette.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xxxxl,
    fontWeight: typography.regular,
  },
  startButton: {
    borderRadius: 28,
    overflow: 'hidden',
    ...shadow.floating,
  },
  startButtonGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  startButtonText: {
    color: palette.textLight,
    fontSize: typography.h6,
    fontWeight: typography.bold,
    letterSpacing: 0.2,
  },
  progressSection: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  progressCard: {
    borderRadius: 24,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: palette.borderLight,
    ...shadow.elevated,
  },
  progressHeader: {
    marginBottom: spacing.lg,
  },
  planTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  planTitle: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    letterSpacing: -0.2,
    flex: 1,
  },
  weekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.overlayGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  weekBadgeText: {
    fontSize: 11,
    fontWeight: typography.semibold,
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayCounter: {
    fontSize: typography.body,
    color: palette.textSecondary,
    fontWeight: typography.medium,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  progressTrack: {
    flex: 1,
  },
  progressPercentage: {
    fontSize: typography.bodySmall,
    fontWeight: typography.bold,
    color: palette.primary,
    minWidth: 35,
  },
  progressStats: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    fontWeight: typography.medium,
  },
  weekFocusSection: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  weekFocusCard: {
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.borderLight,
    ...shadow.card,
  },
  weekFocusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  focusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
  },
  weekFocusTitle: {
    fontSize: typography.h6,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    letterSpacing: 0.2,
  },
  weekFocusText: {
    fontSize: typography.h5,
    fontWeight: typography.extrabold,
    color: palette.primary,
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  weekFocusDescription: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    lineHeight: 22,
    fontWeight: typography.regular,
  },
  routineSection: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  routineSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  routineTitle: {
    fontSize: typography.h3,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  routineTimeSection: {
    marginBottom: spacing.xl,
  },
  routineTimeCard: {
    borderRadius: 20,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.borderLight,
    ...shadow.card,
  },
  routineTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  timeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
  },
  routineTimeTitle: {
    fontSize: typography.h5,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    letterSpacing: 0.2,
  },
  stepItem: {
    flexDirection: 'row',
    backgroundColor: palette.overlayLight,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: palette.borderLight,
    ...shadow.card,
  },
  completedStep: {
    backgroundColor: palette.overlayBlush,
    borderColor: palette.success,
  },
  stepCheckbox: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkboxCompleted: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
  },
  checkboxEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 2,
    borderColor: palette.border,
  },
  stepContent: {
    flex: 1,
  },
  stepName: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  completedStepText: {
    textDecorationLine: 'line-through',
    color: palette.textMuted,
  },
  stepDescription: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
    fontWeight: typography.regular,
  },
  productsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepProducts: {
    fontSize: typography.caption,
    color: palette.primary,
    fontWeight: typography.medium,
    fontStyle: 'italic',
  },
  recommendationsSection: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xl,
  },
  recommendationsButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  recommendationsButtonGradient: {
    padding: spacing.xl,
  },
  recommendationsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recommendationsButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  recommendationsIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationsButtonTitle: {
    fontSize: typography.h6,
    fontWeight: typography.bold,
    color: palette.textLight,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  recommendationsButtonSubtitle: {
    fontSize: typography.bodySmall,
    color: palette.textLight,
    opacity: 0.9,
    fontWeight: typography.medium,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1C1820',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2B2530',
    minWidth: 100,
  },
  addPlanButton: {
    backgroundColor: '#D4A574',
    borderColor: '#D4A574',
  },
  addPlanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A574',
  },
  notesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  noteItem: {
    backgroundColor: '#1C1820',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A574',
  },
  noteMood: {
    fontSize: 16,
  },
  noteContent: {
    fontSize: 14,
    color: palette.textPrimary,
    lineHeight: 20,
  },
  completeDaySection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  completeDayButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  completeDayButtonGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  completeDayButtonText: {
    color: palette.textLight,
    fontSize: typography.body,
    fontWeight: typography.bold,
    letterSpacing: 0.2,
  },
  completedDayButton: {
    backgroundColor: palette.overlayLight,
    borderWidth: 2,
    borderColor: palette.success,
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  completedDayButtonText: {
    color: palette.success,
    fontSize: typography.body,
    fontWeight: typography.bold,
    letterSpacing: 0.2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F0D10',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2B2530',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: palette.textPrimary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  moodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  moodButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1C1820',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2B2530',
  },
  selectedMood: {
    borderColor: '#D4A574',
    backgroundColor: '#141216',
  },
  moodEmoji: {
    fontSize: 24,
  },
  noteInput: {
    backgroundColor: '#1C1820',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2B2530',
    minHeight: 100,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#D4A574',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  planItem: {
    flexDirection: 'row',
    backgroundColor: '#1C1820',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  planItemContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  planItemInfo: {
    flex: 1,
  },
  planItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planItemProgress: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 8,
  },
  planItemProgressBar: {
    height: 4,
    backgroundColor: '#2B2530',
    borderRadius: 2,
  },
  planItemProgressFill: {
    height: '100%',
    backgroundColor: '#D4A574',
    borderRadius: 2,
  },
  activePlanIndicator: {
    marginLeft: 12,
  },
  deactivateButton: {
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#2B2530',
  },
  addNewPlanButton: {
    flexDirection: 'row',
    backgroundColor: '#141216',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#D4A574',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addNewPlanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4A574',
  },
  maxPlansNotice: {
    backgroundColor: '#1C1820',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  maxPlansNoticeText: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

});