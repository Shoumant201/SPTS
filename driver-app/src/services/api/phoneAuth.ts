import axiosInstance from '../axiosInstance';
import { getContextualErrorMessage } from '../../utils/errorHandling';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export interface SendOtpRequest {
  phone: string;
  purpose: 'LOGIN' | 'REGISTRATION';
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
  purpose: 'LOGIN' | 'REGISTRATION';
  name?: string;
  deviceToken?: string;
}

export interface PhoneUser {
  id: string;
  phone: string;
  name: string | null;
  role: 'PASSENGER' | 'DRIVER';
  isPhoneVerified: boolean;
  organizationId?: string;
  createdAt: string;
}

export interface PhoneAuthResponse {
  success: boolean;
  message: string;
  user?: PhoneUser;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  phone: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  expiresIn: number;
}

// Generate device token for persistent login
const generateDeviceToken = (): string => {
  const deviceId = Device.osInternalBuildId || Constants.sessionId || 'unknown';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${deviceId}_${timestamp}_${random}`;
};

export const phoneAuthApi = {
  // Send OTP for login or registration
  sendOtp: async (data: SendOtpRequest): Promise<SendOtpResponse> => {
    try {
      // Ensure role is DRIVER for this app
      const requestData = {
        ...data,
        role: 'DRIVER'
      };

      console.log('phoneAuthApi.sendOtp - Request:', requestData);
      const response = await axiosInstance.post('/api/phone-auth/send-otp', requestData);
      console.log('phoneAuthApi.sendOtp - Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.log('phoneAuthApi.sendOtp - Error:', error);
      console.log('phoneAuthApi.sendOtp - Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Failed to send OTP';
      throw new Error(errorMessage);
    }
  },

  // Verify OTP and login/register
  verifyOtp: async (data: VerifyOtpRequest): Promise<PhoneAuthResponse> => {
    try {
      // Generate device token for persistent login
      const deviceToken = generateDeviceToken();
      
      const requestData = {
        ...data,
        role: 'DRIVER',
        deviceToken
      };

      const response = await axiosInstance.post('/api/phone-auth/verify-otp', requestData);
      const authResponse = response.data;

      // Validate that user is a driver
      if (authResponse.user && authResponse.user.role !== 'DRIVER') {
        throw new Error('This account is not authorized for the driver app. Please use the passenger app or contact support.');
      }

      // Store authentication data
      if (authResponse.success && authResponse.tokens) {
        await phoneAuthApi.storeAuthResponse(authResponse);
      }

      return authResponse;
    } catch (error: any) {
      throw new Error(getContextualErrorMessage(error, 'verify OTP'));
    }
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    try {
      const response = await axiosInstance.post('/api/phone-auth/refresh-token', {
        refreshToken
      });
      return response.data;
    } catch (error: any) {
      throw new Error(getContextualErrorMessage(error, 'general'));
    }
  },

  // Get user profile
  getProfile: async (): Promise<{ success: boolean; user: PhoneUser }> => {
    try {
      const response = await axiosInstance.get('/api/phone-auth/profile');
      const profileData = response.data;

      // Validate that user is still a driver
      if (profileData.user && profileData.user.role !== 'DRIVER') {
        throw new Error('Your account role has changed. Please contact support.');
      }

      return profileData;
    } catch (error: any) {
      throw new Error(getContextualErrorMessage(error, 'profile'));
    }
  },

  // Update user profile
  updateProfile: async (data: { name: string }): Promise<{ success: boolean; message: string; user: PhoneUser }> => {
    try {
      const response = await axiosInstance.put('/api/phone-auth/profile', data);
      return response.data;
    } catch (error: any) {
      throw new Error(getContextualErrorMessage(error, 'profile'));
    }
  },

  // Logout user
  logout: async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Get stored device token
      const { TokenStorageService } = await import('../tokenStorage');
      const tokens = await TokenStorageService.getTokens();
      
      const deviceToken = tokens?.deviceToken;
      
      const response = await axiosInstance.post('/api/phone-auth/logout', {
        deviceToken
      });
      
      // Clear local storage
      await TokenStorageService.clearTokens();
      
      return response.data;
    } catch (error: any) {
      // Even if logout fails on server, clear local tokens
      try {
        const { TokenStorageService } = await import('../tokenStorage');
        await TokenStorageService.clearTokens();
      } catch (clearError) {
        console.warn('Failed to clear local tokens:', clearError);
      }
      
      console.warn('Logout request failed, but local cleanup completed:', error.message);
      return { success: true, message: 'Logout successful (local cleanup)' };
    }
  },

  // Helper method to store auth response
  storeAuthResponse: async (authResponse: PhoneAuthResponse): Promise<void> => {
    try {
      if (!authResponse.tokens || !authResponse.user) {
        throw new Error('Invalid authentication response');
      }

      const { TokenStorageService } = await import('../tokenStorage');
      
      // Store tokens and user data
      await TokenStorageService.storeTokens({
        accessToken: authResponse.tokens.accessToken,
        refreshToken: authResponse.tokens.refreshToken,
        deviceToken: generateDeviceToken()
      }, {
        id: authResponse.user.id,
        phone: authResponse.user.phone,
        name: authResponse.user.name || '',
        role: authResponse.user.role,
        userType: 'USER' as const,
        email: '', // Not used in phone auth
        organizationId: authResponse.user.organizationId,
        isActive: true,
        createdAt: authResponse.user.createdAt
      }, true); // true for phone auth
    } catch (error) {
      console.error('Error storing phone auth response:', error);
      throw new Error('Failed to store authentication data');
    }
  },

  // Check if phone number is registered
  checkPhoneRegistration: async (phone: string): Promise<{ isRegistered: boolean; canLogin: boolean }> => {
    try {
      // Try to send login OTP to check if phone is registered
      await phoneAuthApi.sendOtp({ phone, purpose: 'LOGIN' });
      return { isRegistered: true, canLogin: true };
    } catch (error: any) {
      if (error.message.includes('not registered')) {
        return { isRegistered: false, canLogin: false };
      }
      // If it's a rate limit or other error, assume registered
      return { isRegistered: true, canLogin: false };
    }
  },

  // Format phone number for display
  formatPhoneNumber: (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format Nepal numbers
    if (cleaned.startsWith('977') && cleaned.length === 13) {
      return `+977 ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
    }
    
    if (cleaned.startsWith('98') && cleaned.length === 10) {
      return `+977 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
    }
    
    // Default formatting
    return phone;
  },

  // Validate phone number format
  isValidPhoneNumber: (phone: string): boolean => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check Nepal numbers
    if (cleaned.startsWith('977') && cleaned.length === 13) {
      return true;
    }
    
    if (cleaned.startsWith('98') && cleaned.length === 10) {
      return true;
    }
    
    // Check international format
    return /^\+?[1-9]\d{9,14}$/.test(phone);
  }
};