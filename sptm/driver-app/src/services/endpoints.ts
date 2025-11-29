export const API_ENDPOINTS = {
  // Auth endpoints - Mobile Driver App specific
  AUTH: {
    LOGIN: '/api/auth/mobile/driver/login',
    REGISTER: '/api/auth/mobile/driver/register',
    REFRESH_TOKEN: '/api/auth/mobile/driver/refresh-token',
    LOGOUT: '/api/auth/mobile/driver/logout',
    // Legacy endpoints for backward compatibility
    ME: '/api/auth/me',
    PROFILE: '/api/auth/profile',
    CHANGE_PASSWORD: '/api/auth/change-password',
    // Fallback unified endpoints
    UNIFIED_LOGIN: '/api/auth/login',
    UNIFIED_REGISTER: '/api/auth/register',
    UNIFIED_REFRESH: '/api/auth/refresh-token',
    UNIFIED_LOGOUT: '/api/auth/logout',
  },
  
  // Trip endpoints
  TRIPS: {
    LIST: '/api/trips',
    CREATE: '/api/trips',
    GET_BY_ID: (id: string) => `/api/trips/${id}`,
    UPDATE: (id: string) => `/api/trips/${id}`,
    DELETE: (id: string) => `/api/trips/${id}`,
    MY_TRIPS: '/api/trips/my',
    ASSIGNED: '/api/trips/assigned',
  },
  
  // Vehicle endpoints
  VEHICLES: {
    LIST: '/api/vehicles',
    GET_BY_ID: (id: string) => `/api/vehicles/${id}`,
    MY_VEHICLE: '/api/vehicles/my',
    UPDATE_STATUS: (id: string) => `/api/vehicles/${id}/status`,
    UPDATE_LOCATION: (id: string) => `/api/vehicles/${id}/location`,
  },
  
  // Route endpoints
  ROUTES: {
    LIST: '/api/routes',
    GET_BY_ID: (id: string) => `/api/routes/${id}`,
    ASSIGNED: '/api/routes/assigned',
  },
  
  // Driver-specific endpoints
  DRIVER: {
    STATUS: '/api/driver/status',
    LOCATION: '/api/driver/location',
    EARNINGS: '/api/driver/earnings',
    SCHEDULE: '/api/driver/schedule',
  },
  
  // Organization endpoints
  ORGANIZATIONS: {
    LIST: '/api/organizations',
    ACTIVE: '/api/organizations/active',
  },
} as const;