import axiosInstance from '../axiosInstance';

export interface TripHistoryItem {
  id: string;
  routeName: string;
  routeNumber: string | null;
  vehiclePlateNumber: string | null;
  driverName: string | null;
  tapInLocation: string | null;
  tapOutLocation: string | null;
  tapInAt: string;
  tapOutAt: string | null;
  duration: number | null; // in minutes
  distance: number | null; // in km
  estimatedFare: number;
  actualFare: number | null;
  discountApplied: number;
  finalFare: number;
  status: string;
}

export interface TripStatistics {
  totalTrips: number;
  totalSpent: number;
  totalSaved: number;
  averageFare: number;
  totalDistance: number;
  totalDuration: number;
  mostUsedRoute: string | null;
}

export interface TripReceipt {
  id: string;
  tripId: string;
  receiptNumber: string;
  date: string;
  route: {
    name: string;
    number: string | null;
  };
  from: string;
  to: string;
  distance: number;
  duration: number;
  baseFare: number;
  discount: number;
  finalFare: number;
  paymentMethod: string;
  transactionId: string;
}

export const tripHistoryApi = {
  // Get trip history
  getHistory: async (params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    trips: TripHistoryItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> => {
    const response = await axiosInstance.get('/api/wallet/tap-history', { params });
    return response.data;
  },

  // Get trip statistics
  getStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    success: boolean;
    statistics: TripStatistics;
  }> => {
    const response = await axiosInstance.get('/api/trips/statistics', { params });
    return response.data;
  },

  // Get trip receipt
  getReceipt: async (tripId: string): Promise<{
    success: boolean;
    receipt: TripReceipt;
  }> => {
    const response = await axiosInstance.get(`/api/trips/${tripId}/receipt`);
    return response.data;
  },

  // Export trip history
  exportHistory: async (params?: {
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'pdf';
  }): Promise<{
    success: boolean;
    downloadUrl: string;
  }> => {
    const response = await axiosInstance.post('/api/trips/export', params);
    return response.data;
  },
};
