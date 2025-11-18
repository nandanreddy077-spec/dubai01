import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { 
  Clock, 
  CheckCircle, 
  Star, 
  Zap, 
  Target, 
  Trophy,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react-native';
import { useGamification } from '@/contexts/GamificationContext';

interface QuickWin {
  id: string;
  title: string;
  description: string;
  duration: number;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'skincare' | 'makeup' | 'pose' | 'lighting';
  instructions: string[];
}

const QUICK_WINS: QuickWin[] = [
  {
    id: 'perfect_lighting',
    title: 'Find Your Perfect Light',
    description: 'Discover the lighting that makes you glow',
    duration: 300,
    points: 50,
    difficulty: 'easy',
    category: 'lighting',
    instructions: [
      'Stand near a window with natural light',
      'Try different angles - face the light directly',
      'Move slightly to the side for soft shadows',
      'Take a selfie in each position',
      'Compare and choose your best lighting'
    ]
  },
  {
    id: 'power_pose',
    title: 'Master Your Power Pose',
    description: 'Find poses that boost your confidence',
    duration: 240,
    points: 40,
    difficulty: 'easy',
    category: 'pose',
    instructions: [
      'Stand tall with shoulders back',
      'Try the "superhero" pose - hands on hips',
      'Practice a genuine smile in the mirror',
      'Find your best angle by turning slightly',
      'Take photos and see what feels natural'
    ]
  },
  {
    id: 'quick_glow',
    title: '2-Minute Glow Boost',
    description: 'Quick skincare routine for instant radiance',
    duration: 120,
    points: 60,
    difficulty: 'medium',
    category: 'skincare',
    instructions: [
      'Splash cold water on your face',
      'Apply a hydrating mist or toner',
      'Gently massage your cheeks in circles',
      'Apply a light moisturizer',
      'Finish with a subtle highlighter on cheekbones'
    ]
  },
  {
    id: 'eye_pop',
    title: 'Make Your Eyes Pop',
    description: 'Simple tricks to enhance your eyes',
    duration: 180,
    points: 45,
    difficulty: 'medium',
    category: 'makeup',
    instructions: [
      'Curl your eyelashes for 10 seconds',
      'Apply one coat of mascara',
      'Use a light eyeshadow or highlighter on inner corners',
      'Define your eyebrows with a brush',
      'Take before and after photos'
    ]
  }
];

interface QuickWinsProps {
  onChallengeComplete?: (challenge: QuickWin, score: number) => void;
}

export default function QuickWins({ onChallengeComplete }: QuickWinsProps) {
  const [selectedChallenge, setSelectedChallenge] = useState<QuickWin | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  
  const { addGlowBoost } = useGamification();
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const completeChallenge = () => {
    if (!selectedChallenge) return;

    setIsActive(false);
    setCompletedChallenges(prev => [...prev, selectedChallenge.id]);
    
    addGlowBoost({
      type: 'score_improvement',
      title: 'Quick Win Completed!',
      message: `You completed "${selectedChallenge.title}"`,
      points: selectedChallenge.points,
    });

    const score = 85 + Math.random() * 15;
    onChallengeComplete?.(selectedChallenge, score);

    setTimeout(() => {
      resetChallenge();
    }, 3000);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeChallenge();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  useEffect(() => {
    if (selectedChallenge && isActive) {
      const progress = 1 - (timeRemaining / selectedChallenge.duration);
      Animated.timing(progressAnimation, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [timeRemaining, selectedChallenge, isActive, progressAnimation, pulseAnimation]);

  const startChallenge = (challenge: QuickWin) => {
    setSelectedChallenge(challenge);
    setTimeRemaining(challenge.duration);
    setCurrentStep(0);
    setIsActive(true);
    progressAnimation.setValue(0);
  };

  const pauseChallenge = () => {
    setIsActive(false);
    pulseAnimation.stopAnimation();
  };

  const resumeChallenge = () => {
    setIsActive(true);
  };

  const resetChallenge = () => {
    setIsActive(false);
    setSelectedChallenge(null);
    setTimeRemaining(0);
    setCurrentStep(0);
    progressAnimation.setValue(0);
    pulseAnimation.setValue(1);
  };



  const nextStep = () => {
    if (selectedChallenge && currentStep < selectedChallenge.instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: QuickWin['difficulty']) => {
    switch (difficulty) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
    }
  };

  const getCategoryIcon = (category: QuickWin['category']) => {
    switch (category) {
      case 'skincare': return <Star color="#8B5CF6" size={16} />;
      case 'makeup': return <Zap color="#EC4899" size={16} />;
      case 'pose': return <Target color="#10B981" size={16} />;
      case 'lighting': return <Trophy color="#F59E0B" size={16} />;
    }
  };

  if (selectedChallenge) {
    return (
      <View style={styles.activeContainer}>
        <View style={styles.activeHeader}>
          <Text style={styles.activeTitle}>{selectedChallenge.title}</Text>
          <TouchableOpacity onPress={resetChallenge} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Animated.View 
          style={[
            styles.timerContainer,
            { transform: [{ scale: pulseAnimation }] }
          ]}
        >
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          <Text style={styles.timerLabel}>remaining</Text>
        </Animated.View>

        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              {
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]} 
          />
        </View>

        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>
            Step {currentStep + 1} of {selectedChallenge.instructions.length}
          </Text>
          <Text style={styles.stepText}>
            {selectedChallenge.instructions[currentStep]}
          </Text>
        </View>

        <View style={styles.stepNavigation}>
          <TouchableOpacity 
            style={[styles.stepButton, currentStep === 0 && styles.disabledButton]}
            onPress={prevStep}
            disabled={currentStep === 0}
          >
            <Text style={styles.stepButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.stepButton, 
              currentStep === selectedChallenge.instructions.length - 1 && styles.disabledButton
            ]}
            onPress={nextStep}
            disabled={currentStep === selectedChallenge.instructions.length - 1}
          >
            <Text style={styles.stepButtonText}>Next</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={isActive ? pauseChallenge : resumeChallenge}
          >
            {isActive ? <Pause color="#FFFFFF" size={20} /> : <Play color="#FFFFFF" size={20} />}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resetButton} onPress={resetChallenge}>
            <RotateCcw color="#6B7280" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Wins</Text>
        <Text style={styles.subtitle}>5-minute challenges for instant results</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {QUICK_WINS.map((challenge) => {
          const isCompleted = completedChallenges.includes(challenge.id);
          
          return (
            <TouchableOpacity
              key={challenge.id}
              style={[
                styles.challengeCard,
                isCompleted && styles.completedCard
              ]}
              onPress={() => startChallenge(challenge)}
              disabled={isCompleted}
            >
              <View style={styles.challengeHeader}>
                <View style={styles.challengeInfo}>
                  <View style={styles.challengeMeta}>
                    {getCategoryIcon(challenge.category)}
                    <Text style={styles.categoryText}>
                      {challenge.category.charAt(0).toUpperCase() + challenge.category.slice(1)}
                    </Text>
                  </View>
                  
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDescription}>{challenge.description}</Text>
                </View>
                
                {isCompleted ? (
                  <CheckCircle color="#10B981" size={24} />
                ) : (
                  <View style={styles.challengeStats}>
                    <View style={styles.statItem}>
                      <Clock color="#6B7280" size={16} />
                      <Text style={styles.statText}>{Math.ceil(challenge.duration / 60)}m</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Star color="#D4A574" size={16} />
                      <Text style={styles.statText}>{challenge.points}pts</Text>
                    </View>
                  </View>
                )}
              </View>
              
              <View style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(challenge.difficulty) }
              ]}>
                <Text style={styles.difficultyText}>
                  {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  completedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  challengeInfo: {
    flex: 1,
    marginRight: 12,
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  challengeStats: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activeContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
    padding: 20,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  activeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#D4A574',
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 32,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#D4A574',
    borderRadius: 4,
  },
  stepContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4A574',
    marginBottom: 12,
  },
  stepText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  stepNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  stepButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  stepButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D4A574',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});