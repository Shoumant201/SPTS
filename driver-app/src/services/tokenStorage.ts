import { SafeAsyncStorage } from '../utils/safeAsyncStorage';
import { User } from './api/auth';

interface StoredTokenData {
  accessToken: string;
  refreshToken: string;
  deviceToken?: string;
  user: User;
  expiresAt: number;
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  deviceToken?: string;
}

export class TokenStorageService {
  private static readonly ACCESS_TOKEN_KEY = 'accessToken';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static readonly DEVICE_TOKEN_KEY = 'deviceToken';
  private static readonly USER_DATA_KEY = 'user';
  private static readonly TOKEN_EXPIRES_KEY = 'tokenExpires';
  private static readonly LEGACY_TOKEN_KEY = 'token'; // For backward compatibility
  private static readonly PHONE_AUTH_FLAG = 'phoneAuth'; // Flag to indicate phone auth

  /**
   * Store authentication tokens and user data
   */
  static async storeTokens(tokens: TokenData, user: User, isPhoneAuth: boolean = false): Promise<void> {
    try {
      // Validate inputs
      if (!tokens.accessToken || !tokens.refreshToken) {
        throw new Error('Cannot store undefined or empty tokens');
      }
      if (!user) {
        throw new Error('Cannot store undefined user data');
      }

      // Calculate expiration time (7 days for phone auth, 1 hour for email auth)
      const expirationHours = isPhoneAuth ? 24 * 7 : 1; // 7 days vs 1 hour
      const expiresAt = Date.now() + (expirationHours * 60 * 60 * 1000);

      const storageItems: [string, string][] = [
        [this.ACCESS_TOKEN_KEY, tokens.accessToken],
        [this.REFRESH_TOKEN_KEY, tokens.refreshToken],
        [this.USER_DATA_KEY, JSON.stringify(user)],
        [this.TOKEN_EXPIRES_KEY, expiresAt.toString()],
        [this.LEGACY_TOKEN_KEY, tokens.accessToken], // For backward compatibility
        [this.PHONE_AUTH_FLAG, isPhoneAuth.toString()],
      ];

      // Store device token if provided
      if (tokens.deviceToken) {
        storageItems.push([this.DEVICE_TOKEN_KEY, tokens.deviceToken]);
      }

      await SafeAsyncStorage.multiSet(storageItems);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  /**
   * Get all stored tokens
   */
  static async getTokens(): Promise<TokenData | null> {
    try {
      const accessToken = await this.getAccessToken();
      const refreshToken = await this.getRefreshToken();
      const deviceToken = await this.getDeviceToken();

      if (!accessToken || !refreshToken) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        deviceToken: deviceToken || undefined
      };
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
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
   * Get stored device token
   */
  static async getDeviceToken(): Promise<string | null> {
    try {
      return await SafeAsyncStorage.getItem(this.DEVICE_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting device token:', error);
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
   * Check if using phone authentication
   */
  static async isPhoneAuth(): Promise<boolean> {
    try {
      const phoneAuth = await SafeAsyncStorage.getItem(this.PHONE_AUTH_FLAG);
      return phoneAuth === 'true';
    } catch (error) {
      console.error('Error checking phone auth flag:', error);
      return false;
    }
  }

  /**
   * Check if token is expired (more lenient for phone auth)
   */
  static async isTokenExpired(): Promise<boolean> {
    try {
      const expiresAt = await SafeAsyncStorage.getItem(this.TOKEN_EXPIRES_KEY);
      if (!expiresAt) return true;

      const isPhoneAuthUser = await this.isPhoneAuth();
      const expirationTime = parseInt(expiresAt);
      const currentTime = Date.now();

      // For phone auth, add a grace period of 1 day before considering expired
      if (isPhoneAuthUser) {
        const gracePeriod = 24 * 60 * 60 * 1000; // 1 day
        return currentTime >= (expirationTime + gracePeriod);
      }

      return currentTime >= expirationTime;
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
        this.DEVICE_TOKEN_KEY,
        this.USER_DATA_KEY,
        this.TOKEN_EXPIRES_KEY,
        this.LEGACY_TOKEN_KEY,
        this.PHONE_AUTH_FLAG,
      ]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated (more persistent for phone auth)
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      const user = await this.getUser();
      const isExpired = await this.isTokenExpired();

      // For phone auth, even if token is expired, check if we have refresh token
      if (isExpired) {
        const isPhoneAuthUser = await this.isPhoneAuth();
        const refreshToken = await this.getRefreshToken();

        if (isPhoneAuthUser && refreshToken) {
          // Token is expired but we have refresh token for phone auth
          // The app should attempt to refresh the token
          return true;
        }

        return false;
      }

      return !!(accessToken && user);
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
      const deviceToken = await this.getDeviceToken();
      const user = await this.getUser();
      const expiresAt = await SafeAsyncStorage.getItem(this.TOKEN_EXPIRES_KEY);

      if (!accessToken || !refreshToken || !user || !expiresAt) {
        return null;
      }

      return {
        accessToken,
        refreshToken,
        deviceToken: deviceToken || undefined,
        user,
        expiresAt: parseInt(expiresAt)
      };
    } catch (error) {
      console.error('Error getting stored token data:', error);
      return null;
    }
  }

  /**
   * Validate that stored user is a driver
   */
  static async validateDriverRole(): Promise<boolean> {
    try {
      const user = await this.getUser();
      return user?.role === 'DRIVER';
    } catch (error) {
      console.error('Error validating driver role:', error);
      return false;
    }
  }

  /**
   * Update access token (for refresh operations)
   */
  static async updateAccessToken(newAccessToken: string, expiresIn?: number): Promise<void> {
    try {
      const isPhoneAuthUser = await this.isPhoneAuth();
      const expirationHours = isPhoneAuthUser ? 24 * 7 : 1; // 7 days vs 1 hour
      const expiresAt = Date.now() + ((expiresIn || expirationHours * 3600) * 1000);

      await SafeAsyncStorage.multiSet([
        [this.ACCESS_TOKEN_KEY, newAccessToken],
        [this.TOKEN_EXPIRES_KEY, expiresAt.toString()],
        [this.LEGACY_TOKEN_KEY, newAccessToken], // For backward compatibility
      ]);
    } catch (error) {
      console.error('Error updating access token:', error);
      throw error;
    }
  }
}