import axiosInstance from '../axiosInstance';

export interface Trip {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  distance?: number;
  basePrice: number;
  finalPrice: number;
  driverEarnings?: number;
  passengerCount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  route: {
    name: string;
    routeNumber?: string;
    startPoint: string;
    endPoint: string;
    distance: number;
  };
  vehicle?: {
    plateNumber: string;
    type: string;
  };
  notes?: string;
}

export interface EarningsSummary {
  totalEarnings: number;
  totalRevenue: number;
  totalTrips: number;
  totalDistance: number;
  totalDuration: number;
  averageEarningsPerTrip: number;
}

export const tripApi = {
  /**
   * Start a new trip
   */
  startTrip: async (data: {
    routeId: string;
    vehicleId?: string;
    assignmentId?: string;
    startLocation?: string;
    passengerCount?: number;
  }) => {
    const response = await axiosInstance.post('/api/trips/start', data);
    return response.data;
  },

  /**
   * End active trip
   */
  endTrip: async (
    tripId: string,
    data: {
      endLocation?: string;
      passengerCount?: number;
      notes?: string;
    }
  ) => {
    const response = await axiosInstance.patch(`/api/trips/${tripId}/end`, data);
    return response.data;
  },

  /**
   * Get driver's trip history
   */
  getMyTrips: async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) => {
    const response = await axiosInstance.get('/api/trips/my', { params });
    return response.data;
  },

  /**
   * Get active trip
   */
  getActiveTrip: async () => {
    const response = await axiosInstance.get('/api/trips/active');
    return response.data;
  },

  /**
   * Get earnings summary
   */
  getEarnings: async (params?: {
    period?: 'today' | 'week' | 'month' | 'all';
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await axiosInstance.get('/api/trips/earnings', { params });
    return response.data;
  },

  /**
   * Get trip statistics
   */
  getTripStats: async (period?: 'today' | 'week' | 'month') => {
    const response = await axiosInstance.get('/api/trips/stats', {
      params: { period },
    });
    return response.data;
  },
};
