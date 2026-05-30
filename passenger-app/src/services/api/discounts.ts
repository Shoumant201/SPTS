import axiosInstance from '../axiosInstance';

export type DiscountType = 'STUDENT' | 'ELDERLY' | 'DISABLED' | 'VETERAN' | 'LOW_INCOME';
export type DiscountStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'SUSPENDED';

export interface DiscountApplication {
  id: string;
  userId: string;
  type: DiscountType;
  status: DiscountStatus;
  discountPercentage: number;
  documentUrl?: string;
  documentType?: string;
  idNumber?: string;
  institutionName?: string;
  expiryDate?: string;
  reason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  appliedAt: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string | null;
    phone: string;
  };
  reviewer?: {
    id: string;
    name: string | null;
  };
}

export interface ApplyDiscountData {
  type: DiscountType;
  idNumber?: string;
  institutionName?: string;
  expiryDate?: string;
  reason?: string;
  documentUrl?: string;
  documentType?: string;
}

export interface FareCalculation {
  baseFare: number;
  discountPercentage: number;
  discountAmount: number;
  finalFare: number;
  discountType: DiscountType | null;
  hasDiscount: boolean;
}

export const discountApi = {
  // Apply for discount
  applyForDiscount: async (data: ApplyDiscountData): Promise<{
    success: boolean;
    message: string;
    application: DiscountApplication;
  }> => {
    const response = await axiosInstance.post('/api/discounts/apply', data);
    return response.data;
  },

  // Get my applications
  getMyApplications: async (): Promise<{
    success: boolean;
    applications: DiscountApplication[];
  }> => {
    const response = await axiosInstance.get('/api/discounts/my-applications');
    return response.data;
  },

  // Get active discount
  getActiveDiscount: async (): Promise<{
    success: boolean;
    discount: DiscountApplication | null;
    hasActiveDiscount: boolean;
  }> => {
    const response = await axiosInstance.get('/api/discounts/active');
    return response.data;
  },

  // Get application by ID
  getApplicationById: async (id: string): Promise<{
    success: boolean;
    application: DiscountApplication;
  }> => {
    const response = await axiosInstance.get(`/api/discounts/application/${id}`);
    return response.data;
  },

  // Cancel application
  cancelApplication: async (id: string): Promise<{
    success: boolean;
    message: string;
    application: DiscountApplication;
  }> => {
    const response = await axiosInstance.post(`/api/discounts/cancel/${id}`);
    return response.data;
  },

  // Calculate fare with discount
  calculateFare: async (baseFare: number): Promise<{
    success: boolean;
  } & FareCalculation> => {
    const response = await axiosInstance.post('/api/discounts/calculate-fare', { baseFare });
    return response.data;
  },
};
