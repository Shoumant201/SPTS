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
  // Login passenger with role validation
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      // Try mobile-specific endpoint first
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, data);
      const authResponse = response.data;
      
      // Validate that user is a passenger
      if (authResponse.user.role !== 'PASSENGER') {
        throw new Error('This account is not authorized for the passenger app. Please use the driver app or contact support.');
      }
      
      return authResponse;
    } catch (error: any) {
      // If mobile endpoint fails, try unified endpoint with context
      if (error.response?.status === 404) {
        try {
          const response = await axiosInstance.post(API_ENDPOINTS.AUTH.UNIFIED_LOGIN, {
            ...data,
            context: 'passenger-app'
          });
          const authResponse = response.data;
          
          // Validate role
          if (authResponse.user.role !== 'PASSENGER') {
            throw new Error('This account is not authorized for the passenger app. Please use the driver app or contact support.');
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

  // Register passenger
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      // Ensure role is set to PASSENGER for registration
      const registerData = {
        ...data,
        role: 'PASSENGER'
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
            role: 'PASSENGER',
            context: 'passenger-app'
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
    
    // Validate that user is still a passenger
    if (user.role !== 'PASSENGER') {
      throw new Error('Your account role has changed. Please contact support.');
    }
    
    return user;
  },

  // Get user profile
  getProfile: async (): Promise<{ user: User }> => {
    const response = await axiosInstance.get(API_ENDPOINTS.AUTH.PROFILE);
    const profileData = response.data;
    
    // Validate that user is still a passenger
    if (profileData.user.role !== 'PASSENGER') {
      throw new Error('Your account role has changed. Please contact support.');
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