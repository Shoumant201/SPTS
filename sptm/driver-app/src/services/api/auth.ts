import axiosInstance from '../axiosInstance';
import { API_ENDPOINTS } from '../endpoints';
import { getContextualErrorMessage } from '../../utils/errorHandling';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
  organizationId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  userType: 'USER';
  organizationId?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  token?: string; // For backward compatibility
  user: User;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  refreshToken?: string; // For backward compatibility
}

export interface AuthError {
  type: string;
  message: string;
  code: number;
  details?: any;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Helper function to safely extract tokens from auth response
const extractTokens = (authResponse: AuthResponse): { accessToken: string; refreshToken: string } => {
  // Check for new token structure
  if (authResponse.tokens && authResponse.tokens.accessToken && authResponse.tokens.refreshToken) {
    return authResponse.tokens;
  }
  
  // Check for legacy token structure
  if (authResponse.token && authResponse.refreshToken) {
    return {
      accessToken: authResponse.token,
      refreshToken: authResponse.refreshToken
    };
  }
  
  // If no valid tokens found, throw error
  throw new Error('Invalid token response from server');
};

export const authApi = {
  // Helper method to store auth response safely
  storeAuthResponse: async (authResponse: AuthResponse): Promise<void> => {
    try {
      const tokens = extractTokens(authResponse);
      const { TokenStorageService } = await import('../tokenStorage');
      await TokenStorageService.storeTokens(tokens, authResponse.user);
    } catch (error) {
      console.error('Error storing auth response:', error);
      throw new Error('Failed to store authentication data');
    }
  },

  // Login driver with role validation
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      // Try mobile-specific endpoint first
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, data);
      const authResponse = response.data;
      
      // Validate that user is a driver
      if (authResponse.user.role !== 'DRIVER') {
        throw new Error('This account is not authorized for the driver app. Please use the passenger app or contact your organization.');
      }
      
      return authResponse;
    } catch (error: any) {
      // If mobile endpoint fails, try unified endpoint with context
      if (error.response?.status === 404) {
        try {
          const response = await axiosInstance.post(API_ENDPOINTS.AUTH.UNIFIED_LOGIN, {
            ...data,
            context: 'driver-app'
          });
          const authResponse = response.data;
          
          // Validate role
          if (authResponse.user.role !== 'DRIVER') {
            throw new Error('This account is not authorized for the driver app. Please use the passenger app or contact your organization.');
          }
          
          return authResponse;
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
      
      // Use improved error handling
      throw new Error(getContextualErrorMessage(error, 'login'));
    }
  },

  // Register driver
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      // Ensure role is set to DRIVER for registration
      const registerData = {
        ...data,
        role: 'DRIVER'
      };
      
      // Try mobile-specific endpoint first
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, registerData);
      return response.data;
    } catch (error: any) {
      // If mobile endpoint fails, try unified endpoint
      if (error.response?.status === 404) {
        try {
          const response = await axiosInstance.post(API_ENDPOINTS.AUTH.UNIFIED_REGISTER, {
            ...data,
            role: 'DRIVER',
            context: 'driver-app'
          });
          return response.data;
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
      
      // Use improved error handling
      throw new Error(getContextualErrorMessage(error, 'register'));
    }
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{ tokens: { accessToken: string; refreshToken: string } }> => {
    try {
      // Try mobile-specific endpoint first
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
      return response.data;
    } catch (error: any) {
      // If mobile endpoint fails, try unified endpoint
      if (error.response?.status === 404) {
        const response = await axiosInstance.post(API_ENDPOINTS.AUTH.UNIFIED_REFRESH, { refreshToken });
        return response.data;
      }
      throw error;
    }
  },

  // Get current user with role validation
  getMe: async (): Promise<User> => {
    const response = await axiosInstance.get(API_ENDPOINTS.AUTH.ME);
    const user = response.data;
    
    // Validate that user is still a driver
    if (user.role !== 'DRIVER') {
      throw new Error('Your account role has changed. Please contact your organization administrator.');
    }
    
    return user;
  },

  // Get user profile
  getProfile: async (): Promise<{ user: User }> => {
    const response = await axiosInstance.get(API_ENDPOINTS.AUTH.PROFILE);
    const profileData = response.data;
    
    // Validate that user is still a driver
    if (profileData.user.role !== 'DRIVER') {
      throw new Error('Your account role has changed. Please contact your organization administrator.');
    }
    
    return profileData;
  },

  // Logout user
  logout: async (): Promise<{ message: string }> => {
    try {
      // Try mobile-specific endpoint first
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
      return response.data;
    } catch (error: any) {
      // If mobile endpoint fails, try unified endpoint
      if (error.response?.status === 404) {
        try {
          const response = await axiosInstance.post(API_ENDPOINTS.AUTH.UNIFIED_LOGOUT);
          return response.data;
        } catch (fallbackError: any) {
          console.warn('Both logout endpoints failed, but continuing with local cleanup:', fallbackError.message);
          return { message: 'Logout successful (local cleanup)' };
        }
      }
      
      // If logout fails (e.g., 401), still return success
      // The important thing is that we clear local tokens
      console.warn('Logout request failed, but continuing with local cleanup:', error.message);
      return { message: 'Logout successful (local cleanup)' };
    }
  },

  // Change password
  changePassword: async (data: ChangePasswordRequest): Promise<{ message: string }> => {
    try {
      const response = await axiosInstance.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
      return response.data;
    } catch (error: any) {
      throw new Error(getContextualErrorMessage(error, 'profile'));
    }
  },
};

// Organization API
export interface Organization {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export const organizationApi = {
  // Get active organizations for driver registration (public endpoint)
  getActiveOrganizations: async (): Promise<Organization[]> => {
    try {
      // Use fetch instead of axios to avoid authentication interceptors
      const response = await fetch('http://192.168.1.68:3001/api/auth/organizations/active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Failed to fetch organizations:', error);
      // Return empty array if fetch fails
      return [];
    }
  },
};