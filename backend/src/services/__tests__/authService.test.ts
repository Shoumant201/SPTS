import { UserRole } from '@prisma/client';
import { AuthServiceImpl, TokenPayload } from '../authService';
import { comparePassword } from '../../utils/password';
import { generateTokens, validateTokenWithUserType, revokeRefreshToken, ROLE_HIERARCHY } from '../../utils/jwt';
import { prisma } from '../../utils/prisma';
import { SecurityService } from '../securityService';

// Mock dependencies
jest.mock('../../utils/password');
jest.mock('../../utils/jwt');
jest.mock('../../utils/prisma', () => ({
  prisma: {
    superAdmin: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    admin: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    organization: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));
jest.mock('../securityService');

const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
const mockGenerateTokens = generateTokens as jest.MockedFunction<typeof generateTokens>;
const mockValidateTokenWithUserType = validateTokenWithUserType as jest.MockedFunction<typeof validateTokenWithUserType>;
const mockRevokeRefreshToken = revokeRefreshToken as jest.MockedFunction<typeof revokeRefreshToken>;

describe('AuthService', () => {
  let authService: AuthServiceImpl;

  beforeEach(() => {
    authService = new AuthServiceImpl();
    jest.clearAllMocks();
    
    // Mock SecurityService methods
    (SecurityService.checkAccountLockout as jest.Mock).mockReturnValue({ locked: false });
    (SecurityService.recordFailedAttempt as jest.Mock).mockImplementation(() => {});
    (SecurityService.recordSuccessfulAttempt as jest.Mock).mockImplementation(() => {});
  });

  describe('generateTokens', () => {
    it('should generate tokens with correct payload', () => {
      const payload: TokenPayload = {
        id: 'user-id',
        email: 'test@example.com',
        role: 'ADMIN',
        userType: 'ADMIN'
      };

      const expectedTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      mockGenerateTokens.mockReturnValue(expectedTokens);

      const result = authService.generateTokens(payload);

      expect(mockGenerateTokens).toHaveBeenCalledWith({
        id: 'user-id',
        email: 'test@example.com',
        role: 'ADMIN',
        userType: 'ADMIN',
        organizationId: undefined
      });
      expect(result).toEqual(expectedTokens);
    });
  });

  describe('authenticateSuperAdmin', () => {
    const mockSuperAdmin = {
      id: 'super-admin-id',
      email: 'super@test.com',
      name: 'Super Admin',
      password: 'hashed-password',
      isActive: true
    };

    it('should authenticate super admin with valid credentials', async () => {
      (prisma.superAdmin.findUnique as jest.Mock).mockResolvedValue(mockSuperAdmin);
      mockComparePassword.mockResolvedValue(true);
      mockGenerateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });

      const result = await authService.authenticateSuperAdmin('super@test.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'super-admin-id',
        email: 'super@test.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        userType: 'SUPER_ADMIN'
      });
      expect(result.tokens).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
      expect(prisma.superAdmin.update).toHaveBeenCalledWith({
        where: { id: 'super-admin-id' },
        data: {
          lastLoginAt: expect.any(Date),
          refreshToken: 'refresh-token'
        }
      });
      expect(SecurityService.recordSuccessfulAttempt).toHaveBeenCalledWith('SUPER_ADMIN', 'super-admin-id');
    });

    it('should reject invalid email', async () => {
      (prisma.superAdmin.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.authenticateSuperAdmin('invalid@test.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(result.user).toBeUndefined();
      expect(result.tokens).toBeUndefined();
    });

    it('should reject invalid password', async () => {
      (prisma.superAdmin.findUnique as jest.Mock).mockResolvedValue(mockSuperAdmin);
      mockComparePassword.mockResolvedValue(false);

      const result = await authService.authenticateSuperAdmin('super@test.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(SecurityService.recordFailedAttempt).toHaveBeenCalledWith('SUPER_ADMIN', 'super-admin-id');
    });

    it('should reject inactive account', async () => {
      (prisma.superAdmin.findUnique as jest.Mock).mockResolvedValue({
        ...mockSuperAdmin,
        isActive: false
      });

      const result = await authService.authenticateSuperAdmin('super@test.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account is inactive');
    });

    it('should reject locked account', async () => {
      (prisma.superAdmin.findUnique as jest.Mock).mockResolvedValue(mockSuperAdmin);
      (SecurityService.checkAccountLockout as jest.Mock).mockReturnValue({ locked: true });

      const result = await authService.authenticateSuperAdmin('super@test.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account is temporarily locked due to multiple failed login attempts');
    });

    it('should handle database errors gracefully', async () => {
      (prisma.superAdmin.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await authService.authenticateSuperAdmin('super@test.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });
  });

  describe('authenticateAdmin', () => {
    const mockAdmin = {
      id: 'admin-id',
      email: 'admin@test.com',
      name: 'Admin User',
      password: 'hashed-password',
      isActive: true
    };

    it('should authenticate admin with valid credentials', async () => {
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      mockComparePassword.mockResolvedValue(true);
      mockGenerateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });

      const result = await authService.authenticateAdmin('admin@test.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'admin-id',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'ADMIN',
        userType: 'ADMIN'
      });
      expect(SecurityService.recordSuccessfulAttempt).toHaveBeenCalledWith('ADMIN', 'admin-id');
    });

    it('should reject invalid credentials', async () => {
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await authService.authenticateAdmin('invalid@test.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('authenticateOrganization', () => {
    const mockOrganization = {
      id: 'org-id',
      email: 'org@test.com',
      name: 'Test Organization',
      password: 'hashed-password',
      isActive: true
    };

    it('should authenticate organization with valid credentials', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrganization);
      mockComparePassword.mockResolvedValue(true);
      mockGenerateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });

      const result = await authService.authenticateOrganization('org@test.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'org-id',
        email: 'org@test.com',
        name: 'Test Organization',
        role: 'ORGANIZATION',
        userType: 'ORGANIZATION',
        organizationId: 'org-id'
      });
      expect(SecurityService.recordSuccessfulAttempt).toHaveBeenCalledWith('ORGANIZATION', 'org-id');
    });

    it('should include organizationId in token payload', async () => {
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockOrganization);
      mockComparePassword.mockResolvedValue(true);
      mockGenerateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });

      await authService.authenticateOrganization('org@test.com', 'password123');

      expect(mockGenerateTokens).toHaveBeenCalledWith({
        id: 'org-id',
        email: 'org@test.com',
        role: 'ORGANIZATION',
        userType: 'ORGANIZATION',
        organizationId: 'org-id'
      });
    });
  });

  describe('authenticateUser', () => {
    const mockDriver = {
      id: 'driver-id',
      email: 'driver@test.com',
      name: 'Driver User',
      password: 'hashed-password',
      role: UserRole.DRIVER,
      isActive: true,
      organizationId: 'org-id',
      organization: {
        id: 'org-id',
        name: 'Test Organization'
      }
    };

    const mockPassenger = {
      id: 'passenger-id',
      email: 'passenger@test.com',
      name: 'Passenger User',
      password: 'hashed-password',
      role: UserRole.PASSENGER,
      isActive: true,
      organizationId: null,
      organization: null
    };

    it('should authenticate driver with valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDriver);
      mockComparePassword.mockResolvedValue(true);
      mockGenerateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });

      const result = await authService.authenticateUser('driver@test.com', 'password123', UserRole.DRIVER);

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'driver-id',
        email: 'driver@test.com',
        name: 'Driver User',
        role: 'DRIVER',
        userType: 'USER',
        organizationId: 'org-id'
      });
      expect(SecurityService.recordSuccessfulAttempt).toHaveBeenCalledWith('USER', 'driver-id');
    });

    it('should authenticate passenger with valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPassenger);
      mockComparePassword.mockResolvedValue(true);
      mockGenerateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });

      const result = await authService.authenticateUser('passenger@test.com', 'password123', UserRole.PASSENGER);

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'passenger-id',
        email: 'passenger@test.com',
        name: 'Passenger User',
        role: 'PASSENGER',
        userType: 'USER',
        organizationId: undefined
      });
    });

    it('should reject role mismatch', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDriver);

      const result = await authService.authenticateUser('driver@test.com', 'password123', UserRole.PASSENGER);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid role for this user');
    });

    it('should reject driver without organization', async () => {
      const driverWithoutOrg = {
        ...mockDriver,
        organizationId: null
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(driverWithoutOrg);
      mockComparePassword.mockResolvedValue(true);

      const result = await authService.authenticateUser('driver@test.com', 'password123', UserRole.DRIVER);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Driver must be assigned to an organization');
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      // Mock the refreshTokens function from jwt utils
      const jwtUtils = require('../../utils/jwt');
      const mockRefreshTokens = jest.spyOn(jwtUtils, 'refreshTokens').mockResolvedValue(mockTokens);

      const result = await authService.refreshTokens('valid-refresh-token');

      expect(mockRefreshTokens).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual(mockTokens);

      mockRefreshTokens.mockRestore();
    });
  });

  describe('revokeTokens', () => {
    it('should revoke tokens successfully', async () => {
      mockRevokeRefreshToken.mockResolvedValue();

      await authService.revokeTokens('user-id', 'ADMIN');

      expect(mockRevokeRefreshToken).toHaveBeenCalledWith('user-id', 'ADMIN');
    });

    it('should handle revocation errors', async () => {
      mockRevokeRefreshToken.mockRejectedValue(new Error('Revocation failed'));

      await expect(authService.revokeTokens('user-id', 'ADMIN')).rejects.toThrow('Failed to revoke tokens');
    });
  });

  describe('validateAccess', () => {
    it('should validate access for super admin', async () => {
      const mockDecoded = {
        id: 'super-admin-id',
        email: 'super@test.com',
        role: 'SUPER_ADMIN',
        userType: 'SUPER_ADMIN' as const,
        hierarchy: 4,
        permissions: ['*']
      };

      mockValidateTokenWithUserType.mockResolvedValue(mockDecoded);

      const result = await authService.validateAccess('valid-token', 'ADMIN');

      expect(result).toBe(true);
      expect(mockValidateTokenWithUserType).toHaveBeenCalledWith('valid-token');
    });

    it('should validate organization boundary for organization users', async () => {
      const mockDecoded = {
        id: 'org-id',
        email: 'org@test.com',
        role: 'ORGANIZATION',
        userType: 'ORGANIZATION' as const,
        hierarchy: 2,
        permissions: ['drivers:read'],
        organizationId: 'org-1'
      };

      mockValidateTokenWithUserType.mockResolvedValue(mockDecoded);

      const result = await authService.validateAccess('valid-token', 'DRIVER', 'org-1');

      expect(result).toBe(true);
    });

    it('should reject organization boundary violation', async () => {
      const mockDecoded = {
        id: 'org-id',
        email: 'org@test.com',
        role: 'ORGANIZATION',
        userType: 'ORGANIZATION' as const,
        hierarchy: 2,
        permissions: ['drivers:read'],
        organizationId: 'org-1'
      };

      mockValidateTokenWithUserType.mockResolvedValue(mockDecoded);

      const result = await authService.validateAccess('valid-token', 'DRIVER', 'org-2');

      expect(result).toBe(false);
    });

    it('should reject insufficient hierarchy', async () => {
      const mockDecoded = {
        id: 'driver-id',
        email: 'driver@test.com',
        role: 'DRIVER',
        userType: 'USER' as const,
        hierarchy: 1,
        permissions: ['profile:read']
      };

      mockValidateTokenWithUserType.mockResolvedValue(mockDecoded);

      const result = await authService.validateAccess('valid-token', 'ADMIN');

      expect(result).toBe(false);
    });

    it('should handle token validation errors', async () => {
      mockValidateTokenWithUserType.mockRejectedValue(new Error('Invalid token'));

      const result = await authService.validateAccess('invalid-token', 'ADMIN');

      expect(result).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    describe('Email normalization', () => {
      it('should normalize email to lowercase for super admin', async () => {
        const mockSuperAdmin = {
          id: 'super-admin-id',
          email: 'super@test.com',
          name: 'Super Admin',
          password: 'hashed-password',
          isActive: true
        };

        (prisma.superAdmin.findUnique as jest.Mock).mockResolvedValue(mockSuperAdmin);
        mockComparePassword.mockResolvedValue(true);
        mockGenerateTokens.mockReturnValue({
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        });

        await authService.authenticateSuperAdmin('SUPER@TEST.COM', 'password123');

        expect(prisma.superAdmin.findUnique).toHaveBeenCalledWith({
          where: { email: 'super@test.com' }
        });
      });

      it('should normalize email to lowercase for all user types', async () => {
        const testCases = [
          { method: 'authenticateAdmin', table: 'admin' },
          { method: 'authenticateOrganization', table: 'organization' }
        ];

        for (const testCase of testCases) {
          const mockUser = {
            id: 'test-id',
            email: 'test@example.com',
            name: 'Test User',
            password: 'hashed-password',
            isActive: true
          };

          if (testCase.table === 'admin') {
            (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockUser);
          } else if (testCase.table === 'organization') {
            (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockUser);
          }
          
          mockComparePassword.mockResolvedValue(true);
          mockGenerateTokens.mockReturnValue({
            accessToken: 'access-token',
            refreshToken: 'refresh-token'
          });

          await (authService as any)[testCase.method]('TEST@EXAMPLE.COM', 'password123');

          if (testCase.table === 'admin') {
            expect(prisma.admin.findUnique).toHaveBeenCalledWith({
              where: { email: 'test@example.com' }
            });
          } else if (testCase.table === 'organization') {
            expect(prisma.organization.findUnique).toHaveBeenCalledWith({
              where: { email: 'test@example.com' }
            });
          }
        }
      });
    });

    describe('Database connection errors', () => {
      it('should handle database connection errors gracefully for all auth methods', async () => {
        const authMethods = [
          'authenticateSuperAdmin',
          'authenticateAdmin', 
          'authenticateOrganization'
        ];

        for (const method of authMethods) {
          if (method === 'authenticateSuperAdmin') {
            (prisma.superAdmin.findUnique as jest.Mock).mockRejectedValue(new Error('Connection timeout'));
          } else if (method === 'authenticateAdmin') {
            (prisma.admin.findUnique as jest.Mock).mockRejectedValue(new Error('Connection timeout'));
          } else if (method === 'authenticateOrganization') {
            (prisma.organization.findUnique as jest.Mock).mockRejectedValue(new Error('Connection timeout'));
          }

          const result = await (authService as any)[method]('test@example.com', 'password123');

          expect(result.success).toBe(false);
          expect(result.error).toBe('Authentication failed');
        }
      });
    });

    describe('Token generation errors', () => {
      it('should handle token generation failures', async () => {
        const mockSuperAdmin = {
          id: 'super-admin-id',
          email: 'super@test.com',
          name: 'Super Admin',
          password: 'hashed-password',
          isActive: true
        };

        (prisma.superAdmin.findUnique as jest.Mock).mockResolvedValue(mockSuperAdmin);
        mockComparePassword.mockResolvedValue(true);
        mockGenerateTokens.mockImplementation(() => {
          throw new Error('Token generation failed');
        });

        const result = await authService.authenticateSuperAdmin('super@test.com', 'password123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Authentication failed');
      });
    });
  });

  describe('Role Hierarchy and Permission Testing', () => {
    describe('Role hierarchy validation', () => {
      it('should validate role hierarchy correctly', () => {
        // Mock the ROLE_HIERARCHY import
        const mockRoleHierarchy = {
          SUPER_ADMIN: 4,
          ADMIN: 3,
          ORGANIZATION: 2,
          DRIVER: 1,
          PASSENGER: 1
        };

        // Mock the require call for ROLE_HIERARCHY
        jest.doMock('../../utils/jwt', () => ({
          ...jest.requireActual('../../utils/jwt'),
          ROLE_HIERARCHY: mockRoleHierarchy
        }));

        const hierarchy = (authService as any).getRoleHierarchy('SUPER_ADMIN');
        expect(hierarchy).toBe(4);
      });

      it('should return 0 for unknown roles', () => {
        const hierarchy = (authService as any).getRoleHierarchy('UNKNOWN_ROLE');
        expect(hierarchy).toBe(0);
      });
    });

    describe('Permission checking', () => {
      it('should validate wildcard permissions', () => {
        const result = (authService as any).hasPermission('*', 'ANY_ROLE');
        expect(result).toBe(true);
      });

      it('should validate specific resource permissions', () => {
        const testCases = [
          { permission: 'admin:read', role: 'ADMIN', expected: true },
          { permission: 'user:read', role: 'ADMIN', expected: false },
          { permission: 'organization:read', role: 'ORGANIZATION', expected: true }
        ];

        testCases.forEach(({ permission, role, expected }) => {
          const result = (authService as any).hasPermission(permission, role);
          expect(result).toBe(expected);
        });
      });
    });
  });

  describe('Token Management Edge Cases', () => {
    describe('Refresh token validation', () => {
      it('should handle invalid refresh tokens', async () => {
        const jwtUtils = require('../../utils/jwt');
        const mockRefreshTokens = jest.spyOn(jwtUtils, 'refreshTokens')
          .mockRejectedValue(new Error('Invalid refresh token'));

        await expect(authService.refreshTokens('invalid-token')).rejects.toThrow();

        mockRefreshTokens.mockRestore();
      });

      it('should handle expired refresh tokens', async () => {
        const jwtUtils = require('../../utils/jwt');
        const mockRefreshTokens = jest.spyOn(jwtUtils, 'refreshTokens')
          .mockRejectedValue(new Error('Token expired'));

        await expect(authService.refreshTokens('expired-token')).rejects.toThrow();

        mockRefreshTokens.mockRestore();
      });
    });

    describe('Token revocation edge cases', () => {
      it('should handle revocation of non-existent tokens', async () => {
        mockRevokeRefreshToken.mockRejectedValue(new Error('User not found'));

        await expect(authService.revokeTokens('non-existent-user', 'ADMIN'))
          .rejects.toThrow('Failed to revoke tokens');
      });

      it('should handle database errors during revocation', async () => {
        mockRevokeRefreshToken.mockRejectedValue(new Error('Database connection failed'));

        await expect(authService.revokeTokens('user-id', 'ADMIN'))
          .rejects.toThrow('Failed to revoke tokens');
      });
    });
  });

  describe('Organization Boundary Validation', () => {
    describe('Organization-specific access validation', () => {
      it('should validate same organization access', async () => {
        const mockDecoded = {
          id: 'org-id',
          email: 'org@test.com',
          role: 'ORGANIZATION',
          userType: 'ORGANIZATION' as const,
          hierarchy: 2,
          permissions: ['drivers:read'],
          organizationId: 'org-1'
        };

        mockValidateTokenWithUserType.mockResolvedValue(mockDecoded);

        const result = await authService.validateAccess('valid-token', 'DRIVER', 'org-1');
        expect(result).toBe(true);
      });

      it('should reject different organization access', async () => {
        const mockDecoded = {
          id: 'org-id',
          email: 'org@test.com',
          role: 'ORGANIZATION',
          userType: 'ORGANIZATION' as const,
          hierarchy: 2,
          permissions: ['drivers:read'],
          organizationId: 'org-1'
        };

        mockValidateTokenWithUserType.mockResolvedValue(mockDecoded);

        const result = await authService.validateAccess('valid-token', 'DRIVER', 'org-2');
        expect(result).toBe(false);
      });

      it('should allow super admin to access any organization', async () => {
        const mockDecoded = {
          id: 'super-admin-id',
          email: 'super@test.com',
          role: 'SUPER_ADMIN',
          userType: 'SUPER_ADMIN' as const,
          hierarchy: 4,
          permissions: ['*']
        };

        mockValidateTokenWithUserType.mockResolvedValue(mockDecoded);

        const result = await authService.validateAccess('valid-token', 'ORGANIZATION', 'any-org');
        expect(result).toBe(true);
      });
    });
  });

  describe('Security Service Integration', () => {
    describe('Account lockout integration', () => {
      it('should respect account lockout for all user types', async () => {
        const userTypes = [
          { method: 'authenticateSuperAdmin', table: 'superAdmin', type: 'SUPER_ADMIN' },
          { method: 'authenticateAdmin', table: 'admin', type: 'ADMIN' },
          { method: 'authenticateOrganization', table: 'organization', type: 'ORGANIZATION' }
        ];

        for (const userType of userTypes) {
          const mockUser = {
            id: 'test-id',
            email: 'test@example.com',
            name: 'Test User',
            password: 'hashed-password',
            isActive: true
          };

          if (userType.table === 'superAdmin') {
            (prisma.superAdmin.findUnique as jest.Mock).mockResolvedValue(mockUser);
          } else if (userType.table === 'admin') {
            (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockUser);
          } else if (userType.table === 'organization') {
            (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockUser);
          }
          
          (SecurityService.checkAccountLockout as jest.Mock).mockReturnValue({ locked: true });

          const result = await (authService as any)[userType.method]('test@example.com', 'password123');

          expect(result.success).toBe(false);
          expect(result.error).toBe('Account is temporarily locked due to multiple failed login attempts');
          expect(SecurityService.checkAccountLockout).toHaveBeenCalledWith(userType.type, 'test-id');
        }
      });

      it('should record failed attempts for all user types', async () => {
        const userTypes = [
          { method: 'authenticateSuperAdmin', table: 'superAdmin', type: 'SUPER_ADMIN' },
          { method: 'authenticateAdmin', table: 'admin', type: 'ADMIN' },
          { method: 'authenticateOrganization', table: 'organization', type: 'ORGANIZATION' }
        ];

        for (const userType of userTypes) {
          const mockUser = {
            id: 'test-id',
            email: 'test@example.com',
            name: 'Test User',
            password: 'hashed-password',
            isActive: true
          };

          if (userType.table === 'superAdmin') {
            (prisma.superAdmin.findUnique as jest.Mock).mockResolvedValue(mockUser);
          } else if (userType.table === 'admin') {
            (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockUser);
          } else if (userType.table === 'organization') {
            (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockUser);
          }
          
          (SecurityService.checkAccountLockout as jest.Mock).mockReturnValue({ locked: false });
          mockComparePassword.mockResolvedValue(false);

          await (authService as any)[userType.method]('test@example.com', 'wrongpassword');

          expect(SecurityService.recordFailedAttempt).toHaveBeenCalledWith(userType.type, 'test-id');
        }
      });

      it('should record successful attempts for all user types', async () => {
        const userTypes = [
          { method: 'authenticateSuperAdmin', table: 'superAdmin', type: 'SUPER_ADMIN' },
          { method: 'authenticateAdmin', table: 'admin', type: 'ADMIN' },
          { method: 'authenticateOrganization', table: 'organization', type: 'ORGANIZATION' }
        ];

        for (const userType of userTypes) {
          const mockUser = {
            id: 'test-id',
            email: 'test@example.com',
            name: 'Test User',
            password: 'hashed-password',
            isActive: true
          };

          if (userType.table === 'superAdmin') {
            (prisma.superAdmin.findUnique as jest.Mock).mockResolvedValue(mockUser);
          } else if (userType.table === 'admin') {
            (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockUser);
          } else if (userType.table === 'organization') {
            (prisma.organization.findUnique as jest.Mock).mockResolvedValue(mockUser);
          }
          
          (SecurityService.checkAccountLockout as jest.Mock).mockReturnValue({ locked: false });
          mockComparePassword.mockResolvedValue(true);
          mockGenerateTokens.mockReturnValue({
            accessToken: 'access-token',
            refreshToken: 'refresh-token'
          });

          await (authService as any)[userType.method]('test@example.com', 'password123');

          expect(SecurityService.recordSuccessfulAttempt).toHaveBeenCalledWith(userType.type, 'test-id');
        }
      });
    });
  });

  describe('User Authentication Edge Cases', () => {
    describe('Driver-specific validations', () => {
      it('should require organization for drivers', async () => {
        const mockDriverWithoutOrg = {
          id: 'driver-id',
          email: 'driver@test.com',
          name: 'Driver User',
          password: 'hashed-password',
          role: UserRole.DRIVER,
          isActive: true,
          organizationId: null,
          organization: null
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDriverWithoutOrg);
        mockComparePassword.mockResolvedValue(true);

        const result = await authService.authenticateUser('driver@test.com', 'password123', UserRole.DRIVER);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Driver must be assigned to an organization');
      });

      it('should allow passengers without organization', async () => {
        const mockPassenger = {
          id: 'passenger-id',
          email: 'passenger@test.com',
          name: 'Passenger User',
          password: 'hashed-password',
          role: UserRole.PASSENGER,
          isActive: true,
          organizationId: null,
          organization: null
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPassenger);
        mockComparePassword.mockResolvedValue(true);
        mockGenerateTokens.mockReturnValue({
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        });

        const result = await authService.authenticateUser('passenger@test.com', 'password123', UserRole.PASSENGER);

        expect(result.success).toBe(true);
        expect(result.user?.organizationId).toBeUndefined();
      });
    });

    describe('Role mismatch scenarios', () => {
      it('should reject driver trying to authenticate as passenger', async () => {
        const mockDriver = {
          id: 'driver-id',
          email: 'driver@test.com',
          name: 'Driver User',
          password: 'hashed-password',
          role: UserRole.DRIVER,
          isActive: true,
          organizationId: 'org-id',
          organization: { id: 'org-id', name: 'Test Organization' }
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDriver);

        const result = await authService.authenticateUser('driver@test.com', 'password123', UserRole.PASSENGER);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid role for this user');
      });

      it('should reject passenger trying to authenticate as driver', async () => {
        const mockPassenger = {
          id: 'passenger-id',
          email: 'passenger@test.com',
          name: 'Passenger User',
          password: 'hashed-password',
          role: UserRole.PASSENGER,
          isActive: true,
          organizationId: null,
          organization: null
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockPassenger);

        const result = await authService.authenticateUser('passenger@test.com', 'password123', UserRole.DRIVER);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid role for this user');
      });
    });
  });

  describe('private methods', () => {
    describe('validateCredentials', () => {
      it('should return false for empty email', async () => {
        const result = await (authService as any).validateCredentials('', 'password', 'hashed');
        expect(result).toBe(false);
      });

      it('should return false for empty password', async () => {
        const result = await (authService as any).validateCredentials('email@test.com', '', 'hashed');
        expect(result).toBe(false);
      });

      it('should call comparePassword with correct parameters', async () => {
        mockComparePassword.mockResolvedValue(true);
        
        const result = await (authService as any).validateCredentials('email@test.com', 'password', 'hashed');
        
        expect(mockComparePassword).toHaveBeenCalledWith('password', 'hashed');
        expect(result).toBe(true);
      });
    });

    describe('getRoleHierarchy', () => {
      it('should return correct hierarchy for known roles', () => {
        // Mock the require call to return the hierarchy
        jest.doMock('../../utils/jwt', () => ({
          ROLE_HIERARCHY: {
            SUPER_ADMIN: 4,
            ADMIN: 3,
            ORGANIZATION: 2,
            DRIVER: 1,
            PASSENGER: 1
          }
        }));

        const hierarchy = (authService as any).getRoleHierarchy('SUPER_ADMIN');
        expect(hierarchy).toBe(4);
      });

      it('should return 0 for unknown roles', () => {
        const hierarchy = (authService as any).getRoleHierarchy('UNKNOWN_ROLE');
        expect(hierarchy).toBe(0);
      });
    });

    describe('hasPermission', () => {
      it('should return true for wildcard permission', () => {
        const result = (authService as any).hasPermission('*', 'ADMIN');
        expect(result).toBe(true);
      });

      it('should return true for matching resource permission', () => {
        const result = (authService as any).hasPermission('admin:read', 'ADMIN');
        expect(result).toBe(true);
      });

      it('should return false for non-matching permission', () => {
        const result = (authService as any).hasPermission('user:read', 'ADMIN');
        expect(result).toBe(false);
      });
    });

    describe('updateLoginInfo', () => {
      it('should update login info for all user types', async () => {
        const testCases = [
          { table: 'super_admins', prismaMethod: 'superAdmin' },
          { table: 'admins', prismaMethod: 'admin' },
          { table: 'organizations', prismaMethod: 'organization' },
          { table: 'users', prismaMethod: 'user' }
        ];

        for (const testCase of testCases) {
          let updateSpy: jest.Mock;
          
          if (testCase.prismaMethod === 'superAdmin') {
            updateSpy = (prisma.superAdmin.update as jest.Mock);
          } else if (testCase.prismaMethod === 'admin') {
            updateSpy = (prisma.admin.update as jest.Mock);
          } else if (testCase.prismaMethod === 'organization') {
            updateSpy = (prisma.organization.update as jest.Mock);
          } else {
            updateSpy = (prisma.user.update as jest.Mock);
          }
          
          updateSpy.mockResolvedValue({});

          await (authService as any).updateLoginInfo(testCase.table, 'test-id', 'refresh-token');

          expect(updateSpy).toHaveBeenCalledWith({
            where: { id: 'test-id' },
            data: {
              lastLoginAt: expect.any(Date),
              refreshToken: 'refresh-token'
            }
          });
        }
      });
    });
  });
});