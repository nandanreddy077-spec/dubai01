import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { Sparkles, DollarSign, ArrowRight, Edit3, Star, Crown, Zap, Gem } from 'lucide-react-native';
import { useAnalysis } from '@/contexts/AnalysisContext';
import { useSkincare } from '@/contexts/SkincareContext';
import { PlanTemplate } from '@/types/skincare';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow, typography, spacing } from '@/constants/theme';



export default function SkincarePlanSelectionScreen() {
  const { currentResult } = useAnalysis();
  const { getPresetPlans, createPlanFromTemplate, generateCustomPlan, isGenerating } = useSkincare();
  const [showCustomGoal, setShowCustomGoal] = useState(false);
  const [customGoal, setCustomGoal] = useState('');

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const { theme } = useTheme();

  // Animation refs
  const sparkleRotation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  const presetPlans = getPresetPlans();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette);

  const loadingSteps = [
    "Analyzing your unique skin profile...",
    "Selecting premium ingredients...",
    "Crafting your personalized routine...",
    "Adding finishing touches..."
  ];

  // Loading animations
  useEffect(() => {
    if (isGenerating) {
      // Reset animations
      setLoadingProgress(0);
      setLoadingStep(0);
      progressAnimation.setValue(0);
      
      // Sparkle rotation
      const sparkleRotate = Animated.loop(
        Animated.timing(sparkleRotation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      
      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      
      // Shimmer animation
      const shimmer = Animated.loop(
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      
      sparkleRotate.start();
      pulse.start();
      shimmer.start();
      
      // Progress simulation
      const progressTimer = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressTimer);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 500);
      
      // Step progression
      const stepTimer = setInterval(() => {
        setLoadingStep(prev => {
          if (prev >= loadingSteps.length - 1) {
            clearInterval(stepTimer);
            return loadingSteps.length - 1;
          }
          return prev + 1;
        });
      }, 2000);
      
      return () => {
        sparkleRotate.stop();
        pulse.stop();
        shimmer.stop();
        clearInterval(progressTimer);
        clearInterval(stepTimer);
      };
    }
  }, [isGenerating, loadingSteps.length, progressAnimation, pulseAnimation, shimmerAnimation, sparkleRotation]);
  
  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: loadingProgress / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [loadingProgress, progressAnimation]);

  const handleSelectTemplate = async (template: PlanTemplate) => {
    if (!currentResult) return;
    
    try {
      await createPlanFromTemplate(template, currentResult);
      router.push('/(tabs)/glow-coach');
    } catch {
      Alert.alert('Error', 'Failed to create skincare plan. Please try again.');
    }
  };

  const handleCustomPlan = async () => {
    if (!currentResult) return;
    
    if (!customGoal.trim()) {
      Alert.alert('Please enter your skincare goal');
      return;
    }
    
    try {
      await generateCustomPlan(currentResult, customGoal);
      router.push('/(tabs)/glow-coach');
    } catch {
      Alert.alert('Error', 'Failed to generate custom plan. Please try again.');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (!currentResult) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: "Skincare Plan" }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No analysis results found</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/analysis-results')}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen 
        options={{ 
          title: "",
          headerTransparent: true,
          headerBackTitle: "Back",
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Luxurious Header */}
        <View style={styles.header}>
          <LinearGradient 
            colors={gradient.shimmer} 
            style={styles.headerGlow}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Crown color={palette.primary} size={32} />
          </LinearGradient>
          <Text style={styles.headerTitle}>Choose Your Glow Journey</Text>
          <Text style={styles.headerSubtitle}>
            Curated by beauty experts, designed for your unique radiance
          </Text>
          <View style={styles.headerDivider} />
        </View>

        {/* Curated Plans */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Gem color={palette.primary} size={20} />
            <Text style={styles.sectionTitle}>Curated for You</Text>
          </View>
          
          {presetPlans.map((template, index) => (
            <TouchableOpacity
              key={template.id}
              style={[styles.planCard, { marginBottom: spacing.xl }]}
              onPress={() => handleSelectTemplate(template)}
              disabled={isGenerating}
              activeOpacity={0.95}
            >
              <LinearGradient 
                colors={index % 2 === 0 ? gradient.card : gradient.rose}
                style={styles.planCardGradient}
              >
                <View style={styles.planHeader}>
                  <View style={styles.planTitleContainer}>
                    <Text style={styles.planTitle}>{template.title}</Text>
                    <View style={styles.planBadge}>
                      <Star color={palette.primary} size={12} fill={palette.primary} />
                      <Text style={styles.planBadgeText}>Expert Choice</Text>
                    </View>
                  </View>
                  <View style={styles.planArrow}>
                    <ArrowRight color={palette.primary} size={20} />
                  </View>
                </View>
                
                <Text style={styles.planDescription}>{template.description}</Text>
                
                <View style={styles.planMetrics}>
                  <LinearGradient colors={gradient.shimmer} style={styles.metricsContainer}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricNumber}>{template.preview.morningSteps}</Text>
                      <Text style={styles.metricLabel}>Morning</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricNumber}>{template.preview.eveningSteps}</Text>
                      <Text style={styles.metricLabel}>Evening</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricNumber}>{template.preview.weeklyTreatments}</Text>
                      <Text style={styles.metricLabel}>Treatments</Text>
                    </View>
                  </LinearGradient>
                </View>
                
                <View style={styles.planTags}>
                  <View style={[styles.difficultyTag, { backgroundColor: getDifficultyColor(template.difficulty) + '15' }]}>
                    <Text style={[styles.tagText, { color: getDifficultyColor(template.difficulty) }]}>
                      {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                    </Text>
                  </View>
                  <View style={[styles.costTag, { backgroundColor: getCostColor(template.estimatedCost) + '15' }]}>
                    <DollarSign color={getCostColor(template.estimatedCost)} size={12} />
                    <Text style={[styles.tagText, { color: getCostColor(template.estimatedCost) }]}>
                      {template.estimatedCost} investment
                    </Text>
                  </View>
                </View>
                
                <View style={styles.concernsContainer}>
                  <Text style={styles.concernsLabel}>Perfect for:</Text>
                  <Text style={styles.concernsText}>
                    {template.targetConcerns.slice(0, 2).join(' • ')}
                    {template.targetConcerns.length > 2 && ' • More'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bespoke Plan Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap color={palette.primary} size={20} />
            <Text style={styles.sectionTitle}>Bespoke Experience</Text>
          </View>
          
          <LinearGradient colors={gradient.aurora} style={styles.customCard}>
            <View style={styles.customHeader}>
              <LinearGradient colors={gradient.glow} style={styles.customIcon}>
                <Edit3 color={palette.textLight} size={20} />
              </LinearGradient>
              <View style={styles.customTitleContainer}>
                <Text style={styles.customTitle}>Design Your Journey</Text>
                <Text style={styles.customSubtitle}>Tailored exclusively for your skin</Text>
              </View>
            </View>
            
            <Text style={styles.customDescription}>
              Share your unique beauty aspirations and let our AI craft a personalized 30-day transformation plan that celebrates your individual radiance.
            </Text>
            
            {!showCustomGoal ? (
              <TouchableOpacity
                style={styles.customButton}
                onPress={() => setShowCustomGoal(true)}
                activeOpacity={0.9}
              >
                <LinearGradient colors={gradient.primary} style={styles.customButtonGradient}>
                  <Sparkles color={palette.textLight} size={16} />
                  <Text style={styles.customButtonText}>Begin Your Story</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.customInputContainer}>
                <Text style={styles.inputLabel}>What&apos;s your beauty vision for the next 30 days?</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Share your dreams... radiant glow, porcelain smoothness, youthful vitality..."
                    placeholderTextColor={palette.textMuted}
                    value={customGoal}
                    onChangeText={setCustomGoal}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
                
                <View style={styles.customActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowCustomGoal(false);
                      setCustomGoal('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Maybe Later</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.createButton, { opacity: customGoal.trim() ? 1 : 0.6 }]}
                    onPress={handleCustomPlan}
                    disabled={!customGoal.trim() || isGenerating}
                    activeOpacity={0.9}
                  >
                    <LinearGradient colors={gradient.primary} style={styles.createButtonGradient}>
                      {isGenerating ? (
                        <ActivityIndicator color={palette.textLight} size="small" />
                      ) : (
                        <>
                          <Crown color={palette.textLight} size={16} />
                          <Text style={styles.createButtonText}>Craft My Plan</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Enhanced Loading Overlay */}
        {isGenerating && (
          <View style={styles.loadingOverlay}>
            <LinearGradient colors={['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.85)']} style={styles.loadingBackground}>
              {/* Animated Background Elements */}
              <Animated.View 
                style={[
                  styles.backgroundOrb1,
                  {
                    transform: [{
                      translateX: shimmerAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-50, 50]
                      })
                    }]
                  }
                ]}
              >
                <LinearGradient 
                  colors={[palette.primary + '20', 'transparent']} 
                  style={styles.orbGradient}
                />
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.backgroundOrb2,
                  {
                    transform: [{
                      translateY: shimmerAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, -30]
                      })
                    }]
                  }
                ]}
              >
                <LinearGradient 
                  colors={['transparent', palette.secondary + '15', 'transparent']} 
                  style={styles.orbGradient}
                />
              </Animated.View>
              
              <View style={styles.loadingCard}>
                <LinearGradient colors={gradient.shimmer} style={styles.loadingIconContainer}>
                  <Animated.View
                    style={[
                      styles.sparkleContainer,
                      {
                        transform: [
                          {
                            rotate: sparkleRotation.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg']
                            })
                          },
                          { scale: pulseAnimation }
                        ]
                      }
                    ]}
                  >
                    <Sparkles color={palette.primary} size={36} />
                  </Animated.View>
                  
                  {/* Floating particles */}
                  <View style={styles.particlesContainer}>
                    {[...Array(6)].map((_, i) => (
                      <Animated.View
                        key={i}
                        style={[
                          styles.particle,
                          {
                            transform: [
                              {
                                translateY: shimmerAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, -20 - i * 5]
                                })
                              },
                              {
                                translateX: shimmerAnimation.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, (i % 2 === 0 ? 1 : -1) * (10 + i * 2)]
                                })
                              }
                            ],
                            opacity: shimmerAnimation.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [0.8, 0.3, 0.8]
                            })
                          }
                        ]}
                      >
                        <View style={[styles.particleDot, { backgroundColor: i % 2 === 0 ? palette.primary : palette.secondary }]} />
                      </Animated.View>
                    ))}
                  </View>
                </LinearGradient>
                
                <Text style={styles.loadingTitle}>Creating your personalized plan...</Text>
                <Text style={styles.loadingSubtext}>{loadingSteps[loadingStep]}</Text>
                
                {/* Enhanced Progress Bar */}
                <View style={styles.loadingProgressContainer}>
                  <View style={styles.loadingProgressBar}>
                    <Animated.View 
                      style={[
                        styles.loadingProgressFill,
                        {
                          width: progressAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%']
                          })
                        }
                      ]}
                    >
                      <LinearGradient 
                        colors={[palette.primary, palette.secondary]} 
                        style={styles.progressGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                      
                      {/* Progress shimmer */}
                      <Animated.View
                        style={[
                          styles.progressShimmer,
                          {
                            transform: [{
                              translateX: shimmerAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-100, 300]
                              })
                            }]
                          }
                        ]}
                      >
                        <LinearGradient
                          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                          style={styles.shimmerGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        />
                      </Animated.View>
                    </Animated.View>
                  </View>
                  
                  <Text style={styles.progressText}>{Math.round(loadingProgress)}%</Text>
                </View>
                
                {/* Status indicators */}
                <View style={styles.statusContainer}>
                  {loadingSteps.map((_, index) => (
                    <View 
                      key={index}
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: index <= loadingStep ? palette.primary : palette.overlayLight,
                          transform: [{ scale: index === loadingStep ? 1.2 : 1 }]
                        }
                      ]}
                    />
                  ))}
                </View>
                
                <Text style={styles.loadingNote}>✨ This may take a few moments</Text>
              </View>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: 80,
    paddingBottom: spacing.xxxxl,
  },
  headerGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadow.glow,
  },
  headerTitle: {
    fontSize: typography.display,
    fontWeight: typography.black,
    color: palette.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: typography.h6,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
    fontWeight: typography.medium,
  },
  headerDivider: {
    width: 60,
    height: 3,
    backgroundColor: palette.primary,
    borderRadius: 2,
    marginTop: spacing.xl,
  },
  section: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  planCard: {
    borderRadius: 28,
    ...shadow.floating,
    overflow: 'hidden',
  },
  planCardGradient: {
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: 28,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  planTitleContainer: {
    flex: 1,
  },
  planTitle: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    letterSpacing: -0.2,
    marginBottom: spacing.xs,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.overlayGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: typography.semibold,
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planArrow: {
    backgroundColor: palette.overlayBlush,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planDescription: {
    fontSize: typography.body,
    color: palette.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.xl,
    fontWeight: typography.regular,
  },
  planMetrics: {
    marginBottom: spacing.lg,
  },
  metricsContainer: {
    flexDirection: 'row',
    backgroundColor: palette.overlayLight,
    borderRadius: 20,
    padding: spacing.lg,
    ...shadow.card,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: palette.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: typography.caption,
    color: palette.textSecondary,
    fontWeight: typography.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: palette.divider,
    marginHorizontal: spacing.sm,
  },
  planTags: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  difficultyTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  costTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    fontSize: typography.caption,
    fontWeight: typography.semibold,
    letterSpacing: 0.3,
  },

  concernsContainer: {
    backgroundColor: palette.overlayBlush,
    borderRadius: 16,
    padding: spacing.md,
  },
  concernsLabel: {
    fontSize: typography.bodySmall,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  concernsText: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    fontWeight: typography.medium,
    lineHeight: 20,
  },
  customCard: {
    borderRadius: 28,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: palette.borderLight,
    ...shadow.floating,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  customIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
  },
  customTitleContainer: {
    flex: 1,
  },
  customTitle: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  customSubtitle: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    fontWeight: typography.medium,
    fontStyle: 'italic',
  },
  customDescription: {
    fontSize: typography.body,
    color: palette.textSecondary,
    lineHeight: 26,
    marginBottom: spacing.xxl,
    fontWeight: typography.regular,
  },
  customButton: {
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow.glow,
  },
  customButtonGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  customButtonText: {
    color: palette.textLight,
    fontSize: typography.h6,
    fontWeight: typography.bold,
    letterSpacing: 0.2,
  },
  customInputContainer: {
    gap: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.h6,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.card,
  },
  textInput: {
    backgroundColor: palette.surface,
    padding: spacing.xl,
    fontSize: typography.body,
    color: palette.textPrimary,
    borderWidth: 2,
    borderColor: palette.borderLight,
    minHeight: 120,
    fontWeight: typography.regular,
    lineHeight: 24,
  },
  customActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: palette.overlayLight,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cancelButtonText: {
    color: palette.textSecondary,
    fontSize: typography.body,
    fontWeight: typography.medium,
  },
  createButton: {
    flex: 2,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.glow,
  },
  createButtonGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  createButtonText: {
    color: palette.textLight,
    fontSize: typography.body,
    fontWeight: typography.bold,
    letterSpacing: 0.2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundOrb1: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.6,
  },
  backgroundOrb2: {
    position: 'absolute',
    bottom: '25%',
    right: '15%',
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.4,
  },
  orbGradient: {
    flex: 1,
    borderRadius: 100,
  },
  loadingCard: {
    backgroundColor: palette.surface,
    borderRadius: 32,
    padding: spacing.xxxxl,
    alignItems: 'center',
    marginHorizontal: spacing.xxl,
    maxWidth: 340,
    width: '100%',
    borderWidth: 1,
    borderColor: palette.borderLight,
    ...shadow.floating,
    position: 'relative',
    zIndex: 10,
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadow.glow,
    position: 'relative',
    overflow: 'visible',
  },
  sparkleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  particlesContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
  },
  particleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  loadingTitle: {
    fontSize: typography.h4,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  loadingSubtext: {
    fontSize: typography.body,
    color: palette.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
    minHeight: 48,
    fontWeight: typography.medium,
  },
  loadingProgressContainer: {
    width: '100%',
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  loadingProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: palette.overlayLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  loadingProgressFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressGradient: {
    flex: 1,
    borderRadius: 4,
  },
  progressShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
  },
  shimmerGradient: {
    flex: 1,
    width: 100,
  },
  progressText: {
    fontSize: typography.caption,
    fontWeight: typography.semibold,
    color: palette.primary,
    letterSpacing: 0.5,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingNote: {
    fontSize: typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#D4A574',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});