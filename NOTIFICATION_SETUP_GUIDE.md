# Notification System Setup Guide

## 📱 How Notifications Work

Your Glow Check app has a comprehensive notification system that sends gentle reminders to help users build consistent skincare habits.

---

## 🎯 Notification Types

### 1. **Routine Reminders**
- **Morning Routine**: Daily reminder at 9:00 AM (customizable)
- **Evening Routine**: Daily reminder at 8:00 PM (customizable)
- Only sent if the routine hasn't been completed yet
- **Smart**: Automatically cancelled if user completes the routine

### 2. **Progress Tracking Reminders**
- Daily reminder at 2:00 PM (customizable) to track progress
- Encourages users to take photos and log journal entries
- Only sent if progress not tracked today

### 3. **Streak Warnings**
- Sent at 10:00 PM if user has a streak of 3+ days
- Helps prevent users from losing their progress
- **Example**: "Don't lose your 7-day streak! 🔥"

### 4. **Achievement Alerts**
- Immediate notifications when users unlock badges
- Always positive and celebratory
- **Example**: "🎉 Achievement Unlocked! You earned 'Consistency Champion'!"

### 5. **Weekly Insights**
- Every Sunday at 10:00 AM
- Notifies users when their weekly summary is ready
- **Example**: "📊 Weekly Insights Ready! See your transformation this week."

---

## ✅ Current Status

### ✅ **Already Configured:**
- ✅ Notification system implemented in `lib/notifications.ts`
- ✅ Android notification channel configured
- ✅ iOS permissions handled
- ✅ Web notifications supported
- ✅ Smart scheduling (doesn't spam users)
- ✅ Settings screen at `/notification-settings`
- ✅ Automatic initialization in `app/_layout.tsx`

### 📋 **What's Set Up:**

1. **App Configuration** (`app.json`):
   ```json
   {
     "plugins": [
       [
         "expo-notifications",
         {
           "color": "#ffffff",
           "defaultChannel": "default",
           "enableBackgroundRemoteNotifications": false
         }
       ]
     ]
   }
   ```

2. **Android Channel**: 
   - Channel ID: `glowcheck-reminders`
   - Name: "GlowCheck Reminders"
   - High importance, vibration, sound enabled

3. **Initialization**: Automatically runs on app startup

---

## 🚀 How to Use

### For Users

1. **Open Notification Settings**:
   - Go to Profile tab
   - Tap "Notification Settings" (or navigate to `/notification-settings`)

2. **Customize Preferences**:
   - Enable/disable notification types
   - Set custom times for reminders
   - Configure quiet hours

3. **Test Notifications**:
   - Tap "Send Test Notification" button
   - Verify notifications work on your device

### For Developers

#### Initialize Notifications
```typescript
import { initializeNotifications, startDailyNotifications } from '@/lib/notifications';

// Initialize (runs automatically in app/_layout.tsx)
await initializeNotifications();

// Start scheduling notifications
await startDailyNotifications({
  streak: 5,
  hasCompletedMorning: false,
  hasCompletedEvening: false,
});
```

#### Schedule Custom Notifications
```typescript
import { scheduleLocalNotificationAt } from '@/lib/notifications';

await scheduleLocalNotificationAt({
  at: new Date('2026-01-13T09:00:00'),
  title: '☀️ Good morning!',
  body: 'Start your day with your skincare routine',
  data: {
    kind: 'routine',
    routineType: 'morning',
    deepLink: '/(tabs)/glow-coach',
  },
});
```

#### Mark Routine Complete
```typescript
import { markRoutineDone } from '@/lib/notifications';

// When user completes morning routine
await markRoutineDone('morning');

// Automatically reschedules for tomorrow
```

#### Get/Update Preferences
```typescript
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/notifications';

// Get current preferences
const prefs = await getNotificationPreferences();

// Update preferences
await updateNotificationPreferences({
  morningTime: 8, // 8 AM instead of 9 AM
  enabled: true,
});
```

---

## 🔧 Setup Requirements

### iOS Setup

1. **App.json already configured** ✅
2. **Permissions**: Automatically requested on first use
3. **Production Build**: Works in production builds automatically

### Android Setup

1. **App.json already configured** ✅
2. **Notification Channel**: Created automatically
3. **Permissions**: Automatically requested on first use
4. **Production Build**: Works in production builds automatically

### Web Setup

1. **Browser Permissions**: Requested when app loads
2. **Fallback**: Uses `Notification` API
3. **No Additional Setup**: Works automatically

---

## 📱 Notification Flow

### User Journey

1. **First Launch**:
   - App requests notification permission
   - If granted, notifications are enabled by default
   - Settings screen allows customization

2. **Daily Schedule**:
   - Morning reminder at 9:00 AM (if morning routine not done)
   - Progress reminder at 2:00 PM (if progress not tracked)
   - Evening reminder at 8:00 PM (if evening routine not done)
   - Streak warning at 10:00 PM (if streak > 3 days)

3. **User Actions**:
   - Completes routine → notification for that routine is cancelled
   - Tracks progress → progress reminder cancelled
   - Next day → new notifications scheduled

4. **User Taps Notification**:
   - Opens app
   - Deep links to relevant screen (routine, progress, etc.)

---

## ⚙️ Configuration Options

### Default Settings

```typescript
{
  enabled: true,
  morningRoutine: true,      // Morning reminders
  eveningRoutine: true,      // Evening reminders
  progressReminders: true,   // Progress tracking reminders
  streakWarnings: true,      // Streak protection
  weeklyInsights: true,      // Weekly summaries
  achievementAlerts: true,   // Badge unlocks
  morningTime: 9,            // 9:00 AM
  eveningTime: 20,           // 8:00 PM
  progressTime: 14,          // 2:00 PM
  quietHoursStart: 22,       // 10:00 PM
  quietHoursEnd: 7,          // 7:00 AM
}
```

### Customization

Users can customize:
- ✅ Enable/disable each notification type
- ✅ Set custom times for reminders
- ✅ Configure quiet hours (no notifications during sleep)
- ✅ Turn off all notifications

---

## 🎨 Notification Messages

Each notification type has multiple message variations that rotate randomly:

### Morning Routine
- "☀️ Good morning, beautiful!"
- "✨ Rise & Glow!"
- "🌅 Morning Glow Time!"

### Evening Routine
- "🌙 Evening Routine Time!"
- "✨ Night Glow Reset!"
- "💫 Skincare O'Clock!"

### Progress Tracking
- "📸 Track Your Glow!"
- "📊 Your Progress Awaits!"
- "⚡ Quick Check-In!"

### Streak Warnings
- "🔥 Don't Lose Your Streak!"
- "⚠️ Streak Alert!"
- "💪 Your Streak Needs You!"

---

## 🔔 Testing Notifications

### Test in Development

1. **Open app in Expo Go or development build**
2. **Go to Profile → Notification Settings**
3. **Tap "Send Test Notification"**
4. **Verify notification appears**

### Test Scheduled Notifications

```typescript
import { testNotification } from '@/lib/notifications';

// Send immediate test notification
await testNotification();
```

### Test Production

1. **Build production app** (`eas build --platform ios`)
2. **Install on device**
3. **Grant notification permissions**
4. **Wait for scheduled notifications**

---

## 📊 Notification Status

### Check Notification Status

```typescript
import { getNotificationStatus } from '@/lib/notifications';

const status = await getNotificationStatus();
console.log(status);
// {
//   permissionGranted: true,
//   scheduledNotifications: 3,
//   morningScheduled: true,
//   eveningScheduled: true,
//   platform: 'ios'
// }
```

---

## 🛠️ Troubleshooting

### Notifications Not Working?

1. **Check Permissions**:
   - iOS: Settings → Glow Check → Notifications
   - Android: Settings → Apps → Glow Check → Notifications

2. **Check Device Settings**:
   - Do Not Disturb mode might block notifications
   - Battery optimization might restrict background notifications

3. **Check App Settings**:
   - Go to Notification Settings in app
   - Verify notifications are enabled
   - Check individual notification types are on

4. **Development vs Production**:
   - In Expo Go: Notifications work but may be limited
   - In Production Build: Full notification support

### Common Issues

**Issue**: Notifications not appearing in Expo Go
- **Solution**: This is normal. Full notifications work in production builds.

**Issue**: Notifications stopped working
- **Solution**: 
  1. Check device notification settings
  2. Restart app
  3. Re-grant permissions if needed

**Issue**: Too many notifications
- **Solution**: 
  1. Go to Notification Settings
  2. Disable notification types you don't want
  3. Adjust quiet hours

---

## 🚀 Production Checklist

Before launching:

- [x] ✅ Notification system implemented
- [x] ✅ Android channel configured
- [x] ✅ iOS permissions handled
- [x] ✅ Settings screen created
- [x] ✅ Smart scheduling active
- [ ] ⚠️ **Test on real device** (recommended before launch)
- [ ] ⚠️ **Test scheduled notifications** (verify timing)
- [ ] ⚠️ **Test deep linking** (verify notifications open correct screens)

---

## 📝 Summary

### ✅ **What's Already Working:**

1. **Notification System**: Fully implemented ✅
2. **Permissions**: Automatically requested ✅
3. **Scheduling**: Smart, non-spammy scheduling ✅
4. **Settings**: User can customize everything ✅
5. **Types**: All 5 notification types supported ✅
6. **Platforms**: iOS, Android, Web supported ✅

### 🎯 **Next Steps:**

1. **Test in Development**:
   - Open notification settings
   - Send test notification
   - Verify it works

2. **Test in Production** (after build):
   - Install on real device
   - Grant permissions
   - Wait for scheduled notifications
   - Verify deep linking works

3. **Monitor Usage**:
   - Check which notifications users engage with
   - Adjust timing if needed
   - Fine-tune messages based on feedback

---

## 🔗 Related Files

- `lib/notifications.ts` - Core notification system
- `lib/smart-notifications.ts` - Engagement-based notifications
- `lib/engagement-notifications.ts` - Advanced engagement tracking
- `app/notification-settings.tsx` - Settings UI
- `app/_layout.tsx` - Initialization
- `app.json` - Plugin configuration

---

**Status**: ✅ **Notifications are fully set up and ready to use!**

You just need to:
1. Test them in your app
2. Verify they work on real devices
3. Customize messages if needed

Everything else is already configured! 🎉

