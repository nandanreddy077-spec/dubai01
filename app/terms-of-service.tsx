import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { getPalette } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function TermsOfServiceScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const styles = createStyles(palette);

  const headerOptions = useMemo(() => ({
    title: 'Terms of Service',
    headerStyle: { backgroundColor: palette.surface },
    headerTintColor: palette.textPrimary,
  }), [palette.surface, palette.textPrimary]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={headerOptions} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        testID="tos-scroll"
      >
        <Text style={styles.title}>GlowCheck Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last updated: September 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By downloading, installing, or using the GlowCheck application (the "App"), you agree to be bound by these Terms of Service (the "Terms"). If you do not agree to the Terms, you must not use the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>GlowCheck provides:</Text>
          <Text style={styles.bulletPoint}>• AI-powered skin and style analysis</Text>
          <Text style={styles.bulletPoint}>• Personalized skincare routines and coaching</Text>
          <Text style={styles.bulletPoint}>• Progress tracking, challenges, and rewards</Text>
          <Text style={styles.bulletPoint}>• Community posting, comments, reactions, and optional geotagging</Text>
          <Text style={styles.bulletPoint}>• Premium subscription features</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Eligibility and Accounts</Text>
          <Text style={styles.bulletPoint}>• You must meet minimum age requirements (see Privacy Policy)</Text>
          <Text style={styles.bulletPoint}>• Provide accurate information and keep credentials secure</Text>
          <Text style={styles.bulletPoint}>• You are responsible for all activity under your account</Text>
          <Text style={styles.bulletPoint}>• We may refuse, suspend, or terminate accounts for misuse</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Subscriptions, Payments, and Refunds</Text>
          <Text style={styles.paragraph}>Payments are processed by Stripe. By subscribing you agree that:</Text>
          <Text style={styles.bulletPoint}>• Recurring charges occur until you cancel</Text>
          <Text style={styles.bulletPoint}>• Prices may change with prior notice</Text>
          <Text style={styles.bulletPoint}>• Taxes may apply based on your location</Text>
          <Text style={styles.bulletPoint}>• Refunds follow our refund policy and applicable law</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. User Content, Communities, and Conduct</Text>
          <Text style={styles.paragraph}>You may post photos, captions, comments, and reactions. You agree not to:</Text>
          <Text style={styles.bulletPoint}>• Post unlawful, harmful, or infringing content</Text>
          <Text style={styles.bulletPoint}>• Bully, harass, or impersonate others</Text>
          <Text style={styles.bulletPoint}>• Share personal or confidential information without consent</Text>
          <Text style={styles.bulletPoint}>• Upload content you don't have rights to use</Text>
          <Text style={styles.paragraph}>We can remove content or restrict accounts that violate these rules.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. License to Your Content</Text>
          <Text style={styles.paragraph}>You retain ownership of your content. You grant us a limited, worldwide, non-exclusive, royalty-free license to host and display your content solely to operate and improve the App. You can delete your content; residual copies may persist for a limited time in backups.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Medical and Safety Disclaimer</Text>
          <Text style={styles.paragraph}>GlowCheck provides informational guidance only and is not a substitute for professional medical advice. Do not rely solely on the App for diagnosis or treatment. Stop using products if irritation occurs and consult a professional.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
          <Text style={styles.paragraph}>We and our licensors own the App, software, models, and brand assets. You may not copy, modify, reverse engineer, or create derivative works, except as permitted by law.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Privacy</Text>
          <Text style={styles.paragraph}>Your use of the App is also governed by the Privacy Policy. Please review it to understand how we process personal data.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Disclaimers and Limitation of Liability</Text>
          <Text style={styles.paragraph}>THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES AND LIMIT LIABILITY FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Indemnity</Text>
          <Text style={styles.paragraph}>You agree to indemnify and hold us harmless from claims arising from your use of the App or violation of these Terms.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Termination</Text>
          <Text style={styles.paragraph}>We may suspend or terminate access for any violation of these Terms or for harmful conduct. You may stop using the App at any time.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Changes to Terms</Text>
          <Text style={styles.paragraph}>We may update these Terms. Material changes will be communicated in-App or via email. Continued use means acceptance.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Governing Law and Dispute Resolution</Text>
          <Text style={styles.paragraph}>These Terms are governed by the laws of the United States and your state of residence, unless otherwise required by law. Disputes will be resolved in the courts with jurisdiction over your residence, unless mandatory local law provides otherwise.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Contact</Text>
          <Text style={styles.paragraph}>Email: anixagency7@gmail.com</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>By using GlowCheck, you acknowledge and agree to these Terms of Service.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: palette.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
    marginBottom: 4,
    paddingLeft: 8,
  },
  footer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 12,
  },
  footerText: {
    fontSize: 12,
    color: palette.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});