import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Check, Circle } from 'lucide-react-native';
import { palette, shadow } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface SimpleRoutineCardProps {
  title: string;
  isCompleted: boolean;
  onToggle: () => void;
  index: number;
}

export default function SimpleRoutineCard({ 
  title, 
  isCompleted, 
  onToggle,
  index 
}: SimpleRoutineCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: isCompleted ? 1 : 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [isCompleted, checkAnim]);

  const handlePress = () => {
    Haptics.impactAsync(
      isCompleted ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle();
  };

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={[
          styles.container,
          isCompleted && styles.containerCompleted,
        ]}
      >
        <View style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}>
          {isCompleted ? (
            <Animated.View style={{ transform: [{ scale: checkScale }] }}>
              <Check color="#FFFFFF" size={18} strokeWidth={3} />
            </Animated.View>
          ) : (
            <Circle color={palette.textMuted} size={18} strokeWidth={2} />
          )}
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
            {title}
          </Text>
          <Text style={styles.hint}>
            {isCompleted ? "Done! ✨" : "Tap to complete"}
          </Text>
        </View>

        <Text style={styles.stepNumber}>{index + 1}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: palette.border,
    ...shadow.soft,
  },
  containerCompleted: {
    backgroundColor: 'rgba(201, 169, 97, 0.08)',
    borderColor: palette.gold,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  checkboxCompleted: {
    backgroundColor: palette.gold,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: palette.textPrimary,
    marginBottom: 2,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: palette.textSecondary,
  },
  hint: {
    fontSize: 13,
    color: palette.textMuted,
    fontWeight: '500' as const,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: palette.textMuted,
    marginLeft: 8,
  },
});
