import axiosInstance from '../axiosInstance';

export interface RouteStop {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
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
  organizationId: string | null;
  organization?: { id: string; name: string };
  stops: RouteStop[];
  _count?: { trips: number };
  createdAt: string;
}

export interface CreateRouteData {
  name: string;
  routeNumber?: string;
  description?: string;
  basePrice: number;
  stops: RouteStop[];
}

export const routesApi = {
  getRoutes: async (): Promise<Route[]> => {
    const res = await axiosInstance.get('/api/routes');
    return res.data.routes;
  },

  getRoute: async (id: string): Promise<Route> => {
    const res = await axiosInstance.get(`/api/routes/${id}`);
    return res.data.route;
  },

  createRoute: async (data: CreateRouteData): Promise<Route> => {
    const res = await axiosInstance.post('/api/routes', data);
    return res.data.route;
  },

  updateRoute: async (id: string, data: Partial<CreateRouteData> & { isActive?: boolean }): Promise<Route> => {
    const res = await axiosInstance.put(`/api/routes/${id}`, data);
    return res.data.route;
  },

  deleteRoute: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/routes/${id}`);
  },
};
