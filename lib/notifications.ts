import { Platform } from 'react-native';

// Simplified notification system without expo-notifications
// This works in Expo Go SDK 53 and production builds

const MORNING_HOUR = 10;
const EVENING_HOUR = 22;

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

async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.log('[Notifications] getItem error', e);
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.log('[Notifications] setItem error', e);
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.log('[Notifications] removeItem error', e);
  }
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

export async function initializeNotifications() {
  console.log('[Notifications] Initializing simplified notification system...');
  
  if (Platform.OS === 'web') {
    const hasPermission = await requestWebNotificationPermission();
    console.log('[Notifications] Web notifications initialized:', hasPermission);
    return hasPermission;
  }
  
  // For mobile platforms in Expo Go SDK 53, we can't use expo-notifications
  // But we can still track routine completion
  console.log('[Notifications] Mobile notifications not available in Expo Go SDK 53');
  console.log('[Notifications] Routine tracking will still work without push notifications');
  return true; // Return true to allow routine tracking
}

export async function scheduleDailyReminder(type: RoutineType) {
  const hour = type === 'morning' ? MORNING_HOUR : EVENING_HOUR;
  const title = type === 'morning' ? 'Morning routine reminder' : 'Evening routine reminder';
  const body = type === 'morning' ? "Haven't finished your morning skincare yet? Let's glow!" : "Time for your evening routine. Your skin will thank you.";

  const dateKey = getLocalDateKey();
  const doneKey = (type === 'morning' ? STORAGE_KEYS.morningDonePrefix : STORAGE_KEYS.eveningDonePrefix) + dateKey;
  const isDone = (await getItem(doneKey)) === '1';
  
  if (isDone) {
    console.log(`[Notifications] ${type} already done for ${dateKey}, skipping schedule for today`);
    return;
  }

  const now = new Date();
  const currentHour = now.getHours();
  
  // Only schedule notification if we haven't passed the time yet today
  if ((type === 'morning' && currentHour >= MORNING_HOUR) || 
      (type === 'evening' && currentHour >= EVENING_HOUR)) {
    console.log(`[Notifications] ${type} time has passed for today, scheduling for tomorrow`);
  }

  const when = nextTimeTodayOrTomorrow(hour);

  if (Platform.OS === 'web') {
    const ms = when.getTime() - Date.now();
    console.log(`[Notifications] Web scheduling ${type} in ${Math.round(ms / 1000)}s at`, when.toString());
    
    // Clear any existing timeout for this type
    const timeoutKey = `${type}_timeout`;
    const existingTimeout = (globalThis as any)[timeoutKey];
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    (globalThis as any)[timeoutKey] = setTimeout(() => {
      if (!('Notification' in globalThis)) return console.log('[Notifications] Notification API not available');
      getItem(doneKey).then(val => {
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

  // For mobile platforms, just log that we would schedule a notification
  console.log(`[Notifications] Would schedule ${type} notification for ${when.toString()}`);
  console.log('[Notifications] Mobile push notifications require a development build (not available in Expo Go SDK 53)');
}

export async function markRoutineDone(type: RoutineType, date = new Date()) {
  const key = (type === 'morning' ? STORAGE_KEYS.morningDonePrefix : STORAGE_KEYS.eveningDonePrefix) + getLocalDateKey(date);
  await setItem(key, '1');
  console.log('[Notifications] marked done', type, getLocalDateKey(date));

  if (Platform.OS === 'web') {
    // Clear web timeout
    const timeoutKey = `${type}_timeout`;
    const existingTimeout = (globalThis as any)[timeoutKey];
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      delete (globalThis as any)[timeoutKey];
    }
  }

  // Schedule for tomorrow
  await scheduleDailyReminder(type);
}

export async function resetTodayFlags() {
  const today = getLocalDateKey();
  await removeItem(STORAGE_KEYS.morningDonePrefix + today);
  await removeItem(STORAGE_KEYS.eveningDonePrefix + today);
}

export async function startDailyNotifications() {
  console.log('[Notifications] Starting simplified notification system');
  
  try {
    // Initialize notifications first
    const initialized = await initializeNotifications();
    if (!initialized && Platform.OS === 'web') {
      console.log('[Notifications] Failed to initialize web notifications');
      return false;
    }

    await scheduleDailyReminder('morning');
    await scheduleDailyReminder('evening');
    
    console.log('[Notifications] Notification system started successfully');
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
    platform: Platform.OS,
  };

  try {
    if (Platform.OS === 'web') {
      status.permissionGranted = 'Notification' in globalThis && Notification.permission === 'granted';
      // Check if we have active timeouts
      status.morningScheduled = !!(globalThis as any).morning_timeout;
      status.eveningScheduled = !!(globalThis as any).evening_timeout;
      status.scheduledNotifications = (status.morningScheduled ? 1 : 0) + (status.eveningScheduled ? 1 : 0);
    } else {
      // For mobile, we can't check actual notifications in Expo Go SDK 53
      console.log('[Notifications] Mobile notification status not available in Expo Go SDK 53');
      status.permissionGranted = true; // Assume granted for routine tracking
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
      new Notification('Test Notification', {
        body: 'This is a test notification from Glow Check!',
      });
      console.log('[Notifications] Web test notification sent');
    } else {
      console.log('[Notifications] Web notifications not available or not permitted');
    }
    return;
  }

  console.log('[Notifications] Mobile test notifications not available in Expo Go SDK 53');
  console.log('[Notifications] Use a development build for full notification support');
}

export async function clearAllNotifications() {
  console.log('[Notifications] Clearing all notifications...');
  
  if (Platform.OS === 'web') {
    // Clear web timeouts
    const timeoutKeys = ['morning_timeout', 'evening_timeout'];
    timeoutKeys.forEach(key => {
      const timeout = (globalThis as any)[key];
      if (timeout) {
        clearTimeout(timeout);
        delete (globalThis as any)[key];
      }
    });
    console.log('[Notifications] Web timeouts cleared');
    return;
  }

  // Clear stored IDs for mobile (even though we can't cancel actual notifications in Expo Go)
  await removeItem(STORAGE_KEYS.morningNotifId);
  await removeItem(STORAGE_KEYS.eveningNotifId);
  console.log('[Notifications] Notification data cleared');
}