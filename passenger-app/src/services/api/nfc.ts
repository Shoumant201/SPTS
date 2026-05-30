import axiosInstance from '../axiosInstance';

export interface ActiveRide {
  id: string;
  userId: string;
  routeId: string;
  vehicleId: string | null;
  driverId: string | null;
  tapInTransactionId: string;
  estimatedFare: number;
  actualFare: number | null;
  status: string;
  tapInAt: string;
  tapOutAt: string | null;
  route?: {
    id: string;
    name: string;
    routeNumber: string | null;
    startPoint: string;
    endPoint: string;
    basePrice: number;
  };
  vehicle?: {
    id: string;
    plateNumber: string;
    type: string;
  };
}

export interface RegisterNFCResponse {
  message: string;
  nfcId: string;
}

export interface ActiveRideResponse {
  activeRide: ActiveRide | null;
}

/**
 * Register NFC ID for the authenticated passenger
 */
export const registerNFC = async (nfcId: string): Promise<RegisterNFCResponse> => {
  const response = await axiosInstance.post('/nfc/register', { nfcId });
  return response.data;
};

/**
 * Get the passenger's active ride (if any)
 */
export const getActiveRide = async (): Promise<ActiveRideResponse> => {
  const response = await axiosInstance.get('/nfc/active-ride');
  return response.data;
};

/**
 * Check if passenger has an active ride
 */
export const hasActiveRide = async (): Promise<boolean> => {
  try {
    const { activeRide } = await getActiveRide();
    return activeRide !== null && activeRide.status === 'ACTIVE';
  } catch (error) {
    console.error('Error checking active ride:', error);
    return false;
  }
};
