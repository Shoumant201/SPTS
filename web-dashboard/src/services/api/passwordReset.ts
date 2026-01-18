import axiosInstance from '../axiosInstance';
import { API_ENDPOINTS } from '../endpoints';

export interface RequestResetResponse {
  message: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  email?: string;
  message: string;
  error?: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export const passwordResetApi = {
  /**
   * Request password reset - sends email with reset link
   */
  requestReset: async (email: string): Promise<RequestResetResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.PASSWORD_RESET.REQUEST, { email });
    return response.data;
  },

  /**
   * Validate reset token
   */
  validateToken: async (token: string): Promise<ValidateTokenResponse> => {
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.PASSWORD_RESET.VALIDATE(token));
      return response.data;
    } catch (error: any) {
      return {
        valid: false,
        message: error.response?.data?.error || 'Invalid token',
        error: error.response?.data?.error
      };
    }
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<ResetPasswordResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.PASSWORD_RESET.RESET, {
      token,
      newPassword
    });
    return response.data;
  },
};
