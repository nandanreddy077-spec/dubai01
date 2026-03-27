import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Clock, Sparkles, TrendingUp, Award, Sun, Moon, Info } from 'lucide-react-native';
import { getPalette, shadow, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  getNotificationPreferences, 
  updateNotificationPreferences,
  testNotification,
  getNotificationStatus,
  type NotificationPreferences 
} from '@/lib/notifications';
import PressableScale from '@/components/PressableScale';

export default function NotificationSettingsScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    const preferences = await getNotificationPreferences();
    const status = await getNotificationStatus();
    setPrefs(preferences);
    setPermissionGranted(status.permissionGranted);
    setIsLoading(false);
  };

  const updatePref = async (key: keyof NotificationPreferences, value: any) => {
    if (!prefs) return;
    
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await updateNotificationPreferences({ [key]: value });
  };

  const handleTestNotification = async () => {
    await testNotification();
    Alert.alert(
      '✨ Test Sent!',
      'If you don&apos;t see a notification, check your device settings to ensure notifications are enabled for GlowCheck.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading || !prefs) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
            Loading preferences...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!permissionGranted && Platform.OS !== 'web' && (
          <View style={[styles.warningCard, { backgroundColor: palette.error + '15', borderColor: palette.error }]}>
            <Info size={20} color={palette.error} />
            <Text style={[styles.warningText, { color: palette.error }]}>
              Notifications are disabled in your device settings. Enable them to receive reminders.
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: palette.surface }, shadow.soft]}>
          <View style={styles.cardHeader}>
            <Bell size={22} color={palette.primary} />
            <Text style={[styles.cardTitle, { color: palette.text }]}>Master Switch</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: palette.text }]}>
                Enable Notifications
              </Text>
              <Text style={[styles.settingDescription, { color: palette.textSecondary }]}>
                Turn all notifications on or off
              </Text>
            </View>
            <Switch
              value={prefs.enabled}
              onValueChange={(value) => updatePref('enabled', value)}
              trackColor={{ false: palette.border, true: palette.primary + '40' }}
              thumbColor={prefs.enabled ? palette.primary : palette.textSecondary}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface }, shadow.soft]}>
          <View style={styles.cardHeader}>
            <Sparkles size={22} color={palette.primary} />
            <Text style={[styles.cardTitle, { color: palette.text }]}>Routine Reminders</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.iconLabel}>
                <Sun size={18} color={palette.gold} />
                <Text style={[styles.settingLabel, { color: palette.text }]}>
                  Morning Routine
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: palette.textSecondary }]}>
                Daily at {prefs.morningTime}:00
              </Text>
            </View>
            <Switch
              value={prefs.morningRoutine}
              onValueChange={(value) => updatePref('morningRoutine', value)}
              trackColor={{ false: palette.border, true: palette.primary + '40' }}
              thumbColor={prefs.morningRoutine ? palette.primary : palette.textSecondary}
              disabled={!prefs.enabled}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: palette.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.iconLabel}>
                <Moon size={18} color={palette.secondary} />
                <Text style={[styles.settingLabel, { color: palette.text }]}>
                  Evening Routine
                </Text>
              </View>
              <Text style={[styles.settingDescription, { color: palette.textSecondary }]}>
                Daily at {prefs.eveningTime}:00
              </Text>
            </View>
            <Switch
              value={prefs.eveningRoutine}
              onValueChange={(value) => updatePref('eveningRoutine', value)}
              trackColor={{ false: palette.border, true: palette.primary + '40' }}
              thumbColor={prefs.eveningRoutine ? palette.primary : palette.textSecondary}
              disabled={!prefs.enabled}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface }, shadow.soft]}>
          <View style={styles.cardHeader}>
            <TrendingUp size={22} color={palette.primary} />
            <Text style={[styles.cardTitle, { color: palette.text }]}>Progress Tracking</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: palette.text }]}>
                Progress Reminders
              </Text>
              <Text style={[styles.settingDescription, { color: palette.textSecondary }]}>
                Daily photo & journal prompts at {prefs.progressTime}:00
              </Text>
            </View>
            <Switch
              value={prefs.progressReminders}
              onValueChange={(value) => updatePref('progressReminders', value)}
              trackColor={{ false: palette.border, true: palette.primary + '40' }}
              thumbColor={prefs.progressReminders ? palette.primary : palette.textSecondary}
              disabled={!prefs.enabled}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: palette.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: palette.text }]}>
                Weekly Insights
              </Text>
              <Text style={[styles.settingDescription, { color: palette.textSecondary }]}>
                Your week in glow every Sunday at 10:00
              </Text>
            </View>
            <Switch
              value={prefs.weeklyInsights}
              onValueChange={(value) => updatePref('weeklyInsights', value)}
              trackColor={{ false: palette.border, true: palette.primary + '40' }}
              thumbColor={prefs.weeklyInsights ? palette.primary : palette.textSecondary}
              disabled={!prefs.enabled}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface }, shadow.soft]}>
          <View style={styles.cardHeader}>
            <Award size={22} color={palette.primary} />
            <Text style={[styles.cardTitle, { color: palette.text }]}>Engagement</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: palette.text }]}>
                Streak Warnings
              </Text>
              <Text style={[styles.settingDescription, { color: palette.textSecondary }]}>
                Don&apos;t break your streak! (only for streaks 3+ days)
              </Text>
            </View>
            <Switch
              value={prefs.streakWarnings}
              onValueChange={(value) => updatePref('streakWarnings', value)}
              trackColor={{ false: palette.border, true: palette.primary + '40' }}
              thumbColor={prefs.streakWarnings ? palette.primary : palette.textSecondary}
              disabled={!prefs.enabled}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: palette.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: palette.text }]}>
                Achievement Alerts
              </Text>
              <Text style={[styles.settingDescription, { color: palette.textSecondary }]}>
                Get notified when you unlock badges
              </Text>
            </View>
            <Switch
              value={prefs.achievementAlerts}
              onValueChange={(value) => updatePref('achievementAlerts', value)}
              trackColor={{ false: palette.border, true: palette.primary + '40' }}
              thumbColor={prefs.achievementAlerts ? palette.primary : palette.textSecondary}
              disabled={!prefs.enabled}
            />
          </View>
        </View>

        <PressableScale onPress={handleTestNotification}>
          <View style={[styles.testButton, { backgroundColor: palette.primary }, shadow.soft]}>
            <Bell size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </View>
        </PressableScale>

        <View style={[styles.infoCard, { backgroundColor: palette.primary + '10' }]}>
          <Clock size={18} color={palette.primary} />
          <Text style={[styles.infoText, { color: palette.text }]}>
            Notifications respect your device&apos;s Do Not Disturb settings and won&apos;t arrive between{' '}
            {prefs.quietHoursStart}:00 - {prefs.quietHoursEnd}:00.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  warningText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
  card: {
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginVertical: spacing.md,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
