import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, gradient } from '@/constants/theme';

interface AnimatedProgressBarProps {
  progress: number; // 0 to 100
  height?: number;
  borderRadius?: number;
  backgroundColor?: string;
  gradientColors?: readonly [string, string, ...string[]];
  duration?: number;
}

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  height = 8,
  borderRadius = 4,
  backgroundColor = palette.overlayLight,
  gradientColors = gradient.primary,
  duration = 500,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration,
      useNativeDriver: false,
    }).start();
  }, [progress, duration, animatedWidth]);

  const styles = StyleSheet.create({
    container: {
      height,
      backgroundColor,
      borderRadius,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius,
    },
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          width: animatedWidth.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
            extrapolate: 'clamp',
          }),
        }}
      >
        <LinearGradient
          colors={gradientColors}
          style={styles.progressBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
    </View>
  );
};

export default AnimatedProgressBar;