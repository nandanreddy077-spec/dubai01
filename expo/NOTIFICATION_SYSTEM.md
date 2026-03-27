# Smart Engagement Notification System

## Overview
A Zomato-inspired smart notification system designed to hook users without feeling like spam. The system is value-driven, personalized, and context-aware.

## Key Features

### 🎯 Anti-Spam Safeguards
- **Maximum 2-3 notifications per day** (based on user preference)
- **6-hour minimum gap** between notifications
- **Quiet hours** (10 PM - 8 AM by default, customizable)
- **Activity detection** - won't notify if user is active in last 2 hours
- **Context-aware** - won't send if action already completed
- **Frequency capping** - respects daily limits

### 📱 Notification Types

#### 1. Routine Reminders
- **Morning Routine** (9 AM default, adaptive)
- **Evening Routine** (8 PM default, adaptive)
- Only sent if routine not completed
- Smart timing based on user engagement patterns

#### 2. Progress Tracking
- **Combined reminder** for photo + journal (9 AM or user's best hour)
- Only sent if progress not tracked today
- Value-focused messaging

#### 3. Streak Protection
- **Streak warnings** (10:30 PM, only if streak > 3 days)
- **Streak milestones** (3, 7, 14, 30 days) - immediate celebration
- Only sent when streak is at risk

#### 4. Achievements
- **Badge unlocks** - immediate, always positive
- **Progress milestones** - when skin improves
- Never annoying, always celebratory

#### 5. Weekly Insights
- **Sunday 10 AM** - weekly summary
- Always valuable, no action required

### 🎨 Zomato-Style Messaging

#### Friendly & Personal
- "Good morning, beautiful! ☀️"
- "Hey there, glow-getter! 👋"
- "Rise & glow! 🌅"

#### Value-Driven
- "Track your glow today! 📸"
- "Your progress is waiting 📈"
- "Quick check-in time! ⚡"

#### Streak Psychology
- "Don't let your streak slip! 🔥"
- "Your streak needs you! 💪"
- "Last chance to save your streak! ⏰"

### 🧠 Smart Features

#### 1. Adaptive Timing
- Learns user's best engagement hours
- Sends notifications at optimal times
- Respects user's schedule

#### 2. Context Awareness
- Checks if action already completed
- Skips if user is currently active
- Adapts to user behavior

#### 3. Progressive Engagement
- **Tier 1 (Days 1-3)**: Gentle reminders
- **Tier 2 (Days 4-7)**: Moderate urgency
- **Tier 3 (Streak at risk)**: Urgent warnings

#### 4. Personalization
- Uses user's name (when available)
- Includes streak count
- Mentions achievements
- Adapts to user preferences

## Implementation

### Files
- `lib/engagement-notifications.ts` - Core notification engine
- Integrated with:
  - `app/_layout.tsx` - Initialization
  - `app/(tabs)/index.tsx` - Home screen scheduling
  - `app/(tabs)/glow-coach.tsx` - Routine completion tracking
  - `app/(tabs)/progress.tsx` - Photo/journal tracking
  - `contexts/GamificationContext.tsx` - Achievement notifications

### Usage

#### Initialize
```typescript
import { initializeEngagementNotifications } from '@/lib/engagement-notifications';

await initializeEngagementNotifications();
```

#### Schedule Daily Notifications
```typescript
import { scheduleDailyNotifications } from '@/lib/engagement-notifications';

await scheduleDailyNotifications({
  streak: currentStreak,
  hasCompletedMorning: false,
  hasCompletedEvening: false,
  hasTrackedProgress: false,
  lastActiveDays: 0,
});
```

#### Track User Activity
```typescript
import { trackUserActivity } from '@/lib/engagement-notifications';

await trackUserActivity('app_open');
await trackUserActivity('routine_complete');
await trackUserActivity('photo_taken');
await trackUserActivity('journal_entry');
```

#### Send Immediate Notifications
```typescript
import { sendImmediateNotification } from '@/lib/engagement-notifications';

// For achievements
await sendImmediateNotification('ACHIEVEMENT', { badge: 'Consistency Champion' });

// For streak milestones
await sendImmediateNotification('STREAK_MILESTONE', { streak: 7 });
```

#### Get/Update Preferences
```typescript
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/engagement-notifications';

const prefs = await getNotificationPreferences();
await updateNotificationPreferences({
  frequency: 'low', // 'low' | 'medium' | 'high'
  quietHoursStart: 22,
  quietHoursEnd: 8,
});
```

## Notification Schedule

### Daily (Max 2-3)
- **9:00 AM** - Progress tracking reminder (if not tracked)
- **8:00 PM** - Evening routine (if morning completed, evening not done)

### Weekly
- **Sunday 10:00 AM** - Weekly insights ready

### On-Demand
- **Streak warnings** - Only if streak > 3 and at risk (10:30 PM)
- **Achievements** - Immediate when earned
- **Milestones** - Immediate when reached

## User Preferences

Users can customize:
- Enable/disable notification types
- Set quiet hours
- Choose frequency (1, 2, or 3 per day max)
- Custom notification times
- Turn off completely

## Anti-Spam Rules

1. **Daily Limit**: 1-3 notifications max (based on preference)
2. **Time Gap**: Minimum 6 hours between notifications
3. **Quiet Hours**: No notifications 10 PM - 8 AM
4. **Activity Cooldown**: No notifications if user active in last 2 hours
5. **Context Check**: Won't send if action already completed
6. **Type Limits**: Max 1 reminder per routine type per day

## Message Variations

Each notification type has 3-5 message variations that rotate to avoid repetition and keep messages fresh.

## Tracking & Analytics

The system tracks:
- User engagement patterns
- Best notification times
- Notification open rates
- Action completion rates
- User preferences

## Future Enhancements

- A/B testing for message effectiveness
- Machine learning for optimal timing
- Push notification support (when available)
- Rich notifications with images
- Notification categories/channels

