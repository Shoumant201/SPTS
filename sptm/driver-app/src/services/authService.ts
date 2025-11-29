import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, Driver } from '../types';

// Storage keys
const TOKEN_KEY = '@sptm_driver_token';
const REFRESH_TOKEN_KEY = '@sptm_driver_refresh_token';
const DRIVER_DATA_KEY = '@sptm_driver_data';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  driver: Driver | null;
  token: string | null;
}

class AuthService {
  private baseUrl = 'https://api.sptm.com'; // This would be configured per environment

  /**
   * Authenticate driver with username and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Simulate API call - in real implementation, this would be an actual HTTP request
      const response = await this.simulateApiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success && response.data) {
        const authData = response.data as AuthResponse;
        
        // Store authentication data securely
        await this.storeAuthData(authData);
        
        return authData;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : 'Network error occurred');
    }
  }

  /**
   * Logout and clear stored authentication data
   */
  async logout(): Promise<void> {
    try {
      // Clear all stored authentication data
      await AsyncStorage.multiRemove([
        TOKEN_KEY,
        REFRESH_TOKEN_KEY,
        DRIVER_DATA_KEY,
      ]);
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout - always succeed locally
    }
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return false;

      // Check if token is expired
      const isValid = await this.validateToken(token);
      if (!isValid) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        return refreshed;
      }

      return true;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  /**
   * Get current authentication state
   */
  async getAuthState(): Promise<AuthState> {
    try {
      const [token, driverData] = await AsyncStorage.multiGet([
        TOKEN_KEY,
        DRIVER_DATA_KEY,
      ]);

      const tokenValue = token[1];
      const driverValue = driverData[1];

      return {
        isAuthenticated: !!tokenValue,
        token: tokenValue,
        driver: driverValue ? JSON.parse(driverValue) : null,
      };
    } catch (error) {
      console.error('Get auth state error:', error);
      return {
        isAuthenticated: false,
        token: null,
        driver: null,
      };
    }
  }

  /**
   * Get current driver data
   */
  async getCurrentDriver(): Promise<Driver | null> {
    try {
      const driverData = await AsyncStorage.getItem(DRIVER_DATA_KEY);
      return driverData ? JSON.parse(driverData) : null;
    } catch (error) {
      console.error('Get current driver error:', error);
      return null;
    }
  }

  /**
   * Get current authentication token
   */
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;

      const response = await this.simulateApiCall('/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (response.success && response.data) {
        const authData = response.data as AuthResponse;
        await this.storeAuthData(authData);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Validate token (check expiration)
   */
  private async validateToken(token: string): Promise<boolean> {
    try {
      // In a real implementation, this would decode the JWT and check expiration
      // For simulation, we'll assume tokens are valid for 1 hour
      const tokenData = this.parseJWT(token);
      const now = Date.now() / 1000;
      return tokenData.exp > now;
    } catch (error) {
      return false;
    }
  }

  /**
   * Store authentication data securely
   */
  private async storeAuthData(authData: AuthResponse): Promise<void> {
    try {
      // Validate data before storing to prevent AsyncStorage errors
      if (!authData.token || !authData.refreshToken || !authData.driver) {
        throw new Error('Invalid auth data - missing required fields');
      }
      
      await AsyncStorage.multiSet([
        [TOKEN_KEY, authData.token],
        [REFRESH_TOKEN_KEY, authData.refreshToken],
        [DRIVER_DATA_KEY, JSON.stringify(authData.driver)],
      ]);
    } catch (error) {
      console.error('Store auth data error:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Parse JWT token (simplified for simulation)
   */
  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  /**
   * Simulate API call for development/testing
   */
  private async simulateApiCall(endpoint: string, options: any): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Simulate different responses based on endpoint and credentials
    if (endpoint === '/auth/login') {
      const credentials = JSON.parse(options.body) as LoginCredentials;
      
      // Simulate successful login for demo credentials
      if (credentials.username === 'driver123' && credentials.password === 'password123') {
        const mockDriver: Driver = {
          id: 'driver_001',
          name: 'John Smith',
          employeeId: 'EMP123',
          currentShift: null,
          currentTrip: null,
          location: {
            latitude: 37.7749,
            longitude: -122.4194,
            timestamp: new Date(),
          },
          status: 'online',
        };

        const mockAuthResponse: AuthResponse = {
          token: this.generateMockJWT(mockDriver.id),
          refreshToken: this.generateMockJWT(mockDriver.id, true),
          driver: mockDriver,
          expiresIn: 3600, // 1 hour
        };

        return {
          success: true,
          data: mockAuthResponse,
        };
      } else {
        return {
          success: false,
          error: 'Invalid username or password',
        };
      }
    }

    if (endpoint === '/auth/refresh') {
      // Simulate successful token refresh
      const mockDriver: Driver = {
        id: 'driver_001',
        name: 'John Smith',
        employeeId: 'EMP123',
        currentShift: null,
        currentTrip: null,
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          timestamp: new Date(),
        },
        status: 'online',
      };

      return {
        success: true,
        data: {
          token: this.generateMockJWT(mockDriver.id),
          refreshToken: this.generateMockJWT(mockDriver.id, true),
          driver: mockDriver,
          expiresIn: 3600,
        },
      };
    }

    return {
      success: false,
      error: 'Endpoint not found',
    };
  }

  /**
   * Generate mock JWT token for simulation
   */
  private generateMockJWT(driverId: string, isRefresh: boolean = false): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (isRefresh ? 7 * 24 * 3600 : 3600); // 7 days for refresh, 1 hour for access
    
    const payload = btoa(JSON.stringify({
      sub: driverId,
      iat: now,
      exp: exp,
      type: isRefresh ? 'refresh' : 'access',
    }));

    const signature = btoa('mock_signature');
    return `${header}.${payload}.${signature}`;
  }
}

// DEPRECATED: This service is deprecated in favor of the new auth API
// Keeping for backward compatibility but not exporting to avoid conflicts
const legacyAuthService = new AuthService();
// export const authService = new AuthService();
// export default authService;