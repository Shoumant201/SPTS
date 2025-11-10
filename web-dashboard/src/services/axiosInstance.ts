import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { TokenStorageService } from './tokenStorage';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 1;
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

// Helper to check if URL is a refresh token endpoint
const isRefreshTokenEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return url.includes('/refresh-token') || url.includes('/refresh');
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenStorageService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // Reset refresh attempts on successful response
    refreshAttempts = 0;
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry if this is already a refresh token request that failed
    if (error.response?.status === 401 && isRefreshTokenEndpoint(originalRequest.url)) {
      console.error('Refresh token expired or invalid. Logging out...');
      isRefreshing = false;
      refreshAttempts = 0;
      TokenStorageService.clearTokens();
      
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      
      return Promise.reject(error);
    }

    // Handle 401 errors for regular requests
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if we've exceeded max refresh attempts
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.error('Max refresh attempts reached. Logging out...');
        isRefreshing = false;
        refreshAttempts = 0;
        TokenStorageService.clearTokens();
        
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        
        return Promise.reject(error);
      }

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
      refreshAttempts++;

      try {
        const refreshToken = TokenStorageService.getRefreshToken();
        const userType = TokenStorageService.getUserType();
        
        if (!refreshToken || !userType) {
          throw new Error('No refresh token available');
        }

        // Import authApi dynamically to avoid circular dependency
        const { authApi } = await import('./api/auth');
        const response = await authApi.refreshToken(refreshToken, userType);
        const storedUser = TokenStorageService.getUser();
        
        if (!storedUser) {
          throw new Error('No stored user data');
        }

        TokenStorageService.storeTokens(response.tokens, storedUser);
        
        // Update the authorization header for the original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${response.tokens.accessToken}`;
        }
        
        processQueue(null, response.tokens.accessToken);
        
        // Reset refresh attempts on success
        refreshAttempts = 0;
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        TokenStorageService.clearTokens();
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For other 401 errors or if refresh fails
    if (error.response?.status === 401) {
      TokenStorageService.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;