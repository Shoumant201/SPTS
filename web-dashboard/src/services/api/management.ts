import axiosInstance from '../axiosInstance';

// Types
export interface Admin {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  _count?: {
    organizations: number;
  };
}

export interface Organization {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  licenseNumber?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  _count?: {
    users: number;
    vehicles: number;
  };
}

export interface CreateAdminData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface UpdateAdminData {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  isActive?: boolean;
}

export interface CreateOrganizationData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  licenseNumber?: string;
  adminId?: string;
}

export interface UpdateOrganizationData {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  address?: string;
  licenseNumber?: string;
  isActive?: boolean;
}

// Super Admin API - Admin Management
export const superAdminApi = {
  // Admin CRUD
  getAdmins: async (): Promise<{ admins: Admin[] }> => {
    const response = await axiosInstance.get('/api/super-admin/admins');
    return response.data;
  },

  getAdmin: async (id: string): Promise<{ admin: Admin }> => {
    const response = await axiosInstance.get(`/api/super-admin/admins/${id}`);
    return response.data;
  },

  createAdmin: async (data: CreateAdminData): Promise<{ message: string; admin: Admin }> => {
    const response = await axiosInstance.post('/api/super-admin/admins', data);
    return response.data;
  },

  updateAdmin: async (id: string, data: UpdateAdminData): Promise<{ message: string; admin: Admin }> => {
    const response = await axiosInstance.put(`/api/super-admin/admins/${id}`, data);
    return response.data;
  },

  deleteAdmin: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/api/super-admin/admins/${id}`);
    return response.data;
  },

  // Organization CRUD (Super Admin)
  getOrganizations: async (): Promise<{ organizations: Organization[] }> => {
    const response = await axiosInstance.get('/api/super-admin/organizations');
    return response.data;
  },

  getOrganization: async (id: string): Promise<{ organization: Organization }> => {
    const response = await axiosInstance.get(`/api/super-admin/organizations/${id}`);
    return response.data;
  },

  createOrganization: async (data: CreateOrganizationData): Promise<{ message: string; organization: Organization }> => {
    const response = await axiosInstance.post('/api/super-admin/organizations', data);
    return response.data;
  },

  updateOrganization: async (id: string, data: UpdateOrganizationData): Promise<{ message: string; organization: Organization }> => {
    const response = await axiosInstance.put(`/api/super-admin/organizations/${id}`, data);
    return response.data;
  },

  deleteOrganization: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/api/super-admin/organizations/${id}`);
    return response.data;
  },
};

// Admin API - Organization Management
export const adminApi = {
  getOrganizations: async (): Promise<{ organizations: Organization[] }> => {
    const response = await axiosInstance.get('/api/admin/organizations');
    return response.data;
  },

  getOrganization: async (id: string): Promise<{ organization: Organization }> => {
    const response = await axiosInstance.get(`/api/admin/organizations/${id}`);
    return response.data;
  },

  createOrganization: async (data: CreateOrganizationData): Promise<{ message: string; organization: Organization }> => {
    const response = await axiosInstance.post('/api/admin/organizations', data);
    return response.data;
  },

  updateOrganization: async (id: string, data: UpdateOrganizationData): Promise<{ message: string; organization: Organization }> => {
    const response = await axiosInstance.put(`/api/admin/organizations/${id}`, data);
    return response.data;
  },

  deleteOrganization: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/api/admin/organizations/${id}`);
    return response.data;
  },
};
