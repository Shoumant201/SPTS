import axiosInstance from '../axiosInstance';

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export type Day = typeof DAYS[number];

export interface Assignment {
  id: string;
  organizationId: string;
  vehicleId: string;
  driverId: string;
  routeId: string;
  departureTime: string;
  days: Day[];
  status: 'ACTIVE' | 'SUSPENDED' | 'COMPLETED';
  notes: string | null;
  vehicle: { id: string; plateNumber: string; type: string; capacity: number };
  driver: { id: string; name: string | null; phone: string };
  route: { id: string; name: string; routeNumber: string | null; startPoint: string; endPoint: string; distance: number };
  createdAt: string;
}

export interface CreateAssignmentData {
  vehicleId: string;
  driverId: string;
  routeId: string;
  departureTime: string;
  days: Day[];
  notes?: string;
}

export const assignmentsApi = {
  getAll: async (): Promise<Assignment[]> => {
    const res = await axiosInstance.get('/api/assignments');
    return res.data.assignments;
  },
  create: async (data: CreateAssignmentData): Promise<Assignment> => {
    const res = await axiosInstance.post('/api/assignments', data);
    return res.data.assignment;
  },
  update: async (id: string, data: Partial<CreateAssignmentData> & { status?: string }): Promise<Assignment> => {
    const res = await axiosInstance.put(`/api/assignments/${id}`, data);
    return res.data.assignment;
  },
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/assignments/${id}`);
  },
};
