import axiosInstance from '../axiosInstance';
import { User } from './auth';

export interface UpdateProfileData {
  name?: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileUser extends User {
  phone?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  // Organization-specific fields
  address?: string;
  licenseNumber?: string;
}

export interface ProfileResponse {
  message: string;
  user: ProfileUser;
}

export const profileApi = {
  // Get current user profile
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await axiosInstance.get('/api/profile');
    return response.data;
  },

  // Update profile information
  updateProfile: async (data: UpdateProfileData): Promise<ProfileResponse> => {
    const response = await axiosInstance.put('/api/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    const response = await axiosInstance.put('/api/profile/password', data);
    return response.data;
  },
};