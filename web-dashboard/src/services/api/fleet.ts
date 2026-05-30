import axiosInstance from '../axiosInstance';

export interface IoTDevice {
  id: string;
  deviceId: string;
  deviceToken?: string; // Only returned on creation
  status: 'ACTIVE' | 'INACTIVE' | 'OFFLINE';
  lastSeenAt: string | null;
  passengerCount: number;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  capacity: number;
  type: 'BUS' | 'MINIBUS' | 'TAXI';
  model: string | null;
  year: number | null;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  organizationId: string | null;
  organization?: { id: string; name: string };
  iotDevice: IoTDevice | null;
  createdAt: string;
}

export interface CreateVehicleData {
  plateNumber: string;
  capacity: number;
  type: 'BUS' | 'MINIBUS' | 'TAXI';
  model?: string;
  year?: number;
  iotDeviceId: string;
}

export const fleetApi = {
  getVehicles: async (): Promise<Vehicle[]> => {
    const res = await axiosInstance.get('/api/fleet');
    return res.data.vehicles;
  },

  getVehicle: async (id: string): Promise<Vehicle> => {
    const res = await axiosInstance.get(`/api/fleet/${id}`);
    return res.data.vehicle;
  },

  createVehicle: async (data: CreateVehicleData): Promise<{ vehicle: Vehicle; note: string }> => {
    const res = await axiosInstance.post('/api/fleet', data);
    return res.data;
  },

  updateVehicle: async (id: string, data: Partial<CreateVehicleData & { status: string }>): Promise<Vehicle> => {
    const res = await axiosInstance.put(`/api/fleet/${id}`, data);
    return res.data.vehicle;
  },

  deleteVehicle: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/fleet/${id}`);
  },

  regenerateDeviceToken: async (vehicleId: string): Promise<{ deviceToken: string; note: string }> => {
    const res = await axiosInstance.post(`/api/fleet/${vehicleId}/regenerate-token`);
    return res.data;
  },
};
