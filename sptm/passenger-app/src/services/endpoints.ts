export const API_ENDPOINTS = {
  // Auth endpoints - Mobile Passenger App specific
  AUTH: {
    LOGIN: '/api/auth/mobile/passenger/login',
    REGISTER: '/api/auth/mobile/passenger/register',
    REFRESH_TOKEN: '/api/auth/mobile/passenger/refresh-token',
    LOGOUT: '/api/auth/mobile/passenger/logout',
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
  },
  
  // Route endpoints
  ROUTES: {
    LIST: '/api/routes',
    GET_BY_ID: (id: string) => `/api/routes/${id}`,
    SEARCH: '/api/routes/search',
  },
  
  // Discount endpoints
  DISCOUNTS: {
    PROFILE: '/api/discounts/profile',
    APPLY: '/api/discounts/apply',
    VERIFY: '/api/discounts/verify',
  },
  
  // Vehicle endpoints
  VEHICLES: {
    LIST: '/api/vehicles',
    GET_BY_ID: (id: string) => `/api/vehicles/${id}`,
    NEARBY: '/api/vehicles/nearby',
  },
} as const;