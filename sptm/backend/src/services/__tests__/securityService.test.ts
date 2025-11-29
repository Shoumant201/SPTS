import { SecurityService } from '../securityService';
import { AuthErrorType } from '../../types/auth';

describe('SecurityService', () => {
  beforeEach(() => {
    // Clear in-memory stores before each test
    SecurityService.clearStores();
  });

  describe('Rate Limiting', () => {
    it('should allow first request', () => {
      const result = SecurityService.checkRateLimit('USER', 'test@example.com');
      expect(result.allowed).toBe(true);
      expect(result.resetTime).toBeUndefined();
    });

    it('should block after exceeding rate limit', () => {
      const userType = 'USER';
      const identifier = 'test@example.com';

      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        SecurityService.checkRateLimit(userType, identifier);
      }

      // Next request should be blocked
      const result = SecurityService.checkRateLimit(userType, identifier);
      expect(result.allowed).toBe(false);
      expect(result.resetTime).toBeDefined();
    });

    it('should have different limits for different user types', () => {
      const identifier = 'test@example.com';

      // Super admin should have higher limit (10)
      for (let i = 0; i < 10; i++) {
        const result = SecurityService.checkRateLimit('SUPER_ADMIN', identifier);
        expect(result.allowed).toBe(true);
      }

      // 11th request should be blocked
      const result = SecurityService.checkRateLimit('SUPER_ADMIN', identifier);
      expect(result.allowed).toBe(false);
    });

    it('should reset rate limit after window expires', () => {
      const userType = 'USER';
      const identifier = 'test@example.com';

      // Exceed rate limit (USER config allows 5 attempts)
      for (let i = 0; i < 6; i++) {
        SecurityService.checkRateLimit(userType, identifier);
      }

      // Verify blocked
      let result = SecurityService.checkRateLimit(userType, identifier);
      expect(result.allowed).toBe(false);

      // Mock time passage - need to exceed block duration (1 hour for USER)
      const originalNow = Date.now;
      const futureTime = originalNow() + 65 * 60 * 1000; // 65 minutes later (more than 1 hour block)
      Date.now = jest.fn(() => futureTime);

      // Should be allowed again
      result = SecurityService.checkRateLimit(userType, identifier);
      expect(result.allowed).toBe(true);

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('Account Lockout', () => {
    it('should not be locked initially', () => {
      const result = SecurityService.checkAccountLockout('USER', 'user123');
      expect(result.locked).toBe(false);
    });

    it('should lock account after max failed attempts', () => {
      const userType = 'USER';
      const userId = 'user123';

      // Record failed attempts up to the limit
      for (let i = 0; i < 2; i++) {
        SecurityService.recordFailedAttempt(userType, userId);
      }

      // Third attempt should lock the account
      const result = SecurityService.recordFailedAttempt(userType, userId);
      expect(result.locked).toBe(true);
      expect(result.lockedUntil).toBeDefined();
    });

    it('should check if account is locked', () => {
      const userType = 'USER';
      const userId = 'user123';

      // Lock the account
      for (let i = 0; i < 3; i++) {
        SecurityService.recordFailedAttempt(userType, userId);
      }

      // Check lockout status
      const result = SecurityService.checkAccountLockout(userType, userId);
      expect(result.locked).toBe(true);
    });

    it('should unlock account after lockout period', () => {
      const userType = 'USER';
      const userId = 'user123';

      // Lock the account
      for (let i = 0; i < 3; i++) {
        SecurityService.recordFailedAttempt(userType, userId);
      }

      // Mock time passage
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 3 * 60 * 60 * 1000); // 3 hours later

      // Should be unlocked
      const result = SecurityService.checkAccountLockout(userType, userId);
      expect(result.locked).toBe(false);

      // Restore Date.now
      Date.now = originalNow;
    });

    it('should reset failed attempts on successful login', () => {
      const userType = 'USER';
      const userId = 'user123';

      // Record some failed attempts
      SecurityService.recordFailedAttempt(userType, userId);
      SecurityService.recordFailedAttempt(userType, userId);

      // Record successful attempt
      SecurityService.recordSuccessfulAttempt(userType, userId);

      // Should not be locked even after another failed attempt
      const result = SecurityService.recordFailedAttempt(userType, userId);
      expect(result.locked).toBe(false);
    });

    it('should have different lockout configs for different user types', () => {
      // Super admin should have higher threshold (5 attempts)
      for (let i = 0; i < 4; i++) {
        const result = SecurityService.recordFailedAttempt('SUPER_ADMIN', 'admin123');
        expect(result.locked).toBe(false);
      }

      // 5th attempt should lock
      const result = SecurityService.recordFailedAttempt('SUPER_ADMIN', 'admin123');
      expect(result.locked).toBe(true);
    });
  });

  describe('Password Strength Validation', () => {
    it('should validate strong password', () => {
      const result = SecurityService.validatePasswordStrength('StrongP@ssw0rd');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const testCases = [
        { password: 'short', expectedErrors: 4 }, // too short, no uppercase, no number, no special
        { password: 'nouppercase123!', expectedErrors: 1 }, // no uppercase
        { password: 'NOLOWERCASE123!', expectedErrors: 1 }, // no lowercase
        { password: 'NoNumbers!', expectedErrors: 1 }, // no numbers
        { password: 'NoSpecialChars123', expectedErrors: 1 }, // no special chars
      ];

      testCases.forEach(({ password, expectedErrors }) => {
        const result = SecurityService.validatePasswordStrength(password);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(expectedErrors);
      });
    });
  });

  describe('Security Configuration', () => {
    it('should return correct config for each user type', () => {
      const superAdminConfig = SecurityService.getSecurityConfig('SUPER_ADMIN');
      expect(superAdminConfig.rateLimit.maxAttempts).toBe(10);
      expect(superAdminConfig.lockout.maxFailedAttempts).toBe(5);

      const userConfig = SecurityService.getSecurityConfig('USER');
      expect(userConfig.rateLimit.maxAttempts).toBe(5);
      expect(userConfig.lockout.maxFailedAttempts).toBe(3);
    });

    it('should return default config for unknown user type', () => {
      const config = SecurityService.getSecurityConfig('UNKNOWN');
      expect(config.rateLimit.maxAttempts).toBe(5); // USER default
      expect(config.lockout.maxFailedAttempts).toBe(3); // USER default
    });
  });

  describe('Error Response Creation', () => {
    it('should create standardized error response', () => {
      const error = SecurityService.createAuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Test error message',
        401,
        '/test/path',
        { additional: 'data' }
      );

      expect(error.error.type).toBe(AuthErrorType.INVALID_CREDENTIALS);
      expect(error.error.message).toBe('Test error message');
      expect(error.error.code).toBe(401);
      expect(error.error.details).toEqual({ additional: 'data' });
      expect(error.path).toBe('/test/path');
      expect(error.timestamp).toBeDefined();
    });
  });

  describe('Security Logging', () => {
    it('should log security events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await SecurityService.logSecurityEvent({
        timestamp: new Date(),
        userType: 'USER',
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        action: 'LOGIN_ATTEMPT',
        success: true
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle logging errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Logging failed');
      });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await SecurityService.logSecurityEvent({
        timestamp: new Date(),
        userType: 'USER',
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        action: 'LOGIN_ATTEMPT',
        success: true
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to log security event:', expect.any(Error));
      
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});