import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Target, ArrowRight, CheckCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useSkincare } from '@/contexts/SkincareContext';
import * as Haptics from 'expo-haptics';

const GOAL_OPTIONS = [
  {
    id: 'acne',
    title: 'Clear Acne & Breakouts',
    description: 'Reduce active breakouts and prevent future ones',
    icon: '🎯',
  },
  {
    id: 'anti-aging',
    title: 'Anti-Aging & Fine Lines',
    description: 'Reduce fine lines, wrinkles, and signs of aging',
    icon: '✨',
  },
  {
    id: 'hydration',
    title: 'Improve Hydration',
    description: 'Boost skin moisture and plumpness',
    icon: '💧',
  },
  {
    id: 'brightness',
    title: 'Brighten & Even Tone',
    description: 'Reduce dark spots and achieve even skin tone',
    icon: '🌟',
  },
  {
    id: 'texture',
    title: 'Smooth Texture',
    description: 'Improve skin smoothness and reduce roughness',
    icon: '🌸',
  },
  {
    id: 'pores',
    title: 'Minimize Pores',
    description: 'Reduce pore visibility and size',
    icon: '🔍',
  },
  {
    id: 'sensitivity',
    title: 'Calm Sensitive Skin',
    description: 'Reduce redness and irritation',
    icon: '🛡️',
  },
  {
    id: 'overall',
    title: 'Overall Improvement',
    description: 'General skincare routine for healthy skin',
    icon: '💫',
  },
];

export default function RoutineGoalSetupScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const { currentResult } = useAnalysis();
  const { generateCustomPlan, isGenerating, activePlans, deactivatePlan, canAddMorePlans } = useSkincare();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const styles = createStyles(palette);

  if (!currentResult) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No analysis result found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleGoalToggle = (goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter(id => id !== goalId));
    } else {
      if (selectedGoals.length < 3) {
        setSelectedGoals([...selectedGoals, goalId]);
      } else {
        Alert.alert(
          'Maximum Goals',
          'You can select up to 3 primary goals. Deselect one to choose another.',
        );
      }
    }
  };


  const handleGeneratePlan = async () => {
    if (selectedGoals.length === 0 && !customGoal.trim()) {
      Alert.alert('Select a Goal', 'Please select at least one goal or enter a custom goal.');
      return;
    }

    // Check if user has active plans
    if (activePlans.length > 0) {
      // Show dialog to ask what they want to do
      if (!canAddMorePlans) {
        // User has 3 active plans - must replace or pause one
        Alert.alert(
          'Active Routine Detected',
          `You already have ${activePlans.length} active routine(s). You can have up to 3 active routines at a time.\n\nWhat would you like to do?`,
          [
            {
              text: 'Pause Current & Start New',
              style: 'default',
              onPress: async () => {
                // Pause all current active plans
                for (const plan of activePlans) {
                  await deactivatePlan(plan.id);
                }
                await proceedWithPlanGeneration();
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      } else {
        // User has less than 3 active plans - can add new one
        Alert.alert(
          'Create New Routine?',
          `You already have ${activePlans.length} active routine(s). You can have up to 3 active routines.\n\nWould you like to:\n• Add this as a new routine (keep current one active)\n• Pause current routine and start this new one`,
          [
            {
              text: 'Add New (Keep Current)',
              style: 'default',
              onPress: () => proceedWithPlanGeneration()
            },
            {
              text: 'Pause Current & Start New',
              style: 'default',
              onPress: async () => {
                // Pause all current active plans
                for (const plan of activePlans) {
                  await deactivatePlan(plan.id);
                }
                await proceedWithPlanGeneration();
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }
    }

    // No active plans - proceed directly
    await proceedWithPlanGeneration();
  };

  const proceedWithPlanGeneration = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Build goal description
      let goalDescription = '';
      
      if (selectedGoals.length > 0) {
        const goalNames = selectedGoals.map(id => {
          const goal = GOAL_OPTIONS.find(g => g.id === id);
          return goal?.title || id;
        });
        goalDescription = `Primary goals: ${goalNames.join(', ')}`;
      }
      
      if (customGoal.trim()) {
        if (goalDescription) {
          goalDescription += `. Custom goal: ${customGoal.trim()}`;
        } else {
          goalDescription = customGoal.trim();
        }
      }

      console.log('🎯 Generating plan with goals:', goalDescription);
      
      const plan = await generateCustomPlan(currentResult, goalDescription);
      
      console.log('✅ Plan generated successfully:', plan.id);
      
      // Navigate to routine screen
      router.replace('/(tabs)/glow-coach');
    } catch (error: any) {
      console.error('❌ Plan generation error:', error);
      Alert.alert(
        'Error',
        'Failed to generate your routine. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Set Your Goals',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: palette.textPrimary,
          headerTransparent: true,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Target color={palette.primary} size={32} strokeWidth={2.5} />
          </View>
          <Text style={styles.headerTitle}>What's Your Goal?</Text>
          <Text style={styles.headerSubtitle}>
            Select up to 3 primary goals to create your personalized routine
          </Text>
        </View>

        {/* Goal Options */}
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>Choose Your Goals</Text>
          <View style={styles.goalsGrid}>
            {GOAL_OPTIONS.map((goal) => {
              const isSelected = selectedGoals.includes(goal.id);
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    isSelected && styles.goalCardSelected,
                  ]}
                  onPress={() => handleGoalToggle(goal.id)}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <CheckCircle color="#FFFFFF" size={16} fill="#FFFFFF" />
                    </View>
                  )}
                  <Text style={styles.goalIcon}>{goal.icon}</Text>
                  <Text style={[
                    styles.goalTitle,
                    isSelected && styles.goalTitleSelected,
                  ]}>
                    {goal.title}
                  </Text>
                  <Text style={[
                    styles.goalDescription,
                    isSelected && styles.goalDescriptionSelected,
                  ]}>
                    {goal.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Goal Input */}
        <View style={styles.customSection}>
          <TouchableOpacity
            style={styles.customToggle}
            onPress={() => {
              setShowCustomInput(!showCustomInput);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.customToggleText}>
              {showCustomInput ? '✓' : '+'} Add Custom Goal
            </Text>
          </TouchableOpacity>

          {showCustomInput && (
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                placeholder="Describe your specific skincare goal..."
                placeholderTextColor={palette.textMuted}
                value={customGoal}
                onChangeText={setCustomGoal}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}
        </View>

        {/* Selected Goals Summary */}
        {selectedGoals.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Your Goals:</Text>
            <View style={styles.summaryTags}>
              {selectedGoals.map((goalId) => {
                const goal = GOAL_OPTIONS.find(g => g.id === goalId);
                return (
                  <View key={goalId} style={styles.summaryTag}>
                    <Text style={styles.summaryTagText}>{goal?.title || goalId}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Generate Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.generateButton,
              (selectedGoals.length === 0 && !customGoal.trim()) && styles.generateButtonDisabled,
            ]}
            onPress={handleGeneratePlan}
            disabled={isGenerating || (selectedGoals.length === 0 && !customGoal.trim())}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={
                (selectedGoals.length === 0 && !customGoal.trim())
                  ? [palette.surface, palette.surface]
                  : [palette.primary, palette.primaryDark || palette.primary]
              }
              style={styles.generateButtonGradient}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.generateButtonText}>Generating Your Routine...</Text>
                </>
              ) : (
                <>
                  <Sparkles color="#FFFFFF" size={20} strokeWidth={2.5} />
                  <Text style={styles.generateButtonText}>Generate My Routine</Text>
                  <ArrowRight color="#FFFFFF" size={20} strokeWidth={2.5} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.buttonHint}>
            Your routine will be personalized based on your analysis and goals
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    color: palette.textMuted,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: palette.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  backButtonText: {
    color: palette.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  goalsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 16,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    width: '47%',
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: palette.border,
    ...shadow.card,
    position: 'relative',
  },
  goalCardSelected: {
    backgroundColor: 'rgba(201, 169, 97, 0.1)',
    borderColor: palette.gold,
    borderWidth: 2.5,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  goalTitleSelected: {
    color: palette.gold,
  },
  goalDescription: {
    fontSize: 12,
    color: palette.textSecondary,
    lineHeight: 18,
  },
  goalDescriptionSelected: {
    color: palette.textPrimary,
  },
  customSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  customToggle: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: palette.border,
    ...shadow.card,
  },
  customToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.primary,
    textAlign: 'center',
  },
  customInputContainer: {
    marginTop: 12,
  },
  customInput: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: palette.border,
    color: palette.textPrimary,
    fontSize: 15,
    minHeight: 100,
    ...shadow.card,
  },
  summarySection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  summaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryTag: {
    backgroundColor: palette.gold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  summaryTagText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  generateButton: {
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow.elevated,
    marginBottom: 12,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonHint: {
    fontSize: 13,
    color: palette.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

