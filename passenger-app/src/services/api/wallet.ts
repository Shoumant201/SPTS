import axiosInstance from '../axiosInstance';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'TAP_IN' | 'TAP_OUT' | 'TOP_UP' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  description: string | null;
  route?: { name: string; routeNumber: string | null };
  vehicle?: { plateNumber: string };
  createdAt: string;
}

export interface TapSession {
  id: string;
  userId: string;
  routeId: string;
  vehicleId: string | null;
  driverId: string | null;
  tapInLocation: string | null;
  tapOutLocation: string | null;
  estimatedFare: number;
  actualFare: number | null;
  duration: number | null;
  status: string;
  tapInAt: string;
  tapOutAt: string | null;
  route: {
    name: string;
    routeNumber: string | null;
  };
  vehicle?: {
    plateNumber: string;
  };
  driver?: {
    name: string | null;
  };
}

export const walletApi = {
  // Get wallet
  getWallet: async (): Promise<{ success: boolean; wallet: Wallet }> => {
    const response = await axiosInstance.get('/api/wallet');
    return response.data;
  },

  // Top up wallet
  topUp: async (amount: number): Promise<{ success: boolean; wallet: Wallet; transaction: WalletTransaction }> => {
    const response = await axiosInstance.post('/api/wallet/topup', { amount });
    return response.data;
  },

  // Get transactions
  getTransactions: async (): Promise<{ success: boolean; transactions: WalletTransaction[] }> => {
    const response = await axiosInstance.get('/api/wallet/transactions');
    return response.data;
  },

  // Tap in
  tapIn: async (data: {
    routeId: string;
    vehicleId?: string;
    driverId?: string;
    latitude?: number;
    longitude?: number;
    location?: string;
  }): Promise<{ success: boolean; session: TapSession; message: string }> => {
    const response = await axiosInstance.post('/api/wallet/tap-in', data);
    return response.data;
  },

  // Tap out
  tapOut: async (data: {
    latitude?: number;
    longitude?: number;
    location?: string;
  }): Promise<{ success: boolean; session: TapSession; message: string }> => {
    const response = await axiosInstance.post('/api/wallet/tap-out', data);
    return response.data;
  },

  // Get active session
  getActiveSession: async (): Promise<{ success: boolean; session: TapSession | null }> => {
    const response = await axiosInstance.get('/api/wallet/active-session');
    return response.data;
  },

  // Get tap history
  getTapHistory: async (): Promise<{ success: boolean; sessions: TapSession[] }> => {
    const response = await axiosInstance.get('/api/wallet/tap-history');
    return response.data;
  },
};
