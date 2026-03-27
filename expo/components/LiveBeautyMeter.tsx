import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

interface LiveBeautyMeterProps {
  isActive: boolean;
  onScoreChange?: (score: number) => void;
}

const { width } = Dimensions.get('window');

export default function LiveBeautyMeter({ isActive, onScoreChange }: LiveBeautyMeterProps) {
  const [currentScore, setCurrentScore] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [previousScore, setPreviousScore] = useState(0);
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Simulate real-time beauty analysis
      const interval = setInterval(() => {
        // Generate a realistic beauty score with some variation
        const baseScore = 65 + Math.random() * 30; // 65-95 range
        const variation = (Math.random() - 0.5) * 10; // ±5 variation
        const newScore = Math.max(0, Math.min(100, baseScore + variation));
        
        setPreviousScore(currentScore);
        setCurrentScore(Math.round(newScore));
        
        // Determine trend
        if (newScore > currentScore + 2) {
          setTrend('up');
        } else if (newScore < currentScore - 2) {
          setTrend('down');
        } else {
          setTrend('stable');
        }
        
        // Animate score change
        Animated.timing(animatedValue, {
          toValue: newScore / 100,
          duration: 500,
          useNativeDriver: false,
        }).start();
        
        // Trigger sparkle effect for high scores
        if (newScore > 85) {
          Animated.sequence([
            Animated.timing(sparkleAnimation, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnimation, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
        
        onScoreChange?.(newScore);
      }, 1000);

      // Start pulse animation
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

      return () => {
        clearInterval(interval);
        pulseAnimation.stopAnimation();
      };
    } else {
      // Reset when inactive
      setCurrentScore(0);
      setTrend('stable');
      animatedValue.setValue(0);
      pulseAnimation.setValue(1);
      sparkleAnimation.setValue(0);
    }
  }, [isActive, currentScore, animatedValue, pulseAnimation, sparkleAnimation, onScoreChange]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'; // Excellent - Green
    if (score >= 80) return '#F59E0B'; // Good - Amber
    if (score >= 70) return '#EF4444'; // Fair - Red
    return '#6B7280'; // Poor - Gray
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Stunning';
    if (score >= 80) return 'Beautiful';
    if (score >= 70) return 'Pretty';
    if (score >= 60) return 'Good';
    return 'Analyzing...';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="#10B981" size={16} />;
      case 'down':
        return <TrendingDown color="#EF4444" size={16} />;
      default:
        return <Minus color="#6B7280" size={16} />;
    }
  };

  if (!isActive) return null;

  const scoreColor = getScoreColor(currentScore);
  const scoreLabel = getScoreLabel(currentScore);

  return (
    <View style={styles.container}>
      {/* Sparkle Effects */}
      <Animated.View
        style={[
          styles.sparkleContainer,
          {
            opacity: sparkleAnimation,
          },
        ]}
      >
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.sparkle,
              {
                transform: [
                  { rotate: `${index * 60}deg` },
                  { translateY: -40 },
                ],
              },
            ]}
          >
            <Sparkles color="#FFD700" size={12} />
          </View>
        ))}
      </Animated.View>

      {/* Main Meter */}
      <Animated.View
        style={[
          styles.meterContainer,
          {
            transform: [{ scale: pulseAnimation }],
          },
        ]}
      >
        {/* Background Circle */}
        <View style={styles.meterBackground} />
        
        {/* Progress Circle */}
        <Animated.View
          style={[
            styles.meterProgress,
            {
              borderColor: scoreColor,
              transform: [
                {
                  rotate: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '270deg'],
                  }),
                },
              ],
            },
          ]}
        />
        
        {/* Center Content */}
        <View style={styles.meterCenter}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {currentScore}
          </Text>
          <Text style={styles.scoreLabel}>{scoreLabel}</Text>
          
          {/* Trend Indicator */}
          <View style={styles.trendContainer}>
            {getTrendIcon()}
            <Text style={[styles.trendText, { color: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280' }]}>
              {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
              {Math.abs(currentScore - previousScore)}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Live Indicator */}
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsText}>
          {currentScore < 70 ? 'Try better lighting or adjust your angle' :
           currentScore < 85 ? 'Great! Small adjustments can boost your score' :
           'Perfect! You\'re glowing!'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    margin: 20,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 20,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  meterContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  meterBackground: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#374151',
  },
  meterProgress: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  meterCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#D1D5DB',
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    maxWidth: width * 0.8,
  },
  tipsText: {
    fontSize: 12,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 16,
  },
});