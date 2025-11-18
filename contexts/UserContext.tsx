import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { User } from '@/types/user';
import { Platform } from 'react-native';

// Web-compatible storage wrapper
const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },
  async multiRemove(keys: string[]): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        keys.forEach(key => localStorage.removeItem(key));
        return;
      }
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Storage multiRemove error:', error);
    }
  }
};

const STORAGE_KEY = 'glowcheck_user';
const FIRST_TIME_KEY = 'glowcheck_first_time';

const DEFAULT_USER: User = {
  id: '1',
  name: 'Guest User',
  email: 'guest@example.com',
  avatar: '', // Start with empty avatar to enforce profile picture requirement
  isPremium: true,
  stats: {
    analyses: 0,
    dayStreak: 0,
    glowScore: 0,
    totalPoints: 0,
    level: 1,
    bestGlowScore: 0,
    improvementStreak: 0,
  },
  badges: [],
  achievements: [],
  glowBoosts: [],
};

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isFirstTime, setIsFirstTime] = useState<boolean>(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [userData, firstTimeData, analysisData] = await Promise.all([
        storage.getItem(STORAGE_KEY),
        storage.getItem(FIRST_TIME_KEY),
        storage.getItem('glowcheck_analysis_history'),
      ]);
      
      let baseUser = DEFAULT_USER;
      try {
        baseUser = userData ? JSON.parse(userData) : DEFAULT_USER;
      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
        // Clear corrupted data
        await storage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER));
        baseUser = DEFAULT_USER;
      }
      
      // Update stats based on analysis history
      if (analysisData) {
        let analysisHistory = [];
        try {
          analysisHistory = JSON.parse(analysisData);
        } catch (parseError) {
          console.error('Error parsing analysis data:', parseError);
          // Clear corrupted analysis data
          await storage.setItem('glowcheck_analysis_history', JSON.stringify([]));
          analysisHistory = [];
        }
        const analysisCount = analysisHistory.length;
        const latestGlowScore = analysisHistory.length > 0 ? Math.round(analysisHistory[0].overallScore) : baseUser.stats.glowScore;
        const bestGlowScore = analysisHistory.length > 0 ? Math.max(...analysisHistory.map((a: any) => Math.round(a.overallScore))) : baseUser.stats.bestGlowScore;
        
        // Calculate day streak based on analysis timestamps
        let dayStreak = 0;
        if (analysisHistory.length > 0) {
          const today = new Date();
          const sortedAnalyses = analysisHistory.sort((a: any, b: any) => b.timestamp - a.timestamp);
          
          for (let i = 0; i < sortedAnalyses.length; i++) {
            const analysisDate = new Date(sortedAnalyses[i].timestamp);
            const daysDiff = Math.floor((today.getTime() - analysisDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === i) {
              dayStreak++;
            } else {
              break;
            }
          }
        }
        
        baseUser = {
          ...baseUser,
          stats: {
            ...baseUser.stats,
            analyses: analysisCount,
            glowScore: latestGlowScore,
            bestGlowScore: bestGlowScore,
            dayStreak: dayStreak,
            totalPoints: analysisCount * 100 + dayStreak * 50,
            level: Math.floor((analysisCount * 100 + dayStreak * 50) / 500) + 1,
          },
        };
      }
      
      setUser(baseUser);
      setIsFirstTime(firstTimeData === null);
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(DEFAULT_USER);
    }
  };

  const saveUser = async (userData: User) => {
    try {
      await storage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const updateAvatar = useCallback(async (uri: string) => {
    console.log('updateAvatar called with URI:', uri);
    if (user) {
      try {
        const updatedUser = { ...user, avatar: uri };
        console.log('Updating user with new avatar:', updatedUser.avatar);
        setUser(updatedUser);
        await saveUser(updatedUser);
        console.log('Avatar updated and saved successfully');
      } catch (error) {
        console.error('Error updating avatar:', error);
        throw error;
      }
    } else {
      console.error('No user found when trying to update avatar');
      throw new Error('No user found');
    }
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await storage.multiRemove([STORAGE_KEY, FIRST_TIME_KEY]);
      setUser(null);
      setIsFirstTime(true);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }, []);

  const handleSetUser = useCallback(async (userData: User | null) => {
    setUser(userData);
    if (userData) {
      await saveUser(userData);
    }
  }, []);

  const handleSetIsFirstTime = useCallback(async (value: boolean) => {
    setIsFirstTime(value);
    try {
      if (!value) {
        await storage.setItem(FIRST_TIME_KEY, 'false');
      }
    } catch (error) {
      console.error('Error saving first time flag:', error);
    }
  }, []);

  const updateUserStats = useCallback(async (updates: Partial<User['stats']>) => {
    if (user) {
      const updatedUser = {
        ...user,
        stats: {
          ...user.stats,
          ...updates,
        },
      };
      setUser(updatedUser);
      await saveUser(updatedUser);
    }
  }, [user]);



  const refreshUserData = useCallback(() => {
    loadUserData();
  }, []);

  const hasProfilePicture = useMemo(() => {
    return user?.avatar && user.avatar.trim() !== '';
  }, [user?.avatar]);

  return useMemo(() => ({
    user,
    setUser: handleSetUser,
    updateAvatar,
    logout,
    isFirstTime,
    setIsFirstTime: handleSetIsFirstTime,
    updateUserStats,
    refreshUserData,
    hasProfilePicture,
  }), [user, isFirstTime, handleSetUser, updateAvatar, logout, handleSetIsFirstTime, updateUserStats, refreshUserData, hasProfilePicture]);
});