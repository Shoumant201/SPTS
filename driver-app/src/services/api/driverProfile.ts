import axiosInstance from '../axiosInstance';

export interface DriverProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  licenseType?: string;
  experience?: number;
  address?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  isAvailable: boolean;
  rating?: number;
  totalTrips: number;
}

export interface ValidateLicenseResponse {
  success: boolean;
  isValid: boolean;
  message?: string;
  error?: string;
  licenseData?: {
    licenseNumber: string;
    fullName: string;
    licenseType: string;
    expiryDate: string;
    bloodGroup?: string;
    address: string;
  };
}

export interface CreateProfileData {
  licenseNumber: string;
  licenseExpiryDate: string;
  licenseType?: string;
  experience?: number;
  address?: string;
  emergencyContact?: string;
  bloodGroup?: string;
}

export const driverProfileApi = {
  /**
   * Validate driver license against government database
   */
  validateLicense: async (licenseNumber: string): Promise<ValidateLicenseResponse> => {
    const response = await axiosInstance.post('/api/driver-management/driver/validate-license', {
      licenseNumber
    });
    return response.data;
  },

  /**
   * Get driver profile
   */
  getProfile: async () => {
    const response = await axiosInstance.get('/api/driver-management/driver/profile');
    return response.data;
  },

  /**
   * Create or update driver profile
   */
  createOrUpdateProfile: async (profileData: CreateProfileData) => {
    const response = await axiosInstance.put('/api/driver-management/driver/profile', profileData);
    return response.data;
  },

  /**
   * Get join requests
   */
  getJoinRequests: async (status?: string) => {
    const response = await axiosInstance.get('/api/driver-management/driver/requests', {
      params: status ? { status } : {}
    });
    return response.data;
  },

  /**
   * Respond to join request
   */
  respondToRequest: async (requestId: string, action: 'accept' | 'reject', responseNote?: string) => {
    const response = await axiosInstance.post(
      `/api/driver-management/driver/requests/${requestId}/respond`,
      { action, responseNote }
    );
    return response.data;
  }
};
