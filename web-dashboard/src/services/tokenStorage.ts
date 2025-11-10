import { User, UserType } from './api/auth';

interface StoredTokenData {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresAt: number;
}

// Helper to check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

export class TokenStorageService {
  private static readonly ACCESS_TOKEN_KEY = 'sptm_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'sptm_refresh_token';
  private static readonly USER_DATA_KEY = 'sptm_user_data';
  private static readonly TOKEN_EXPIRES_KEY = 'sptm_token_expires';

  /**
   * Store authentication tokens and user data
   */
  static storeTokens(tokens: { accessToken: string; refreshToken: string }, user: User): void {
    if (!isBrowser) return;
    
    try {
      // Calculate expiration time (assuming 1 hour for access token, with 5 min buffer)
      const expiresAt = Date.now() + (55 * 60 * 1000);
      
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));
      localStorage.setItem(this.TOKEN_EXPIRES_KEY, expiresAt.toString());
      
      // Legacy token storage for backward compatibility
      localStorage.setItem('token', tokens.accessToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  /**
   * Get stored access token
   */
  static getAccessToken(): string | null {
    if (!isBrowser) return null;
    
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY) || localStorage.getItem('token');
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  static getRefreshToken(): string | null {
    if (!isBrowser) return null;
    
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Get stored user data
   */
  static getUser(): User | null {
    if (!isBrowser) return null;
    
    try {
      const userData = localStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(): boolean {
    if (!isBrowser) return true;
    
    try {
      const expiresAt = localStorage.getItem(this.TOKEN_EXPIRES_KEY);
      if (!expiresAt) return true;
      
      // Token is expired if current time is past expiration
      return Date.now() >= parseInt(expiresAt);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Get user type from stored user data
   */
  static getUserType(): UserType | null {
    const user = this.getUser();
    return user?.userType as UserType || null;
  }

  /**
   * Clear all stored authentication data
   */
  static clearTokens(): void {
    if (!isBrowser) return;
    
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_DATA_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRES_KEY);
      
      // Clear legacy token for backward compatibility
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    if (!isBrowser) return false;
    
    const accessToken = this.getAccessToken();
    const user = this.getUser();
    
    // User is authenticated if we have token and user data
    // Even if token is expired, we can try to refresh it
    return !!(accessToken && user);
  }

  /**
   * Get stored token data for refresh operations
   */
  static getStoredTokenData(): StoredTokenData | null {
    if (!isBrowser) return null;
    
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const user = this.getUser();
    const expiresAt = localStorage.getItem(this.TOKEN_EXPIRES_KEY);

    if (!accessToken || !refreshToken || !user || !expiresAt) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      user,
      expiresAt: parseInt(expiresAt)
    };
  }
}