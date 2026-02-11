import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient } from '@/constants/theme';

export default function ScanTabScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  useEffect(() => {
    // Directly go to camera screen with face detection
    router.replace('/(tabs)/glow-analysis');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <View style={styles.content} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

