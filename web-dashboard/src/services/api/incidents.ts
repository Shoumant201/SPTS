import axiosInstance from '../axiosInstance';

export interface IncidentReport {
  id: string;
  type: 'BREAKDOWN' | 'ACCIDENT' | 'DELAY' | 'TRAFFIC' | 'WEATHER' | 'MEDICAL' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REPORTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  title: string;
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  reportedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  estimatedDelay?: number;
  affectedPassengers?: number;
  requiresAssistance: boolean;
  isEmergency: boolean;
  driver: {
    id: string;
    name: string;
    phone: string;
  };
  vehicle?: {
    id: string;
    plateNumber: string;
    type: string;
  };
  route?: {
    id: string;
    name: string;
    routeNumber?: string;
    startPoint: string;
    endPoint: string;
  };
  assignment?: {
    id: string;
    departureTime: string;
  };
}

export const incidentApi = {
  /**
   * Get organization incidents
   */
  getOrganizationIncidents: async (params?: {
    status?: string;
    type?: string;
    severity?: string;
    driverId?: string;
    limit?: number;
  }) => {
    const response = await axiosInstance.get('/api/incidents/organization', { params });
    return response.data;
  },

  /**
   * Get active/unresolved incidents
   */
  getActiveIncidents: async () => {
    const response = await axiosInstance.get('/api/incidents/active');
    return response.data;
  },

  /**
   * Get incident details
   */
  getIncidentDetails: async (id: string) => {
    const response = await axiosInstance.get(`/api/incidents/${id}`);
    return response.data;
  },

  /**
   * Update incident status
   */
  updateIncidentStatus: async (id: string, status: string, resolutionNotes?: string) => {
    const response = await axiosInstance.patch(`/api/incidents/${id}/status`, {
      status,
      resolutionNotes,
    });
    return response.data;
  },

  /**
   * Get incident statistics
   */
  getIncidentStats: async (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axiosInstance.get('/api/incidents/stats', { params });
    return response.data;
  },
};
