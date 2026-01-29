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
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, gradient, shadow, typography, spacing } from '@/constants/theme';
import { 
  Calendar,
  CheckCircle,
  Circle,
  Camera,
  Plus,
  Target,
  Droplets,
  Sun,
  Moon,
  X,
  Play,
  Pause,
  Crown,
  Sparkles,
  Heart,
  Star,
  Gem,
  ArrowRight,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react-native';
import { useSkincare } from '@/contexts/SkincareContext';
import { useGamification } from '@/contexts/GamificationContext';
import { SkincareStep, WeeklyPlan, SkincarePlan } from '@/types/skincare';
import { router } from 'expo-router';
import DailyRewardsModal from '@/components/DailyRewardsModal';
import AnimatedProgressBar from '@/components/AnimatedProgressBar';
import GlassCard from '@/components/GlassCard';
import { useProducts } from '@/contexts/ProductContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import FeaturePaywall from '@/components/FeaturePaywall';
import Logo from '@/components/Logo';

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
  const { 
    currentPlan, 
    activePlans, 
    updatePlanProgress, 
    setCurrentPlan, 
    deactivatePlan, 
    canAddMorePlans,
    savePlan
  } = useSkincare();
  const { completeDailyRoutine, hasCompletedToday, hasCompletedForPlanDay } = useGamification();
  const { recommendations, generateRecommendations } = useProducts();
  const subscription = useSubscription();
  const { canAccessAICoach } = subscription || { canAccessAICoach: false };
  const [showPaywall, setShowPaywall] = useState(!canAccessAICoach);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemProduct, setItemProduct] = useState('');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<'morning' | 'evening'>('morning');
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [dailyRewards, setDailyRewards] = useState<DailyReward[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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

  useEffect(() => {
    const checkAndSkipIncompleteDays = async () => {
      if (!currentPlan) return;
      if (currentPlan.progress.currentDay >= currentPlan.duration) return;
      
      const currentDayCompleted = hasCompletedForPlanDay(currentPlan.id, currentPlan.progress.currentDay);
      
      if (!currentDayCompleted) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayMidnight = today.getTime();
        const planTime = currentPlan.lastAccessedAt || currentPlan.createdAt;
        const planDate = new Date(planTime);
        const planDay = new Date(planDate.getFullYear(), planDate.getMonth(), planDate.getDate());
        const planMidnight = planDay.getTime();
        
        if (planMidnight < todayMidnight) {
          const nextDay = currentPlan.progress.currentDay + 1;
          if (nextDay <= currentPlan.duration) {
            await updatePlanProgress(currentPlan.id, {
              currentDay: nextDay,
              completedSteps: []
            });
          }
        }
      }
    };

    const timer = setTimeout(checkAndSkipIncompleteDays, 500);
    return () => clearTimeout(timer);
  }, [currentPlan, hasCompletedForPlanDay, updatePlanProgress]);

  useEffect(() => {
    const checkDayProgression = async () => {
      if (!currentPlan) return;
      if (currentPlan.progress.currentDay >= currentPlan.duration) return;
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour === 0 && currentMinute <= 5) {
        const currentDayCompleted = hasCompletedForPlanDay(currentPlan.id, currentPlan.progress.currentDay);
        
        if (!currentDayCompleted) {
          const nextDay = currentPlan.progress.currentDay + 1;
          if (nextDay <= currentPlan.duration) {
            await updatePlanProgress(currentPlan.id, {
              currentDay: nextDay,
              completedSteps: []
            });
          }
        }
      }
    };

    checkDayProgression();
    const interval = setInterval(checkDayProgression, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentPlan, hasCompletedForPlanDay, updatePlanProgress]);

  const handlePlanSwitch = async (plan: SkincarePlan) => {
    const updatedPlan = { ...plan, lastAccessedAt: Date.now() };
    setCurrentPlan(updatedPlan);
    setShowPlansModal(false);
  };

  const handleDeactivatePlan = async (planId: string) => {
    Alert.alert('Deactivate Plan', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          try {
            await deactivatePlan(planId);
            setShowPlansModal(false);
          } catch (err) {
            Alert.alert('Error', 'Failed to deactivate plan');
          }
        }
      }
    ]);
  };

  if (activePlans.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={['#FAFBFC', '#F5F7FA']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrapper}>
            <LinearGradient colors={['#F5F7FA', '#FFFFFF']} style={styles.emptyIcon}>
              <Crown color="#C9A961" size={48} strokeWidth={1.5} />
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>Your Glow Journey{'\n'}Awaits</Text>
          <Text style={styles.emptySubtitle}>
            Get a personalized skincare plan with AI-powered analysis. Track progress and watch your skin transform.
          </Text>
          <TouchableOpacity 
            style={styles.startButton}
            onPress={() => router.push('/glow-analysis')}
            activeOpacity={0.9}
          >
            <LinearGradient colors={['#0A0A0A', '#1A1A1A']} style={styles.startButtonGradient}>
              <Sparkles color="#FFFFFF" size={20} />
              <Text style={styles.startButtonText}>Start Analysis</Text>
              <ArrowRight color="#FFFFFF" size={18} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentPlan) return null;

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

  const handleStepComplete = async (stepId: string) => {
    const isCompleted = currentPlan.progress.completedSteps.includes(stepId);
    const updatedSteps = isCompleted
      ? currentPlan.progress.completedSteps.filter((id: string) => id !== stepId)
      : [...currentPlan.progress.completedSteps, stepId];
    
    await updatePlanProgress(currentPlan.id, { completedSteps: updatedSteps });
  };

  const handleAddItem = async () => {
    if (!itemName.trim() || !itemDescription.trim()) {
      Alert.alert('Missing Info', 'Please enter name and description.');
      return;
    }
    
    if (!currentPlan) return;
    
    const currentWeekIndex = Math.min(currentWeek - 1, currentPlan.weeklyPlans.length - 1);
    const weekPlan = currentPlan.weeklyPlans[currentWeekIndex];
    
    const existingSteps = weekPlan.steps.filter(
      (step: SkincareStep) => step.timeOfDay === selectedTimeOfDay || step.timeOfDay === 'both'
    );
    const maxOrder = existingSteps.length > 0 
      ? Math.max(...existingSteps.map((s: SkincareStep) => s.order))
      : 0;
    
    const newStep: SkincareStep = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: itemName.trim(),
      description: itemDescription.trim(),
      products: itemProduct.trim() ? [itemProduct.trim()] : [],
      timeOfDay: selectedTimeOfDay,
      frequency: 'daily',
      order: maxOrder + 1,
      instructions: [itemDescription.trim()],
      benefits: ['Custom step'],
    };
    
    const updatedWeeklyPlans = [...currentPlan.weeklyPlans];
    updatedWeeklyPlans[currentWeekIndex] = {
      ...weekPlan,
      steps: [...weekPlan.steps, newStep]
    };
    
    const updatedPlan = { ...currentPlan, weeklyPlans: updatedWeeklyPlans };
    await savePlan(updatedPlan);
    setCurrentPlan(updatedPlan);
    
    setItemName('');
    setItemDescription('');
    setItemProduct('');
    setSelectedTimeOfDay('morning');
    setShowNoteModal(false);
    
    Alert.alert('Added!', `"${itemName}" added to your routine.`);
  };

  const handleCompleteDailyRoutine = async () => {
    if (!currentPlan) return;
    
    try {
      if (hasCompletedToday()) {
        Alert.alert('Already Done!', 'Come back tomorrow for your next routine.');
        return;
      }
      
      const allSteps = [...todaySteps.morning, ...todaySteps.evening];
      const completedSteps = currentPlan.progress.completedSteps;
      const allStepsCompleted = allSteps.every(step => completedSteps.includes(step.id));
      
      if (!allStepsCompleted) {
        const incompleteSteps = allSteps.filter(step => !completedSteps.includes(step.id));
        Alert.alert(
          'Complete Your Routine',
          `Finish these steps first:\n\n${incompleteSteps.map(s => `• ${s.name}`).join('\n')}`
        );
        return;
      }
      
      const rewards = await completeDailyRoutine(currentPlan.id, currentPlan.progress.currentDay);
      
      const isLastDay = currentPlan.progress.currentDay >= currentPlan.duration;
      const nextDay = isLastDay ? currentPlan.progress.currentDay : currentPlan.progress.currentDay + 1;
      
      if (!isLastDay) {
        await updatePlanProgress(currentPlan.id, { currentDay: nextDay, completedSteps: [] });
      }
      
      if (rewards && rewards.length > 0) {
        setDailyRewards(rewards);
        setShowRewardsModal(true);
      } else {
        Alert.alert(
          isLastDay ? 'Plan Complete! 🎉' : 'Day Complete! ✨',
          isLastDay 
            ? 'Congratulations on completing your plan!' 
            : `Day ${currentPlan.progress.currentDay} done! Ready for day ${nextDay}?`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete routine.');
    }
  };

  const renderStepItem = (step: SkincareStep, isCompleted: boolean) => (
    <TouchableOpacity
      key={step.id}
      style={[styles.stepItem, isCompleted && styles.stepItemCompleted]}
      onPress={() => handleStepComplete(step.id)}
      activeOpacity={0.7}
    >
      <View style={styles.stepCheckbox}>
        {isCompleted ? (
          <View style={styles.checkboxDone}>
            <CheckCircle color="#FFFFFF" size={18} />
          </View>
        ) : (
          <View style={styles.checkboxEmpty}>
            <Circle color="#D1D5DB" size={18} />
          </View>
        )}
      </View>
      
      <View style={styles.stepContent}>
        <Text style={[styles.stepName, isCompleted && styles.stepNameDone]}>{step.name}</Text>
        <Text style={styles.stepDesc}>{step.description}</Text>
        {step.products.length > 0 && (
          <View style={styles.stepProducts}>
            <Droplets color="#C9A961" size={12} />
            <Text style={styles.stepProductText}>{step.products.join(' • ')}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#FAFBFC', '#F5F7FA']} style={StyleSheet.absoluteFillObject} />
      
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        style={{ opacity: fadeAnim }}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Glow Coach</Text>
              <Text style={styles.headerSubtitle}>Day {currentPlan.progress.currentDay} of {currentPlan.duration}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.plansButton}
              onPress={() => setShowPlansModal(true)}
              activeOpacity={0.8}
            >
              <Gem color="#C9A961" size={16} />
              <Text style={styles.plansButtonText}>{activePlans.length}/3</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <GlassCard variant="elevated" borderRadius={20}>
            <View style={styles.progressHeader}>
              <Text style={styles.planTitle}>{currentPlan.title}</Text>
              <View style={styles.weekBadge}>
                <Text style={styles.weekBadgeText}>Week {currentWeek}</Text>
              </View>
            </View>
            
            <View style={styles.progressBar}>
              <AnimatedProgressBar 
                progress={progressPercentage}
                height={8}
                borderRadius={4}
                gradientColors={['#0A0A0A', '#1A1A1A']}
                duration={800}
              />
            </View>
            
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Calendar color="#6B7280" size={14} />
                <Text style={styles.progressStatText}>{daysRemaining} days left</Text>
              </View>
              <View style={styles.progressStat}>
                <Heart color="#C9A961" size={14} fill="#C9A961" />
                <Text style={styles.progressStatText}>{Math.round(progressPercentage)}% complete</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {currentWeekPlan && (
          <View style={styles.section}>
            <GlassCard variant="subtle" borderRadius={16} padding={16}>
              <View style={styles.focusHeader}>
                <Target color="#C9A961" size={18} />
                <Text style={styles.focusTitle}>This Week&apos;s Focus</Text>
              </View>
              <Text style={styles.focusText}>{currentWeekPlan.focus}</Text>
            </GlassCard>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today&apos;s Routine</Text>
          
          {todaySteps.morning.length > 0 && (
            <View style={styles.routineCard}>
              <View style={styles.routineHeader}>
                <View style={[styles.routineIcon, { backgroundColor: 'rgba(251,191,36,0.15)' }]}>
                  <Sun color="#F59E0B" size={18} />
                </View>
                <Text style={styles.routineTitle}>Morning</Text>
                <Text style={styles.routineCount}>
                  {todaySteps.morning.filter((s: SkincareStep) => currentPlan.progress.completedSteps.includes(s.id)).length}/{todaySteps.morning.length}
                </Text>
              </View>
              
              {todaySteps.morning.map((step: SkincareStep) => 
                renderStepItem(step, currentPlan.progress.completedSteps.includes(step.id))
              )}
            </View>
          )}

          {todaySteps.evening.length > 0 && (
            <View style={styles.routineCard}>
              <View style={styles.routineHeader}>
                <View style={[styles.routineIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                  <Moon color="#6366F1" size={18} />
                </View>
                <Text style={styles.routineTitle}>Evening</Text>
                <Text style={styles.routineCount}>
                  {todaySteps.evening.filter((s: SkincareStep) => currentPlan.progress.completedSteps.includes(s.id)).length}/{todaySteps.evening.length}
                </Text>
              </View>
              
              {todaySteps.evening.map((step: SkincareStep) => 
                renderStepItem(step, currentPlan.progress.completedSteps.includes(step.id))
              )}
            </View>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowNoteModal(true)}>
            <Plus color="#C9A961" size={18} />
            <Text style={styles.actionBtnText}>Add Step</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/progress')}>
            <Camera color="#C9A961" size={18} />
            <Text style={styles.actionBtnText}>Photo</Text>
          </TouchableOpacity>
          
          {canAddMorePlans && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => router.push('/glow-analysis')}>
              <Plus color="#FFFFFF" size={18} />
              <Text style={styles.actionBtnTextPrimary}>New Plan</Text>
            </TouchableOpacity>
          )}
        </View>

        {recommendations.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.recommendationsCard}
              onPress={() => router.push('/product-tracking')}
              activeOpacity={0.9}
            >
              <View style={styles.recommendationsContent}>
                <View style={styles.recommendationsIcon}>
                  <ShoppingBag color="#6B7280" size={22} />
                </View>
                <View style={styles.recommendationsText}>
                  <Text style={styles.recommendationsTitle}>Product Picks</Text>
                  <Text style={styles.recommendationsSubtitle}>{recommendations.length} recommendations</Text>
                </View>
                <ChevronRight color="#9CA3AF" size={20} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          {hasCompletedForPlanDay(currentPlan.id, currentPlan.progress.currentDay) ? (
            <View style={styles.completedButton}>
              <CheckCircle color="#10B981" size={20} />
              <Text style={styles.completedButtonText}>
                {currentPlan.progress.currentDay >= currentPlan.duration ? 'Plan Complete! 🎉' : 'Day Complete ✨'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={handleCompleteDailyRoutine}
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#10B981', '#059669']} style={styles.completeButtonGradient}>
                <CheckCircle color="#FFFFFF" size={20} />
                <Text style={styles.completeButtonText}>Complete Day {currentPlan.progress.currentDay}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </Animated.ScrollView>

      <Modal visible={showPlansModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Plans ({activePlans.length}/3)</Text>
            <TouchableOpacity onPress={() => setShowPlansModal(false)}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {activePlans.map((plan) => (
              <View key={plan.id} style={styles.planItem}>
                <TouchableOpacity style={styles.planItemContent} onPress={() => handlePlanSwitch(plan)}>
                  <View style={styles.planItemInfo}>
                    <Text style={styles.planItemTitle}>{plan.title}</Text>
                    <Text style={styles.planItemProgress}>
                      Day {plan.progress.currentDay}/{plan.duration} • Week {Math.ceil(plan.progress.currentDay / 7)}
                    </Text>
                    <View style={styles.planItemBar}>
                      <View style={[styles.planItemFill, { width: `${(plan.progress.currentDay / plan.duration) * 100}%` }]} />
                    </View>
                  </View>
                  
                  {currentPlan.id === plan.id && (
                    <View style={styles.activeBadge}>
                      <Play color="#10B981" size={14} fill="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.deactivateBtn} onPress={() => handleDeactivatePlan(plan.id)}>
                  <Pause color="#EF4444" size={16} />
                </TouchableOpacity>
              </View>
            ))}
            
            {canAddMorePlans && (
              <TouchableOpacity 
                style={styles.addPlanBtn}
                onPress={() => { setShowPlansModal(false); router.push('/glow-analysis'); }}
              >
                <Plus color="#C9A961" size={20} />
                <Text style={styles.addPlanBtnText}>Create New Plan</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showNoteModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Custom Step</Text>
            <TouchableOpacity onPress={() => { setShowNoteModal(false); setItemName(''); setItemDescription(''); setItemProduct(''); }}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalLabel}>Routine</Text>
            <View style={styles.timeSelector}>
              <TouchableOpacity
                style={[styles.timeBtn, selectedTimeOfDay === 'morning' && styles.timeBtnActive]}
                onPress={() => setSelectedTimeOfDay('morning')}
              >
                <Sun color={selectedTimeOfDay === 'morning' ? '#F59E0B' : '#9CA3AF'} size={18} />
                <Text style={[styles.timeBtnText, selectedTimeOfDay === 'morning' && styles.timeBtnTextActive]}>Morning</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.timeBtn, selectedTimeOfDay === 'evening' && styles.timeBtnActive]}
                onPress={() => setSelectedTimeOfDay('evening')}
              >
                <Moon color={selectedTimeOfDay === 'evening' ? '#6366F1' : '#9CA3AF'} size={18} />
                <Text style={[styles.timeBtnText, selectedTimeOfDay === 'evening' && styles.timeBtnTextActive]}>Evening</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>Step Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Vitamin C Serum"
              value={itemName}
              onChangeText={setItemName}
              placeholderTextColor="#9CA3AF"
            />
            
            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="How to apply this step..."
              value={itemDescription}
              onChangeText={setItemDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
            
            <Text style={styles.modalLabel}>Product (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., CeraVe Cleanser"
              value={itemProduct}
              onChangeText={setItemProduct}
              placeholderTextColor="#9CA3AF"
            />
            
            <TouchableOpacity 
              style={[styles.saveBtn, { opacity: (itemName.trim() && itemDescription.trim()) ? 1 : 0.5 }]}
              onPress={handleAddItem}
              disabled={!itemName.trim() || !itemDescription.trim()}
            >
              <Text style={styles.saveBtnText}>Add Step</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <DailyRewardsModal visible={showRewardsModal} rewards={dailyRewards} onClose={() => setShowRewardsModal(false)} />
      
      {showPaywall && <FeaturePaywall featureType="ai-coach" onDismiss={() => setShowPaywall(false)} showDismiss={true} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#0A0A0A',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  plansButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201,169,97,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  plansButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#C9A961',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0A0A0A',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#0A0A0A',
    flex: 1,
  },
  weekBadge: {
    backgroundColor: 'rgba(201,169,97,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  weekBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#C9A961',
  },
  progressBar: {
    marginBottom: 14,
  },
  progressStats: {
    flexDirection: 'row',
    gap: 20,
  },
  progressStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressStatText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500' as const,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  focusTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  focusText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0A0A0A',
    lineHeight: 22,
  },
  routineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...shadow.soft,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  routineIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0A0A0A',
    flex: 1,
  },
  routineCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600' as const,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  stepItemCompleted: {
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  stepCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxDone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0A0A0A',
    marginBottom: 4,
  },
  stepNameDone: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  stepDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  stepProducts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepProductText: {
    fontSize: 12,
    color: '#C9A961',
    fontWeight: '500' as const,
    fontStyle: 'italic' as const,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  actionBtnPrimary: {
    backgroundColor: '#0A0A0A',
    borderColor: '#0A0A0A',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#C9A961',
  },
  actionBtnTextPrimary: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  recommendationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  recommendationsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  recommendationsText: {
    flex: 1,
  },
  recommendationsTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0A0A0A',
    marginBottom: 2,
  },
  recommendationsSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  completeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  completedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  completedButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#10B981',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrapper: {
    marginBottom: 24,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.soft,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#0A0A0A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 10,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0A0A0A',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#0A0A0A',
    marginBottom: 10,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0A0A0A',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  modalTextArea: {
    minHeight: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  timeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  timeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  timeBtnActive: {
    backgroundColor: '#0A0A0A',
    borderColor: '#0A0A0A',
  },
  timeBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  timeBtnTextActive: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: '#0A0A0A',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  planItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
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
    fontWeight: '600' as const,
    color: '#0A0A0A',
    marginBottom: 4,
  },
  planItemProgress: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  planItemBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  planItemFill: {
    height: '100%',
    backgroundColor: '#C9A961',
    borderRadius: 2,
  },
  activeBadge: {
    marginLeft: 12,
  },
  deactivateBtn: {
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0,0,0,0.06)',
  },
  addPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#C9A961',
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 8,
  },
  addPlanBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#C9A961',
  },
});
