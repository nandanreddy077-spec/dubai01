import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_TIMES = {
  MORNING_CHECK_IN: 9,
  PRODUCT_REMINDER: 13,
  EVENING_ROUTINE: 20,
  STREAK_WARNING: 22,
};

const STORAGE_KEYS = {
  LAST_CHECK_IN: 'smart_notif_last_check_in',
  NOTIFICATION_PREFERENCES: 'smart_notif_preferences',
  ENGAGEMENT_DATA: 'smart_notif_engagement',
  SCHEDULED_NOTIFS: 'smart_notif_scheduled',
} as const;

interface NotificationPreferences {
  morningCheckIn: boolean;
  productReminders: boolean;
  eveningRoutine: boolean;
  streakWarnings: boolean;
  optimalTimes: {
    morning?: number;
    afternoon?: number;
    evening?: number;
  };
}

interface EngagementData {
  lastOpenTime: string;
  bestEngagementHour: number;
  totalOpens: number;
  notificationClicks: number;
  streakBreaks: number;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  morningCheckIn: true,
  productReminders: true,
  eveningRoutine: true,
  streakWarnings: true,
  optimalTimes: {},
};

const NOTIFICATION_MESSAGES = {
  MORNING_CHECK_IN: [
    {
      title: "Good morning, beautiful! ✨",
      body: "Start your day with a quick check-in. Your 🔥 streak is waiting!",
    },
    {
      title: "Rise & glow! ☀️",
      body: "Don't break your streak! Quick check-in takes 10 seconds.",
    },
    {
      title: "Your glow awaits! 💫",
      body: "Daily check-in = instant rewards. Let's keep that streak alive!",
    },
  ],
  PRODUCT_REMINDER: [
    {
      title: "Did you log your products today? 📝",
      body: "Track your routine to unlock personalized recommendations!",
    },
    {
      title: "Quick reminder! 💄",
      body: "Log today's products to see your progress. It takes 30 seconds!",
    },
  ],
  EVENING_ROUTINE: [
    {
      title: "Evening glow time! 🌙",
      body: "Complete your routine to maintain your streak. You're doing amazing!",
    },
    {
      title: "Skincare o'clock! ⏰",
      body: "Your evening routine is calling. Keep that glow going!",
    },
  ],
  STREAK_WARNING: [
    {
      title: "Don't lose your streak! 🔥",
      body: "Just 2 hours left! Quick check-in to save your {streak} day streak.",
    },
    {
      title: "Streak alert! ⚠️",
      body: "You're about to lose {streak} days of progress. Check in now!",
    },
  ],
};

function getRandomMessage(category: keyof typeof NOTIFICATION_MESSAGES): { title: string; body: string } {
  const messages = NOTIFICATION_MESSAGES[category];
  return messages[Math.floor(Math.random() * messages.length)];
}

export async function initializeSmartNotifications() {
  console.log('[SmartNotif] Initializing smart notification system...');
  
  if (Platform.OS === 'web') {
    if ('Notification' in globalThis) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('[SmartNotif] Web permission:', permission);
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  }
  
  console.log('[SmartNotif] Mobile notifications ready (development build required for production)');
  return true;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const prefs = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES);
    return prefs ? JSON.parse(prefs) : DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('[SmartNotif] Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

export async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
  try {
    const current = await getNotificationPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, JSON.stringify(updated));
    console.log('[SmartNotif] Preferences updated:', updated);
  } catch (error) {
    console.error('[SmartNotif] Error updating preferences:', error);
  }
}

export async function trackAppOpen() {
  try {
    const now = new Date();
    const hour = now.getHours();
    
    const engagementData = await getEngagementData();
    engagementData.lastOpenTime = now.toISOString();
    engagementData.totalOpens++;
    
    const hourCounts = await AsyncStorage.getItem('notif_hour_counts');
    const counts: Record<number, number> = hourCounts ? JSON.parse(hourCounts) : {};
    counts[hour] = (counts[hour] || 0) + 1;
    
    let maxCount = 0;
    let bestHour = 9;
    Object.entries(counts).forEach(([h, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestHour = parseInt(h);
      }
    });
    
    engagementData.bestEngagementHour = bestHour;
    
    await AsyncStorage.setItem('notif_hour_counts', JSON.stringify(counts));
    await AsyncStorage.setItem(STORAGE_KEYS.ENGAGEMENT_DATA, JSON.stringify(engagementData));
    
    console.log('[SmartNotif] App open tracked, best hour:', bestHour);
  } catch (error) {
    console.error('[SmartNotif] Error tracking app open:', error);
  }
}

export async function trackNotificationClick() {
  try {
    const engagementData = await getEngagementData();
    engagementData.notificationClicks++;
    await AsyncStorage.setItem(STORAGE_KEYS.ENGAGEMENT_DATA, JSON.stringify(engagementData));
    console.log('[SmartNotif] Notification click tracked');
  } catch (error) {
    console.error('[SmartNotif] Error tracking notification click:', error);
  }
}

async function getEngagementData(): Promise<EngagementData> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ENGAGEMENT_DATA);
    return data ? JSON.parse(data) : {
      lastOpenTime: new Date().toISOString(),
      bestEngagementHour: 9,
      totalOpens: 0,
      notificationClicks: 0,
      streakBreaks: 0,
    };
  } catch (error) {
    console.error('[SmartNotif] Error loading engagement data:', error);
    return {
      lastOpenTime: new Date().toISOString(),
      bestEngagementHour: 9,
      totalOpens: 0,
      notificationClicks: 0,
      streakBreaks: 0,
    };
  }
}

export async function scheduleDailyNotifications(streak: number = 0) {
  const preferences = await getNotificationPreferences();
  const engagement = await getEngagementData();
  
  console.log('[SmartNotif] Scheduling daily notifications, streak:', streak, 'best hour:', engagement.bestEngagementHour);
  
  if (preferences.morningCheckIn) {
    await scheduleNotification(
      'MORNING_CHECK_IN',
      engagement.optimalTimes?.morning || engagement.bestEngagementHour || NOTIFICATION_TIMES.MORNING_CHECK_IN,
      { streak }
    );
  }
  
  if (preferences.productReminders) {
    await scheduleNotification(
      'PRODUCT_REMINDER',
      NOTIFICATION_TIMES.PRODUCT_REMINDER,
      { streak }
    );
  }
  
  if (preferences.eveningRoutine) {
    await scheduleNotification(
      'EVENING_ROUTINE',
      NOTIFICATION_TIMES.EVENING_ROUTINE,
      { streak }
    );
  }
  
  if (preferences.streakWarnings && streak > 0) {
    await scheduleNotification(
      'STREAK_WARNING',
      NOTIFICATION_TIMES.STREAK_WARNING,
      { streak }
    );
  }
}

async function scheduleNotification(
  type: keyof typeof NOTIFICATION_MESSAGES,
  hour: number,
  context: { streak: number }
) {
  const message = getRandomMessage(type);
  const body = message.body.replace('{streak}', context.streak.toString());
  
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, 0, 0, 0);
  
  if (scheduledTime.getTime() <= now.getTime()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const msUntilNotif = scheduledTime.getTime() - now.getTime();
  
  if (Platform.OS === 'web') {
    const timeoutKey = `smart_notif_${type}`;
    const existingTimeout = (globalThis as any)[timeoutKey];
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    (globalThis as any)[timeoutKey] = setTimeout(() => {
      if ('Notification' in globalThis && Notification.permission === 'granted') {
        new Notification(message.title, { 
          body,
          icon: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/53s334upy03qk49h5gire',
          badge: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/53s334upy03qk49h5gire',
        });
        console.log('[SmartNotif] Web notification shown:', type);
      }
    }, msUntilNotif);
    
    console.log(`[SmartNotif] Scheduled ${type} in ${Math.round(msUntilNotif / 1000 / 60)} minutes`);
  } else {
    console.log(`[SmartNotif] Would schedule ${type} for ${scheduledTime.toLocaleTimeString()}`);
  }
}

export async function cancelAllSmartNotifications() {
  if (Platform.OS === 'web') {
    const types = ['MORNING_CHECK_IN', 'PRODUCT_REMINDER', 'EVENING_ROUTINE', 'STREAK_WARNING'];
    types.forEach(type => {
      const timeoutKey = `smart_notif_${type}`;
      const existingTimeout = (globalThis as any)[timeoutKey];
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        delete (globalThis as any)[timeoutKey];
      }
    });
    console.log('[SmartNotif] All notifications cancelled');
  }
}

export async function sendImmediateNotification(title: string, body: string) {
  if (Platform.OS === 'web') {
    if ('Notification' in globalThis && Notification.permission === 'granted') {
      new Notification(title, { 
        body,
        icon: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/53s334upy03qk49h5gire',
      });
      console.log('[SmartNotif] Immediate notification sent');
    }
  } else {
    console.log('[SmartNotif] Would send immediate notification:', title, body);
  }
}
