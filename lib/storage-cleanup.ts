import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
};

const STORAGE_KEYS = [
  'glowcheck_user',
  'glowcheck_first_time',
  'glowcheck_analysis_history',
  'gamification_badges',
  'gamification_achievements',
  'gamification_glow_boosts',
  'gamification_daily_completions',
  'gamification_completion_log_v2',
  'glow_community_circles_v1',
  'glow_community_posts_v1',
  'glow_community_memberships_v1',
  'subscription_state',
  'skincare_plans_history',
  'style_analysis_history',
];

export async function validateAndCleanStorage(): Promise<void> {
  console.log('🔍 Starting storage validation and cleanup...');
  
  for (const key of STORAGE_KEYS) {
    try {
      const data = await storage.getItem(key);
      if (data) {
        try {
          // Try to parse the JSON
          JSON.parse(data);
          console.log(`✅ ${key}: Valid JSON`);
        } catch (parseError) {
          console.error(`❌ ${key}: Invalid JSON, clearing...`, parseError);
          await storage.removeItem(key);
          
          // Reset to default values for critical keys
          if (key === 'glowcheck_analysis_history') {
            await storage.setItem(key, JSON.stringify([]));
          } else if (key === 'gamification_badges') {
            await storage.setItem(key, JSON.stringify([]));
          } else if (key === 'gamification_achievements') {
            await storage.setItem(key, JSON.stringify([]));
          } else if (key === 'gamification_glow_boosts') {
            await storage.setItem(key, JSON.stringify([]));
          } else if (key === 'gamification_daily_completions') {
            await storage.setItem(key, JSON.stringify([]));
          } else if (key === 'glow_community_circles_v1') {
            await storage.setItem(key, JSON.stringify([]));
          } else if (key === 'glow_community_posts_v1') {
            await storage.setItem(key, JSON.stringify({}));
          } else if (key === 'glow_community_memberships_v1') {
            await storage.setItem(key, JSON.stringify([]));
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${key}:`, error);
      await storage.removeItem(key);
    }
  }
  
  console.log('✅ Storage validation and cleanup completed');
}

export const clearAllStorageData = async () => {
  try {
    console.log('🧹 Starting storage cleanup...');
    
    const keysToRemove = [
      'glowcheck_analysis_history',
      'gamification_glow_boosts',
      'gamification_badges', 
      'gamification_achievements',
      'gamification_daily_completions',
      'notification_permissions',
      'skincare_plans',
      'skincare_current_plan',
      'user_profile',
      'auth_token',
      'subscription_status'
    ];

    if (Platform.OS === 'web') {
      // Clear localStorage on web
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`✅ Removed ${key} from localStorage`);
        } catch (error) {
          console.warn(`⚠️ Failed to remove ${key}:`, error);
        }
      });
      
      // Also try to clear all localStorage if needed
      try {
        localStorage.clear();
        console.log('✅ Cleared all localStorage');
      } catch (error) {
        console.warn('⚠️ Failed to clear localStorage:', error);
      }
    } else {
      // Clear AsyncStorage on mobile
      await AsyncStorage.multiRemove(keysToRemove);
      console.log('✅ Cleared AsyncStorage keys');
    }
    
    console.log('🎉 Storage cleanup completed');
  } catch (error) {
    console.error('❌ Storage cleanup failed:', error);
  }
};

export const getStorageUsage = async () => {
  try {
    const keys = Platform.OS === 'web' 
      ? Object.keys(localStorage)
      : await AsyncStorage.getAllKeys();
    
    let totalSize = 0;
    const usage: Record<string, number> = {};
    
    for (const key of keys) {
      try {
        const value = Platform.OS === 'web' 
          ? localStorage.getItem(key)
          : await AsyncStorage.getItem(key);
        
        if (value) {
          const size = new Blob([value]).size;
          usage[key] = size;
          totalSize += size;
        }
      } catch (error) {
        console.warn(`Failed to get size for ${key}:`, error);
      }
    }
    
    return { usage, totalSize, keys: keys.length };
  } catch (error) {
    console.error('Failed to get storage usage:', error);
    return { usage: {}, totalSize: 0, keys: 0 };
  }
};