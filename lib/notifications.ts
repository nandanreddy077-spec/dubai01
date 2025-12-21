import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const MORNING_HOUR = 10;
const EVENING_HOUR = 21;

const ANDROID_CHANNEL_ID = 'glowcheck-reminders';

const STORAGE_KEYS = {
  morningDonePrefix: 'glow_morning_done_',
  eveningDonePrefix: 'glow_evening_done_',
  morningNotifId: 'glow_morning_notif_id',
  eveningNotifId: 'glow_evening_notif_id',
} as const;

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

function getRoutineCopy(type: RoutineType): { title: string; body: string; deepLink: string } {
  if (type === 'morning') {
    return {
      title: 'Rise & Glow',
      body: 'Your morning GlowCoach routine is waiting. 2 minutes to keep your streak alive.',
      deepLink: '/glow-coach',
    };
  }

  return {
    title: 'Night Glow Reset',
    body: 'Time for your evening routine. Close the day strong and wake up glowing.',
    deepLink: '/glow-coach',
  };
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

async function scheduleNativeOnce(type: RoutineType, when: Date) {
  const { title, body, deepLink } = getRoutineCopy(type);

  const storageKey = type === 'morning' ? STORAGE_KEYS.morningNotifId : STORAGE_KEYS.eveningNotifId;
  await cancelScheduledByStorageKey(storageKey);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: {
        kind: 'routine',
        routineType: type,
        deepLink,
      } satisfies GlowNotificationData,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
    },
  });

  await AsyncStorage.setItem(storageKey, id);
  console.log('[Notifications] scheduled', type, 'for', when.toISOString(), 'id=', id);
}

export async function initializeNotifications(): Promise<boolean> {
  console.log('[Notifications] Initializing notification system...');

  if (Platform.OS === 'web') {
    const hasPermission = await requestWebNotificationPermission();
    console.log('[Notifications] Web notifications initialized:', hasPermission);
    return hasPermission;
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
    console.log('[Notifications] current permission:', current.status, current.granted);

    let granted = current.granted;
    if (!granted) {
      const asked = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      granted = asked.granted;
      console.log('[Notifications] requested permission:', asked.status, asked.granted);
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'GlowCoach Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 50, 200],
        lightColor: '#F8C7D7',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
      });
    }

    console.log('[Notifications] initialized ok, granted=', granted);
    return granted;
  } catch (e) {
    console.log('[Notifications] initialize error', e);
    return false;
  }
}

export async function scheduleDailyReminder(type: RoutineType) {
  const hour = type === 'morning' ? MORNING_HOUR : EVENING_HOUR;
  const dateKey = getLocalDateKey();
  const doneKey = (type === 'morning' ? STORAGE_KEYS.morningDonePrefix : STORAGE_KEYS.eveningDonePrefix) + dateKey;

  const isDone = (await AsyncStorage.getItem(doneKey)) === '1';
  if (isDone) {
    console.log(`[Notifications] ${type} already done for ${dateKey}, skipping schedule`);
    await cancelScheduledByStorageKey(type === 'morning' ? STORAGE_KEYS.morningNotifId : STORAGE_KEYS.eveningNotifId);
    return;
  }

  const when = nextTimeTodayOrTomorrow(hour);

  if (Platform.OS === 'web') {
    const { title, body } = getRoutineCopy(type);
    const ms = when.getTime() - Date.now();
    console.log(`[Notifications] Web scheduling ${type} in ${Math.round(ms / 1000)}s at`, when.toString());

    const timeoutKey = `${type}_timeout`;
    const existingTimeout = (globalThis as any)[timeoutKey] as ReturnType<typeof setTimeout> | undefined;
    if (existingTimeout) clearTimeout(existingTimeout);

    (globalThis as any)[timeoutKey] = setTimeout(() => {
      if (!('Notification' in globalThis)) return console.log('[Notifications] Notification API not available');
      AsyncStorage.getItem(doneKey).then((val) => {
        if (val === '1') {
          console.log(`[Notifications] ${type} done by trigger time, not showing web notification`);
          return;
        }
        try {
          new Notification(title, { body });
        } catch (e) {
          console.log('[Notifications] Web show error', e);
        }
      });
    }, Math.max(0, ms));

    return;
  }

  await scheduleNativeOnce(type, when);
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

export async function startDailyNotifications() {
  console.log('[Notifications] Starting daily notifications');

  try {
    const initialized = await initializeNotifications();
    if (!initialized && Platform.OS !== 'web') {
      console.log('[Notifications] Notification permission not granted');
    }

    await scheduleDailyReminder('morning');
    await scheduleDailyReminder('evening');

    console.log('[Notifications] Daily notifications started');
    return true;
  } catch (e) {
    console.log('[Notifications] Error starting notifications:', e);
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

export async function testNotification() {
  console.log('[Notifications] Testing notification...');

  if (Platform.OS === 'web') {
    if ('Notification' in globalThis && Notification.permission === 'granted') {
      new Notification('GlowCheck Test', {
        body: 'Notifications are working. Tap to open GlowCoach.',
      });
      console.log('[Notifications] Web test notification sent');
    }
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'GlowCheck Test',
      body: 'Notifications are working. Tap to open GlowCoach.',
      sound: 'default',
      data: {
        kind: 'test',
        deepLink: '/glow-coach',
      } satisfies GlowNotificationData,
    },
    trigger: null,
  });
}

export async function clearAllNotifications() {
  console.log('[Notifications] Clearing all notifications...');

  if (Platform.OS === 'web') {
    const timeoutKeys = ['morning_timeout', 'evening_timeout'];
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
  } catch (e) {
    console.log('[Notifications] cancelAllScheduledNotificationsAsync error', e);
  }

  await AsyncStorage.multiRemove([STORAGE_KEYS.morningNotifId, STORAGE_KEYS.eveningNotifId]);
  console.log('[Notifications] Notification data cleared');
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
