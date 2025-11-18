import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { getPalette } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const styles = createStyles(palette);

  const headerOptions = useMemo(() => ({
    title: 'Privacy Policy',
    headerStyle: { backgroundColor: palette.surface },
    headerTintColor: palette.textPrimary,
  }), [palette.surface, palette.textPrimary]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={headerOptions} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        testID="privacy-policy-scroll"
      >
        <Text style={styles.title}>GlowCheck Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last updated: September 2025</Text>

        <View style={styles.section}>
          <Text style={styles.paragraph}>
            This Privacy Policy explains how GlowCheck ("we", "us", "our") collects, uses, discloses, and protects personal information when you use the GlowCheck mobile and web applications ("App"). We act as the data controller for personal data where we determine the purposes and means of processing. If you have questions or requests, contact: anixagency7@gmail.com.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. What We Collect</Text>
          <Text style={styles.subTitle}>Account Information</Text>
          <Text style={styles.bulletPoint}>• Name, username, email</Text>
          <Text style={styles.bulletPoint}>• Password (stored using strong hashing)</Text>
          <Text style={styles.bulletPoint}>• Age confirmation/verification status where applicable</Text>

          <Text style={styles.subTitle}>Photos & Media</Text>
          <Text style={styles.bulletPoint}>• Profile photo you upload</Text>
          <Text style={styles.bulletPoint}>• Selfies and images you submit for AI analysis (only with your consent)</Text>

          <Text style={styles.subTitle}>Location Data</Text>
          <Text style={styles.bulletPoint}>• Approximate location (IP-based) for basic personalization and security</Text>
          <Text style={styles.bulletPoint}>• Optional precise location (GPS) if you grant permission, used for geotagging posts and nearby content</Text>

          <Text style={styles.subTitle}>Usage & Device Data</Text>
          <Text style={styles.bulletPoint}>• Device type, OS, app version, language, time zone</Text>
          <Text style={styles.bulletPoint}>• Crash logs and performance events</Text>
          <Text style={styles.bulletPoint}>• In-app actions and interactions for analytics and product improvement</Text>

          <Text style={styles.subTitle}>Payment & Subscription</Text>
          <Text style={styles.bulletPoint}>• Subscription status, plan, and invoices processed by Stripe</Text>
          <Text style={styles.bulletPoint}>• We never store raw card numbers; Stripe tokenizes and processes payments</Text>

          <Text style={styles.subTitle}>Communications</Text>
          <Text style={styles.bulletPoint}>• Emails, push notification preferences, and customer support messages</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Personal Information</Text>
          <Text style={styles.bulletPoint}>• Provide core App features, accounts, and communities</Text>
          <Text style={styles.bulletPoint}>• Perform AI-powered skin and style analysis with your submitted photos</Text>
          <Text style={styles.bulletPoint}>• Personalize routines, tips, and content</Text>
          <Text style={styles.bulletPoint}>• Process subscriptions and payments via Stripe</Text>
          <Text style={styles.bulletPoint}>• Measure and improve performance, safety, and reliability</Text>
          <Text style={styles.bulletPoint}>• Communicate about updates, security, and support</Text>
          <Text style={styles.bulletPoint}>• Comply with legal obligations and enforce terms</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Legal Bases (GDPR/UK GDPR)</Text>
          <Text style={styles.bulletPoint}>• Consent: processing selfies for AI analysis; precise location; marketing</Text>
          <Text style={styles.bulletPoint}>• Contract: providing the App and subscription features you request</Text>
          <Text style={styles.bulletPoint}>• Legitimate Interests: safety, fraud prevention, analytics, service improvement</Text>
          <Text style={styles.bulletPoint}>• Legal Obligation: tax/accounting retention, responding to lawful requests</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Processors and Service Providers</Text>
          <Text style={styles.bulletPoint}>• Supabase: database, auth, storage</Text>
          <Text style={styles.bulletPoint}>• Stripe: payments, subscriptions, refunds</Text>
          <Text style={styles.bulletPoint}>• Google Vision API and/or OpenAI API: AI features</Text>
          <Text style={styles.bulletPoint}>• Analytics (optional): Firebase, Amplitude, Mixpanel</Text>
          <Text style={styles.paragraph}>These providers process data under contracts and only per our instructions.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Retention</Text>
          <Text style={styles.bulletPoint}>• Account data: kept while your account is active; deleted upon request or after 2 years of inactivity</Text>
          <Text style={styles.bulletPoint}>• Photos/selfies for analysis: processed promptly and retained up to 72 hours unless you choose to save them to your profile</Text>
          <Text style={styles.bulletPoint}>• Payment records: retained 7 years for legal and accounting compliance</Text>
          <Text style={styles.bulletPoint}>• Analytics data: anonymized/aggregated within 18 months</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Children and Age Limits</Text>
          <Text style={styles.paragraph}>
            The App is not directed to children under 13 (US COPPA) or under 16 (EU/UK). Users must confirm they meet local minimum age requirements (16+ EU/UK; 18+ in some jurisdictions). We do not knowingly collect data from minors.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Cookies, Tracking, and Ads</Text>
          <Text style={styles.paragraph}>We do not sell personal data and do not use targeted advertising. If ads are introduced, they will be contextual only. We may use essential and analytics technologies to operate and improve the App. You can manage optional analytics via in-App settings where available.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Sharing and Disclosures</Text>
          <Text style={styles.bulletPoint}>• With service providers under contract (see Section 4)</Text>
          <Text style={styles.bulletPoint}>• With legal authorities if required by law or to protect rights, safety, and security</Text>
          <Text style={styles.bulletPoint}>• If you post content in communities, your profile, caption, and optional geotags may be visible to other users based on your settings</Text>
          <Text style={styles.bulletPoint}>• We do not share for cross-context behavioral advertising and do not sell personal information</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. International Transfers</Text>
          <Text style={styles.paragraph}>
            Personal data may be processed outside your country. Where required, we use appropriate safeguards such as Standard Contractual Clauses (SCCs) and additional technical and organizational measures.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Security</Text>
          <Text style={styles.bulletPoint}>• Encryption in transit and at rest where applicable</Text>
          <Text style={styles.bulletPoint}>• Access controls and least-privilege principles</Text>
          <Text style={styles.bulletPoint}>• Regular updates and vulnerability management</Text>
          <Text style={styles.bulletPoint}>• Secure cloud infrastructure and monitoring</Text>
          <Text style={styles.paragraph}>No system is 100% secure; we work to continuously improve our protections.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Your Rights</Text>
          <Text style={styles.subTitle}>GDPR/UK GDPR</Text>
          <Text style={styles.bulletPoint}>• Access, rectification, erasure, restriction, portability, and objection</Text>
          <Text style={styles.bulletPoint}>• Withdraw consent at any time without affecting prior lawful processing</Text>

          <Text style={styles.subTitle}>CCPA/CPRA (California)</Text>
          <Text style={styles.bulletPoint}>• Right to know, delete, correct, and opt out of sale/sharing (we do not sell/share)</Text>
          <Text style={styles.bulletPoint}>• Right to non-discrimination for exercising rights</Text>

          <Text style={styles.subTitle}>India DPDP Act</Text>
          <Text style={styles.bulletPoint}>• Rights to access, correction, and grievance redressal</Text>

          <Text style={styles.paragraph}>To exercise rights, email anixagency7@gmail.com. We may verify your identity before responding.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Community Content and Geolocation</Text>
          <Text style={styles.paragraph}>If you enable precise location or add geotags to posts, this information can be visible to others according to your privacy settings. You can remove geotags from posts at any time.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Data Deletion and Account Closure</Text>
          <Text style={styles.paragraph}>You can request account deletion in the App (where available) or by email. We will delete or de-identify personal data unless we must retain it for legal obligations, dispute resolution, or security purposes. Backups may persist for a limited period.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Changes to This Policy</Text>
          <Text style={styles.paragraph}>We may update this Policy. Material changes will be communicated in-App or by email. Continued use after changes constitutes acceptance.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Contact</Text>
          <Text style={styles.paragraph}>Email: anixagency7@gmail.com</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using GlowCheck, you acknowledge this Privacy Policy and consent to processing as described where consent is required.
          </Text>
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
  subTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.textPrimary,
    marginTop: 8,
    marginBottom: 8,
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