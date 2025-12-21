import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

const ANDROID_CHANNEL_ID = 'glowcheck-reminders';
const ANDROID_CHANNEL_NAME = 'GlowCheck Reminders';

const STORAGE_KEYS = {
  morningDonePrefix: 'glow_morning_done_',
  eveningDonePrefix: 'glow_evening_done_',
  progressDonePrefix: 'glow_progress_done_',
  morningNotifId: 'glow_morning_notif_id',
  eveningNotifId: 'glow_evening_notif_id',
  progressNotifId: 'glow_progress_notif_id',
  streakNotifId: 'glow_streak_notif_id',
  weeklyNotifId: 'glow_weekly_notif_id',
  notificationPreferences: 'notification_preferences',
  notificationStats: 'notification_stats',
} as const;

export interface NotificationPreferences {
  enabled: boolean;
  morningRoutine: boolean;
  eveningRoutine: boolean;
  progressReminders: boolean;
  streakWarnings: boolean;
  weeklyInsights: boolean;
  achievementAlerts: boolean;
  morningTime: number;
  eveningTime: number;
  progressTime: number;
  quietHoursStart: number;
  quietHoursEnd: number;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  morningRoutine: true,
  eveningRoutine: true,
  progressReminders: true,
  streakWarnings: true,
  weeklyInsights: true,
  achievementAlerts: true,
  morningTime: 9,
  eveningTime: 20,
  progressTime: 14,
  quietHoursStart: 22,
  quietHoursEnd: 7,
};

function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function nextTimeTodayOrTomorrow(targetHour: number): Date {
  const now = new Date();
  const target = new Date();
  target.setHours(targetHour, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

async function requestWebNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'web') return false;

  try {
    if (!('Notification' in globalThis)) {
      console.log('[Notifications] Web Notification API not available');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
      console.log('[Notifications] Web notifications denied by user');
      return false;
    }
    const perm = await Notification.requestPermission();
    console.log('[Notifications] Web permission result:', perm);
    return perm === 'granted';
  } catch (e) {
    console.log('[Notifications] Web permission error', e);
    return false;
  }
}

export type RoutineType = 'morning' | 'evening';

export type GlowNotificationKind = 'routine' | 'engagement' | 'weekly' | 'achievement' | 'test';

export type GlowNotificationData = {
  kind: GlowNotificationKind;
  deepLink?: string;
  routineType?: RoutineType;
  campaign?: string;
  meta?: Record<string, string | number | boolean | null>;
};

const NOTIFICATION_MESSAGES = {
  morning: [
    { title: '☀️ Good morning, beautiful!', body: 'Start your day with your GlowCoach routine. Your skin will thank you!' },
    { title: '✨ Rise & Glow!', body: 'Your morning routine is waiting. Keep that streak alive!' },
    { title: '🌅 Morning Glow Time!', body: 'Just 5 minutes for glowing skin. Let\'s do this!' },
  ],
  evening: [
    { title: '🌙 Evening Routine Time!', body: 'Wind down with your skincare ritual. You deserve this moment.' },
    { title: '✨ Night Glow Reset!', body: 'Complete your evening routine and wake up glowing tomorrow!' },
    { title: '💫 Skincare O\'Clock!', body: 'End your day on a glowing note. Your routine awaits!' },
  ],
  progress: [
    { title: '📸 Track Your Glow!', body: 'Quick photo + journal entry = powerful insights. Takes 2 minutes!' },
    { title: '📊 Your Progress Awaits!', body: 'Capture today\'s glow and see your transformation. Every day counts!' },
    { title: '⚡ Quick Check-In!', body: 'Log your progress to unlock personalized insights. You\'re amazing!' },
  ],
  streak: [
    { title: '🔥 Don\'t Lose Your Streak!', body: 'Just 2 hours left! Quick routine to save your {streak}-day streak!' },
    { title: '⚠️ Streak Alert!', body: 'You\'re about to lose {streak} days of progress. Check in now!' },
    { title: '💪 Your Streak Needs You!', body: '{streak} days of consistency - don\'t break it now!' },
  ],
  achievement: [
    { title: '🎉 Achievement Unlocked!', body: 'You earned "{badge}"! Your dedication is inspiring!' },
    { title: '🏆 New Badge!', body: 'Congratulations! You unlocked "{badge}". Keep glowing!' },
  ],
  weekly: [
    { title: '📊 Weekly Insights Ready!', body: 'See your skin transformation this week. New insights waiting!' },
    { title: '✨ Your Week in Glow!', body: 'Check your progress, wins, and personalized tips inside!' },
  ],
};

function getRandomMessage(type: keyof typeof NOTIFICATION_MESSAGES): { title: string; body: string } {
  const messages = NOTIFICATION_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)];
}

function personalizeMessage(message: string, context: Record<string, string | number>): string {
  let result = message;
  Object.entries(context).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, String(value));
  });
  return result;
}

async function cancelScheduledByStorageKey(storageKey: string) {
  try {
    const id = await AsyncStorage.getItem(storageKey);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(storageKey);
      console.log('[Notifications] cancelled scheduled notification', storageKey, id);
    }
  } catch (e) {
    console.log('[Notifications] cancelScheduledByStorageKey error', storageKey, e);
  }
}



export async function initializeNotifications(): Promise<boolean> {
  console.log('[Notifications] Initializing comprehensive notification system...');

  if (Platform.OS === 'web') {
    const hasPermission = await requestWebNotificationPermission();
    console.log('[Notifications] Web notifications initialized:', hasPermission);
    return hasPermission;
  }

  if (!Device.isDevice) {
    console.log('[Notifications] Not a physical device, notifications limited');
    return false;
  }

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const current = await Notifications.getPermissionsAsync();
    console.log('[Notifications] Current permission:', current.status);

    let granted = current.granted;
    if (!granted && current.canAskAgain) {
      const asked = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {},
      });
      granted = asked.granted;
      console.log('[Notifications] Permission requested:', asked.status);
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: ANDROID_CHANNEL_NAME,
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B9D',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
      console.log('[Notifications] Android channel created');
    }

    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(0);
    }

    console.log('[Notifications] ✅ Initialized successfully, permission:', granted);
    return granted;
  } catch (e) {
    console.error('[Notifications] ❌ Initialization error:', e);
    return false;
  }
}

export async function scheduleDailyReminder(type: RoutineType) {
  const prefs = await getNotificationPreferences();
  const hour = type === 'morning' ? prefs.morningTime : prefs.eveningTime;
  const dateKey = getLocalDateKey();
  const doneKey = (type === 'morning' ? STORAGE_KEYS.morningDonePrefix : STORAGE_KEYS.eveningDonePrefix) + dateKey;
  const storageKey = type === 'morning' ? STORAGE_KEYS.morningNotifId : STORAGE_KEYS.eveningNotifId;

  const isDone = (await AsyncStorage.getItem(doneKey)) === '1';
  if (isDone) {
    console.log(`[Notifications] ${type} already done, skipping`);
    await cancelScheduledByStorageKey(storageKey);
    return;
  }

  const when = nextTimeTodayOrTomorrow(hour);
  const message = getRandomMessage(type);

  if (Platform.OS === 'web') {
    const ms = when.getTime() - Date.now();
    const timeoutKey = `${type}_timeout`;
    const existingTimeout = (globalThis as any)[timeoutKey] as ReturnType<typeof setTimeout> | undefined;
    if (existingTimeout) clearTimeout(existingTimeout);

    (globalThis as any)[timeoutKey] = setTimeout(() => {
      if (!('Notification' in globalThis)) return;
      AsyncStorage.getItem(doneKey).then((val) => {
        if (val === '1') return;
        try {
          new Notification(message.title, { body: message.body });
        } catch (e) {
          console.error('[Notifications] Web notification error', e);
        }
      });
    }, Math.max(0, ms));

    console.log(`[Notifications] Web ${type} scheduled for ${when.toLocaleTimeString()}`);
    return;
  }

  await cancelScheduledByStorageKey(storageKey);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: message.title,
      body: message.body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: {
        kind: 'routine',
        routineType: type,
        deepLink: '/(tabs)/glow-coach',
      } satisfies GlowNotificationData,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
    },
  });

  await AsyncStorage.setItem(storageKey, id);
  console.log(`[Notifications] ${type} scheduled for ${when.toLocaleTimeString()}, id=${id}`);
}

async function scheduleProgressReminder() {
  const prefs = await getNotificationPreferences();
  const when = nextTimeTodayOrTomorrow(prefs.progressTime);
  const message = getRandomMessage('progress');
  const storageKey = STORAGE_KEYS.progressNotifId;

  if (Platform.OS === 'web') {
    const ms = when.getTime() - Date.now();
    const timeoutKey = 'progress_timeout';
    const existingTimeout = (globalThis as any)[timeoutKey] as ReturnType<typeof setTimeout> | undefined;
    if (existingTimeout) clearTimeout(existingTimeout);

    (globalThis as any)[timeoutKey] = setTimeout(() => {
      if ('Notification' in globalThis) {
        try {
          new Notification(message.title, { body: message.body });
        } catch (e) {
          console.error('[Notifications] Web notification error', e);
        }
      }
    }, Math.max(0, ms));

    return;
  }

  await cancelScheduledByStorageKey(storageKey);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: message.title,
      body: message.body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: {
        kind: 'engagement',
        deepLink: '/(tabs)/progress',
      } satisfies GlowNotificationData,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
    },
  });

  await AsyncStorage.setItem(storageKey, id);
  console.log(`[Notifications] Progress reminder scheduled for ${when.toLocaleTimeString()}`);
}

async function scheduleStreakWarning(streak: number) {
  const when = nextTimeTodayOrTomorrow(22);
  const message = getRandomMessage('streak');
  const body = personalizeMessage(message.body, { streak });
  const storageKey = STORAGE_KEYS.streakNotifId;

  if (Platform.OS === 'web') {
    const ms = when.getTime() - Date.now();
    const timeoutKey = 'streak_timeout';
    const existingTimeout = (globalThis as any)[timeoutKey] as ReturnType<typeof setTimeout> | undefined;
    if (existingTimeout) clearTimeout(existingTimeout);

    (globalThis as any)[timeoutKey] = setTimeout(() => {
      if ('Notification' in globalThis) {
        try {
          new Notification(message.title, { body });
        } catch (e) {
          console.error('[Notifications] Web notification error', e);
        }
      }
    }, Math.max(0, ms));

    return;
  }

  await cancelScheduledByStorageKey(storageKey);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: message.title,
      body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        kind: 'engagement',
        deepLink: '/(tabs)/glow-coach',
      } satisfies GlowNotificationData,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
    },
  });

  await AsyncStorage.setItem(storageKey, id);
  console.log(`[Notifications] Streak warning scheduled for ${when.toLocaleTimeString()}`);
}

async function scheduleWeeklyInsights() {
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
  nextSunday.setHours(10, 0, 0, 0);

  if (nextSunday.getTime() <= now.getTime()) {
    nextSunday.setDate(nextSunday.getDate() + 7);
  }

  const message = getRandomMessage('weekly');
  const storageKey = STORAGE_KEYS.weeklyNotifId;

  if (Platform.OS === 'web') {
    const ms = nextSunday.getTime() - Date.now();
    const timeoutKey = 'weekly_timeout';
    const existingTimeout = (globalThis as any)[timeoutKey] as ReturnType<typeof setTimeout> | undefined;
    if (existingTimeout) clearTimeout(existingTimeout);

    (globalThis as any)[timeoutKey] = setTimeout(() => {
      if ('Notification' in globalThis) {
        try {
          new Notification(message.title, { body: message.body });
        } catch (e) {
          console.error('[Notifications] Web notification error', e);
        }
      }
    }, Math.max(0, ms));

    return;
  }

  await cancelScheduledByStorageKey(storageKey);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: message.title,
      body: message.body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
      data: {
        kind: 'weekly',
        deepLink: '/(tabs)/progress',
      } satisfies GlowNotificationData,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextSunday,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
    },
  });

  await AsyncStorage.setItem(storageKey, id);
  console.log(`[Notifications] Weekly insights scheduled for ${nextSunday.toLocaleString()}`);
}

export async function markRoutineDone(type: RoutineType, date = new Date()) {
  const key = (type === 'morning' ? STORAGE_KEYS.morningDonePrefix : STORAGE_KEYS.eveningDonePrefix) + getLocalDateKey(date);
  await AsyncStorage.setItem(key, '1');
  console.log('[Notifications] marked done', type, getLocalDateKey(date));

  if (Platform.OS === 'web') {
    const timeoutKey = `${type}_timeout`;
    const existingTimeout = (globalThis as any)[timeoutKey] as ReturnType<typeof setTimeout> | undefined;
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      delete (globalThis as any)[timeoutKey];
    }
  } else {
    await cancelScheduledByStorageKey(type === 'morning' ? STORAGE_KEYS.morningNotifId : STORAGE_KEYS.eveningNotifId);
  }

  await scheduleDailyReminder(type);
}

export async function resetTodayFlags() {
  const today = getLocalDateKey();
  await AsyncStorage.removeItem(STORAGE_KEYS.morningDonePrefix + today);
  await AsyncStorage.removeItem(STORAGE_KEYS.eveningDonePrefix + today);
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.notificationPreferences);
    return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
  } catch (e) {
    console.error('[Notifications] Error loading preferences:', e);
    return DEFAULT_PREFERENCES;
  }
}

export async function updateNotificationPreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
  try {
    const current = await getNotificationPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(STORAGE_KEYS.notificationPreferences, JSON.stringify(updated));
    console.log('[Notifications] Preferences updated');
    await rescheduleAllNotifications();
  } catch (e) {
    console.error('[Notifications] Error updating preferences:', e);
  }
}

async function rescheduleAllNotifications() {
  await clearAllNotifications();
  const prefs = await getNotificationPreferences();
  if (prefs.enabled) {
    await startDailyNotifications();
  }
}

export async function startDailyNotifications(options?: { streak?: number; hasCompletedMorning?: boolean; hasCompletedEvening?: boolean }) {
  console.log('[Notifications] Starting daily notifications...');

  try {
    const prefs = await getNotificationPreferences();
    if (!prefs.enabled) {
      console.log('[Notifications] Notifications disabled by user');
      return false;
    }

    const initialized = await initializeNotifications();
    if (!initialized && Platform.OS !== 'web') {
      console.log('[Notifications] ⚠️ Permission not granted');
      return false;
    }

    if (prefs.morningRoutine && !options?.hasCompletedMorning) {
      await scheduleDailyReminder('morning');
    }

    if (prefs.eveningRoutine && !options?.hasCompletedEvening) {
      await scheduleDailyReminder('evening');
    }

    if (prefs.progressReminders) {
      await scheduleProgressReminder();
    }

    if (prefs.streakWarnings && options?.streak && options.streak > 3) {
      await scheduleStreakWarning(options.streak);
    }

    if (prefs.weeklyInsights) {
      await scheduleWeeklyInsights();
    }

    console.log('[Notifications] ✅ All notifications scheduled');
    return true;
  } catch (e) {
    console.error('[Notifications] ❌ Error starting notifications:', e);
    return false;
  }
}

export async function getNotificationStatus() {
  const status = {
    permissionGranted: false,
    scheduledNotifications: 0,
    morningScheduled: false,
    eveningScheduled: false,
    platform: Platform.OS as string,
  };

  try {
    if (Platform.OS === 'web') {
      status.permissionGranted = 'Notification' in globalThis && Notification.permission === 'granted';
      status.morningScheduled = !!(globalThis as any).morning_timeout;
      status.eveningScheduled = !!(globalThis as any).evening_timeout;
      status.scheduledNotifications = (status.morningScheduled ? 1 : 0) + (status.eveningScheduled ? 1 : 0);
    } else {
      const perm = await Notifications.getPermissionsAsync();
      status.permissionGranted = perm.granted;

      const morningId = await AsyncStorage.getItem(STORAGE_KEYS.morningNotifId);
      const eveningId = await AsyncStorage.getItem(STORAGE_KEYS.eveningNotifId);
      status.morningScheduled = !!morningId;
      status.eveningScheduled = !!eveningId;
      status.scheduledNotifications = (morningId ? 1 : 0) + (eveningId ? 1 : 0);
    }
  } catch (e) {
    console.log('[Notifications] Error getting status:', e);
  }

  return status;
}

export async function sendImmediateNotification(type: 'achievement' | 'weekly', context: Record<string, string | number> = {}) {
  const prefs = await getNotificationPreferences();
  
  if (!prefs.enabled) return;
  if (type === 'achievement' && !prefs.achievementAlerts) return;
  if (type === 'weekly' && !prefs.weeklyInsights) return;

  const message = getRandomMessage(type);
  const title = personalizeMessage(message.title, context);
  const body = personalizeMessage(message.body, context);

  if (Platform.OS === 'web') {
    if ('Notification' in globalThis && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: {
        kind: type === 'achievement' ? 'achievement' : 'weekly',
        deepLink: type === 'achievement' ? '/(tabs)' : '/(tabs)/progress',
      } satisfies GlowNotificationData,
    },
    trigger: null,
  });

  console.log(`[Notifications] Immediate ${type} notification sent`);
}

export async function testNotification() {
  console.log('[Notifications] Testing notification...');

  if (Platform.OS === 'web') {
    if ('Notification' in globalThis && Notification.permission === 'granted') {
      new Notification('✨ GlowCheck Test', {
        body: 'Notifications are working perfectly! Tap to open.',
      });
      console.log('[Notifications] Web test notification sent');
    }
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✨ GlowCheck Test',
      body: 'Notifications are working perfectly! Tap to open.',
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: {
        kind: 'test',
        deepLink: '/(tabs)',
      } satisfies GlowNotificationData,
    },
    trigger: null,
  });

  console.log('[Notifications] Test notification sent');
}

export async function clearAllNotifications() {
  console.log('[Notifications] Clearing all notifications...');

  if (Platform.OS === 'web') {
    const timeoutKeys = ['morning_timeout', 'evening_timeout', 'progress_timeout', 'streak_timeout', 'weekly_timeout'];
    timeoutKeys.forEach((key) => {
      const timeout = (globalThis as any)[key] as ReturnType<typeof setTimeout> | undefined;
      if (timeout) {
        clearTimeout(timeout);
        delete (globalThis as any)[key];
      }
    });
    console.log('[Notifications] Web timeouts cleared');
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(0);
    }
  } catch (e) {
    console.error('[Notifications] Clear error', e);
  }

  await AsyncStorage.multiRemove([
    STORAGE_KEYS.morningNotifId,
    STORAGE_KEYS.eveningNotifId,
    STORAGE_KEYS.progressNotifId,
    STORAGE_KEYS.streakNotifId,
    STORAGE_KEYS.weeklyNotifId,
  ]);
  
  console.log('[Notifications] ✅ All notifications cleared');
}

export async function scheduleLocalNotificationAt(params: {
  idKey?: string;
  at: Date;
  title: string;
  body: string;
  data?: GlowNotificationData;
  androidChannelId?: string;
}): Promise<string | null> {
  const { idKey, at, title, body, data, androidChannelId } = params;

  if (Platform.OS === 'web') {
    const ms = at.getTime() - Date.now();
    const timeoutKey = idKey ?? `local_${title}_${at.toISOString()}`;

    const existingTimeout = (globalThis as any)[timeoutKey] as ReturnType<typeof setTimeout> | undefined;
    if (existingTimeout) clearTimeout(existingTimeout);

    (globalThis as any)[timeoutKey] = setTimeout(() => {
      if (!('Notification' in globalThis) || Notification.permission !== 'granted') return;
      try {
        new Notification(title, { body });
      } catch (e) {
        console.log('[Notifications] Web scheduleLocalNotificationAt show error', e);
      }
    }, Math.max(0, ms));

    console.log('[Notifications] Web scheduled notification', timeoutKey, at.toISOString());
    return timeoutKey;
  }

  if (idKey) {
    await cancelScheduledByStorageKey(idKey);
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: data ?? ({ kind: 'engagement' } satisfies GlowNotificationData),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: at,
    },
  });

  if (idKey) {
    await AsyncStorage.setItem(idKey, id);
  }

  if (Platform.OS === 'android' && androidChannelId) {
    console.log('[Notifications] androidChannelId provided (handled by setNotificationChannelAsync):', androidChannelId);
  }

  return id;
}
