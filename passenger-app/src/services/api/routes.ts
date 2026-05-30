import axiosInstance from '../axiosInstance';

export interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
}

export interface RouteOrganization {
  id: string;
  name: string;
}

export interface RouteAssignment {
  id: string;
  driver: {
    id: string;
    name: string | null;
  };
  vehicle: {
    plateNumber: string;
    type: string;
    capacity: number;
  };
}

export interface Route {
  id: string;
  name: string;
  routeNumber: string | null;
  description: string | null;
  startPoint: string;
  endPoint: string;
  distance: number;
  basePrice: number;
  isActive: boolean;
  stops: RouteStop[];
  organization: RouteOrganization | null;
  assignments?: RouteAssignment[];
  _count?: {
    trips?: number;
    assignments?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RoutesResponse {
  success: boolean;
  count: number;
  routes: Route[];
}

export interface RouteResponse {
  success: boolean;
  route: Route;
}

export interface SearchRoutesResponse extends RoutesResponse {
  searchQuery: string;
}

export const routeApi = {
  // Get all active routes
  getAllRoutes: async (params?: {
    search?: string;
    sortBy?: 'name' | 'price' | 'distance';
  }): Promise<RoutesResponse> => {
    const response = await axiosInstance.get('/api/routes/public', { params });
    return response.data;
  },

  // Search routes by destination
  searchRoutes: async (params: {
    destination: string;
    maxPrice?: number;
    minDistance?: number;
    maxDistance?: number;
  }): Promise<SearchRoutesResponse> => {
    const response = await axiosInstance.get('/api/routes/public/search', { params });
    return response.data;
  },

  // Get route details
  getRouteDetails: async (routeId: string): Promise<RouteResponse> => {
    const response = await axiosInstance.get(`/api/routes/public/${routeId}`);
    return response.data;
  },
};
