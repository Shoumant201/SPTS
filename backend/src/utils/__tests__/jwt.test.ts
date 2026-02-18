import * as jwt from 'jsonwebtoken';
import { 
  generateTokens, 
  verifyAccessToken, 
  verifyRefreshToken, 
  refreshTokens,
  validateTokenWithUserType,
  revokeRefreshToken,
  JWTPayload,
  ROLE_HIERARCHY 
} from '../jwt';
import { prisma } from '../prisma';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../prisma', () => ({
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

const mockSign = jwt.sign as jest.MockedFunction<typeof jwt.sign>;
const mockVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

describe('JWT Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  describe('ROLE_HIERARCHY', () => {
    it('should have correct hierarchy values', () => {
      expect(ROLE_HIERARCHY.SUPER_ADMIN).toBe(4);
      expect(ROLE_HIERARCHY.ADMIN).toBe(3);
      expect(ROLE_HIERARCHY.ORGANIZATION).toBe(2);
      expect(ROLE_HIERARCHY.DRIVER).toBe(1);
      expect(ROLE_HIERARCHY.PASSENGER).toBe(1);
    });
  });

  describe('generateTokens', () => {
    it('should generate tokens for super admin', () => {
      const payload: JWTPayload = {
        id: 'super-admin-id',
        email: 'super@test.com',
        role: 'SUPER_ADMIN',
        userType: 'SUPER_ADMIN'
      };

      mockSign
        .mockReturnValueOnce('access-token' as any)
        .mockReturnValueOnce('refresh-token' as any);

      const result = generateTokens(payload);

      expect(mockSign).toHaveBeenCalledTimes(2);
      
      // Check access token generation
      expect(mockSign).toHaveBeenNthCalledWith(1, {
        id: 'super-admin-id',
        email: 'super@test.com',
        role: 'SUPER_ADMIN',
        userType: 'SUPER_ADMIN',
        organizationId: undefined,
        hierarchy: 4,
        permissions: ['*']
      }, 'test-jwt-secret', { expiresIn: '30m' });

      // Check refresh token generation
      expect(mockSign).toHaveBeenNthCalledWith(2, {
        id: 'super-admin-id',
        userType: 'SUPER_ADMIN',
        organizationId: undefined
      }, 'test-jwt-refresh-secret', { expiresIn: '7d' });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      });
    });

    it('should generate tokens for organization with organizationId', () => {
      const payload: JWTPayload = {
        id: 'org-id',
        email: 'org@test.com',
        role: 'ORGANIZATION',
        userType: 'ORGANIZATION',
        organizationId: 'org-id'
      };

      mockSign
        .mockReturnValueOnce('access-token' as any)
        .mockReturnValueOnce('refresh-token' as any);

      const result = generateTokens(payload);

      expect(mockSign).toHaveBeenNthCalledWith(1, {
        id: 'org-id',
        email: 'org@test.com',
        role: 'ORGANIZATION',
        userType: 'ORGANIZATION',
        organizationId: 'org-id',
        hierarchy: 2,
        permissions: [
          'drivers:read',
          'drivers:write',
          'vehicles:read',
          'vehicles:write',
          'routes:read',
          'trips:read',
          'organization:read',
          'organization:write'
        ]
      }, 'test-jwt-secret', { expiresIn: '2h' });
    });

    it('should generate tokens for driver user', () => {
      const payload: JWTPayload = {
        id: 'driver-id',
        email: 'driver@test.com',
        role: 'DRIVER',
        userType: 'USER',
        organizationId: 'org-id'
      };

      mockSign
        .mockReturnValueOnce('access-token' as any)
        .mockReturnValueOnce('refresh-token' as any);

      generateTokens(payload);

      expect(mockSign).toHaveBeenNthCalledWith(1, {
        id: 'driver-id',
        email: 'driver@test.com',
        role: 'DRIVER',
        userType: 'USER',
        organizationId: 'org-id',
        hierarchy: 1,
        permissions: [
          'profile:read',
          'profile:write',
          'vehicle:read',
          'routes:read',
          'trips:read',
          'trips:write'
        ]
      }, 'test-jwt-secret', { expiresIn: '4h' });
    });

    it('should generate tokens for passenger user', () => {
      const payload: JWTPayload = {
        id: 'passenger-id',
        email: 'passenger@test.com',
        role: 'PASSENGER',
        userType: 'USER'
      };

      mockSign
        .mockReturnValueOnce('access-token' as any)
        .mockReturnValueOnce('refresh-token' as any);

      generateTokens(payload);

      expect(mockSign).toHaveBeenNthCalledWith(1, {
        id: 'passenger-id',
        email: 'passenger@test.com',
        role: 'PASSENGER',
        userType: 'USER',
        organizationId: undefined,
        hierarchy: 1,
        permissions: [
          'profile:read',
          'profile:write',
          'trips:read',
          'trips:write',
          'routes:read',
          'discounts:read',
          'discounts:write'
        ]
      }, 'test-jwt-secret', { expiresIn: '4h' });
    });

    it('should throw error when JWT_SECRET is not configured', () => {
      delete process.env.JWT_SECRET;

      const payload: JWTPayload = {
        id: 'user-id',
        email: 'user@test.com',
        role: 'ADMIN',
        userType: 'ADMIN'
      };

      expect(() => generateTokens(payload)).toThrow('JWT secrets not configured');
    });

    it('should throw error when JWT_REFRESH_SECRET is not configured', () => {
      delete process.env.JWT_REFRESH_SECRET;

      const payload: JWTPayload = {
        id: 'user-id',
        email: 'user@test.com',
        role: 'ADMIN',
        userType: 'ADMIN'
      };

      expect(() => generateTokens(payload)).toThrow('JWT secrets not configured');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const mockPayload: JWTPayload = {
        id: 'user-id',
        email: 'user@test.com',
        role: 'ADMIN',
        userType: 'ADMIN',
        hierarchy: 3,
        permissions: ['organizations:read']
      };

      mockVerify.mockReturnValue(mockPayload as any);

      const result = verifyAccessToken('valid-token');

      expect(mockVerify).toHaveBeenCalledWith('valid-token', 'test-jwt-secret');
      expect(result).toEqual(mockPayload);
    });

    it('should throw error for invalid token', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => verifyAccessToken('invalid-token')).toThrow('Invalid or expired access token');
    });

    it('should throw error when JWT_SECRET is not configured', () => {
      delete process.env.JWT_SECRET;

      expect(() => verifyAccessToken('token')).toThrow('JWT secret not configured');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const mockPayload = {
        id: 'user-id',
        userType: 'ADMIN',
        organizationId: 'org-id'
      };

      mockVerify.mockReturnValue(mockPayload as any);

      const result = verifyRefreshToken('valid-refresh-token');

      expect(mockVerify).toHaveBeenCalledWith('valid-refresh-token', 'test-jwt-refresh-secret');
      expect(result).toEqual(mockPayload);
    });

    it('should throw error for invalid refresh token', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => verifyRefreshToken('invalid-token')).toThrow('Invalid or expired refresh token');
    });

    it('should throw error when JWT_REFRESH_SECRET is not configured', () => {
      delete process.env.JWT_REFRESH_SECRET;

      expect(() => verifyRefreshToken('token')).toThrow('JWT refresh secret not configured');
    });
  });

  describe('refreshTokens', () => {
    const mockRefreshPayload = {
      id: 'admin-id',
      userType: 'ADMIN',
      organizationId: undefined
    };

    const mockUserData = {
      id: 'admin-id',
      email: 'admin@test.com',
      name: 'Admin User',
      isActive: true,
      refreshToken: 'stored-refresh-token',
      role: 'ADMIN'
    };

    beforeEach(() => {
      mockVerify.mockReturnValue(mockRefreshPayload as any);
      mockSign
        .mockReturnValueOnce('new-access-token' as any)
        .mockReturnValueOnce('new-refresh-token' as any);
    });

    it('should refresh tokens for admin user', async () => {
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockUserData);
      (prisma.admin.update as jest.Mock).mockResolvedValue({});

      const result = await refreshTokens('stored-refresh-token');

      expect(prisma.admin.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin-id' },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          refreshToken: true
        }
      });

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: 'admin-id' },
        data: { refreshToken: 'new-refresh-token' }
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });
    });

    it('should refresh tokens for organization user', async () => {
      const orgRefreshPayload = {
        id: 'org-id',
        userType: 'ORGANIZATION',
        organizationId: 'org-id'
      };
      
      const orgUserData = {
        id: 'org-id',
        email: 'org@test.com',
        name: 'Test Organization',
        isActive: true,
        refreshToken: 'stored-refresh-token',
        role: 'ORGANIZATION'
      };

      mockVerify.mockReturnValue(orgRefreshPayload as any);
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue(orgUserData);
      (prisma.organization.update as jest.Mock).mockResolvedValue({});

      const result = await refreshTokens('stored-refresh-token');

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-id' },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          refreshToken: true
        }
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });
    });

    it('should refresh tokens for regular user', async () => {
      const userRefreshPayload = {
        id: 'user-id',
        userType: 'USER',
        organizationId: 'org-id'
      };
      
      const userData = {
        id: 'user-id',
        email: 'user@test.com',
        name: 'Test User',
        role: 'DRIVER',
        isActive: true,
        refreshToken: 'stored-refresh-token',
        organizationId: 'org-id'
      };

      mockVerify.mockReturnValue(userRefreshPayload as any);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userData);
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await refreshTokens('stored-refresh-token');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          refreshToken: true,
          organizationId: true
        }
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });
    });

    it('should throw error for user not found', async () => {
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(refreshTokens('stored-refresh-token')).rejects.toThrow('Token refresh failed: User not found or inactive');
    });

    it('should throw error for inactive user', async () => {
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
        ...mockUserData,
        isActive: false
      });

      await expect(refreshTokens('stored-refresh-token')).rejects.toThrow('Token refresh failed: User not found or inactive');
    });

    it('should throw error for token mismatch', async () => {
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
        ...mockUserData,
        refreshToken: 'different-token'
      });

      await expect(refreshTokens('stored-refresh-token')).rejects.toThrow('Token refresh failed: Invalid refresh token');
    });

    it('should throw error for invalid refresh token', async () => {
      mockVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(refreshTokens('invalid-token')).rejects.toThrow('Token refresh failed: Invalid or expired refresh token');
    });
  });

  describe('validateTokenWithUserType', () => {
    const mockAccessPayload: JWTPayload = {
      id: 'admin-id',
      email: 'admin@test.com',
      role: 'ADMIN',
      userType: 'ADMIN',
      hierarchy: 3,
      permissions: ['organizations:read']
    };

    const mockUserData = {
      id: 'admin-id',
      email: 'admin@test.com',
      name: 'Admin User',
      isActive: true,
      refreshToken: 'refresh-token',
      role: 'ADMIN'
    };

    beforeEach(() => {
      mockVerify.mockReturnValue(mockAccessPayload as any);
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue(mockUserData);
    });

    it('should validate token without user type check', async () => {
      const result = await validateTokenWithUserType('valid-token');

      expect(result).toEqual(mockAccessPayload);
      expect(prisma.admin.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin-id' },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          refreshToken: true
        }
      });
    });

    it('should validate token with matching user type', async () => {
      const result = await validateTokenWithUserType('valid-token', 'ADMIN');

      expect(result).toEqual(mockAccessPayload);
    });

    it('should throw error for user type mismatch', async () => {
      await expect(validateTokenWithUserType('valid-token', 'ORGANIZATION'))
        .rejects.toThrow('Token validation failed: Invalid user type. Expected: ORGANIZATION, Got: ADMIN');
    });

    it('should throw error for inactive user', async () => {
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue({
        ...mockUserData,
        isActive: false
      });

      await expect(validateTokenWithUserType('valid-token'))
        .rejects.toThrow('Token validation failed: User not found or inactive');
    });

    it('should throw error for user not found', async () => {
      (prisma.admin.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(validateTokenWithUserType('valid-token'))
        .rejects.toThrow('Token validation failed: User not found or inactive');
    });

    it('should throw error for invalid token', async () => {
      mockVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(validateTokenWithUserType('invalid-token'))
        .rejects.toThrow('Token validation failed: Invalid or expired access token');
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke refresh token for super admin', async () => {
      (prisma.superAdmin.update as jest.Mock).mockResolvedValue({});

      await revokeRefreshToken('super-admin-id', 'SUPER_ADMIN');

      expect(prisma.superAdmin.update).toHaveBeenCalledWith({
        where: { id: 'super-admin-id' },
        data: { refreshToken: null }
      });
    });

    it('should revoke refresh token for admin', async () => {
      (prisma.admin.update as jest.Mock).mockResolvedValue({});

      await revokeRefreshToken('admin-id', 'ADMIN');

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: 'admin-id' },
        data: { refreshToken: null }
      });
    });

    it('should revoke refresh token for organization', async () => {
      (prisma.organization.update as jest.Mock).mockResolvedValue({});

      await revokeRefreshToken('org-id', 'ORGANIZATION');

      expect(prisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-id' },
        data: { refreshToken: null }
      });
    });

    it('should revoke refresh token for user', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({});

      await revokeRefreshToken('user-id', 'USER');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { refreshToken: null }
      });
    });

    it('should throw error for invalid user type', async () => {
      await expect(revokeRefreshToken('user-id', 'INVALID_TYPE' as any))
        .rejects.toThrow('Invalid user type: INVALID_TYPE');
    });
  });
});