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

export interface Driver {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  isPhoneVerified: boolean;
  profile?: DriverProfile;
  hasExistingRequest?: boolean;
  existingRequestStatus?: string;
  joinedAt?: string;
}

export interface JoinRequest {
  id: string;
  organizationId: string;
  driverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  requestedBy: 'ORGANIZATION' | 'DRIVER';
  message?: string;
  responseNote?: string;
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  driver?: Driver;
  organization?: {
    id: string;
    name: string;
    phone?: string;
    email: string;
    address?: string;
    licenseNumber?: string;
  };
}

export const driverManagementApi = {
  // Organization APIs
  searchDrivers: async (query: string) => {
    const response = await axiosInstance.get('/api/driver-management/organization/search', {
      params: { query }
    });
    return response.data;
  },

  sendJoinRequest: async (driverId: string, message?: string) => {
    const response = await axiosInstance.post('/api/driver-management/organization/send-request', {
      driverId,
      message
    });
    return response.data;
  },

  getOrganizationRequests: async (status?: string) => {
    const response = await axiosInstance.get('/api/driver-management/organization/requests', {
      params: status ? { status } : {}
    });
    return response.data;
  },

  cancelJoinRequest: async (requestId: string) => {
    const response = await axiosInstance.delete(
      `/api/driver-management/organization/requests/${requestId}`
    );
    return response.data;
  },

  getOrganizationDrivers: async () => {
    const response = await axiosInstance.get('/api/driver-management/organization/drivers');
    return response.data;
  },

  removeDriver: async (driverId: string) => {
    const response = await axiosInstance.delete(
      `/api/driver-management/organization/drivers/${driverId}`
    );
    return response.data;
  },

  // Driver APIs
  getDriverProfile: async () => {
    const response = await axiosInstance.get('/api/driver-management/driver/profile');
    return response.data;
  },

  updateDriverProfile: async (profileData: Partial<DriverProfile>) => {
    const response = await axiosInstance.put('/api/driver-management/driver/profile', profileData);
    return response.data;
  },

  getDriverRequests: async (status?: string) => {
    const response = await axiosInstance.get('/api/driver-management/driver/requests', {
      params: status ? { status } : {}
    });
    return response.data;
  },

  respondToRequest: async (requestId: string, action: 'accept' | 'reject', responseNote?: string) => {
    const response = await axiosInstance.post(
      `/api/driver-management/driver/requests/${requestId}/respond`,
      { action, responseNote }
    );
    return response.data;
  }
};
