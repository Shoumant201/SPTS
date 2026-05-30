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
  vehicleId?: string;
  routeId?: string;
  assignmentId?: string;
  reportedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  estimatedDelay?: number;
  affectedPassengers?: number;
  requiresAssistance: boolean;
  isEmergency: boolean;
  vehicle?: {
    plateNumber: string;
    type: string;
  };
  route?: {
    name: string;
    routeNumber?: string;
  };
}

export interface ReportIncidentData {
  type: 'BREAKDOWN' | 'ACCIDENT' | 'DELAY' | 'TRAFFIC' | 'WEATHER' | 'MEDICAL' | 'OTHER';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  vehicleId?: string;
  routeId?: string;
  assignmentId?: string;
  estimatedDelay?: number;
  affectedPassengers?: number;
  requiresAssistance?: boolean;
  isEmergency?: boolean;
}

export const incidentApi = {
  /**
   * Report a new incident
   */
  reportIncident: async (data: ReportIncidentData) => {
    const response = await axiosInstance.post('/api/incidents/report', data);
    return response.data;
  },

  /**
   * Get driver's incident reports
   */
  getMyIncidents: async (status?: string, type?: string) => {
    const params: any = {};
    if (status) params.status = status;
    if (type) params.type = type;
    
    const response = await axiosInstance.get('/api/incidents/my', { params });
    return response.data;
  },

  /**
   * Get incident details
   */
  getIncidentDetails: async (id: string) => {
    const response = await axiosInstance.get(`/api/incidents/${id}`);
    return response.data;
  },
};
