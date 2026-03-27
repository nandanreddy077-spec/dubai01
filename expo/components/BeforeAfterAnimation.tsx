import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Play, Pause, RotateCcw, Sparkles, TrendingUp } from 'lucide-react-native';

interface BeforeAfterAnimationProps {
  beforeImage: string;
  afterImage: string;
  beforeScore: number;
  afterScore: number;
  onAnimationComplete?: () => void;
  autoPlay?: boolean;
}

const { width } = Dimensions.get('window');

export default function BeforeAfterAnimation({
  beforeImage,
  afterImage,
  beforeScore,
  afterScore,
  onAnimationComplete,
  autoPlay = true,
}: BeforeAfterAnimationProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentPhase, setCurrentPhase] = useState<'before' | 'transition' | 'after'>('before');
  
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;
  const scoreAnimation = useRef(new Animated.Value(beforeScore)).current;

  useEffect(() => {
    if (isPlaying) {
      startAnimation();
    }
  }, [isPlaying]);

  const startAnimation = () => {
    setCurrentPhase('before');
    
    // Reset all animations
    slideAnimation.setValue(0);
    fadeAnimation.setValue(1);
    scaleAnimation.setValue(1);
    sparkleAnimation.setValue(0);
    scoreAnimation.setValue(beforeScore);

    // Start the sequence
    Animated.sequence([
      // Phase 1: Show before image (2 seconds)
      Animated.delay(2000),
      
      // Phase 2: Transition effect
      Animated.parallel([
        // Slide transition
        Animated.timing(slideAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        // Fade effect
        Animated.sequence([
          Animated.timing(fadeAnimation, {
            toValue: 0.3,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
        // Scale effect
        Animated.sequence([
          Animated.timing(scaleAnimation, {
            toValue: 1.05,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
        // Score animation
        Animated.timing(scoreAnimation, {
          toValue: afterScore,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]),
      
      // Phase 3: Sparkle celebration
      Animated.timing(sparkleAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      
      // Hold the after state
      Animated.delay(2000),
    ]).start(() => {
      setCurrentPhase('after');
      setIsPlaying(false);
      onAnimationComplete?.();
    });

    // Update phase indicators
    setTimeout(() => setCurrentPhase('transition'), 2000);
    setTimeout(() => setCurrentPhase('after'), 3500);
  };

  const resetAnimation = () => {
    setIsPlaying(false);
    setCurrentPhase('before');
    slideAnimation.setValue(0);
    fadeAnimation.setValue(1);
    scaleAnimation.setValue(1);
    sparkleAnimation.setValue(0);
    scoreAnimation.setValue(beforeScore);
  };

  const togglePlayPause = () => {
    if (currentPhase === 'after') {
      resetAnimation();
      setTimeout(() => setIsPlaying(true), 100);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const improvement = afterScore - beforeScore;
  const improvementPercentage = beforeScore > 0 ? ((improvement / beforeScore) * 100).toFixed(1) : '0.0';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Glow Transformation</Text>
        <Text style={styles.subtitle}>Watch your beauty score improve!</Text>
      </View>

      {/* Main Animation Container */}
      <View style={styles.animationContainer}>
        {/* Sparkle Effects */}
        <Animated.View
          style={[
            styles.sparkleContainer,
            {
              opacity: sparkleAnimation,
            },
          ]}
        >
          {[...Array(12)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.sparkle,
                {
                  transform: [
                    { rotate: `${index * 30}deg` },
                    { translateY: -80 },
                    {
                      scale: sparkleAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Sparkles color="#FFD700" size={16} />
            </Animated.View>
          ))}
        </Animated.View>

        {/* Image Container */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [
                { scale: scaleAnimation },
              ],
              opacity: fadeAnimation,
            },
          ]}
        >
          {/* Before Image */}
          <Animated.View
            style={[
              styles.imageWrapper,
              {
                transform: [
                  {
                    translateX: slideAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -width * 0.8],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image source={{ uri: beforeImage }} style={styles.image} />
            <View style={styles.imageLabel}>
              <Text style={styles.imageLabelText}>Before</Text>
            </View>
          </Animated.View>

          {/* After Image */}
          <Animated.View
            style={[
              styles.imageWrapper,
              {
                transform: [
                  {
                    translateX: slideAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [width * 0.8, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image source={{ uri: afterImage }} style={styles.image} />
            <View style={styles.imageLabel}>
              <Text style={styles.imageLabelText}>After</Text>
            </View>
          </Animated.View>

          {/* Divider Line */}
          <Animated.View
            style={[
              styles.dividerLine,
              {
                transform: [
                  {
                    translateX: slideAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -width * 0.4],
                    }),
                  },
                ],
              },
            ]}
          />
        </Animated.View>

        {/* Score Display */}
        <View style={styles.scoreContainer}>
          <Animated.Text style={[styles.scoreText, { color: '#D4A574' }]}>
            {scoreAnimation.interpolate({
              inputRange: beforeScore === afterScore ? [beforeScore, beforeScore + 1] : [beforeScore, afterScore],
              outputRange: beforeScore === afterScore ? [beforeScore, beforeScore] : [beforeScore, afterScore],
              extrapolate: 'clamp',
            }).interpolate({
              inputRange: [0, 100],
              outputRange: ['0', '100'],
              extrapolate: 'clamp',
            })}
          </Animated.Text>
          <Text style={styles.scoreLabel}>Beauty Score</Text>
        </View>

        {/* Improvement Badge */}
        {currentPhase === 'after' && improvement > 0 && (
          <Animated.View
            style={[
              styles.improvementBadge,
              {
                opacity: sparkleAnimation,
                transform: [
                  {
                    scale: sparkleAnimation.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1.2, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <TrendingUp color="#FFFFFF" size={16} />
            <Text style={styles.improvementText}>
              +{improvement} points ({improvementPercentage}% better!)
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={togglePlayPause}
        >
          {isPlaying ? (
            <Pause color="#D4A574" size={24} />
          ) : (
            <Play color="#D4A574" size={24} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={resetAnimation}
        >
          <RotateCcw color="#6B7280" size={24} />
        </TouchableOpacity>
      </View>

      {/* Phase Indicator */}
      <View style={styles.phaseIndicator}>
        <View style={[styles.phaseDot, currentPhase === 'before' && styles.activePhaseDot]} />
        <View style={[styles.phaseDot, currentPhase === 'transition' && styles.activePhaseDot]} />
        <View style={[styles.phaseDot, currentPhase === 'after' && styles.activePhaseDot]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  animationContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  sparkleContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  sparkle: {
    position: 'absolute',
  },
  imageContainer: {
    width: width * 0.8,
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  imageWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  imageLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dividerLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  scoreContainer: {
    position: 'absolute',
    bottom: -60,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  improvementBadge: {
    position: 'absolute',
    bottom: -100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  improvementText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  activePhaseDot: {
    backgroundColor: '#D4A574',
  },
});