import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '@/constants/theme';

interface PremiumScreenProps {
  children: ReactNode;
  testID?: string;
}

export default function PremiumScreen({ children, testID }: PremiumScreenProps) {
  return (
    <SafeAreaView style={styles.container} testID={testID ?? 'premium-screen'}>
      <LinearGradient colors={[palette.backgroundStart, palette.backgroundEnd]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0D10' },
  content: { flex: 1 },
});