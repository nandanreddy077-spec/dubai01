import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Trash2, 
  Download, 
  Share2, 
  Heart,
  ChevronRight,
  Info
} from 'lucide-react-native';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  type: 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function PrivacyCareScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  const [dataCollection, setDataCollection] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<boolean>(true);
  const [personalizedAds, setPersonalizedAds] = useState<boolean>(false);
  const [shareWithPartners, setShareWithPartners] = useState<boolean>(false);

  const handleDataExport = useCallback(() => {
    Alert.alert(
      'Export Your Data',
      'We\'ll prepare your data for download and send you an email when it\'s ready. This may take up to 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request Export', onPress: () => Alert.alert('Export Requested', 'You\'ll receive an email when your data is ready for download.') }
      ]
    );
  }, []);

  const handleDataDeletion = useCallback(() => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your data including photos, analyses, and account information. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All Data', 
          style: 'destructive',
          onPress: () => Alert.alert('Data Deletion Requested', 'Your data deletion request has been submitted. You\'ll receive a confirmation email within 24 hours.')
        }
      ]
    );
  }, []);

  const handlePrivacyPolicy = useCallback(() => {
    router.push('/privacy-policy');
  }, []);

  const handleTermsOfService = useCallback(() => {
    router.push('/terms-of-service');
  }, []);

  const savePrivacySetting = useCallback(async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(`privacy_${key}`, JSON.stringify(value));
    } catch (error) {
      console.log('Failed to save privacy setting:', error);
    }
  }, []);

  const privacySettings: PrivacySetting[] = [
    {
      id: 'data_collection',
      title: 'Data Collection',
      description: 'Allow us to collect usage data to improve your experience',
      icon: Shield,
      type: 'toggle',
      value: dataCollection,
      onToggle: (value) => {
        setDataCollection(value);
        savePrivacySetting('data_collection', value);
      }
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Help us understand how you use the app to make it better',
      icon: Eye,
      type: 'toggle',
      value: analytics,
      onToggle: (value) => {
        setAnalytics(value);
        savePrivacySetting('analytics', value);
      }
    },
    {
      id: 'personalized_ads',
      title: 'Personalized Ads',
      description: 'Show you ads based on your interests and usage',
      icon: personalizedAds ? Eye : EyeOff,
      type: 'toggle',
      value: personalizedAds,
      onToggle: (value) => {
        setPersonalizedAds(value);
        savePrivacySetting('personalized_ads', value);
      }
    },
    {
      id: 'share_partners',
      title: 'Share with Partners',
      description: 'Share anonymized data with trusted beauty partners',
      icon: Share2,
      type: 'toggle',
      value: shareWithPartners,
      onToggle: (value) => {
        setShareWithPartners(value);
        savePrivacySetting('share_partners', value);
      }
    }
  ];

  const dataRights: PrivacySetting[] = [
    {
      id: 'export_data',
      title: 'Export My Data',
      description: 'Download a copy of all your data',
      icon: Download,
      type: 'action',
      onPress: handleDataExport
    },
    {
      id: 'delete_data',
      title: 'Delete All Data',
      description: 'Permanently remove all your data from our servers',
      icon: Trash2,
      type: 'action',
      onPress: handleDataDeletion
    }
  ];

  const legalSettings: PrivacySetting[] = [
    {
      id: 'privacy_policy',
      title: 'Privacy Policy',
      description: 'Read our privacy policy',
      icon: Lock,
      type: 'action',
      onPress: handlePrivacyPolicy
    },
    {
      id: 'terms_service',
      title: 'Terms of Service',
      description: 'Read our terms of service',
      icon: Info,
      type: 'action',
      onPress: handleTermsOfService
    }
  ];

  const renderSetting = (setting: PrivacySetting) => (
    <View key={setting.id} style={[styles.settingItem, shadow.card]}>
      <View style={styles.settingIcon}>
        <setting.icon color={palette.blush} size={22} strokeWidth={2} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: palette.textPrimary }]}>{setting.title}</Text>
        <Text style={[styles.settingDescription, { color: palette.textSecondary }]}>{setting.description}</Text>
      </View>
      {setting.type === 'toggle' ? (
        <Switch
          value={setting.value}
          onValueChange={setting.onToggle}
          trackColor={{ false: palette.surfaceAlt, true: palette.overlayBlush }}
          thumbColor={setting.value ? palette.blush : palette.textMuted}
        />
      ) : (
        <TouchableOpacity onPress={setting.onPress} style={styles.actionButton}>
          <ChevronRight color={palette.gold} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.backgroundStart }]}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen options={{ 
        title: 'Privacy & Care', 
        headerShown: true,
        headerStyle: { backgroundColor: 'transparent' },
        headerTintColor: palette.textPrimary
      }} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Heart color={palette.blush} size={32} fill={palette.blush} />
          </View>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Your Privacy Matters</Text>
          <Text style={[styles.headerSubtitle, { color: palette.textSecondary }]}>
            We care deeply about your privacy and want you to feel safe and in control of your data.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Privacy Settings</Text>
          <View style={[styles.settingsCard, { backgroundColor: palette.surface, borderColor: palette.divider }]}>
            {privacySettings.map(renderSetting)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Your Data Rights</Text>
          <View style={[styles.settingsCard, { backgroundColor: palette.surface, borderColor: palette.divider }]}>
            {dataRights.map(renderSetting)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Legal</Text>
          <View style={[styles.settingsCard, { backgroundColor: palette.surface, borderColor: palette.divider }]}>
            {legalSettings.map(renderSetting)}
          </View>
        </View>

        <View style={styles.footer}>
          <LinearGradient colors={gradient.primary} style={styles.footerCard}>
            <Heart color={palette.textPrimary} size={24} fill={palette.blush} />
            <Text style={[styles.footerTitle, { color: palette.textPrimary }]}>We Care About You</Text>
            <Text style={[styles.footerText, { color: palette.textSecondary }]}>
              Your trust is precious to us. We&apos;re committed to being transparent about how we handle your data and giving you full control over your privacy.
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(244, 196, 196, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 232, 232, 0.5)',
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(244, 196, 196, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    padding: 8,
  },
  footer: {
    paddingHorizontal: 24,
  },
  footerCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});