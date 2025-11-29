export const API_ENDPOINTS = {
  // Auth endpoints - Multi-tier authentication
  AUTH: {
    // Web dashboard specific endpoints
    WEB: {
      SUPER_ADMIN: {
        LOGIN: '/api/auth/web/super-admin/login',
        REFRESH_TOKEN: '/api/auth/web/super-admin/refresh-token',
        LOGOUT: '/api/auth/web/super-admin/logout',
      },
      ADMIN: {
        LOGIN: '/api/auth/web/admin/login',
        REFRESH_TOKEN: '/api/auth/web/admin/refresh-token',
        LOGOUT: '/api/auth/web/admin/logout',
      },
      ORGANIZATION: {
        LOGIN: '/api/auth/web/organization/login',
        REFRESH_TOKEN: '/api/auth/web/organization/refresh-token',
        LOGOUT: '/api/auth/web/organization/logout',
      },
    },
    // Legacy/unified endpoints (for backward compatibility)
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    PROFILE: '/api/auth/profile',
    CHANGE_PASSWORD: '/api/auth/change-password',
    REFRESH_TOKEN: '/api/auth/refresh-token',
  },
  
  // Organization endpoints
  ORGANIZATIONS: {
    LIST: '/api/organizations',
    CREATE: '/api/organizations',
    GET_BY_ID: (id: string) => `/api/organizations/${id}`,
    UPDATE: (id: string) => `/api/organizations/${id}`,
    DELETE: (id: string) => `/api/organizations/${id}`,
  },
  
  // User endpoints
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    GET_BY_ID: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
  },
  
  // Trip endpoints
  TRIPS: {
    LIST: '/api/trips',
    CREATE: '/api/trips',
    GET_BY_ID: (id: string) => `/api/trips/${id}`,
    UPDATE: (id: string) => `/api/trips/${id}`,
    DELETE: (id: string) => `/api/trips/${id}`,
  },
  
  // Vehicle endpoints
  VEHICLES: {
    LIST: '/api/vehicles',
    CREATE: '/api/vehicles',
    GET_BY_ID: (id: string) => `/api/vehicles/${id}`,
    UPDATE: (id: string) => `/api/vehicles/${id}`,
    DELETE: (id: string) => `/api/vehicles/${id}`,
  },
  
  // Route endpoints
  ROUTES: {
    LIST: '/api/routes',
    CREATE: '/api/routes',
    GET_BY_ID: (id: string) => `/api/routes/${id}`,
    UPDATE: (id: string) => `/api/routes/${id}`,
    DELETE: (id: string) => `/api/routes/${id}`,
  },
} as const;