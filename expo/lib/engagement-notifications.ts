import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleLocalNotificationAt, type GlowNotificationData } from '@/lib/notifications';

// Zomato-inspired smart notification system
// Focus: Value-driven, personalized, non-spammy, engaging

const STORAGE_KEYS = {
  NOTIFICATION_PREFERENCES: 'engagement_notif_preferences',
  NOTIFICATION_HISTORY: 'engagement_notif_history',
  USER_ACTIVITY: 'engagement_user_activity',
  LAST_NOTIFICATION_TIME: 'engagement_last_notif_time',
  DAILY_NOTIFICATION_COUNT: 'engagement_daily_count',
  USER_ENGAGEMENT_PATTERN: 'engagement_pattern',

  NOTIF_ID_MORNING: 'engagement_notif_id_morning',
  NOTIF_ID_PROGRESS: 'engagement_notif_id_progress',
  NOTIF_ID_EVENING: 'engagement_notif_id_evening',
  NOTIF_ID_STREAK: 'engagement_notif_id_streak',
  NOTIF_ID_WEEKLY: 'engagement_notif_id_weekly',
} as const;

// Anti-spam rules
const ANTI_SPAM_RULES = {
  maxDailyNotifications: 2,
  minHoursBetweenNotifications: 6,
  quietHoursStart: 22, // 10 PM
  quietHoursEnd: 8, // 8 AM
  maxRoutineReminders: 1,
  maxStreakWarnings: 1,
  activityCooldownHours: 2, // Don't notify if user active in last 2 hours
};

export interface NotificationPreferences {
  enabled: boolean;
  routineReminders: boolean;
  progressReminders: boolean;
  achievementNotifications: boolean;
  streakWarnings: boolean;
  weeklyInsights: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  frequency: 'low' | 'medium' | 'high'; // 1, 2, or 3 per day max
  customTimes?: {
    morning?: number;
    evening?: number;
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  routineReminders: true,
  progressReminders: true,
  achievementNotifications: true,
  streakWarnings: true,
  weeklyInsights: true,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  frequency: 'medium',
};

interface NotificationHistory {
  date: string;
  notifications: {
    type: string;
    time: string;
    sent: boolean;
  }[];
}

interface UserActivity {
  lastAppOpen: string;
  lastActionTime: string;
  bestEngagementHours: number[];
  totalOpens: number;
  averageSessionDuration: number;
}

// Zomato-style message templates - friendly, personalized, value-driven
const NOTIFICATION_MESSAGES = {
  MORNING_ROUTINE: [
    {
      title: "Good morning, beautiful! ☀️",
      body: "Start your day right with your morning glow routine. Your skin will thank you!",
      emoji: "✨",
    },
    {
      title: "Rise & glow! 🌅",
      body: "Your morning routine is waiting. Just 5 minutes for that perfect glow!",
      emoji: "💫",
    },
    {
      title: "Hey there, glow-getter! 👋",
      body: "Time to kickstart your day with your skincare routine. You've got this!",
      emoji: "🌟",
    },
  ],
  EVENING_ROUTINE: [
    {
      title: "Evening glow time! 🌙",
      body: "Wind down with your evening routine. Your skin deserves this self-care moment.",
      emoji: "✨",
    },
    {
      title: "Skincare o'clock! ⏰",
      body: "Your evening routine is calling. End your day on a glowing note!",
      emoji: "💫",
    },
    {
      title: "Time to unwind & glow 🌆",
      body: "Complete your evening routine and wake up to happier skin tomorrow!",
      emoji: "🌟",
    },
  ],
  PROGRESS_TRACKING: [
    {
      title: "Track your glow today! 📸",
      body: "Quick photo + journal entry = powerful insights. Takes just 2 minutes!",
      emoji: "📊",
    },
    {
      title: "Your progress is waiting 📈",
      body: "Capture today's glow and see how far you've come. Every day counts!",
      emoji: "✨",
    },
    {
      title: "Quick check-in time! ⚡",
      body: "Log your progress and unlock personalized insights. You're doing amazing!",
      emoji: "🎯",
    },
  ],
  STREAK_WARNING: [
    {
      title: "Don't let your streak slip! 🔥",
      body: "You're on a {streak}-day streak! Complete your routine to keep it going.",
      emoji: "⚡",
    },
    {
      title: "Your streak needs you! 💪",
      body: "{streak} days of consistency - don't break it now! Just a quick routine.",
      emoji: "🔥",
    },
    {
      title: "Last chance to save your streak! ⏰",
      body: "You've worked so hard for {streak} days. One more routine to keep it alive!",
      emoji: "🎯",
    },
  ],
  STREAK_MILESTONE: [
    {
      title: "🎉 {streak}-Day Streak Unlocked!",
      body: "You're a consistency champion! Keep this amazing streak going!",
      emoji: "🏆",
    },
    {
      title: "Incredible! {streak} Days Strong! 🔥",
      body: "Your dedication is showing. Your skin is thanking you every day!",
      emoji: "✨",
    },
    {
      title: "You're on fire! {streak} Days! 🔥",
      body: "This level of consistency is rare. You're building something amazing!",
      emoji: "🌟",
    },
  ],
  ACHIEVEMENT: [
    {
      title: "New Badge Unlocked! 🏆",
      body: "You earned '{badge}'! Your progress is inspiring. Keep going!",
      emoji: "🎉",
    },
    {
      title: "Achievement Unlocked! ✨",
      body: "Congratulations! You've unlocked '{badge}'. Your dedication pays off!",
      emoji: "🌟",
    },
  ],
  WEEKLY_INSIGHTS: [
    {
      title: "Your weekly insights are ready! 📊",
      body: "See how your skin transformed this week. New insights waiting for you!",
      emoji: "✨",
    },
    {
      title: "Weekly glow report is here! 📈",
      body: "Discover your progress, wins, and personalized recommendations inside!",
      emoji: "🎯",
    },
  ],
  PROGRESS_MILESTONE: [
    {
      title: "Amazing progress! 🎉",
      body: "Your skin improved {improvement}% this week! Keep up the great work!",
      emoji: "✨",
    },
    {
      title: "You're glowing! ✨",
      body: "{improvement}% improvement detected! Your routine is working perfectly!",
      emoji: "🌟",
    },
  ],
  RE_ENGAGEMENT: [
    {
      title: "We miss you! 💫",
      body: "Your glow journey is waiting. Come back and see your progress!",
      emoji: "✨",
    },
    {
      title: "Your routine misses you! 🌟",
      body: "It's been a while! Let's get back to your glowing self. You've got this!",
      emoji: "💪",
    },
  ],
};

function getRandomMessage(category: keyof typeof NOTIFICATION_MESSAGES): typeof NOTIFICATION_MESSAGES[keyof typeof NOTIFICATION_MESSAGES][0] {
  const messages = NOTIFICATION_MESSAGES[category];
  return messages[Math.floor(Math.random() * messages.length)];
}

function personalizeMessage(message: string, context: Record<string, string | number>): string {
  let personalized = message;
  Object.entries(context).forEach(([key, value]) => {
    personalized = personalized.replace(`{${key}}`, String(value));
  });
  return personalized;
}

// Get user preferences
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const prefs = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES);
    return prefs ? JSON.parse(prefs) : DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('[EngagementNotif] Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

// Update preferences
export async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
  try {
    const current = await getNotificationPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, JSON.stringify(updated));
    console.log('[EngagementNotif] Preferences updated');
  } catch (error) {
    console.error('[EngagementNotif] Error updating preferences:', error);
  }
}

// Track user activity
export async function trackUserActivity(action: 'app_open' | 'routine_complete' | 'photo_taken' | 'journal_entry'): Promise<void> {
  try {
    const now = new Date();
    const hour = now.getHours();
    
    const activity: UserActivity = await getUserActivity();
    activity.lastAppOpen = now.toISOString();
    activity.lastActionTime = now.toISOString();
    activity.totalOpens++;
    
    // Track best engagement hours
    if (!activity.bestEngagementHours.includes(hour)) {
      activity.bestEngagementHours.push(hour);
      // Keep only last 7 days of hours
      if (activity.bestEngagementHours.length > 14) {
        activity.bestEngagementHours = activity.bestEngagementHours.slice(-14);
      }
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.USER_ACTIVITY, JSON.stringify(activity));
  } catch (error) {
    console.error('[EngagementNotif] Error tracking activity:', error);
  }
}

async function getUserActivity(): Promise<UserActivity> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_ACTIVITY);
    return data ? JSON.parse(data) : {
      lastAppOpen: new Date().toISOString(),
      lastActionTime: new Date().toISOString(),
      bestEngagementHours: [],
      totalOpens: 0,
      averageSessionDuration: 0,
    };
  } catch {
    return {
      lastAppOpen: new Date().toISOString(),
      lastActionTime: new Date().toISOString(),
      bestEngagementHours: [],
      totalOpens: 0,
      averageSessionDuration: 0,
    };
  }
}

// Check if we should send notification (anti-spam logic)
async function shouldSendNotification(type: string): Promise<boolean> {
  const preferences = await getNotificationPreferences();
  
  // Check if notifications are enabled
  if (!preferences.enabled) {
    console.log('[EngagementNotif] Notifications disabled');
    return false;
  }
  
  // Check type-specific preferences
  if (type === 'MORNING_ROUTINE' || type === 'EVENING_ROUTINE') {
    if (!preferences.routineReminders) return false;
  }
  if (type === 'PROGRESS_TRACKING') {
    if (!preferences.progressReminders) return false;
  }
  if (type === 'STREAK_WARNING') {
    if (!preferences.streakWarnings) return false;
  }
  
  // Check quiet hours
  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour >= preferences.quietHoursStart || currentHour < preferences.quietHoursEnd) {
    console.log('[EngagementNotif] Quiet hours, skipping');
    return false;
  }
  
  // Check daily limit
  const dailyCount = await getDailyNotificationCount();
  const maxCount = preferences.frequency === 'low' ? 1 : preferences.frequency === 'medium' ? 2 : 3;
  if (dailyCount >= maxCount) {
    console.log('[EngagementNotif] Daily limit reached');
    return false;
  }
  
  // Check time since last notification
  const lastNotifTime = await getLastNotificationTime();
  if (lastNotifTime) {
    const hoursSince = (now.getTime() - new Date(lastNotifTime).getTime()) / (1000 * 60 * 60);
    if (hoursSince < ANTI_SPAM_RULES.minHoursBetweenNotifications) {
      console.log('[EngagementNotif] Too soon since last notification');
      return false;
    }
  }
  
  // Check if user is active (don't notify if they're using the app)
  const activity = await getUserActivity();
  const hoursSinceActivity = (now.getTime() - new Date(activity.lastAppOpen).getTime()) / (1000 * 60 * 60);
  if (hoursSinceActivity < ANTI_SPAM_RULES.activityCooldownHours) {
    console.log('[EngagementNotif] User is active, skipping');
    return false;
  }
  
  // Check if already sent this type today
  const history = await getNotificationHistory();
  const today = new Date().toISOString().split('T')[0];
  const todayHistory = history.find(h => h.date === today);
  if (todayHistory) {
    const alreadySent = todayHistory.notifications.some(n => n.type === type && n.sent);
    if (alreadySent && (type === 'MORNING_ROUTINE' || type === 'EVENING_ROUTINE' || type === 'STREAK_WARNING')) {
      console.log('[EngagementNotif] Already sent this type today');
      return false;
    }
  }
  
  return true;
}

async function getDailyNotificationCount(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const count = await AsyncStorage.getItem(`${STORAGE_KEYS.DAILY_NOTIFICATION_COUNT}_${today}`);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

async function incrementDailyCount(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const current = await getDailyNotificationCount();
    await AsyncStorage.setItem(`${STORAGE_KEYS.DAILY_NOTIFICATION_COUNT}_${today}`, String(current + 1));
  } catch (error) {
    console.error('[EngagementNotif] Error incrementing count:', error);
  }
}

async function getLastNotificationTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_NOTIFICATION_TIME);
  } catch {
    return null;
  }
}

async function setLastNotificationTime(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_NOTIFICATION_TIME, new Date().toISOString());
  } catch (error) {
    console.error('[EngagementNotif] Error setting last time:', error);
  }
}

async function getNotificationHistory(): Promise<NotificationHistory[]> {
  try {
    const history = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

async function recordNotification(type: string, sent: boolean): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const history = await getNotificationHistory();
    let todayHistory = history.find(h => h.date === today);
    
    if (!todayHistory) {
      todayHistory = { date: today, notifications: [] };
      history.push(todayHistory);
    }
    
    todayHistory.notifications.push({
      type,
      time: new Date().toISOString(),
      sent,
    });
    
    // Keep only last 30 days
    const recentHistory = history.slice(-30);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_HISTORY, JSON.stringify(recentHistory));
  } catch (error) {
    console.error('[EngagementNotif] Error recording notification:', error);
  }
}

// Get optimal notification time based on user behavior
async function getOptimalNotificationTime(type: 'morning' | 'evening' | 'progress'): Promise<number> {
  const preferences = await getNotificationPreferences();
  const activity = await getUserActivity();
  
  // Use custom time if set
  if (preferences.customTimes) {
    if (type === 'morning' && preferences.customTimes.morning) {
      return preferences.customTimes.morning;
    }
    if (type === 'evening' && preferences.customTimes.evening) {
      return preferences.customTimes.evening;
    }
  }
  
  // Use best engagement hour if available
  if (activity.bestEngagementHours.length > 0) {
    const bestHour = activity.bestEngagementHours[activity.bestEngagementHours.length - 1];
    if (type === 'morning' && bestHour >= 7 && bestHour <= 11) {
      return bestHour;
    }
    if (type === 'evening' && bestHour >= 18 && bestHour <= 21) {
      return bestHour;
    }
  }
  
  // Default times
  if (type === 'morning') return 9;
  if (type === 'evening') return 20;
  return 9; // progress tracking
}

// Send notification (Zomato-style)
async function sendNotification(
  type: keyof typeof NOTIFICATION_MESSAGES,
  context: Record<string, string | number> = {}
): Promise<boolean> {
  const canSend = await shouldSendNotification(type);
  if (!canSend) {
    await recordNotification(type, false);
    return false;
  }
  
  const message = getRandomMessage(type);
  const title = personalizeMessage(message.title, context);
  const body = personalizeMessage(message.body, context);
  
  if (Platform.OS === 'web') {
    if ('Notification' in globalThis && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zyxej2cms2wm7flx3yj7z',
          badge: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/zyxej2cms2wm7flx3yj7z',
        });
        console.log('[EngagementNotif] Notification sent:', type);
        await incrementDailyCount();
        await setLastNotificationTime();
        await recordNotification(type, true);
        return true;
      } catch (error) {
        console.error('[EngagementNotif] Error sending notification:', error);
        await recordNotification(type, false);
        return false;
      }
    }
  } else {
    // For mobile, log that we would send
    console.log('[EngagementNotif] Would send notification:', title, body);
    await incrementDailyCount();
    await setLastNotificationTime();
    await recordNotification(type, true);
    return true;
  }
  
  await recordNotification(type, false);
  return false;
}

// Schedule daily notifications
export async function scheduleDailyNotifications(context: {
  streak?: number;
  hasCompletedMorning?: boolean;
  hasCompletedEvening?: boolean;
  hasTrackedProgress?: boolean;
  lastActiveDays?: number;
}): Promise<void> {
  const preferences = await getNotificationPreferences();
  if (!preferences.enabled) return;
  
  console.log('[EngagementNotif] Scheduling daily notifications with context:', context);
  
  // Morning routine (only if not completed)
  if (preferences.routineReminders && !context.hasCompletedMorning) {
    const morningHour = await getOptimalNotificationTime('morning');
    await scheduleNotificationAt('MORNING_ROUTINE', morningHour, {});
  }
  
  // Progress tracking (only if not tracked today)
  if (preferences.progressReminders && !context.hasTrackedProgress) {
    const progressHour = await getOptimalNotificationTime('progress');
    await scheduleNotificationAt('PROGRESS_TRACKING', progressHour, {});
  }
  
  // Evening routine (only if morning was completed and evening not done)
  if (preferences.routineReminders && context.hasCompletedMorning && !context.hasCompletedEvening) {
    const eveningHour = await getOptimalNotificationTime('evening');
    await scheduleNotificationAt('EVENING_ROUTINE', eveningHour, {});
  }
  
  // Streak warning (only if streak > 3 and routine not completed)
  if (preferences.streakWarnings && context.streak && context.streak > 3 && !context.hasCompletedEvening) {
    await scheduleNotificationAt('STREAK_WARNING', 22, { streak: context.streak });
  }
}

// Schedule notification at specific hour
async function scheduleNotificationAt(
  type: keyof typeof NOTIFICATION_MESSAGES,
  hour: number,
  context: Record<string, string | number>
): Promise<void> {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hour, 0, 0, 0);
  
  if (scheduledTime.getTime() <= now.getTime()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const msUntilNotif = scheduledTime.getTime() - now.getTime();
  
  if (Platform.OS === 'web') {
    const timeoutKey = `engagement_notif_${type}`;
    const existingTimeout = (globalThis as any)[timeoutKey] as ReturnType<typeof setTimeout> | undefined;
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    (globalThis as any)[timeoutKey] = setTimeout(async () => {
      await sendNotification(type, context);
      delete (globalThis as any)[timeoutKey];
    }, Math.max(0, msUntilNotif));

    console.log(`[EngagementNotif] Scheduled ${type} for ${scheduledTime.toLocaleString()}`);
    return;
  }

  const idKey =
    type === 'MORNING_ROUTINE'
      ? STORAGE_KEYS.NOTIF_ID_MORNING
      : type === 'PROGRESS_TRACKING'
        ? STORAGE_KEYS.NOTIF_ID_PROGRESS
        : type === 'EVENING_ROUTINE'
          ? STORAGE_KEYS.NOTIF_ID_EVENING
          : type === 'STREAK_WARNING'
            ? STORAGE_KEYS.NOTIF_ID_STREAK
            : STORAGE_KEYS.NOTIF_ID_WEEKLY;

  const deepLink =
    type === 'PROGRESS_TRACKING'
      ? '/(tabs)/progress'
      : type === 'MORNING_ROUTINE' || type === 'EVENING_ROUTINE'
        ? '/glow-coach'
        : '/(tabs)';

  const message = getRandomMessage(type);
  const title = personalizeMessage(message.title, context);
  const body = personalizeMessage(message.body, context);

  const data: GlowNotificationData = {
    kind: type === 'WEEKLY_INSIGHTS' ? 'weekly' : 'engagement',
    campaign: `engagement_${type}`,
    deepLink,
    meta: {
      ...context,
      scheduledHour: hour,
    },
  };

  await scheduleLocalNotificationAt({
    idKey,
    at: scheduledTime,
    title,
    body,
    data,
  });

  console.log(`[EngagementNotif] Scheduled ${type} for ${scheduledTime.toLocaleString()}`);
}

// Send immediate notification (for achievements, milestones)
export async function sendImmediateNotification(
  type: keyof typeof NOTIFICATION_MESSAGES,
  context: Record<string, string | number> = {}
): Promise<boolean> {
  // Immediate notifications bypass some checks but still respect preferences
  const preferences = await getNotificationPreferences();
  if (!preferences.enabled) return false;
  
  if (type === 'ACHIEVEMENT' && !preferences.achievementNotifications) return false;
  if (type === 'WEEKLY_INSIGHTS' && !preferences.weeklyInsights) return false;
  
  return await sendNotification(type, context);
}

// Initialize notification system
export async function initializeEngagementNotifications(): Promise<boolean> {
  console.log('[EngagementNotif] Initializing engagement notification system...');
  
  if (Platform.OS === 'web') {
    if ('Notification' in globalThis) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('[EngagementNotif] Permission:', permission);
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  }
  
  console.log('[EngagementNotif] Mobile notifications ready (development build required)');
  return true;
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') {
    const types: (keyof typeof NOTIFICATION_MESSAGES)[] = [
      'MORNING_ROUTINE',
      'EVENING_ROUTINE',
      'PROGRESS_TRACKING',
      'STREAK_WARNING',
    ];

    types.forEach((type) => {
      const timeoutKey = `engagement_notif_${type}`;
      const existingTimeout = (globalThis as any)[timeoutKey] as ReturnType<typeof setTimeout> | undefined;
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        delete (globalThis as any)[timeoutKey];
      }
    });

    console.log('[EngagementNotif] All notifications cancelled');
    return;
  }

  await AsyncStorage.multiRemove([
    STORAGE_KEYS.NOTIF_ID_MORNING,
    STORAGE_KEYS.NOTIF_ID_PROGRESS,
    STORAGE_KEYS.NOTIF_ID_EVENING,
    STORAGE_KEYS.NOTIF_ID_STREAK,
    STORAGE_KEYS.NOTIF_ID_WEEKLY,
  ]);

  console.log('[EngagementNotif] Cleared scheduled notification ids');
}

// Get notification status
export async function getNotificationStatus() {
  const preferences = await getNotificationPreferences();
  const dailyCount = await getDailyNotificationCount();
  const history = await getNotificationHistory();
  const today = new Date().toISOString().split('T')[0];
  const todayHistory = history.find(h => h.date === today);
  
  return {
    enabled: preferences.enabled,
    dailyCount,
    maxDaily: preferences.frequency === 'low' ? 1 : preferences.frequency === 'medium' ? 2 : 3,
    todayNotifications: todayHistory?.notifications || [],
    preferences,
  };
}

