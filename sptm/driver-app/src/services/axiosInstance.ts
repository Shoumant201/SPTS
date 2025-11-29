import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { SafeAsyncStorage } from '../utils/safeAsyncStorage';

const BASE_URL = 'http://192.168.1.68:3001'; // Your computer's IP address

// Create axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Context': 'driver-app', // Add app context header
  },
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Token storage helpers
const getTokens = async () => {
  try {
    const accessToken = await SafeAsyncStorage.getItem('accessToken') || await SafeAsyncStorage.getItem('token');
    const refreshToken = await SafeAsyncStorage.getItem('refreshToken');
    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error getting tokens from AsyncStorage:', error);
    return { accessToken: null, refreshToken: null };
  }
};

const storeTokens = async (tokens: { accessToken: string; refreshToken: string }) => {
  try {
    // Validate tokens before storing
    if (!tokens.accessToken || !tokens.refreshToken) {
      console.error('Cannot store undefined tokens');
      return;
    }
    
    await SafeAsyncStorage.multiSet([
      ['accessToken', tokens.accessToken],
      ['refreshToken', tokens.refreshToken],
      ['token', tokens.accessToken], // Keep legacy token for backward compatibility
    ]);
  } catch (error) {
    console.error('Error storing tokens in AsyncStorage:', error);
  }
};

const clearTokens = async () => {
  try {
    await SafeAsyncStorage.multiRemove(['accessToken', 'refreshToken', 'token', 'user']);
  } catch (error) {
    console.error('Error clearing tokens from AsyncStorage:', error);
  }
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const { accessToken } = await getTokens();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.error('Error getting token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = await getTokens();
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Import authApi dynamically to avoid circular dependency
        const { authApi } = await import('./api/auth');
        const response = await authApi.refreshToken(refreshToken);
        
        // Validate tokens before storing
        if (response.tokens && response.tokens.accessToken && response.tokens.refreshToken) {
          await storeTokens(response.tokens);
        } else {
          throw new Error('Invalid token response from server');
        }
        
        // Update the authorization header for the original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${response.tokens.accessToken}`;
        }
        
        processQueue(null, response.tokens.accessToken);
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        
        // You might want to navigate to login screen here
        // NavigationService.navigate('Login');
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For other 401 errors or if refresh fails
    if (error.response?.status === 401) {
      await clearTokens();
      // Navigate to login screen
      // NavigationService.navigate('Login');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;