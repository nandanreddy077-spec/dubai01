import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { getPalette } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface CircularMetricProps {
  score: number;
  label: string;
  isLocked?: boolean;
  size?: number;
}

export default function CircularMetric({
  score,
  label,
  isLocked = false,
  size = 70,
}: CircularMetricProps) {
  const { theme } = useTheme();
  const palette = getPalette(theme);

  const getScoreColor = (value: number) => {
    if (value >= 80) return palette.success;
    if (value >= 50) return palette.warning;
    return palette.error;
  };

  const scoreColor = getScoreColor(score);
  const strokeWidth = 6;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.background,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: palette.borderLight,
          },
        ]}
      />
      <View
        style={[
          styles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: isLocked ? palette.textMuted : scoreColor,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [{ rotate: `${-90 + (score / 100) * 360}deg` }],
          },
        ]}
      />
      <View style={styles.content}>
        {isLocked ? (
          <Lock size={20} color={palette.textMuted} />
        ) : (
          <>
            <Text style={[styles.score, { color: scoreColor }]}>{score}</Text>
            <Text style={[styles.label, { color: palette.textSecondary }]} numberOfLines={1}>
              {label}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  background: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  label: {
    fontSize: 9,
    fontWeight: '500' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
