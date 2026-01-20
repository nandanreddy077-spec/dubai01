import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, shadow, radii } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'subtle' | 'dark';
  borderRadius?: number;
  padding?: number;
  noBorder?: boolean;
}

function GlassCardImpl({ 
  children, 
  style, 
  variant = 'default',
  borderRadius = radii.xl,
  padding = 20,
  noBorder = false,
}: GlassCardProps) {
  const getGradientColors = () => {
    switch (variant) {
      case 'elevated':
        return ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)'] as const;
      case 'subtle':
        return ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.4)'] as const;
      case 'dark':
        return ['rgba(10,10,10,0.85)', 'rgba(10,10,10,0.75)'] as const;
      default:
        return ['rgba(255,255,255,0.88)', 'rgba(255,255,255,0.72)'] as const;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'elevated':
        return 'rgba(0,0,0,0.06)';
      case 'subtle':
        return 'rgba(255,255,255,0.3)';
      case 'dark':
        return 'rgba(255,255,255,0.1)';
      default:
        return 'rgba(0,0,0,0.08)';
    }
  };

  const getShadow = () => {
    switch (variant) {
      case 'elevated':
        return shadow.medium;
      case 'subtle':
        return shadow.minimal;
      case 'dark':
        return shadow.strong;
      default:
        return shadow.soft;
    }
  };

  return (
    <View 
      style={[
        styles.container, 
        { borderRadius },
        getShadow(),
        style
      ]}
    >
      <BlurView 
        intensity={Platform.OS === 'web' ? 20 : 40} 
        tint={variant === 'dark' ? 'dark' : 'light'} 
        style={[styles.blur, { borderRadius }]} 
      />
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { 
            borderRadius,
            borderWidth: noBorder ? 0 : 1,
            borderColor: getBorderColor(),
          }
        ]}
      />
      <View style={styles.hairline} />
      <View style={[styles.content, { padding }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  hairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    opacity: 0.6,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});

export default memo(GlassCardImpl);
