import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAsyncStorage } from '../utils/safeAsyncStorage';
import { User } from './api/auth';

interface StoredTokenData {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresAt: number;
}

export class TokenStorageService {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly USER_DATA_KEY = 'user';
  private static readonly TOKEN_EXPIRES_KEY = 'tokenExpires';
  private static readonly LEGACY_TOKEN_KEY = 'token'; // For backward compatibility

  /**
   * Store authentication tokens and user data
   */
  static async storeTokens(tokens: { accessToken: string; refreshToken: string }, user: User): Promise<void> {
    try {
      // Validate inputs
      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('Cannot store undefined or empty tokens');
      }
      if (!user) {
        throw new Error('Cannot store undefined user data');
      }
      
      // Calculate expiration time (assuming 1 hour for access token)
      const expiresAt = Date.now() + (60 * 60 * 1000);
      
      await SafeAsyncStorage.multiSet([
        [this.ACCESS_TOKEN_KEY, tokens.accessToken],
        [this.REFRESH_TOKEN_KEY, tokens.refreshToken],
        [this.USER_DATA_KEY, JSON.stringify(user)],
        [this.TOKEN_EXPIRES_KEY, expiresAt.toString()],
        [this.LEGACY_TOKEN_KEY, tokens.accessToken], // For backward compatibility
      ]);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  /**
   * Get stored access token
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const token = await SafeAsyncStorage.getItem(this.ACCESS_TOKEN_KEY);
      if (token) return token;
      
      // Fallback to legacy token
      return await SafeAsyncStorage.getItem(this.LEGACY_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    try {
      return await SafeAsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Get stored user data
   */
  static async getUser(): Promise<User | null> {
    try {
      const userData = await SafeAsyncStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static async isTokenExpired(): Promise<boolean> {
    try {
      const expiresAt = await SafeAsyncStorage.getItem(this.TOKEN_EXPIRES_KEY);
      if (!expiresAt) return true;
      
      return Date.now() >= parseInt(expiresAt);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Clear all stored authentication data
   */
  static async clearTokens(): Promise<void> {
    try {
      await SafeAsyncStorage.multiRemove([
        this.ACCESS_TOKEN_KEY,
        this.REFRESH_TOKEN_KEY,
        this.USER_DATA_KEY,
        this.TOKEN_EXPIRES_KEY,
        this.LEGACY_TOKEN_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const user = await this.getUser();
      const isExpired = await this.isTokenExpired();
      
      return !!(accessToken && user && !isExpired);
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Get stored token data for refresh operations
   */
  static async getStoredTokenData(): Promise<StoredTokenData | null> {
    try {
      const accessToken = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();
      const user = await this.getUser();
      const expiresAt = await AsyncStorage.getItem(this.TOKEN_EXPIRES_KEY);

      if (!accessToken || !refreshToken || !user || !expiresAt) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        user,
        expiresAt: parseInt(expiresAt)
      };
    } catch (error) {
      console.error('Error getting stored token data:', error);
      return null;
    }
  }

  /**
   * Validate that stored user is a passenger
   */
  static async validatePassengerRole(): Promise<boolean> {
    try {
      const user = await this.getUser();
      return user?.role === 'PASSENGER';
    } catch (error) {
      console.error('Error validating passenger role:', error);
      return false;
    }
  }
}