import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getPalette, spacing, typography } from '@/constants/theme';
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

  const getColor = () => {
    if (isLocked) return palette.textTertiary;
    if (score >= 80) return palette.success;
    if (score >= 50) return palette.warning;
    return palette.error;
  };

  const color = getColor();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            backgroundColor: isLocked ? palette.surface : `${color}15`,
          },
        ]}
      >
        <Text
          style={[
            styles.score,
            {
              color: isLocked ? palette.textTertiary : color,
              fontSize: size * 0.35,
            },
          ]}
        >
          {isLocked ? '?' : score}
        </Text>
      </View>
      <Text
        style={[
          styles.label,
          { color: isLocked ? palette.textTertiary : palette.textSecondary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  score: {
    fontWeight: '700' as const,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '500' as const,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
