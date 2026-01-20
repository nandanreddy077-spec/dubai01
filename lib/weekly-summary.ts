import { ProgressPhoto } from '@/app/(tabs)/progress';
import { JournalEntry } from '@/app/(tabs)/progress';
import { Badge, Achievement } from '@/types/user';
import type { Product, ProductUsageEntry, ProductRoutine } from '@/types/product';

export interface WeeklyStats {
  weekNumber: number;
  startDate: string;
  endDate: string;
  daysCompleted: number;
  photosTaken: number;
  journalEntries: number;
  pointsEarned: number;
  achievementsUnlocked: number;
  badgesEarned: number;
  averageMood: number; // 1-4 scale
  averageSleep: number;
  averageWater: number;
  averageStress: number; // 1-5 scale
  routineCompletionRate: number; // 0-100
  streakDays: number;
  glowScoreChange?: number;
  topImprovements: string[];
  highlights: string[];
}

export interface WeeklySummary {
  stats: WeeklyStats;
  previousWeek?: WeeklyStats;
  trends: {
    moodTrend: 'improving' | 'stable' | 'declining';
    sleepTrend: 'improving' | 'stable' | 'declining';
    waterTrend: 'improving' | 'stable' | 'declining';
    consistencyTrend: 'improving' | 'stable' | 'declining';
  };
  insights: string[];
  recommendations: string[];
}

/**
 * Get the start of the week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get the end of the week (Sunday) for a given date
 */
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

/**
 * Get week number in the year
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Check if a date is within a week range
 */
function isDateInWeek(date: Date, weekStart: Date, weekEnd: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  const startStr = weekStart.toISOString().split('T')[0];
  const endStr = weekEnd.toISOString().split('T')[0];
  return dateStr >= startStr && dateStr <= endStr;
}

/**
 * Calculate weekly statistics from user data
 */
export function calculateWeeklyStats(
  weekStartDate: Date,
  photos: ProgressPhoto[],
  journalEntries: JournalEntry[],
  dailyCompletions: string[],
  badges: Badge[],
  achievements: Achievement[],
  glowBoosts: Array<{ points: number; timestamp: string }>,
  currentStreak: number,
  previousWeekStats?: WeeklyStats
): WeeklyStats {
  const weekStart = getWeekStart(weekStartDate);
  const weekEnd = getWeekEnd(weekStartDate);
  const weekNumber = getWeekNumber(weekStart);

  // Filter data for this week
  const weekPhotos = photos.filter(photo => {
    const photoDate = new Date(photo.timestamp);
    return isDateInWeek(photoDate, weekStart, weekEnd);
  });

  const weekJournalEntries = journalEntries.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return isDateInWeek(entryDate, weekStart, weekEnd);
  });

  const weekCompletions = dailyCompletions.filter(date => {
    const completionDate = new Date(date + 'T00:00:00');
    return isDateInWeek(completionDate, weekStart, weekEnd);
  });

  const weekBadges = badges.filter(badge => {
    if (!badge.unlockedAt) return false;
    const badgeDate = new Date(badge.unlockedAt);
    return isDateInWeek(badgeDate, weekStart, weekEnd);
  });

  const weekAchievements = achievements.filter(achievement => {
    if (!achievement.completed || !achievement.completedAt) return false;
    const achievementDate = new Date(achievement.completedAt);
    return isDateInWeek(achievementDate, weekStart, weekEnd);
  });

  // Calculate points earned this week
  const weekGlowBoosts = glowBoosts.filter(boost => {
    const boostDate = new Date(boost.timestamp);
    return isDateInWeek(boostDate, weekStart, weekEnd);
  });
  const pointsEarned = weekGlowBoosts.reduce((sum, boost) => sum + boost.points, 0);

  // Calculate averages from journal entries
  const moodMap: Record<string, number> = { great: 4, good: 3, okay: 2, bad: 1 };
  const moodValues = weekJournalEntries.map(e => moodMap[e.mood] || 0).filter(v => v > 0);
  const averageMood = moodValues.length > 0 
    ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length 
    : 0;

  const sleepValues = weekJournalEntries.map(e => e.sleepHours).filter(h => h > 0);
  const averageSleep = sleepValues.length > 0 
    ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length 
    : 0;

  const waterValues = weekJournalEntries.map(e => e.waterIntake).filter(w => w > 0);
  const averageWater = waterValues.length > 0 
    ? waterValues.reduce((a, b) => a + b, 0) / waterValues.length 
    : 0;

  const stressValues = weekJournalEntries.map(e => e.stressLevel).filter(s => s > 0);
  const averageStress = stressValues.length > 0 
    ? stressValues.reduce((a, b) => a + b, 0) / stressValues.length 
    : 0;

  // Calculate routine completion rate (completions / 7 days)
  const routineCompletionRate = (weekCompletions.length / 7) * 100;

  // Calculate glow score change if we have photo analysis data
  let glowScoreChange: number | undefined;
  if (weekPhotos.length >= 2 && weekPhotos[0].analysis && weekPhotos[weekPhotos.length - 1].analysis) {
    const firstPhoto = weekPhotos[weekPhotos.length - 1].analysis!;
    const lastPhoto = weekPhotos[0].analysis!;
    const firstAvg = (firstPhoto.hydration + firstPhoto.texture + firstPhoto.brightness + (100 - firstPhoto.acne)) / 4;
    const lastAvg = (lastPhoto.hydration + lastPhoto.texture + lastPhoto.brightness + (100 - lastPhoto.acne)) / 4;
    glowScoreChange = lastAvg - firstAvg;
  }

  // Extract top improvements from photo analyses
  const topImprovements: string[] = [];
  weekPhotos.forEach(photo => {
    if (photo.analysis?.improvements) {
      topImprovements.push(...photo.analysis.improvements);
    }
  });

  // Generate highlights
  const highlights: string[] = [];
  if (weekCompletions.length >= 7) {
    highlights.push('Perfect week! Completed all 7 days');
  }
  if (currentStreak >= 7) {
    highlights.push(`Maintained a ${currentStreak}-day streak!`);
  }
  if (pointsEarned >= 500) {
    highlights.push(`Earned ${pointsEarned} points this week`);
  }
  if (weekBadges.length > 0) {
    highlights.push(`Unlocked ${weekBadges.length} badge${weekBadges.length > 1 ? 's' : ''}`);
  }
  if (averageMood >= 3.5) {
    highlights.push('Great mood average this week!');
  }
  if (averageSleep >= 7) {
    highlights.push('Consistent good sleep');
  }

  return {
    weekNumber,
    startDate: weekStart.toISOString().split('T')[0],
    endDate: weekEnd.toISOString().split('T')[0],
    daysCompleted: weekCompletions.length,
    photosTaken: weekPhotos.length,
    journalEntries: weekJournalEntries.length,
    pointsEarned,
    achievementsUnlocked: weekAchievements.length,
    badgesEarned: weekBadges.length,
    averageMood,
    averageSleep,
    averageWater,
    averageStress,
    routineCompletionRate,
    streakDays: currentStreak,
    glowScoreChange,
    topImprovements: topImprovements.slice(0, 5),
    highlights,
  };
}

/**
 * Calculate trends by comparing current week to previous week
 */
export function calculateTrends(
  current: WeeklyStats,
  previous?: WeeklyStats
): WeeklySummary['trends'] {
  if (!previous) {
    return {
      moodTrend: 'stable',
      sleepTrend: 'stable',
      waterTrend: 'stable',
      consistencyTrend: 'stable',
    };
  }

  const moodDiff = current.averageMood - previous.averageMood;
  const sleepDiff = current.averageSleep - previous.averageSleep;
  const waterDiff = current.averageWater - previous.averageWater;
  const consistencyDiff = current.daysCompleted - previous.daysCompleted;

  return {
    moodTrend: moodDiff > 0.2 ? 'improving' : moodDiff < -0.2 ? 'declining' : 'stable',
    sleepTrend: sleepDiff > 0.5 ? 'improving' : sleepDiff < -0.5 ? 'declining' : 'stable',
    waterTrend: waterDiff > 1 ? 'improving' : waterDiff < -1 ? 'declining' : 'stable',
    consistencyTrend: consistencyDiff > 1 ? 'improving' : consistencyDiff < -1 ? 'declining' : 'stable',
  };
}

/**
 * Generate insights based on weekly stats
 */
export function generateInsights(stats: WeeklyStats, trends: WeeklySummary['trends']): string[] {
  const insights: string[] = [];

  if (stats.daysCompleted >= 7) {
    insights.push('🔥 Perfect consistency! You completed every day this week.');
  } else if (stats.daysCompleted >= 5) {
    insights.push(`Great week! You completed ${stats.daysCompleted} out of 7 days.`);
  }

  if (stats.averageMood >= 3.5) {
    insights.push('✨ Your mood has been consistently positive this week!');
  }

  if (stats.averageSleep >= 7) {
    insights.push('😴 Excellent sleep habits! Your body is getting the rest it needs.');
  } else if (stats.averageSleep < 6) {
    insights.push('💤 Try to aim for 7-8 hours of sleep for optimal skin health.');
  }

  if (stats.averageWater >= 8) {
    insights.push('💧 Great hydration! Keep drinking water for glowing skin.');
  } else if (stats.averageWater < 6) {
    insights.push('💧 Increase water intake - aim for 8+ glasses daily for better skin.');
  }

  if (trends.moodTrend === 'improving') {
    insights.push('📈 Your mood is improving - keep up the great work!');
  }

  if (trends.consistencyTrend === 'improving') {
    insights.push('📊 You\'re becoming more consistent with your routine!');
  }

  if (stats.glowScoreChange && stats.glowScoreChange > 5) {
    insights.push(`🎉 Amazing progress! Your glow score improved by ${Math.round(stats.glowScoreChange)} points.`);
  }

  if (stats.pointsEarned >= 500) {
    insights.push(`🌟 Impressive! You earned ${stats.pointsEarned} points this week.`);
  }

  if (stats.photosTaken >= 3) {
    insights.push('📸 Great job tracking your progress with photos!');
  }

  return insights.length > 0 ? insights : ['Keep up the great work on your glow journey! 🌟'];
}

/**
 * Generate recommendations based on weekly stats
 */
export function generateRecommendations(stats: WeeklyStats, trends: WeeklySummary['trends']): string[] {
  const recommendations: string[] = [];

  if (stats.daysCompleted < 5) {
    recommendations.push('Aim to complete your routine 5-7 days this week for best results.');
  }

  if (stats.averageSleep < 7) {
    recommendations.push('Try to get 7-8 hours of sleep each night for optimal skin recovery.');
  }

  if (stats.averageWater < 8) {
    recommendations.push('Increase your daily water intake to 8+ glasses for better hydration.');
  }

  if (stats.averageStress > 3.5) {
    recommendations.push('Consider stress-reducing activities like meditation or light exercise.');
  }

  if (stats.photosTaken < 2) {
    recommendations.push('Take at least 2 progress photos this week to track your transformation.');
  }

  if (stats.journalEntries < 5) {
    recommendations.push('Log your daily journal entries to identify patterns and insights.');
  }

  if (trends.moodTrend === 'declining') {
    recommendations.push('Focus on self-care activities that boost your mood and wellbeing.');
  }

  if (trends.consistencyTrend === 'declining') {
    recommendations.push('Set a daily reminder to maintain your skincare routine consistency.');
  }

  return recommendations.length > 0 
    ? recommendations 
    : ['Keep maintaining your excellent routine! 🎉'];
}

/**
 * Generate a complete weekly summary (synchronous - rule-based)
 */
export function generateWeeklySummary(
  date: Date,
  photos: ProgressPhoto[],
  journalEntries: JournalEntry[],
  dailyCompletions: string[],
  badges: Badge[],
  achievements: Achievement[],
  glowBoosts: Array<{ points: number; timestamp: string }>,
  currentStreak: number,
  previousWeekStats?: WeeklyStats
): WeeklySummary {
  const currentWeekStats = calculateWeeklyStats(
    date,
    photos,
    journalEntries,
    dailyCompletions,
    badges,
    achievements,
    glowBoosts,
    currentStreak,
    previousWeekStats
  );

  // Calculate previous week stats if not provided
  let previousWeek: WeeklyStats | undefined = previousWeekStats;
  if (!previousWeek) {
    const previousWeekStart = new Date(date);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    previousWeek = calculateWeeklyStats(
      previousWeekStart,
      photos,
      journalEntries,
      dailyCompletions,
      badges,
      achievements,
      glowBoosts,
      0 // Previous week streak not relevant
    );
  }

  const trends = calculateTrends(currentWeekStats, previousWeek);
  const insights = generateInsights(currentWeekStats, trends);
  const recommendations = generateRecommendations(currentWeekStats, trends);

  return {
    stats: currentWeekStats,
    previousWeek,
    trends,
    insights,
    recommendations,
  };
}

/**
 * Generate a complete weekly summary with AI-powered insights (async)
 * Falls back to rule-based if AI is unavailable
 */
export async function generateWeeklySummaryWithAI(
  date: Date,
  photos: ProgressPhoto[],
  journalEntries: JournalEntry[],
  dailyCompletions: string[],
  badges: Badge[],
  achievements: Achievement[],
  glowBoosts: Array<{ points: number; timestamp: string }>,
  currentStreak: number,
  previousWeekStats?: WeeklyStats,
  products?: Product[],
  usageHistory?: ProductUsageEntry[],
  routines?: ProductRoutine[]
): Promise<WeeklySummary> {
  // First, generate base stats (always needed)
  const currentWeekStats = calculateWeeklyStats(
    date,
    photos,
    journalEntries,
    dailyCompletions,
    badges,
    achievements,
    glowBoosts,
    currentStreak,
    previousWeekStats
  );

  // Calculate previous week stats if not provided
  let previousWeek: WeeklyStats | undefined = previousWeekStats;
  if (!previousWeek) {
    const previousWeekStart = new Date(date);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    previousWeek = calculateWeeklyStats(
      previousWeekStart,
      photos,
      journalEntries,
      dailyCompletions,
      badges,
      achievements,
      glowBoosts,
      0
    );
  }

  const trends = calculateTrends(currentWeekStats, previousWeek);

  // Try to generate AI-powered insights
  try {
    // Import AI insights engine
    const { collectInsightData, generateAIInsights } = await import('@/lib/insights-engine');
    
    // Prepare data for AI insights (use weekly data)
    const weekStart = getWeekStart(date);
    const weekEnd = getWeekEnd(date);
    const weekStartTime = weekStart.getTime();
    const weekEndTime = weekEnd.getTime();

    // Filter data for this week only
    const weekPhotos = photos.filter(photo => {
      const photoTime = photo.timestamp;
      return photoTime >= weekStartTime && photoTime <= weekEndTime;
    });

    const weekJournalEntries = journalEntries.filter(entry => {
      const entryTime = entry.timestamp;
      return entryTime >= weekStartTime && entryTime <= weekEndTime;
    });

    const weekUsageHistory = (usageHistory || []).filter(usage => {
      const usageTime = new Date(usage.timestamp).getTime();
      return usageTime >= weekStartTime && usageTime <= weekEndTime;
    });

    // Collect insight data for this week
    const insightData = await collectInsightData(
      weekPhotos,
      weekJournalEntries,
      products || [],
      weekUsageHistory,
      routines || []
    );

    // Generate AI insights
    const aiResult = await generateAIInsights(insightData);

    // Map AI insights to weekly summary format
    // Combine AI insights with weekly-specific context
    const aiInsights: string[] = [];
    const aiRecommendations: string[] = [];

    // Add AI-generated insights
    if (aiResult.insights && aiResult.insights.length > 0) {
      aiInsights.push(...aiResult.insights);
    }

    // Add AI-generated recommendations
    if (aiResult.recommendations && aiResult.recommendations.length > 0) {
      aiRecommendations.push(...aiResult.recommendations);
    }

    // Add wins as insights if available
    if (aiResult.wins && aiResult.wins.length > 0) {
      aiInsights.push(...aiResult.wins.map(win => `🎉 ${win}`));
    }

    // If we got AI insights, use them (but keep some rule-based ones for completeness)
    if (aiInsights.length > 0 || aiRecommendations.length > 0) {
      // Merge with rule-based for comprehensive coverage
      const ruleBasedInsights = generateInsights(currentWeekStats, trends);
      const ruleBasedRecommendations = generateRecommendations(currentWeekStats, trends);

      // Combine: AI insights first (more personalized), then rule-based (for completeness)
      const combinedInsights = [
        ...aiInsights,
        ...ruleBasedInsights.filter(insight => 
          !aiInsights.some(ai => ai.toLowerCase().includes(insight.toLowerCase().substring(0, 20)))
        )
      ].slice(0, 5); // Limit to 5 insights

      const combinedRecommendations = [
        ...aiRecommendations,
        ...ruleBasedRecommendations.filter(rec => 
          !aiRecommendations.some(ai => ai.toLowerCase().includes(rec.toLowerCase().substring(0, 20)))
        )
      ].slice(0, 5); // Limit to 5 recommendations

      return {
        stats: currentWeekStats,
        previousWeek,
        trends,
        insights: combinedInsights.length > 0 ? combinedInsights : ruleBasedInsights,
        recommendations: combinedRecommendations.length > 0 ? combinedRecommendations : ruleBasedRecommendations,
      };
    }
  } catch (error) {
    console.log('AI insights generation failed, using rule-based fallback:', error);
  }

  // Fallback to rule-based if AI fails or no data
  const insights = generateInsights(currentWeekStats, trends);
  const recommendations = generateRecommendations(currentWeekStats, trends);

  return {
    stats: currentWeekStats,
    previousWeek,
    trends,
    insights,
    recommendations,
  };
}

