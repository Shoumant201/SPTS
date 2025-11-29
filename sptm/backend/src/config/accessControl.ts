/**
 * Access Control Matrix Configuration
 * Defines permissions and boundaries for each user type in the multi-tier authentication system
 */

export interface AccessControlConfig {
  canAccess: string[];
  canManage: string[];
  organizationBoundary: boolean;
  permissions: string[];
}

export const ACCESS_CONTROL_MATRIX: Record<string, AccessControlConfig> = {
  SUPER_ADMIN: {
    canAccess: ['*'],
    canManage: ['admins', 'organizations', 'users', 'system', 'routes', 'vehicles', 'trips', 'discounts'],
    organizationBoundary: false,
    permissions: ['*']
  },
  ADMIN: {
    canAccess: ['organizations', 'users', 'routes', 'vehicles', 'trips', 'discounts', 'system-metrics'],
    canManage: ['organizations', 'routes', 'discount-configs', 'verification-requests'],
    organizationBoundary: false,
    permissions: [
      'organizations:read',
      'organizations:create',
      'organizations:update',
      'users:read',
      'routes:read',
      'routes:create',
      'routes:update',
      'routes:delete',
      'vehicles:read',
      'trips:read',
      'discounts:read',
      'discounts:manage',
      'verification:approve',
      'verification:reject',
      'system:metrics'
    ]
  },
  ORGANIZATION: {
    canAccess: ['drivers', 'vehicles', 'routes', 'trips', 'organization-data'],
    canManage: ['drivers', 'vehicles', 'organization-profile'],
    organizationBoundary: true,
    permissions: [
      'drivers:read',
      'drivers:create',
      'drivers:update',
      'drivers:delete',
      'vehicles:read',
      'vehicles:create',
      'vehicles:update',
      'vehicles:delete',
      'routes:read',
      'trips:read',
      'organization:read',
      'organization:update'
    ]
  },
  DRIVER: {
    canAccess: ['own-profile', 'assigned-vehicle', 'assigned-routes', 'own-trips'],
    canManage: ['own-profile'],
    organizationBoundary: true,
    permissions: [
      'profile:read',
      'profile:update',
      'vehicle:read',
      'routes:read',
      'trips:read',
      'trips:update-status'
    ]
  },
  PASSENGER: {
    canAccess: ['own-profile', 'trips', 'routes', 'discount-profile'],
    canManage: ['own-profile', 'discount-profile'],
    organizationBoundary: false,
    permissions: [
      'profile:read',
      'profile:update',
      'trips:read',
      'trips:create',
      'routes:read',
      'discounts:read',
      'discounts:apply',
      'verification:submit'
    ]
  }
};

// Role hierarchy for access control
export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  ORGANIZATION: 2,
  DRIVER: 1,
  PASSENGER: 1
} as const;

/**
 * Resource-based access control mapping
 * Maps API resources to required permissions
 */
export const RESOURCE_PERMISSIONS: Record<string, Record<string, string[]>> = {
  // Admin management (Super Admin only)
  '/api/admin': {
    GET: ['admins:read'],
    POST: ['admins:create'],
    PUT: ['admins:update'],
    DELETE: ['admins:delete']
  },
  
  // Organization management
  '/api/organizations': {
    GET: ['organizations:read'],
    POST: ['organizations:create'],
    PUT: ['organizations:update'],
    DELETE: ['organizations:delete']
  },
  
  // User/Driver management
  '/api/users': {
    GET: ['users:read'],
    POST: ['users:create'],
    PUT: ['users:update'],
    DELETE: ['users:delete']
  },
  
  // Vehicle management
  '/api/vehicles': {
    GET: ['vehicles:read'],
    POST: ['vehicles:create'],
    PUT: ['vehicles:update'],
    DELETE: ['vehicles:delete']
  },
  
  // Route management
  '/api/routes': {
    GET: ['routes:read'],
    POST: ['routes:create'],
    PUT: ['routes:update'],
    DELETE: ['routes:delete']
  },
  
  // Trip management
  '/api/trips': {
    GET: ['trips:read'],
    POST: ['trips:create'],
    PUT: ['trips:update'],
    DELETE: ['trips:delete']
  },
  
  // Discount management
  '/api/discounts': {
    GET: ['discounts:read'],
    POST: ['discounts:create'],
    PUT: ['discounts:update'],
    DELETE: ['discounts:delete']
  },
  
  // Verification management
  '/api/verification': {
    GET: ['verification:read'],
    POST: ['verification:submit'],
    PUT: ['verification:approve', 'verification:reject']
  }
};

/**
 * Context-based access control
 * Defines which user types can access which application contexts
 */
export const CONTEXT_ACCESS_CONTROL = {
  web: ['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION'],
  'mobile-driver': ['DRIVER'],
  'mobile-passenger': ['PASSENGER']
} as const;

/**
 * Organization boundary enforcement rules
 * Defines which user types must respect organization boundaries
 */
export const ORGANIZATION_BOUNDARY_RULES = {
  SUPER_ADMIN: false,  // Can access all organizations
  ADMIN: false,        // Can access all organizations
  ORGANIZATION: true,  // Can only access own organization
  DRIVER: true,        // Can only access own organization data
  PASSENGER: false     // Not bound to specific organization
} as const;

/**
 * Get permissions for a user type
 */
export function getPermissionsForUserType(userType: string): string[] {
  const config = ACCESS_CONTROL_MATRIX[userType];
  return config ? config.permissions : [];
}

/**
 * Check if user type has specific permission
 */
export function hasPermission(userType: string, permission: string): boolean {
  const permissions = getPermissionsForUserType(userType);
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Check if user type can access resource
 */
export function canAccessResource(userType: string, resource: string): boolean {
  const config = ACCESS_CONTROL_MATRIX[userType];
  if (!config) return false;
  
  return config.canAccess.includes('*') || config.canAccess.includes(resource);
}

/**
 * Check if user type can manage resource
 */
export function canManageResource(userType: string, resource: string): boolean {
  const config = ACCESS_CONTROL_MATRIX[userType];
  if (!config) return false;
  
  return config.canManage.includes('*') || config.canManage.includes(resource);
}

/**
 * Check if user type must respect organization boundaries
 */
export function hasOrganizationBoundary(userType: string): boolean {
  return ORGANIZATION_BOUNDARY_RULES[userType as keyof typeof ORGANIZATION_BOUNDARY_RULES] || false;
}

/**
 * Get required permissions for a resource and HTTP method
 */
export function getRequiredPermissions(resource: string, method: string): string[] {
  const resourcePerms = RESOURCE_PERMISSIONS[resource];
  if (!resourcePerms) return [];
  
  return resourcePerms[method.toUpperCase()] || [];
}

/**
 * Validate if user can access context
 */
export function canAccessContext(userType: string, context: string): boolean {
  const allowedUserTypes = CONTEXT_ACCESS_CONTROL[context as keyof typeof CONTEXT_ACCESS_CONTROL];
  if (!allowedUserTypes) return false;
  
  return (allowedUserTypes as readonly string[]).includes(userType);
}