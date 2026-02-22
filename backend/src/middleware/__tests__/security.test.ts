import { Request, Response, NextFunction } from 'express';
import { 
  rateLimitMiddleware, 
  accountLockoutMiddleware, 
  securityLoggingMiddleware,
  passwordStrengthMiddleware,
  extractClientIpMiddleware
} from '../security';
import { SecurityService } from '../../services/securityService';
import { AuthErrorType } from '../../types/auth';

// Mock SecurityService
jest.mock('../../services/securityService');
const mockSecurityService = SecurityService as jest.Mocked<typeof SecurityService>;

describe('Security Middleware', () => {
  let req: any;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      ip: '127.0.0.1',
      path: '/test',
      body: {},
      get: jest.fn(),
      method: 'POST'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      statusCode: 200
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('rateLimitMiddleware', () => {
    it('should allow request when rate limit not exceeded', () => {
      mockSecurityService.checkRateLimit.mockReturnValue({ allowed: true });

      const middleware = rateLimitMiddleware('USER');
      middleware(req as Request, res as Response, next);

      expect(mockSecurityService.checkRateLimit).toHaveBeenCalledWith('USER', '127.0.0.1');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block request when rate limit exceeded', () => {
      const resetTime = Date.now() + 60000;
      mockSecurityService.checkRateLimit.mockReturnValue({ 
        allowed: false, 
        resetTime 
      });
      mockSecurityService.createAuthError.mockReturnValue({
        error: {
          type: AuthErrorType.RATE_LIMIT_EXCEEDED,
          message: 'Too many requests',
          code: 429,
          details: { resetTime: new Date(resetTime).toISOString() }
        },
        timestamp: new Date().toISOString(),
        path: '/test'
      });
      mockSecurityService.logSecurityEvent.mockResolvedValue();

      const middleware = rateLimitMiddleware('USER');
      middleware(req as Request, res as Response, next);

      expect(mockSecurityService.checkRateLimit).toHaveBeenCalledWith('USER', '127.0.0.1');
      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should use default user type when not provided', () => {
      mockSecurityService.checkRateLimit.mockReturnValue({ allowed: true });

      const middleware = rateLimitMiddleware();
      middleware(req as Request, res as Response, next);

      expect(mockSecurityService.checkRateLimit).toHaveBeenCalledWith('USER', '127.0.0.1');
    });

    it('should extract client IP from X-Forwarded-For header', () => {
      (req.get as jest.Mock).mockReturnValue('192.168.1.1, 10.0.0.1');
      mockSecurityService.checkRateLimit.mockReturnValue({ allowed: true });

      const middleware = rateLimitMiddleware('USER');
      middleware(req as Request, res as Response, next);

      expect(mockSecurityService.checkRateLimit).toHaveBeenCalledWith('USER', '127.0.0.1');
    });
  });

  describe('accountLockoutMiddleware', () => {
    const getUserId = (req: Request) => req.body.userId || 'test-user-id';

    it('should allow request when account not locked', () => {
      req.body = { userId: 'test-user-id' };
      mockSecurityService.checkAccountLockout.mockReturnValue({ locked: false });

      const middleware = accountLockoutMiddleware('USER', getUserId);
      middleware(req as Request, res as Response, next);

      expect(mockSecurityService.checkAccountLockout).toHaveBeenCalledWith('USER', 'test-user-id');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block request when account is locked', () => {
      req.body = { userId: 'test-user-id' };
      const lockedUntil = Date.now() + 60000;
      mockSecurityService.checkAccountLockout.mockReturnValue({ 
        locked: true, 
        lockedUntil 
      });
      mockSecurityService.createAuthError.mockReturnValue({
        error: {
          type: AuthErrorType.ACCOUNT_LOCKED,
          message: 'Account is locked',
          code: 423,
          details: { lockedUntil: new Date(lockedUntil).toISOString() }
        },
        timestamp: new Date().toISOString(),
        path: '/test'
      });
      mockSecurityService.logSecurityEvent.mockResolvedValue();

      const middleware = accountLockoutMiddleware('USER', getUserId);
      middleware(req as Request, res as Response, next);

      expect(mockSecurityService.checkAccountLockout).toHaveBeenCalledWith('USER', 'test-user-id');
      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(423);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should continue when no user ID provided', () => {
      req.body = {}; // No userId
      const getUserIdEmpty = (req: Request) => '';
      const middleware = accountLockoutMiddleware('USER', getUserIdEmpty);
      middleware(req as Request, res as Response, next);

      expect(mockSecurityService.checkAccountLockout).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('passwordStrengthMiddleware', () => {
    it('should allow request with strong password', () => {
      req.body = { password: 'StrongP@ssw0rd' };
      mockSecurityService.validatePasswordStrength.mockReturnValue({
        valid: true,
        errors: []
      });

      passwordStrengthMiddleware(req as Request, res as Response, next);

      expect(mockSecurityService.validatePasswordStrength).toHaveBeenCalledWith('StrongP@ssw0rd');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block request with weak password', () => {
      req.body = { password: 'weak' };
      mockSecurityService.validatePasswordStrength.mockReturnValue({
        valid: false,
        errors: ['Password too short', 'Missing uppercase letter']
      });
      mockSecurityService.createAuthError.mockReturnValue({
        error: {
          type: AuthErrorType.WEAK_PASSWORD,
          message: 'Password does not meet requirements',
          code: 400,
          details: { requirements: ['Password too short', 'Missing uppercase letter'] }
        },
        timestamp: new Date().toISOString(),
        path: '/test'
      });

      passwordStrengthMiddleware(req as Request, res as Response, next);

      expect(mockSecurityService.validatePasswordStrength).toHaveBeenCalledWith('weak');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should continue when no password provided', () => {
      passwordStrengthMiddleware(req as Request, res as Response, next);

      expect(mockSecurityService.validatePasswordStrength).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('securityLoggingMiddleware', () => {
    it('should log authentication attempts', () => {
      req.path = '/auth/login';
      req.method = 'POST';
      req.body = { email: 'test@example.com' };
      (req as any).userType = 'USER';
      res.statusCode = 200;
      mockSecurityService.logSecurityEvent.mockResolvedValue();

      securityLoggingMiddleware(req as Request, res as Response, next);

      // Simulate response being sent
      const originalSend = res.send;
      (res.send as jest.Mock)('success');

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith({
        timestamp: expect.any(Date),
        userType: 'USER',
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'unknown',
        action: 'AUTHENTICATION_ATTEMPT',
        success: true,
        errorType: undefined,
        additionalData: {
          path: '/auth/login',
          method: 'POST',
          statusCode: 200
        }
      });
      expect(next).toHaveBeenCalled();
    });

    it('should log failed authentication attempts', () => {
      req.path = '/auth/login';
      req.method = 'POST';
      req.body = { email: 'test@example.com' };
      (req as any).userType = 'USER';
      res.statusCode = 401;
      mockSecurityService.logSecurityEvent.mockResolvedValue();

      securityLoggingMiddleware(req as Request, res as Response, next);

      // Simulate response being sent
      (res.send as jest.Mock)('error');

      expect(mockSecurityService.logSecurityEvent).toHaveBeenCalledWith({
        timestamp: expect.any(Date),
        userType: 'USER',
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'unknown',
        action: 'AUTHENTICATION_ATTEMPT',
        success: false,
        errorType: AuthErrorType.INVALID_CREDENTIALS,
        additionalData: {
          path: '/auth/login',
          method: 'POST',
          statusCode: 401
        }
      });
    });

    it('should not log non-authentication requests', () => {
      req.path = '/api/users';
      mockSecurityService.logSecurityEvent.mockResolvedValue();

      securityLoggingMiddleware(req as Request, res as Response, next);

      // Simulate response being sent
      (res.send as jest.Mock)('data');

      expect(mockSecurityService.logSecurityEvent).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('extractClientIpMiddleware', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      (req.get as jest.Mock).mockImplementation((header: string) => {
        if (header === 'X-Forwarded-For') return '192.168.1.1, 10.0.0.1';
        return undefined;
      });

      extractClientIpMiddleware(req as any, res as Response, next);

      expect((req as any).clientIp).toBe('192.168.1.1');
      expect(next).toHaveBeenCalled();
    });

    it('should extract IP from X-Real-IP header when X-Forwarded-For not available', () => {
      (req.get as jest.Mock).mockImplementation((header: string) => {
        if (header === 'X-Real-IP') return '192.168.1.2';
        return undefined;
      });

      extractClientIpMiddleware(req as any, res as Response, next);

      expect((req as any).clientIp).toBe('192.168.1.2');
      expect(next).toHaveBeenCalled();
    });

    it('should fall back to connection remote address', () => {
      (req as any).connection = { remoteAddress: '192.168.1.3' };

      extractClientIpMiddleware(req as any, res as Response, next);

      expect((req as any).clientIp).toBe('192.168.1.3');
      expect(next).toHaveBeenCalled();
    });

    it('should fall back to req.ip', () => {
      req.ip = '192.168.1.4';

      extractClientIpMiddleware(req as any, res as Response, next);

      expect((req as any).clientIp).toBe('192.168.1.4');
      expect(next).toHaveBeenCalled();
    });

    it('should use unknown when no IP available', () => {
      // Remove all IP sources
      delete req.ip;
      (req.get as jest.Mock).mockReturnValue(undefined);
      
      extractClientIpMiddleware(req as any, res as Response, next);

      expect((req as any).clientIp).toBe('unknown');
      expect(next).toHaveBeenCalled();
    });
  });
});