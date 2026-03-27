import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette, shadow } from '@/constants/theme';

interface SimpleStreakRingProps {
  streak: number;
  maxStreak?: number;
  size?: number;
  showLabel?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function SimpleStreakRing({ 
  streak, 
  maxStreak = 7, 
  size = 140,
  showLabel = true 
}: SimpleStreakRingProps) {
  const progress = Math.min(streak / maxStreak, 1);
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    if (streak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [progress, streak, animatedProgress, pulseAnim]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const getStreakMessage = () => {
    if (streak === 0) return "Start today!";
    if (streak === 1) return "Great start!";
    if (streak < 3) return "Keep going!";
    if (streak < 7) return "On fire! 🔥";
    if (streak === 7) return "Perfect week!";
    return "Unstoppable! 💫";
  };

  

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        {/* Background ring */}
        <Svg width={size} height={size} style={styles.svg}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={palette.border}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={streak > 0 ? palette.gold : palette.border}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        
        {/* Center content */}
        <View style={styles.centerContent}>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakUnit}>days</Text>
        </View>
      </View>
      
      {showLabel && (
        <Text style={styles.streakMessage}>{getStreakMessage()}</Text>
      )}
      
      {/* Day dots */}
      <View style={styles.dayDots}>
        {[...Array(7)].map((_, i) => (
          <View 
            key={i}
            style={[
              styles.dot,
              i < Math.min(streak, 7) && styles.dotActive,
              i === Math.min(streak, 7) - 1 && streak > 0 && styles.dotCurrent,
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  ringContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '900' as const,
    color: palette.textPrimary,
    letterSpacing: -2,
  },
  streakUnit: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: palette.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginTop: -4,
  },
  streakMessage: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600' as const,
    color: palette.textSecondary,
  },
  dayDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.border,
  },
  dotActive: {
    backgroundColor: palette.gold,
  },
  dotCurrent: {
    backgroundColor: '#FF8C00',
    ...shadow.glow,
  },
});
