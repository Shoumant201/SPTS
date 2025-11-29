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
  userType: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'USER';
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

export type UserType = 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  // Multi-tier login methods
  loginSuperAdmin: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.WEB.SUPER_ADMIN.LOGIN, data);
      return response.data;
    } catch (error: any) {
      throw new Error(getContextualErrorMessage(error, 'login'));
    }
  },

  loginAdmin: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.WEB.ADMIN.LOGIN, data);
      return response.data;
    } catch (error: any) {
      throw new Error(getContextualErrorMessage(error, 'login'));
    }
  },

  loginOrganization: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.WEB.ORGANIZATION.LOGIN, data);
      return response.data;
    } catch (error: any) {
      throw new Error(getContextualErrorMessage(error, 'login'));
    }
  },

  // Unified login method that determines user type
  login: async (data: LoginRequest & { userType?: UserType }): Promise<AuthResponse> => {
    if (data.userType) {
      // Extract only email and password for the specific login methods
      const loginData: LoginRequest = {
        email: data.email,
        password: data.password
      };
      
      switch (data.userType) {
        case 'SUPER_ADMIN':
          return authApi.loginSuperAdmin(loginData);
        case 'ADMIN':
          return authApi.loginAdmin(loginData);
        case 'ORGANIZATION':
          return authApi.loginOrganization(loginData);
        default:
          throw new Error('Invalid user type for web dashboard');
      }
    }
    
    // Fallback to legacy endpoint for backward compatibility
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  },

  // Multi-tier refresh token methods
  refreshSuperAdminToken: async (refreshToken: string): Promise<{ tokens: { accessToken: string; refreshToken: string } }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.WEB.SUPER_ADMIN.REFRESH_TOKEN, { refreshToken });
    return response.data;
  },

  refreshAdminToken: async (refreshToken: string): Promise<{ tokens: { accessToken: string; refreshToken: string } }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.WEB.ADMIN.REFRESH_TOKEN, { refreshToken });
    return response.data;
  },

  refreshOrganizationToken: async (refreshToken: string): Promise<{ tokens: { accessToken: string; refreshToken: string } }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.WEB.ORGANIZATION.REFRESH_TOKEN, { refreshToken });
    return response.data;
  },

  // Unified refresh token method
  refreshToken: async (refreshToken: string, userType?: UserType): Promise<{ tokens: { accessToken: string; refreshToken: string } }> => {
    if (userType) {
      switch (userType) {
        case 'SUPER_ADMIN':
          return authApi.refreshSuperAdminToken(refreshToken);
        case 'ADMIN':
          return authApi.refreshAdminToken(refreshToken);
        case 'ORGANIZATION':
          return authApi.refreshOrganizationToken(refreshToken);
        default:
          throw new Error('Invalid user type for token refresh');
      }
    }
    
    // Fallback to legacy endpoint
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
    return response.data;
  },

  // Multi-tier logout methods
  logoutSuperAdmin: async (): Promise<{ message: string }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.WEB.SUPER_ADMIN.LOGOUT);
    return response.data;
  },

  logoutAdmin: async (): Promise<{ message: string }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.WEB.ADMIN.LOGOUT);
    return response.data;
  },

  logoutOrganization: async (): Promise<{ message: string }> => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.WEB.ORGANIZATION.LOGOUT);
    return response.data;
  },

  // Register user (legacy - not used in web dashboard for multi-tier)
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, data);
      return response.data;
    } catch (error: any) {
      throw new Error(getContextualErrorMessage(error, 'register'));
    }
  },

  // Get current user
  getMe: async (): Promise<User> => {
    const response = await axiosInstance.get(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },

  // Get user profile
  getProfile: async (): Promise<{ user: User }> => {
    const response = await axiosInstance.get(API_ENDPOINTS.AUTH.PROFILE);
    return response.data;
  },

  // Unified logout method
  logout: async (userType?: UserType): Promise<{ message: string }> => {
    if (userType) {
      try {
        switch (userType) {
          case 'SUPER_ADMIN':
            return await authApi.logoutSuperAdmin();
          case 'ADMIN':
            return await authApi.logoutAdmin();
          case 'ORGANIZATION':
            return await authApi.logoutOrganization();
          default:
            throw new Error('Invalid user type for logout');
        }
      } catch (error) {
        // If specific logout fails (e.g., token expired), fall back to general logout
        console.warn('Specific logout failed, falling back to general logout:', error);
      }
    }
    
    // Fallback to legacy endpoint (always works even without valid token)
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response.data;
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