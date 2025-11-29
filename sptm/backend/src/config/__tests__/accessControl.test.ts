import { 
  ACCESS_CONTROL_MATRIX, 
  ROLE_HIERARCHY, 
  hasPermission, 
  canAccessResource,
  canManageResource,
  hasOrganizationBoundary,
  getPermissionsForUserType 
} from '../accessControl';

describe('Access Control Configuration', () => {
  describe('ACCESS_CONTROL_MATRIX', () => {
    it('should have correct configuration for SUPER_ADMIN', () => {
      const superAdminConfig = ACCESS_CONTROL_MATRIX.SUPER_ADMIN;
      
      expect(superAdminConfig.canAccess).toContain('*');
      expect(superAdminConfig.canManage).toContain('admins');
      expect(superAdminConfig.canManage).toContain('organizations');
      expect(superAdminConfig.canManage).toContain('users');
      expect(superAdminConfig.canManage).toContain('system');
      expect(superAdminConfig.organizationBoundary).toBe(false);
    });

    it('should have correct configuration for ADMIN', () => {
      const adminConfig = ACCESS_CONTROL_MATRIX.ADMIN;
      
      expect(adminConfig.canAccess).toContain('organizations');
      expect(adminConfig.canAccess).toContain('users');
      expect(adminConfig.canAccess).toContain('routes');
      expect(adminConfig.canAccess).toContain('vehicles');
      expect(adminConfig.canManage).toContain('organizations');
      expect(adminConfig.canManage).toContain('routes');
      expect(adminConfig.organizationBoundary).toBe(false);
    });

    it('should have correct configuration for ORGANIZATION', () => {
      const orgConfig = ACCESS_CONTROL_MATRIX.ORGANIZATION;
      
      expect(orgConfig.canAccess).toContain('drivers');
      expect(orgConfig.canAccess).toContain('vehicles');
      expect(orgConfig.canAccess).toContain('routes');
      expect(orgConfig.canAccess).toContain('trips');
      expect(orgConfig.canManage).toContain('drivers');
      expect(orgConfig.canManage).toContain('vehicles');
      expect(orgConfig.organizationBoundary).toBe(true);
    });

    it('should have correct configuration for DRIVER', () => {
      const driverConfig = ACCESS_CONTROL_MATRIX.DRIVER;
      
      expect(driverConfig.canAccess).toContain('own-profile');
      expect(driverConfig.canAccess).toContain('assigned-vehicle');
      expect(driverConfig.canAccess).toContain('assigned-routes');
      expect(driverConfig.canManage).toContain('own-profile');
      expect(driverConfig.organizationBoundary).toBe(true);
    });

    it('should have correct configuration for PASSENGER', () => {
      const passengerConfig = ACCESS_CONTROL_MATRIX.PASSENGER;
      
      expect(passengerConfig.canAccess).toContain('own-profile');
      expect(passengerConfig.canAccess).toContain('trips');
      expect(passengerConfig.canAccess).toContain('routes');
      expect(passengerConfig.canManage).toContain('own-profile');
      expect(passengerConfig.canManage).toContain('discount-profile');
      expect(passengerConfig.organizationBoundary).toBe(false);
    });
  });

  describe('ROLE_HIERARCHY', () => {
    it('should have correct hierarchy values', () => {
      expect(ROLE_HIERARCHY.SUPER_ADMIN).toBe(4);
      expect(ROLE_HIERARCHY.ADMIN).toBe(3);
      expect(ROLE_HIERARCHY.ORGANIZATION).toBe(2);
      expect(ROLE_HIERARCHY.DRIVER).toBe(1);
      expect(ROLE_HIERARCHY.PASSENGER).toBe(1);
    });

    it('should maintain proper hierarchy order', () => {
      expect(ROLE_HIERARCHY.SUPER_ADMIN).toBeGreaterThan(ROLE_HIERARCHY.ADMIN);
      expect(ROLE_HIERARCHY.ADMIN).toBeGreaterThan(ROLE_HIERARCHY.ORGANIZATION);
      expect(ROLE_HIERARCHY.ORGANIZATION).toBeGreaterThan(ROLE_HIERARCHY.DRIVER);
      expect(ROLE_HIERARCHY.ORGANIZATION).toBeGreaterThan(ROLE_HIERARCHY.PASSENGER);
    });
  });

  describe('hasPermission', () => {
    it('should return true for super admin with wildcard permission', () => {
      const result = hasPermission('SUPER_ADMIN', 'any-resource');
      expect(result).toBe(true);
    });

    it('should return true for admin accessing organizations', () => {
      const result = hasPermission('ADMIN', 'organizations');
      expect(result).toBe(true);
    });

    it('should return true for organization accessing drivers', () => {
      const result = hasPermission('ORGANIZATION', 'drivers');
      expect(result).toBe(true);
    });

    it('should return true for driver accessing own profile', () => {
      const result = hasPermission('DRIVER', 'own-profile');
      expect(result).toBe(true);
    });

    it('should return false for driver accessing organizations', () => {
      const result = hasPermission('DRIVER', 'organizations');
      expect(result).toBe(false);
    });

    it('should return false for passenger accessing drivers', () => {
      const result = hasPermission('PASSENGER', 'drivers');
      expect(result).toBe(false);
    });

    it('should return false for unknown role', () => {
      const result = hasPermission('UNKNOWN_ROLE', 'any-resource');
      expect(result).toBe(false);
    });
  });

  describe('canAccessResource', () => {
    it('should allow super admin to access any resource', () => {
      const result = canAccessResource('SUPER_ADMIN', 'any-resource');
      expect(result).toBe(true);
    });

    it('should allow admin to access organizations', () => {
      const result = canAccessResource('ADMIN', 'organizations');
      expect(result).toBe(true);
    });

    it('should allow organization to access drivers', () => {
      const result = canAccessResource('ORGANIZATION', 'drivers');
      expect(result).toBe(true);
    });

    it('should allow driver to access own profile', () => {
      const result = canAccessResource('DRIVER', 'own-profile');
      expect(result).toBe(true);
    });

    it('should deny driver from accessing organizations', () => {
      const result = canAccessResource('DRIVER', 'organizations');
      expect(result).toBe(false);
    });

    it('should allow passenger to access trips', () => {
      const result = canAccessResource('PASSENGER', 'trips');
      expect(result).toBe(true);
    });

    it('should deny passenger from accessing drivers', () => {
      const result = canAccessResource('PASSENGER', 'drivers');
      expect(result).toBe(false);
    });

    it('should return false for unknown role', () => {
      const result = canAccessResource('UNKNOWN_ROLE', 'any-resource');
      expect(result).toBe(false);
    });
  });

  describe('canManageResource', () => {
    it('should allow super admin to manage any resource', () => {
      const result = canManageResource('SUPER_ADMIN', 'any-resource');
      expect(result).toBe(true);
    });

    it('should allow admin to manage organizations', () => {
      const result = canManageResource('ADMIN', 'organizations');
      expect(result).toBe(true);
    });

    it('should allow organization to manage drivers', () => {
      const result = canManageResource('ORGANIZATION', 'drivers');
      expect(result).toBe(true);
    });

    it('should deny organization from managing organizations', () => {
      const result = canManageResource('ORGANIZATION', 'organizations');
      expect(result).toBe(false);
    });

    it('should allow driver to manage own profile', () => {
      const result = canManageResource('DRIVER', 'own-profile');
      expect(result).toBe(true);
    });

    it('should deny driver from managing drivers', () => {
      const result = canManageResource('DRIVER', 'drivers');
      expect(result).toBe(false);
    });

    it('should return false for unknown role', () => {
      const result = canManageResource('UNKNOWN_ROLE', 'any-resource');
      expect(result).toBe(false);
    });
  });

  describe('hasOrganizationBoundary', () => {
    it('should return false for super admin (no boundary)', () => {
      const result = hasOrganizationBoundary('SUPER_ADMIN');
      expect(result).toBe(false);
    });

    it('should return false for admin (no boundary)', () => {
      const result = hasOrganizationBoundary('ADMIN');
      expect(result).toBe(false);
    });

    it('should return true for organization (has boundary)', () => {
      const result = hasOrganizationBoundary('ORGANIZATION');
      expect(result).toBe(true);
    });

    it('should return true for driver (has boundary)', () => {
      const result = hasOrganizationBoundary('DRIVER');
      expect(result).toBe(true);
    });

    it('should return false for passenger (no boundary)', () => {
      const result = hasOrganizationBoundary('PASSENGER');
      expect(result).toBe(false);
    });

    it('should return false for unknown role', () => {
      const result = hasOrganizationBoundary('UNKNOWN_ROLE');
      expect(result).toBe(false);
    });
  });

  describe('getPermissionsForUserType', () => {
    it('should return correct permissions for known roles', () => {
      const superAdminPerms = getPermissionsForUserType('SUPER_ADMIN');
      expect(superAdminPerms).toContain('*');
      
      const adminPerms = getPermissionsForUserType('ADMIN');
      expect(adminPerms).toContain('organizations:read');
      expect(adminPerms).toContain('organizations:create');
      
      const orgPerms = getPermissionsForUserType('ORGANIZATION');
      expect(orgPerms).toContain('drivers:read');
      expect(orgPerms).toContain('vehicles:read');
      
      const driverPerms = getPermissionsForUserType('DRIVER');
      expect(driverPerms).toContain('profile:read');
      expect(driverPerms).toContain('vehicle:read');
      
      const passengerPerms = getPermissionsForUserType('PASSENGER');
      expect(passengerPerms).toContain('profile:read');
      expect(passengerPerms).toContain('trips:read');
    });

    it('should return empty array for unknown roles', () => {
      expect(getPermissionsForUserType('UNKNOWN_ROLE')).toEqual([]);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle null/undefined role in hasPermission', () => {
      expect(hasPermission(null as any, 'resource')).toBe(false);
      expect(hasPermission(undefined as any, 'resource')).toBe(false);
    });

    it('should handle null/undefined resource in hasPermission', () => {
      expect(hasPermission('ADMIN', null as any)).toBe(false);
      expect(hasPermission('ADMIN', undefined as any)).toBe(false);
    });

    it('should handle empty string role', () => {
      expect(hasPermission('', 'resource')).toBe(false);
    });

    it('should handle empty string resource', () => {
      expect(hasPermission('ADMIN', '')).toBe(false);
    });

    it('should handle case sensitivity in role names', () => {
      expect(hasPermission('admin', 'organizations')).toBe(false); // Should be case sensitive
      expect(hasPermission('ADMIN', 'organizations')).toBe(true);
    });
  });
});