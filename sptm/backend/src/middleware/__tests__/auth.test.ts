import { Request, Response, NextFunction } from 'express';
import { authenticate, authorizeRole, authorizeOrganization, authorizeContext, AuthRequest } from '../auth';
import { verifyAccessToken } from '../../utils/jwt';
import { prisma } from '../../utils/prisma';

// Mock dependencies
jest.mock('../../utils/jwt');
jest.mock('../../utils/prisma', () => ({
  prisma: {
    superAdmin: { findUnique: jest.fn() },
    admin: { findUnique: jest.fn() },
    organization: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() }
  }
}));

const mockVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;

describe('Authentication Middleware', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      header: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate super admin successfully', async () => {
      const mockToken = 'valid-token';
      const mockDecoded = {
        id: 'super-admin-id',
        email: 'super@test.com',
        role: 'SUPER_ADMIN',
        userType: 'SUPER_ADMIN' as const,
        hierarchy: 4,
        permissions: ['*']
      };

      (req.header as jest.Mock).mockReturnValue(`Bearer ${mockToken}`);
      mockVerifyAccessToken.mockReturnValue(mockDecoded);
      (prisma.superAdmin.findUnique as jest.Mock).mockResolvedValue({
        id: 'super-admin-id',
        email: 'super@test.com',
        name: 'Super Admin',
        isActive: true
      });

      await authenticate(req as AuthRequest, res as Response, next);

      expect(req.user).toEqual({
        id: 'super-admin-id',
        email: 'super@test.com',
        role: 'SUPER_ADMIN',
        userType: 'SUPER_ADMIN',
        organizationId: undefined,
        hierarchy: 4,
        permissions: ['*']
      });
      expect(next).toHaveBeenCalled();
    });

    it('should authenticate organization successfully', async () => {
      const mockToken = 'valid-token';
      const mockDecoded = {
        id: 'org-id',
        email: 'org@test.com',
        role: 'ORGANIZATION',
        userType: 'ORGANIZATION' as const,
        hierarchy: 2,
        permissions: ['drivers:read', 'vehicles:read']
      };

      (req.header as jest.Mock).mockReturnValue(`Bearer ${mockToken}`);
      mockVerifyAccessToken.mockReturnValue(mockDecoded);
      (prisma.organization.findUnique as jest.Mock).mockResolvedValue({
        id: 'org-id',
        email: 'org@test.com',
        name: 'Test Organization',
        isActive: true
      });

      await authenticate(req as AuthRequest, res as Response, next);

      expect(req.user).toEqual({
        id: 'org-id',
        email: 'org@test.com',
        role: 'ORGANIZATION',
        userType: 'ORGANIZATION',
        organizationId: 'org-id',
        hierarchy: 2,
        permissions: ['drivers:read', 'vehicles:read']
      });
      expect(next).toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const mockToken = 'invalid-token';
      (req.header as jest.Mock).mockReturnValue(`Bearer ${mockToken}`);
      mockVerifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRole', () => {
    it('should allow access for sufficient hierarchy', () => {
      req.user = {
        id: 'admin-id',
        email: 'admin@test.com',
        role: 'ADMIN',
        userType: 'ADMIN',
        hierarchy: 3
      };

      const middleware = authorizeRole('ORGANIZATION');
      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for insufficient hierarchy', () => {
      req.user = {
        id: 'driver-id',
        email: 'driver@test.com',
        role: 'DRIVER',
        userType: 'USER',
        hierarchy: 1
      };

      const middleware = authorizeRole('ADMIN');
      middleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Insufficient permissions.',
        required: 'ADMIN',
        current: 'DRIVER'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorizeOrganization', () => {
    it('should allow super admin to access any organization', () => {
      req.user = {
        id: 'super-admin-id',
        email: 'super@test.com',
        role: 'SUPER_ADMIN',
        userType: 'SUPER_ADMIN'
      };
      req.params = { organizationId: 'any-org-id' };

      authorizeOrganization(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should enforce organization boundary for organization users', () => {
      req.user = {
        id: 'org-id',
        email: 'org@test.com',
        role: 'ORGANIZATION',
        userType: 'ORGANIZATION',
        organizationId: 'org-1'
      };
      req.params = { organizationId: 'org-2' };

      authorizeOrganization(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Organization boundary violation.',
        message: 'Cannot access data from other organizations'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorizeContext', () => {
    it('should allow web context for admin users', () => {
      req.user = {
        id: 'admin-id',
        email: 'admin@test.com',
        role: 'ADMIN',
        userType: 'ADMIN'
      };

      const middleware = authorizeContext(['web']);
      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow mobile-driver context for driver users', () => {
      req.user = {
        id: 'driver-id',
        email: 'driver@test.com',
        role: 'DRIVER',
        userType: 'USER'
      };

      const middleware = authorizeContext(['mobile-driver']);
      middleware(req as AuthRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny context mismatch', () => {
      req.user = {
        id: 'driver-id',
        email: 'driver@test.com',
        role: 'DRIVER',
        userType: 'USER'
      };

      const middleware = authorizeContext(['web']);
      middleware(req as AuthRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Context mismatch.',
        message: 'This endpoint is not available for mobile-driver users',
        allowedContexts: ['web'],
        userContext: 'mobile-driver'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});