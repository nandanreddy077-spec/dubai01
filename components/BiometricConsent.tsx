/**
 * Biometric Consent Component
 * Required consent for processing biometric data (facial photos)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Linking } from 'react-native';
import { Shield, AlertCircle } from 'lucide-react-native';
import { getPalette } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';

interface BiometricConsentProps {
  onConsentChange: (consented: boolean) => void;
  required?: boolean;
}

export default function BiometricConsent({ onConsentChange, required = true }: BiometricConsentProps) {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const [consented, setConsented] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleToggle = (value: boolean) => {
    setConsented(value);
    onConsentChange(value);
  };

  const handlePrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.surfaceAlt }]}>
      <View style={styles.header}>
        <Shield color={palette.primary} size={20} strokeWidth={2.5} />
        <Text style={[styles.title, { color: palette.textPrimary }]}>Biometric Data Consent</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.description, { color: palette.textSecondary }]}>
          To provide beauty analysis, we need to process your facial photos (biometric data). 
          This includes face detection, feature analysis, and storing your images securely.
        </Text>

        {showDetails && (
          <View style={[styles.details, { backgroundColor: palette.surface }]}>
            <Text style={[styles.detailsTitle, { color: palette.textPrimary }]}>What we collect:</Text>
            <Text style={[styles.detailsText, { color: palette.textSecondary }]}>
              • Facial photos you upload{'\n'}
              • Facial feature data (landmarks, measurements){'\n'}
              • Analysis results and scores
            </Text>
            
            <Text style={[styles.detailsTitle, { color: palette.textPrimary, marginTop: 12 }]}>How we use it:</Text>
            <Text style={[styles.detailsText, { color: palette.textSecondary }]}>
              • Provide beauty analysis and recommendations{'\n'}
              • Track your progress over time{'\n'}
              • Improve our AI analysis (anonymized)
            </Text>

            <Text style={[styles.detailsTitle, { color: palette.textPrimary, marginTop: 12 }]}>Your rights:</Text>
            <Text style={[styles.detailsText, { color: palette.textSecondary }]}>
              • Delete your photos at any time{'\n'}
              • Export your data{'\n'}
              • Withdraw consent (we'll delete your biometric data)
            </Text>
          </View>
        )}

        <TouchableOpacity 
          onPress={() => setShowDetails(!showDetails)}
          style={styles.toggleDetails}
        >
          <Text style={[styles.toggleText, { color: palette.primary }]}>
            {showDetails ? 'Hide details' : 'Show details'}
          </Text>
        </TouchableOpacity>

        <View style={styles.consentRow}>
          <Switch
            value={consented}
            onValueChange={handleToggle}
            trackColor={{ false: palette.surfaceAlt, true: palette.primary }}
            thumbColor={consented ? palette.textLight : palette.textMuted}
            disabled={!required}
          />
          <View style={styles.consentText}>
            <Text style={[styles.consentMain, { color: palette.textPrimary }]}>
              I consent to processing my biometric data (facial photos) for beauty analysis
            </Text>
            <Text style={[styles.consentSub, { color: palette.textSecondary }]}>
              Required to use this feature. See our{' '}
              <Text 
                style={[styles.link, { color: palette.primary }]}
                onPress={handlePrivacyPolicy}
              >
                Privacy Policy
              </Text>
              {' '}for details.
            </Text>
          </View>
        </View>

        {required && !consented && (
          <View style={[styles.warning, { backgroundColor: palette.warning + '20' }]}>
            <AlertCircle color={palette.warning} size={16} strokeWidth={2} />
            <Text style={[styles.warningText, { color: palette.warning }]}>
              Biometric consent is required to proceed
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    gap: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  details: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 13,
    lineHeight: 18,
  },
  toggleDetails: {
    alignSelf: 'flex-start',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
  },
  consentText: {
    flex: 1,
  },
  consentMain: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 4,
  },
  consentSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  link: {
    textDecorationLine: 'underline',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});




















