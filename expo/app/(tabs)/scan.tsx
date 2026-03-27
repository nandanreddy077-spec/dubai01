import React, { useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient } from '@/constants/theme';

export default function ScanTabScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  // Navigate immediately when screen is focused (handles both first visit and return visits)
  useFocusEffect(
    React.useCallback(() => {
      // Navigate immediately without delay for faster transition
      // Use same path as home screen button to avoid navigation errors
      router.push('/(tabs)/glow-analysis');
    }, [])
  );

  // Also navigate on mount as fallback
  useEffect(() => {
    // Immediate navigation on mount - use same path as home screen button
    router.push('/(tabs)/glow-analysis');
  }, []);

  // Show loading state while redirecting
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <View style={styles.content}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

