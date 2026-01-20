# Weekly Summary - Insights & Recommendations Explained

## 📊 How Insights and Recommendations Work

### Overview

The Weekly Summary generates **insights** and **recommendations** based on your weekly data using **rule-based logic**. These are automatically calculated from your:
- Daily routine completions
- Journal entries (mood, sleep, water, stress)
- Progress photos
- Badges and achievements
- Points earned
- Trends (comparing to previous week)

---

## 🔍 Insights Generation

### What Are Insights?

**Insights** are **observations** about your week - they tell you what happened and highlight patterns.

### How They're Generated:

The `generateInsights()` function analyzes your weekly stats and creates insights based on specific thresholds:

#### 1. **Consistency Insights**
```typescript
if (stats.daysCompleted >= 7) {
  insights.push('🔥 Perfect consistency! You completed every day this week.');
} else if (stats.daysCompleted >= 5) {
  insights.push(`Great week! You completed ${stats.daysCompleted} out of 7 days.`);
}
```

**Logic:**
- 7 days completed → "Perfect consistency!"
- 5-6 days → "Great week!"
- Less than 5 → No insight (covered in recommendations)

#### 2. **Mood Insights**
```typescript
if (stats.averageMood >= 3.5) {
  insights.push('✨ Your mood has been consistently positive this week!');
}
```

**Logic:**
- Average mood ≥ 3.5 (out of 4) → Positive mood insight
- Mood scale: great=4, good=3, okay=2, bad=1

#### 3. **Sleep Insights**
```typescript
if (stats.averageSleep >= 7) {
  insights.push('😴 Excellent sleep habits! Your body is getting the rest it needs.');
} else if (stats.averageSleep < 6) {
  insights.push('💤 Try to aim for 7-8 hours of sleep for optimal skin health.');
}
```

**Logic:**
- Average sleep ≥ 7 hours → Positive insight
- Average sleep < 6 hours → Improvement insight

#### 4. **Water/Hydration Insights**
```typescript
if (stats.averageWater >= 8) {
  insights.push('💧 Great hydration! Keep drinking water for glowing skin.');
} else if (stats.averageWater < 6) {
  insights.push('💧 Increase water intake - aim for 8+ glasses daily for better skin.');
}
```

**Logic:**
- Average water ≥ 8 glasses → Positive insight
- Average water < 6 glasses → Improvement insight

#### 5. **Trend Insights**
```typescript
if (trends.moodTrend === 'improving') {
  insights.push('📈 Your mood is improving - keep up the great work!');
}

if (trends.consistencyTrend === 'improving') {
  insights.push('📊 You\'re becoming more consistent with your routine!');
}
```

**Logic:**
- Compares current week to previous week
- Detects improvements in mood, sleep, water, consistency
- Shows positive trends

#### 6. **Progress Insights**
```typescript
if (stats.glowScoreChange && stats.glowScoreChange > 5) {
  insights.push(`🎉 Amazing progress! Your glow score improved by ${Math.round(stats.glowScoreChange)} points.`);
}
```

**Logic:**
- Compares first and last photo of the week
- Calculates glow score change (hydration + texture + brightness + clear skin)
- If improvement > 5 points → Shows progress insight

#### 7. **Activity Insights**
```typescript
if (stats.pointsEarned >= 500) {
  insights.push(`🌟 Impressive! You earned ${stats.pointsEarned} points this week.`);
}

if (stats.photosTaken >= 3) {
  insights.push('📸 Great job tracking your progress with photos!');
}
```

**Logic:**
- Points earned ≥ 500 → Achievement insight
- Photos taken ≥ 3 → Tracking insight

### Example Insights Output:

Based on your week's data, you might see:
- "💤 Try to aim for 7-8 hours of sleep for optimal skin health."
- "💧 Increase water intake - aim for 8+ glasses daily for better skin."
- "📈 Your mood is improving - keep up the great work!"

---

## 🎯 Recommendations Generation

### What Are Recommendations?

**Recommendations** are **actionable advice** - they tell you what to do next week to improve.

### How They're Generated:

The `generateRecommendations()` function analyzes areas that need improvement:

#### 1. **Consistency Recommendations**
```typescript
if (stats.daysCompleted < 5) {
  recommendations.push('Aim to complete your routine 5-7 days this week for best results.');
}
```

**Logic:**
- If completed < 5 days → Recommends increasing consistency

#### 2. **Sleep Recommendations**
```typescript
if (stats.averageSleep < 7) {
  recommendations.push('Try to get 7-8 hours of sleep each night for optimal skin recovery.');
}
```

**Logic:**
- If average sleep < 7 hours → Recommends better sleep

#### 3. **Water Recommendations**
```typescript
if (stats.averageWater < 8) {
  recommendations.push('Increase your daily water intake to 8+ glasses for better hydration.');
}
```

**Logic:**
- If average water < 8 glasses → Recommends more hydration

#### 4. **Stress Recommendations**
```typescript
if (stats.averageStress > 3.5) {
  recommendations.push('Consider stress-reducing activities like meditation or light exercise.');
}
```

**Logic:**
- If average stress > 3.5 (out of 5) → Recommends stress reduction

#### 5. **Tracking Recommendations**
```typescript
if (stats.photosTaken < 2) {
  recommendations.push('Take at least 2 progress photos this week to track your transformation.');
}

if (stats.journalEntries < 5) {
  recommendations.push('Log your daily journal entries to identify patterns and insights.');
}
```

**Logic:**
- If photos < 2 → Recommends more photo tracking
- If journal entries < 5 → Recommends more journaling

#### 6. **Trend-Based Recommendations**
```typescript
if (trends.moodTrend === 'declining') {
  recommendations.push('Focus on self-care activities that boost your mood and wellbeing.');
}

if (trends.consistencyTrend === 'declining') {
  recommendations.push('Set a daily reminder to maintain your skincare routine consistency.');
}
```

**Logic:**
- If mood declining → Recommends mood-boosting activities
- If consistency declining → Recommends reminders

### Example Recommendations Output:

Based on your week's data, you might see:
- "Aim to complete your routine 5-7 days this week for best results."
- "Try to get 7-8 hours of sleep each night for optimal skin recovery."
- "Increase your daily water intake to 8+ glasses for better hydration."
- "Take at least 2 progress photos this week to track your transformation."
- "Log your daily journal entries to identify patterns and insights."

---

## 📈 Data Analysis Flow

### Step 1: Calculate Weekly Stats
```typescript
const stats = calculateWeeklyStats(
  date,
  photos,           // Progress photos
  journalEntries,   // Daily journal logs
  dailyCompletions, // Routine completion dates
  badges,           // Earned badges
  achievements,     // Unlocked achievements
  glowBoosts,       // Points earned
  currentStreak     // Current streak days
);
```

**What it calculates:**
- Days completed
- Photos taken
- Journal entries
- Points earned
- Average mood, sleep, water, stress
- Routine completion rate
- Glow score change

### Step 2: Calculate Trends
```typescript
const trends = calculateTrends(currentWeekStats, previousWeekStats);
```

**What it compares:**
- Current week vs previous week
- Mood trend: improving/stable/declining
- Sleep trend: improving/stable/declining
- Water trend: improving/stable/declining
- Consistency trend: improving/stable/declining

### Step 3: Generate Insights
```typescript
const insights = generateInsights(stats, trends);
```

**What it analyzes:**
- Positive achievements (high scores, good habits)
- Areas needing attention (low scores)
- Trends (improvements or declines)
- Activity levels (photos, journal entries)

### Step 4: Generate Recommendations
```typescript
const recommendations = generateRecommendations(stats, trends);
```

**What it analyzes:**
- Areas below optimal thresholds
- Declining trends
- Missing tracking data
- Opportunities for improvement

---

## 🎨 Display in UI

### Insights Section:
- **Icon**: Sparkles ✨
- **Style**: Cards with rounded corners
- **Content**: Observation statements
- **Example**: "💤 Try to aim for 7-8 hours of sleep for optimal skin health."

### Recommendations Section:
- **Icon**: Target 🎯
- **Style**: Cards with bullet points
- **Content**: Actionable advice
- **Example**: "• Try to get 7-8 hours of sleep each night for optimal skin recovery."

---

## 🔄 How It Updates

### Automatic Updates:
- Generated when weekly summary is opened
- Recalculated when data changes (new photos, journal entries, completions)
- Uses latest week's data (Monday to Sunday)

### Data Sources:
1. **Progress Photos** → Photos taken count, glow score changes
2. **Journal Entries** → Mood, sleep, water, stress averages
3. **Daily Completions** → Routine completion rate, consistency
4. **Badges/Achievements** → Achievements unlocked
5. **Glow Boosts** → Points earned
6. **Current Streak** → Consistency tracking

---

## 📊 Thresholds Reference

### Insights Thresholds:
- **Perfect Week**: 7 days completed
- **Great Week**: 5+ days completed
- **Good Mood**: Average mood ≥ 3.5
- **Good Sleep**: Average sleep ≥ 7 hours
- **Good Hydration**: Average water ≥ 8 glasses
- **High Points**: Points earned ≥ 500
- **Good Tracking**: Photos taken ≥ 3
- **Significant Progress**: Glow score change > 5 points

### Recommendations Thresholds:
- **Needs Consistency**: Days completed < 5
- **Needs Sleep**: Average sleep < 7 hours
- **Needs Water**: Average water < 8 glasses
- **High Stress**: Average stress > 3.5
- **Needs Photos**: Photos taken < 2
- **Needs Journaling**: Journal entries < 5

---

## ✅ Summary

### Insights:
- **Purpose**: Tell you what happened (observations)
- **Focus**: Positive achievements and areas to note
- **Tone**: Celebratory or informative
- **Example**: "💧 Great hydration! Keep drinking water for glowing skin."

### Recommendations:
- **Purpose**: Tell you what to do (actionable advice)
- **Focus**: Areas needing improvement
- **Tone**: Helpful and encouraging
- **Example**: "• Increase your daily water intake to 8+ glasses for better hydration."

### Key Points:
1. ✅ **Rule-based** - Uses specific thresholds and logic
2. ✅ **Data-driven** - Based on your actual weekly data
3. ✅ **Trend-aware** - Compares to previous week
4. ✅ **Personalized** - Specific to your habits and progress
5. ✅ **Actionable** - Recommendations are clear and achievable

---

**The system automatically analyzes your data and provides personalized insights and recommendations every week!** 🌟


