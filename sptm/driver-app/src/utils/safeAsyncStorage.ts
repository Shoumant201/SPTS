import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Safe AsyncStorage wrapper that prevents storing undefined/null values
 */
export class SafeAsyncStorage {
  /**
   * Safely set an item in AsyncStorage
   * Prevents storing undefined or null values
   */
  static async setItem(key: string, value: string): Promise<void> {
    if (value === undefined || value === null) {
      console.warn(`SafeAsyncStorage: Attempted to store ${value} for key "${key}". Skipping.`);
      return;
    }
    
    if (typeof value !== 'string') {
      console.warn(`SafeAsyncStorage: Value for key "${key}" is not a string. Converting.`);
      value = String(value);
    }
    
    return AsyncStorage.setItem(key, value);
  }

  /**
   * Safely get an item from AsyncStorage
   */
  static async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  /**
   * Safely remove an item from AsyncStorage
   */
  static async removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }

  /**
   * Safely set multiple items in AsyncStorage
   * Filters out undefined/null values
   */
  static async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    const safeKeyValuePairs = keyValuePairs.filter(([key, value]) => {
      if (value === undefined || value === null) {
        console.warn(`SafeAsyncStorage: Skipping undefined/null value for key "${key}"`);
        return false;
      }
      return true;
    });

    if (safeKeyValuePairs.length === 0) {
      console.warn('SafeAsyncStorage: No valid key-value pairs to store');
      return;
    }

    return AsyncStorage.multiSet(safeKeyValuePairs);
  }

  /**
   * Safely get multiple items from AsyncStorage
   */
  static async multiGet(keys: string[]): Promise<[string, string | null][]> {
    return AsyncStorage.multiGet(keys);
  }

  /**
   * Safely remove multiple items from AsyncStorage
   */
  static async multiRemove(keys: string[]): Promise<void> {
    return AsyncStorage.multiRemove(keys);
  }

  /**
   * Clear all AsyncStorage data
   */
  static async clear(): Promise<void> {
    return AsyncStorage.clear();
  }

  /**
   * Get all keys from AsyncStorage
   */
  static async getAllKeys(): Promise<string[]> {
    return AsyncStorage.getAllKeys();
  }
}