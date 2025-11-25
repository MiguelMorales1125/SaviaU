/**
 * Storage service that works across web and native platforms
 * Uses AsyncStorage for React Native and localStorage for web
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class StorageService {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      } else {
        // Use AsyncStorage for native
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } else {
        // Use AsyncStorage for native
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } else {
        // Use AsyncStorage for native
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage for web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.clear();
        }
      } else {
        // Use AsyncStorage for native
        await AsyncStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export const storage = new StorageService();
