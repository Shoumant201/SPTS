import axiosInstance from '../axiosInstance';

export interface BusLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  recordedAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  capacity: number;
}

export interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
}

export interface BusRoute {
  id: string;
  name: string;
  routeNumber: string | null;
  startPoint: string;
  endPoint: string;
  basePrice: number;
  stops?: RouteStop[];
}

export interface NearbyBus {
  id: string;
  driverId: string;
  driverName: string | null;
  driverPhone: string;
  vehicle: Vehicle;
  route: BusRoute;
  location: BusLocation;
  distance: number;
  eta: number;
  etaText: string;
}

export interface NearbyBusesResponse {
  success: boolean;
  count: number;
  buses: NearbyBus[];
  searchLocation: {
    latitude: number;
    longitude: number;
  };
  radiusKm: number;
}

export interface BusLocationResponse {
  success: boolean;
  location: BusLocation & {
    driver: {
      id: string;
      name: string | null;
      assignments: any[];
    };
  };
}

export const busApi = {
  // Get nearby buses based on passenger location
  getNearbyBuses: async (
    latitude: number,
    longitude: number,
    radius: number = 5
  ): Promise<NearbyBusesResponse> => {
    const response = await axiosInstance.get('/api/buses/nearby', {
      params: { latitude, longitude, radius },
    });
    return response.data;
  },

  // Get specific bus location
  getBusLocation: async (busId: string): Promise<BusLocationResponse> => {
    const response = await axiosInstance.get(`/api/buses/${busId}/location`);
    return response.data;
  },

  // Get all buses on a specific route
  getBusesByRoute: async (routeId: string) => {
    const response = await axiosInstance.get(`/api/buses/route/${routeId}`);
    return response.data;
  },
};
