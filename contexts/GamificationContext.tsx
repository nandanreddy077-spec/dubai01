import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Badge, Achievement, GlowBoost } from '@/types/user';
import { useUser } from './UserContext';


interface DailyReward {
  id: string;
  type: 'points' | 'badge' | 'streak_bonus' | 'level_up';
  title: string;
  description: string;
  value: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface CompletionEntry {
  date: string;
  planId?: string;
  day?: number;
}

interface GamificationContextType {
  badges: Badge[];
  achievements: Achievement[];
  glowBoosts: GlowBoost[];
  unreadGlowBoosts: GlowBoost[];
  dailyCompletions: string[];
  addGlowBoost: (boost: Omit<GlowBoost, 'id' | 'timestamp' | 'seen'>) => Promise<void>;
  markGlowBoostSeen: (boostId: string) => Promise<void>;
  markAllGlowBoostsSeen: () => Promise<void>;
  checkAndAwardBadges: (analysisScore?: number) => Promise<Badge[]>;
  updateAchievementProgress: (category: string, increment?: number) => Promise<Achievement[]>;
  calculateLevel: (points: number) => number;
  getPointsForNextLevel: (currentLevel: number) => number;
  getLevelProgress: (points: number, level: number) => { current: number; total: number; percentage: number };
  completeDailyRoutine: (planId?: string, day?: number) => Promise<DailyReward[]>;
  hasCompletedToday: () => boolean;
  hasCompletedForPlanDay: (planId: string, day: number) => boolean;
  setupNotifications: () => Promise<void>;
  scheduleRoutineReminders: () => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
}

const STORAGE_KEYS = {
  BADGES: 'gamification_badges',
  ACHIEVEMENTS: 'gamification_achievements',
  GLOW_BOOSTS: 'gamification_glow_boosts',
  DAILY_COMPLETIONS: 'gamification_daily_completions',
  COMPLETION_LOG_V2: 'gamification_completion_log_v2',
  NOTIFICATION_PERMISSIONS: 'notification_permissions',
};

// Notifications are handled by the simplified notification system

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_analysis',
    name: 'First Glow',
    description: 'Complete your first analysis',
    progress: 0,
    target: 1,
    completed: false,
    points: 50,
    category: 'milestone',
  },
  {
    id: 'first_day_complete',
    name: 'Routine Starter',
    description: 'Complete your first daily routine',
    progress: 0,
    target: 1,
    completed: false,
    points: 100,
    category: 'daily',
  },
  {
    id: 'streak_3',
    name: 'Consistency Champion',
    description: 'Complete routines for 3 days in a row',
    progress: 0,
    target: 3,
    completed: false,
    points: 200,
    category: 'daily',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Complete routines for 7 days in a row',
    progress: 0,
    target: 7,
    completed: false,
    points: 500,
    category: 'weekly',
  },
  {
    id: 'streak_30',
    name: 'Glow Legend',
    description: 'Complete routines for 30 days in a row',
    progress: 0,
    target: 30,
    completed: false,
    points: 2000,
    category: 'legendary',
  },
  {
    id: 'analyses_10',
    name: 'Analysis Expert',
    description: 'Complete 10 analyses',
    progress: 0,
    target: 10,
    completed: false,
    points: 200,
    category: 'milestone',
  },
  {
    id: 'improvement_5',
    name: 'Glow Up Master',
    description: 'Improve your score 5 times in a row',
    progress: 0,
    target: 5,
    completed: false,
    points: 300,
    category: 'special',
  },
];

const BADGE_DEFINITIONS = {
  first_analysis: {
    name: 'First Steps',
    description: 'Completed your first analysis',
    icon: '🌟',
    rarity: 'common' as const,
    category: 'analysis' as const,
  },
  first_routine: {
    name: 'Routine Rookie',
    description: 'Completed your first daily routine',
    icon: '✨',
    rarity: 'common' as const,
    category: 'routine' as const,
  },
  streak_master: {
    name: 'Streak Master',
    description: 'Maintained a 7+ day routine streak',
    icon: '🔥',
    rarity: 'rare' as const,
    category: 'streak' as const,
  },
  streak_legend: {
    name: 'Glow Legend',
    description: 'Maintained a 30+ day routine streak',
    icon: '👑',
    rarity: 'legendary' as const,
    category: 'streak' as const,
  },
  glow_perfectionist: {
    name: 'Perfectionist',
    description: 'Achieved a perfect glow score',
    icon: '💎',
    rarity: 'epic' as const,
    category: 'improvement' as const,
  },
  comeback_queen: {
    name: 'Comeback Queen',
    description: 'Returned after a break and improved',
    icon: '🌈',
    rarity: 'legendary' as const,
    category: 'special' as const,
  },
  analysis_addict: {
    name: 'Analysis Addict',
    description: 'Completed 25+ analyses',
    icon: '🎯',
    rarity: 'rare' as const,
    category: 'analysis' as const,
  },
  weekend_warrior: {
    name: 'Weekend Warrior',
    description: 'Completed routines on weekends',
    icon: '🏆',
    rarity: 'rare' as const,
    category: 'special' as const,
  },
};

export const [GamificationProvider, useGamification] = createContextHook(() => {
  const { user, setUser } = useUser();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [glowBoosts, setGlowBoosts] = useState<GlowBoost[]>([]);
  const [dailyCompletions, setDailyCompletions] = useState<string[]>([]);
  const [completionLog, setCompletionLog] = useState<CompletionEntry[]>([]);

  const setupNotifications = useCallback(async () => {
    console.log('Notifications handled by simplified system');
    // No longer using expo-notifications in Expo Go SDK 53
  }, []);

  const scheduleRoutineReminders = useCallback(async () => {
    console.log('Routine reminders handled by simplified notification system');
    // No longer using expo-notifications in Expo Go SDK 53
  }, []);

  const cleanupStorageCallback = useCallback(async () => {
    try {
      console.log('🧹 Starting storage cleanup...');
      
      // Clean up old analysis history that might be causing quota issues
      const analysisHistoryKey = 'glowcheck_analysis_history';
      const analysisHistory = await AsyncStorage.getItem(analysisHistoryKey);
      if (analysisHistory) {
        try {
          const history = JSON.parse(analysisHistory);
          if (Array.isArray(history) && history.length > 5) {
            // Keep only last 5 analyses
            const limitedHistory = history.slice(-5);
            await AsyncStorage.setItem(analysisHistoryKey, JSON.stringify(limitedHistory));
            console.log('✂️ Trimmed analysis history to', limitedHistory.length, 'entries');
          }
        } catch {
          console.log('🗑️ Removing corrupted analysis history');
          await AsyncStorage.removeItem(analysisHistoryKey);
        }
      }
      
      // Clean up old glow boosts
      const currentBoosts = glowBoosts.slice(0, 5); // Keep only 5 most recent
      if (currentBoosts.length !== glowBoosts.length) {
        setGlowBoosts(currentBoosts);
        await saveGlowBoosts(currentBoosts);
        console.log('✂️ Trimmed glow boosts to', currentBoosts.length, 'entries');
      }
      
      console.log('✅ Storage cleanup completed');
    } catch (error) {
      console.error('❌ Storage cleanup failed:', error);
    }
  }, [glowBoosts]);

  useEffect(() => {
    loadGamificationData();
    setupNotifications();
    // Run cleanup on app start
    cleanupStorageCallback();
  }, [setupNotifications, cleanupStorageCallback]);

  useEffect(() => {
    // Schedule notifications when daily completions change
    scheduleRoutineReminders();
  }, [scheduleRoutineReminders]);

  const loadGamificationData = async () => {
    try {
      const [badgesData, achievementsData, glowBoostsData, dailyCompletionsData, completionLogV2] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BADGES),
        AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.GLOW_BOOSTS),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_COMPLETIONS),
        AsyncStorage.getItem(STORAGE_KEYS.COMPLETION_LOG_V2),
      ]);

      // Parse with error handling
      if (badgesData) {
        try {
          const parsed = JSON.parse(badgesData);
          setBadges(Array.isArray(parsed) ? parsed : []);
        } catch (parseError) {
          console.error('Error parsing badges data:', parseError);
          setBadges([]);
        }
      }
      
      if (achievementsData) {
        try {
          const parsed = JSON.parse(achievementsData);
          setAchievements(Array.isArray(parsed) ? parsed : []);
        } catch (parseError) {
          console.error('Error parsing achievements data:', parseError);
          setAchievements([]);
        }
      }
      
      if (glowBoostsData) {
        try {
          const parsed = JSON.parse(glowBoostsData);
          setGlowBoosts(Array.isArray(parsed) ? parsed : []);
        } catch (parseError) {
          console.error('Error parsing glow boosts data:', parseError);
          setGlowBoosts([]);
        }
      }
      
      if (dailyCompletionsData) {
        try {
          const parsed = JSON.parse(dailyCompletionsData);
          setDailyCompletions(Array.isArray(parsed) ? parsed : []);
        } catch (parseError) {
          console.error('Error parsing daily completions data:', parseError);
          setDailyCompletions([]);
        }
      }
      
      if (completionLogV2) {
        try {
          const parsed = JSON.parse(completionLogV2);
          setCompletionLog(Array.isArray(parsed) ? parsed : []);
        } catch (parseError) {
          console.error('Error parsing completion log data:', parseError);
          setCompletionLog([]);
        }
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  };

  const saveBadges = async (newBadges: Badge[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(newBadges));
    } catch (error) {
      console.error('Error saving badges:', error);
    }
  };

  const saveAchievements = async (newAchievements: Achievement[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(newAchievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  };

  const saveGlowBoosts = async (newGlowBoosts: GlowBoost[]) => {
    try {
      // Limit glow boosts to prevent storage overflow - keep only essential data
      const limitedBoosts = newGlowBoosts.slice(0, 10).map(boost => ({
        id: boost.id,
        type: boost.type,
        title: boost.title,
        message: boost.message.length > 50 ? boost.message.substring(0, 50) + '...' : boost.message,
        points: boost.points,
        timestamp: boost.timestamp,
        seen: boost.seen
      }));
      await AsyncStorage.setItem(STORAGE_KEYS.GLOW_BOOSTS, JSON.stringify(limitedBoosts));
    } catch (error) {
      console.error('Error saving glow boosts:', error);
      // Try with minimal data if storage fails
      try {
        const minimalBoosts = newGlowBoosts.slice(0, 3).map(boost => ({
          id: boost.id,
          type: boost.type,
          title: boost.title.substring(0, 20),
          message: boost.message.substring(0, 30),
          points: boost.points,
          timestamp: boost.timestamp,
          seen: boost.seen
        }));
        await AsyncStorage.setItem(STORAGE_KEYS.GLOW_BOOSTS, JSON.stringify(minimalBoosts));
      } catch (retryError) {
        console.error('Error saving minimal glow boosts:', retryError);
        // Clear storage if all else fails
        await AsyncStorage.removeItem(STORAGE_KEYS.GLOW_BOOSTS);
      }
    }
  };

  const saveDailyCompletions = async (completions: string[]) => {
    try {
      const limitedCompletions = completions.slice(-30);
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_COMPLETIONS, JSON.stringify(limitedCompletions));
      console.log('💾 Daily completions saved successfully:', limitedCompletions.length, 'entries');
    } catch (error) {
      console.error('❌ Error saving daily completions:', error);
      try {
        const minimalCompletions = completions.slice(-7);
        await AsyncStorage.setItem(STORAGE_KEYS.DAILY_COMPLETIONS, JSON.stringify(minimalCompletions));
        console.log('💾 Minimal daily completions saved:', minimalCompletions.length, 'entries');
      } catch (retryError) {
        console.error('❌ Error saving minimal daily completions:', retryError);
        await AsyncStorage.removeItem(STORAGE_KEYS.DAILY_COMPLETIONS);
        console.log('🗑️ Cleared daily completions storage due to errors');
      }
    }
  };

  const saveCompletionLog = async (entries: CompletionEntry[]) => {
    try {
      const limited = entries.slice(-60);
      setCompletionLog(limited);
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLETION_LOG_V2, JSON.stringify(limited));
    } catch (error) {
      console.error('❌ Error saving completion log:', error);
    }
  };



  const calculateLevel = useCallback((points: number): number => {
    return Math.floor(points / 500) + 1;
  }, []);

  const getPointsForNextLevel = useCallback((currentLevel: number): number => {
    return currentLevel * 500;
  }, []);

  const getLevelProgress = useCallback((points: number, level: number) => {
    const currentLevelPoints = (level - 1) * 500;
    const nextLevelPoints = level * 500;
    const current = points - currentLevelPoints;
    const total = nextLevelPoints - currentLevelPoints;
    const percentage = (current / total) * 100;
    
    return { current, total, percentage };
  }, []);

  const addGlowBoost = useCallback(async (boost: Omit<GlowBoost, 'id' | 'timestamp' | 'seen'>) => {
    const newBoost: GlowBoost = {
      ...boost,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      seen: false,
    };

    const updatedBoosts = [newBoost, ...glowBoosts].slice(0, 10); // Keep only last 10
    setGlowBoosts(updatedBoosts);
    await saveGlowBoosts(updatedBoosts);

    // Update user points
    if (user) {
      const updatedUser = {
        ...user,
        stats: {
          ...user.stats,
          totalPoints: user.stats.totalPoints + boost.points,
          level: calculateLevel(user.stats.totalPoints + boost.points),
        },
      };
      setUser(updatedUser);
    }
  }, [glowBoosts, user, setUser, calculateLevel]);

  const markGlowBoostSeen = useCallback(async (boostId: string) => {
    const updatedBoosts = glowBoosts.map(boost => 
      boost.id === boostId ? { ...boost, seen: true } : boost
    );
    setGlowBoosts(updatedBoosts);
    await saveGlowBoosts(updatedBoosts);
  }, [glowBoosts]);

  const markAllGlowBoostsSeen = useCallback(async () => {
    const updatedBoosts = glowBoosts.map(boost => ({ ...boost, seen: true }));
    setGlowBoosts(updatedBoosts);
    await saveGlowBoosts(updatedBoosts);
  }, [glowBoosts]);

  const getCurrentStreak = useCallback(() => {
    if (dailyCompletions.length === 0) return 0;
    
    const today = new Date();
    const sortedCompletions = [...dailyCompletions].sort().reverse();
    let streak = 0;
    
    for (let i = 0; i < sortedCompletions.length; i++) {
      const completionDate = new Date(sortedCompletions[i]);
      const daysDiff = Math.floor((today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, [dailyCompletions]);

  const checkAndAwardBadges = useCallback(async (analysisScore?: number, routineCompleted?: boolean): Promise<Badge[]> => {
    if (!user) return [];

    const newBadges: Badge[] = [];
    const existingBadgeIds = badges.map(b => b.id);
    const currentStreak = getCurrentStreak();

    // Check for first analysis badge
    if (user.stats.analyses >= 1 && !existingBadgeIds.includes('first_analysis')) {
      const badgeData = BADGE_DEFINITIONS.first_analysis;
      newBadges.push({
        id: 'first_analysis',
        ...badgeData,
        unlockedAt: new Date().toISOString(),
      });
    }

    // Check for first routine badge
    if (routineCompleted && dailyCompletions.length >= 1 && !existingBadgeIds.includes('first_routine')) {
      const badgeData = BADGE_DEFINITIONS.first_routine;
      newBadges.push({
        id: 'first_routine',
        ...badgeData,
        unlockedAt: new Date().toISOString(),
      });
    }

    // Check for streak master badge
    if (currentStreak >= 7 && !existingBadgeIds.includes('streak_master')) {
      const badgeData = BADGE_DEFINITIONS.streak_master;
      newBadges.push({
        id: 'streak_master',
        ...badgeData,
        unlockedAt: new Date().toISOString(),
      });
    }

    // Check for streak legend badge
    if (currentStreak >= 30 && !existingBadgeIds.includes('streak_legend')) {
      const badgeData = BADGE_DEFINITIONS.streak_legend;
      newBadges.push({
        id: 'streak_legend',
        ...badgeData,
        unlockedAt: new Date().toISOString(),
      });
    }

    // Check for perfect score badge
    if (analysisScore && analysisScore >= 95 && !existingBadgeIds.includes('glow_perfectionist')) {
      const badgeData = BADGE_DEFINITIONS.glow_perfectionist;
      newBadges.push({
        id: 'glow_perfectionist',
        ...badgeData,
        unlockedAt: new Date().toISOString(),
      });
    }

    // Check for analysis addict badge
    if (user.stats.analyses >= 25 && !existingBadgeIds.includes('analysis_addict')) {
      const badgeData = BADGE_DEFINITIONS.analysis_addict;
      newBadges.push({
        id: 'analysis_addict',
        ...badgeData,
        unlockedAt: new Date().toISOString(),
      });
    }

    // Check for weekend warrior badge
    const today = new Date();
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    if (isWeekend && routineCompleted && !existingBadgeIds.includes('weekend_warrior')) {
      const badgeData = BADGE_DEFINITIONS.weekend_warrior;
      newBadges.push({
        id: 'weekend_warrior',
        ...badgeData,
        unlockedAt: new Date().toISOString(),
      });
    }

    if (newBadges.length > 0) {
      const updatedBadges = [...badges, ...newBadges];
      setBadges(updatedBadges);
      await saveBadges(updatedBadges);
    }

    return newBadges;
  }, [user, badges, dailyCompletions, getCurrentStreak]);

  const updateAchievementProgress = useCallback(async (category: string, increment: number = 1): Promise<Achievement[]> => {
    const updatedAchievements = achievements.map(achievement => {
      if (achievement.category === category && !achievement.completed) {
        const newProgress = Math.min(achievement.progress + increment, achievement.target);
        const completed = newProgress >= achievement.target;
        
        return {
          ...achievement,
          progress: newProgress,
          completed,
          completedAt: completed ? new Date().toISOString() : achievement.completedAt,
        };
      }
      return achievement;
    });

    const newlyCompleted = updatedAchievements.filter(
      (achievement, index) => 
        achievement.completed && 
        !achievements[index].completed
    );

    if (newlyCompleted.length > 0) {
      setAchievements(updatedAchievements);
      await saveAchievements(updatedAchievements);

      // Award points for completed achievements
      for (const achievement of newlyCompleted) {
        await addGlowBoost({
          type: 'streak_milestone',
          title: 'Achievement Unlocked!',
          message: achievement.name,
          points: achievement.points,
        });
      }
    }

    return newlyCompleted;
  }, [achievements, addGlowBoost]);

  const hasCompletedToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return dailyCompletions.includes(today);
  }, [dailyCompletions]);

  const hasCompletedForPlanDay = useCallback((planId: string, day: number) => {
    return completionLog.some(e => e.planId === planId && e.day === day);
  }, [completionLog]);



  const cancelAllNotifications = useCallback(async () => {
    console.log('Notifications handled by simplified system');
    // No longer using expo-notifications in Expo Go SDK 53
  }, []);

  const completeDailyRoutine = useCallback(async (planId?: string, day?: number): Promise<DailyReward[]> => {
    console.log('🎯 Starting completeDailyRoutine...');
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today:', today);
    console.log('✅ Current completions:', dailyCompletions);
    
    if (planId && typeof day === 'number' && hasCompletedForPlanDay(planId, day)) {
      console.log('❌ This plan day is already completed, returning empty rewards');
      return [];
    }

    console.log('🚀 Proceeding with daily routine completion...');
    const updatedCompletions = [...dailyCompletions, today];
    setDailyCompletions(updatedCompletions);
    await saveDailyCompletions(updatedCompletions);
    const updatedLog = [...completionLog, { date: today, planId, day }];
    await saveCompletionLog(updatedLog);
    console.log('💾 Updated completions saved:', updatedCompletions, 'log size:', updatedLog.length);

    const currentStreak = getCurrentStreak() + 1; // +1 because we just added today
    console.log('🔥 Current streak:', currentStreak);
    const rewards: DailyReward[] = [];

    // Base daily completion reward
    const basePoints = 100;
    rewards.push({
      id: `daily_completion_${Date.now()}`, // Make ID unique
      type: 'points',
      title: 'Daily Routine Complete!',
      description: 'Consistency is the key to glowing skin',
      value: basePoints,
      icon: '✨',
      rarity: 'common',
    });

    // Streak bonus rewards
    if (currentStreak >= 3) {
      const streakBonus = Math.min(currentStreak * 10, 200); // Cap at 200 bonus points
      rewards.push({
        id: `streak_bonus_${Date.now()}`, // Make ID unique
        type: 'streak_bonus',
        title: `${currentStreak} Day Streak!`,
        description: `Amazing consistency! +${streakBonus} bonus points`,
        value: streakBonus,
        icon: '🔥',
        rarity: currentStreak >= 30 ? 'legendary' : currentStreak >= 14 ? 'epic' : currentStreak >= 7 ? 'rare' : 'common',
      });
    }

    // Weekend bonus
    const today_date = new Date();
    const isWeekend = today_date.getDay() === 0 || today_date.getDay() === 6;
    if (isWeekend) {
      rewards.push({
        id: `weekend_bonus_${Date.now()}`, // Make ID unique
        type: 'points',
        title: 'Weekend Warrior!',
        description: 'Extra dedication on the weekend',
        value: 50,
        icon: '🏆',
        rarity: 'rare',
      });
    }

    // Milestone rewards
    if (currentStreak === 7) {
      rewards.push({
        id: `week_milestone_${Date.now()}`, // Make ID unique
        type: 'badge',
        title: 'Week Champion!',
        description: 'You completed a full week of routines',
        value: 250,
        icon: '👑',
        rarity: 'epic',
      });
    } else if (currentStreak === 30) {
      rewards.push({
        id: `month_milestone_${Date.now()}`, // Make ID unique
        type: 'badge',
        title: 'Glow Legend!',
        description: 'A full month of dedication - incredible!',
        value: 1000,
        icon: '💎',
        rarity: 'legendary',
      });
    }

    // Calculate total points and check for level up
    const totalPoints = rewards.reduce((sum, reward) => sum + reward.value, 0);
    const currentLevel = user ? calculateLevel(user.stats.totalPoints) : 1;
    const newLevel = user ? calculateLevel(user.stats.totalPoints + totalPoints) : 1;
    
    if (newLevel > currentLevel) {
      rewards.push({
        id: `level_up_${Date.now()}`, // Make ID unique
        type: 'level_up',
        title: `Level ${newLevel} Achieved!`,
        description: 'Your glow journey reaches new heights',
        value: newLevel,
        icon: '⭐',
        rarity: 'epic',
      });
    }

    console.log('🎁 Generated rewards:', rewards.length, 'rewards');
    console.log('💰 Total points:', totalPoints);

    // Update user stats and add glow boosts
    if (user) {
      const updatedUser = {
        ...user,
        stats: {
          ...user.stats,
          totalPoints: user.stats.totalPoints + totalPoints,
          level: newLevel,
          dayStreak: currentStreak,
        },
      };
      setUser(updatedUser);
      console.log('👤 User stats updated');

      // Add glow boost for the completion
      await addGlowBoost({
        type: 'daily_completion',
        title: 'Daily Routine Complete!',
        message: `+${totalPoints} points • ${currentStreak} day streak`,
        points: totalPoints,
      });
      console.log('✨ Glow boost added');
    }

    // Check for new badges
    await checkAndAwardBadges(undefined, true);
    console.log('🏆 Badges checked and awarded');
    
    // Update achievements
    await updateAchievementProgress('daily', 1);
    if (currentStreak >= 7) {
      await updateAchievementProgress('weekly', 1);
    }
    if (currentStreak >= 30) {
      await updateAchievementProgress('legendary', 1);
    }
    console.log('🎯 Achievements updated');

    // Cancel today's reminders since routine is complete
    await scheduleRoutineReminders();
    console.log('🔔 Notifications rescheduled');

    console.log('✅ completeDailyRoutine finished, returning', rewards.length, 'rewards');
    return rewards;
  }, [dailyCompletions, completionLog, hasCompletedForPlanDay, getCurrentStreak, user, setUser, addGlowBoost, checkAndAwardBadges, updateAchievementProgress, calculateLevel, scheduleRoutineReminders]);

  const unreadGlowBoosts = useMemo(() => {
    return glowBoosts.filter(boost => !boost.seen);
  }, [glowBoosts]);

  return useMemo(() => ({
    badges,
    achievements,
    glowBoosts,
    unreadGlowBoosts,
    dailyCompletions,
    addGlowBoost,
    markGlowBoostSeen,
    markAllGlowBoostsSeen,
    checkAndAwardBadges,
    updateAchievementProgress,
    calculateLevel,
    getPointsForNextLevel,
    getLevelProgress,
    completeDailyRoutine,
    hasCompletedToday,
    hasCompletedForPlanDay,
    setupNotifications,
    scheduleRoutineReminders,
    cancelAllNotifications,
  }), [
    badges,
    achievements,
    glowBoosts,
    unreadGlowBoosts,
    dailyCompletions,
    addGlowBoost,
    markGlowBoostSeen,
    markAllGlowBoostsSeen,
    checkAndAwardBadges,
    updateAchievementProgress,
    calculateLevel,
    getPointsForNextLevel,
    getLevelProgress,
    completeDailyRoutine,
    hasCompletedToday,
    hasCompletedForPlanDay,
    setupNotifications,
    scheduleRoutineReminders,
    cancelAllNotifications,
  ]);
});