import { AuthErrorType, AuthErrorResponse, SecurityLogEntry, RateLimitConfig, AccountLockoutConfig } from '../types/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rate limiting configurations per user type
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  SUPER_ADMIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 10,
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  },
  ADMIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 8,
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  },
  ORGANIZATION: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 6,
    blockDurationMs: 60 * 60 * 1000 // 1 hour
  },
  USER: {
    windowMs: 5 * 60 * 1000, // 5 minutes (reduced for development)
    maxAttempts: 20, // Increased for development/testing
    blockDurationMs: 10 * 60 * 1000 // 10 minutes (reduced for development)
  }
};

// Account lockout configurations per user type
const LOCKOUT_CONFIGS: Record<string, AccountLockoutConfig> = {
  SUPER_ADMIN: {
    maxFailedAttempts: 5,
    lockoutDurationMs: 30 * 60 * 1000, // 30 minutes
    resetTimeMs: 24 * 60 * 60 * 1000 // 24 hours
  },
  ADMIN: {
    maxFailedAttempts: 5,
    lockoutDurationMs: 60 * 60 * 1000, // 1 hour
    resetTimeMs: 24 * 60 * 60 * 1000 // 24 hours
  },
  ORGANIZATION: {
    maxFailedAttempts: 3,
    lockoutDurationMs: 2 * 60 * 60 * 1000, // 2 hours
    resetTimeMs: 24 * 60 * 60 * 1000 // 24 hours
  },
  USER: {
    maxFailedAttempts: 10, // Increased for development/testing
    lockoutDurationMs: 5 * 60 * 1000, // 5 minutes (reduced for development)
    resetTimeMs: 2 * 60 * 60 * 1000 // 2 hours (reduced for development)
  }
};

// In-memory stores for rate limiting and lockout tracking
const rateLimitStore = new Map<string, { count: number; resetTime: number; blockedUntil?: number }>();
const lockoutStore = new Map<string, { failedAttempts: number; lockedUntil?: number; lastAttempt: number }>();

export class SecurityService {
  /**
   * Clear all security stores (for testing)
   */
  static clearStores(): void {
    rateLimitStore.clear();
    lockoutStore.clear();
  }

  /**
   * Clear rate limit for specific user/IP (for development)
   */
  static clearRateLimit(userType: string, identifier: string): void {
    const key = `${userType}:${identifier}`;
    rateLimitStore.delete(key);
  }

  /**
   * Clear account lockout for specific user (for development)
   */
  static clearAccountLockout(userType: string, userId: string): void {
    const key = `${userType}:${userId}`;
    lockoutStore.delete(key);
  }

  /**
   * Log security events for audit purposes
   */
  static async logSecurityEvent(entry: SecurityLogEntry): Promise<void> {
    try {
      // Log to console for development (in production, use proper logging service)
      console.log(`[SECURITY] ${entry.timestamp.toISOString()} - ${entry.action} - ${entry.success ? 'SUCCESS' : 'FAILED'}`, {
        userType: entry.userType,
        email: entry.email,
        ipAddress: entry.ipAddress,
        errorType: entry.errorType,
        additionalData: entry.additionalData
      });

      // In production, you would store this in a dedicated security log table
      // For now, we'll use console logging
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Check if user is rate limited
   */
  static checkRateLimit(userType: string, identifier: string): { allowed: boolean; resetTime?: number } {
    const config = RATE_LIMIT_CONFIGS[userType] || RATE_LIMIT_CONFIGS.USER;
    const key = `${userType}:${identifier}`;
    const now = Date.now();
    
    const record = rateLimitStore.get(key);
    
    if (!record) {
      // First attempt
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return { allowed: true };
    }

    // Check if user is currently blocked and block hasn't expired
    if (record.blockedUntil && now < record.blockedUntil) {
      return { allowed: false, resetTime: record.blockedUntil };
    }

    // Check if window has expired OR block has expired
    if (now > record.resetTime || (record.blockedUntil && now >= record.blockedUntil)) {
      // Reset the window and clear any block
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return { allowed: true };
    }

    // Increment count
    record.count++;
    
    if (record.count > config.maxAttempts) {
      // Block the user
      record.blockedUntil = now + config.blockDurationMs;
      return { allowed: false, resetTime: record.blockedUntil };
    }

    return { allowed: true };
  }

  /**
   * Check if account is locked out
   */
  static checkAccountLockout(userType: string, userId: string): { locked: boolean; lockedUntil?: number } {
    const config = LOCKOUT_CONFIGS[userType] || LOCKOUT_CONFIGS.USER;
    const key = `${userType}:${userId}`;
    const now = Date.now();
    
    const record = lockoutStore.get(key);
    
    if (!record) {
      return { locked: false };
    }

    // Check if lockout has expired
    if (record.lockedUntil && now >= record.lockedUntil) {
      // Reset failed attempts after lockout expires
      lockoutStore.delete(key);
      return { locked: false };
    }

    // Check if account is currently locked
    if (record.lockedUntil && now < record.lockedUntil) {
      return { locked: true, lockedUntil: record.lockedUntil };
    }

    return { locked: false };
  }

  /**
   * Record failed authentication attempt
   */
  static recordFailedAttempt(userType: string, userId: string): { locked: boolean; lockedUntil?: number } {
    const config = LOCKOUT_CONFIGS[userType] || LOCKOUT_CONFIGS.USER;
    const key = `${userType}:${userId}`;
    const now = Date.now();
    
    const record = lockoutStore.get(key) || { failedAttempts: 0, lastAttempt: now };
    
    // Reset failed attempts if enough time has passed
    if (now - record.lastAttempt > config.resetTimeMs) {
      record.failedAttempts = 0;
    }

    record.failedAttempts++;
    record.lastAttempt = now;

    if (record.failedAttempts >= config.maxFailedAttempts) {
      record.lockedUntil = now + config.lockoutDurationMs;
      lockoutStore.set(key, record);
      return { locked: true, lockedUntil: record.lockedUntil };
    }

    lockoutStore.set(key, record);
    return { locked: false };
  }

  /**
   * Record successful authentication (resets failed attempts)
   */
  static recordSuccessfulAttempt(userType: string, userId: string): void {
    const key = `${userType}:${userId}`;
    lockoutStore.delete(key);
  }

  /**
   * Get security configuration for user type
   */
  static getSecurityConfig(userType: string) {
    return {
      rateLimit: RATE_LIMIT_CONFIGS[userType] || RATE_LIMIT_CONFIGS.USER,
      lockout: LOCKOUT_CONFIGS[userType] || LOCKOUT_CONFIGS.USER
    };
  }

  /**
   * Create standardized auth error response
   */
  static createAuthError(
    type: AuthErrorType,
    message: string,
    code: number,
    path: string,
    details?: any
  ): AuthErrorResponse {
    const error: AuthErrorResponse = {
      error: {
        type,
        message,
        code
      },
      timestamp: new Date().toISOString(),
      path
    };

    if (details !== undefined) {
      error.error.details = details;
    }

    return error;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}