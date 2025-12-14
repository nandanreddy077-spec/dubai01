/**
 * Medical Disclaimer Component
 * Displays prominent disclaimer that this app is NOT medical advice
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { getPalette } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function MedicalDisclaimer({ style }: { style?: any }) {
  const { theme } = useTheme();
  const palette = getPalette(theme);

  return (
    <View style={[styles.container, { backgroundColor: palette.surfaceAlt, borderColor: palette.warning }, style]}>
      <View style={styles.header}>
        <AlertTriangle color={palette.warning} size={20} strokeWidth={2.5} />
        <Text style={[styles.title, { color: palette.warning }]}>Important Notice</Text>
      </View>
      <Text style={[styles.text, { color: palette.textPrimary }]}>
        This app provides beauty and cosmetic guidance only. It is <Text style={styles.bold}>NOT medical advice, diagnosis, or treatment</Text>. 
        Always consult a licensed dermatologist or healthcare provider for medical concerns, skin conditions, or before starting any new skincare regimen.
      </Text>
      <Text style={[styles.text, { color: palette.textSecondary, marginTop: 8 }]}>
        Do not use this app to diagnose or treat any medical condition. If you experience any adverse reactions to products, discontinue use immediately and consult a healthcare professional.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
  },
});















