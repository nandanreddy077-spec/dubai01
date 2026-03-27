/**
 * Storage Optimization Utilities
 * Manages local storage cleanup and optimization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
const CLEANUP_THRESHOLD = 0.8; // Cleanup when 80% full

interface StorageItem {
  key: string;
  size: number;
  lastAccessed: number;
}

/**
 * Get storage size estimate
 */
export async function getStorageSize(): Promise<number> {
  if (Platform.OS === 'web') {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    }
    // Fallback: calculate from localStorage
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          total += value.length;
        }
      }
    }
    return total;
  }

  // React Native: estimate based on keys
  const keys = await AsyncStorage.getAllKeys();
  let total = 0;
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      total += value.length;
    }
  }
  return total;
}

/**
 * Clean up old storage data
 */
export async function cleanupOldStorage(): Promise<void> {
  try {
    const storageSize = await getStorageSize();
    
    if (storageSize < MAX_STORAGE_SIZE * CLEANUP_THRESHOLD) {
      return; // No cleanup needed
    }

    // Get all keys with metadata
    const items: StorageItem[] = [];
    
    if (Platform.OS === 'web') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            // Try to get last accessed from value
            let lastAccessed = Date.now();
            try {
              const parsed = JSON.parse(value);
              if (parsed.timestamp) {
                lastAccessed = parsed.timestamp;
              }
            } catch {
              // Not JSON, use current time
            }
            
            items.push({
              key,
              size: value.length,
              lastAccessed,
            });
          }
        }
      }
    } else {
      const keys = await AsyncStorage.getAllKeys();
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          let lastAccessed = Date.now();
          try {
            const parsed = JSON.parse(value);
            if (parsed.timestamp) {
              lastAccessed = parsed.timestamp;
            }
          } catch {
            // Not JSON
          }
          
          items.push({
            key,
            size: value.length,
            lastAccessed,
          });
        }
      }
    }

    // Sort by last accessed (oldest first)
    items.sort((a, b) => a.lastAccessed - b.lastAccessed);

    // Remove oldest items until under threshold
    let currentSize = storageSize;
    const targetSize = MAX_STORAGE_SIZE * (1 - CLEANUP_THRESHOLD);

    for (const item of items) {
      if (currentSize <= targetSize) {
        break;
      }

      if (Platform.OS === 'web') {
        localStorage.removeItem(item.key);
      } else {
        await AsyncStorage.removeItem(item.key);
      }

      currentSize -= item.size;
    }

    console.log(`Cleaned up storage: ${storageSize} -> ${currentSize} bytes`);
  } catch (error) {
    console.error('Error cleaning up storage:', error);
  }
}

/**
 * Limit array size in storage
 */
export function limitArraySize<T>(array: T[], maxSize: number = 50): T[] {
  return array.slice(0, maxSize);
}

/**
 * Clean up specific storage keys
 */
export async function cleanupStorageKeys(keys: string[]): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      keys.forEach(key => localStorage.removeItem(key));
    } else {
      await AsyncStorage.multiRemove(keys);
    }
  } catch (error) {
    console.error('Error cleaning up storage keys:', error);
  }
}

/**
 * Get storage usage by key prefix
 */
export async function getStorageUsageByPrefix(prefix: string): Promise<number> {
  try {
    let total = 0;
    
    if (Platform.OS === 'web') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            total += value.length;
          }
        }
      }
    } else {
      const keys = await AsyncStorage.getAllKeys();
      for (const key of keys) {
        if (key.startsWith(prefix)) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            total += value.length;
          }
        }
      }
    }
    
    return total;
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return 0;
  }
}



























