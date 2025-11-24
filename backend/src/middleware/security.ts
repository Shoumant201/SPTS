import { Request, Response, NextFunction } from 'express';
import { AuthErrorType } from '../types/auth';
import { SecurityService } from '../services/securityService';

interface SecurityRequest extends Request {
  userType?: string;
  clientIp?: string;
}

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (userType?: string) => {
  return (req: SecurityRequest, res: Response, next: NextFunction) => {
    const requestUserType = userType || req.userType || 'USER';
    const identifier = req.clientIp || req.ip || 'unknown';
    
    const rateLimitCheck = SecurityService.checkRateLimit(requestUserType, identifier);
    
    if (!rateLimitCheck.allowed) {
      const resetTime = rateLimitCheck.resetTime ? new Date(rateLimitCheck.resetTime) : new Date();
      
      // Log rate limit violation
      SecurityService.logSecurityEvent({
        timestamp: new Date(),
        userType: requestUserType,
        ipAddress: identifier,
        userAgent: req.get('User-Agent') || 'unknown',
        action: 'RATE_LIMIT_EXCEEDED',
        success: false,
        errorType: AuthErrorType.RATE_LIMIT_EXCEEDED,
        additionalData: { path: req.path, resetTime }
      });

      const errorResponse = SecurityService.createAuthError(
        AuthErrorType.RATE_LIMIT_EXCEEDED,
        'Too many requests. Please try again later.',
        429,
        req.path,
        { resetTime: resetTime.toISOString() }
      );

      return res.status(429).json(errorResponse);
    }

    next();
  };
};

/**
 * Account lockout check middleware
 */
export const accountLockoutMiddleware = (userType: string, getUserId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = getUserId(req);
    
    if (!userId) {
      return next();
    }

    const lockoutCheck = SecurityService.checkAccountLockout(userType, userId);
    
    if (lockoutCheck.locked) {
      const lockedUntil = lockoutCheck.lockedUntil ? new Date(lockoutCheck.lockedUntil) : new Date();
      
      // Log lockout attempt
      SecurityService.logSecurityEvent({
        timestamp: new Date(),
        userType,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        action: 'ACCOUNT_LOCKED_ACCESS_ATTEMPT',
        success: false,
        errorType: AuthErrorType.ACCOUNT_LOCKED,
        additionalData: { userId, lockedUntil }
      });

      const errorResponse = SecurityService.createAuthError(
        AuthErrorType.ACCOUNT_LOCKED,
        'Account is temporarily locked due to multiple failed login attempts.',
        423,
        req.path,
        { lockedUntil: lockedUntil.toISOString() }
      );

      return res.status(423).json(errorResponse);
    }

    next();
  };
};

/**
 * Security logging middleware for authentication attempts
 */
export const securityLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    // Log authentication attempts
    if (req.path.includes('/auth/') || req.path.includes('/login')) {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      const userType = (req as any).userType || 'UNKNOWN';
      const email = req.body?.email;
      
      SecurityService.logSecurityEvent({
        timestamp: new Date(),
        userType,
        email,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        action: 'AUTHENTICATION_ATTEMPT',
        success: isSuccess,
        errorType: isSuccess ? undefined : AuthErrorType.INVALID_CREDENTIALS,
        additionalData: {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode
        }
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Password strength validation middleware
 */
export const passwordStrengthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;
  
  if (!password) {
    return next();
  }

  const validation = SecurityService.validatePasswordStrength(password);
  
  if (!validation.valid) {
    const errorResponse = SecurityService.createAuthError(
      AuthErrorType.WEAK_PASSWORD,
      'Password does not meet security requirements.',
      400,
      req.path,
      { requirements: validation.errors }
    );

    return res.status(400).json(errorResponse);
  }

  next();
};

/**
 * IP address extraction middleware
 */
export const extractClientIpMiddleware = (req: SecurityRequest, res: Response, next: NextFunction) => {
  // Extract real IP address considering proxies
  req.clientIp = req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
                 req.get('X-Real-IP') ||
                 (req as any).connection?.remoteAddress ||
                 req.ip ||
                 'unknown';
  
  next();
};