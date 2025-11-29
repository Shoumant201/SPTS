import request from 'supertest';
import express from 'express';
import { SecurityService } from '../services/securityService';
import { AuthErrorType } from '../types/auth';

// Mock the auth service to avoid database dependencies
jest.mock('../services/authService', () => ({
  authService: {
    authenticateSuperAdmin: jest.fn(),
    authenticateAdmin: jest.fn(),
    authenticateOrganization: jest.fn(),
    authenticateUser: jest.fn(),
  }
}));

// Mock prisma
jest.mock('../utils/prisma', () => ({
  prisma: {}
}));

describe('Security Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Clear security stores
    SecurityService.clearStores();
    
    jest.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('should block requests after rate limit exceeded', async () => {
      // Create a simple test endpoint with rate limiting
      const { rateLimitMiddleware } = require('../middleware/security');
      
      app.post('/test-rate-limit', 
        rateLimitMiddleware('USER'),
        (req, res) => res.json({ success: true })
      );

      // Make requests up to the limit (5 for USER)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/test-rate-limit')
          .send({});
        expect(response.status).toBe(200);
      }

      // 6th request should be blocked
      const response = await request(app)
        .post('/test-rate-limit')
        .send({});
      
      expect(response.status).toBe(429);
      expect(response.body.error.type).toBe(AuthErrorType.RATE_LIMIT_EXCEEDED);
    });
  });

  describe('Password Strength Validation', () => {
    it('should reject weak passwords', async () => {
      const { passwordStrengthMiddleware } = require('../middleware/security');
      
      app.post('/test-password', 
        passwordStrengthMiddleware,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-password')
        .send({ password: 'weak' });
      
      expect(response.status).toBe(400);
      expect(response.body.error.type).toBe(AuthErrorType.WEAK_PASSWORD);
      expect(response.body.error.details.requirements).toBeDefined();
    });

    it('should accept strong passwords', async () => {
      const { passwordStrengthMiddleware } = require('../middleware/security');
      
      app.post('/test-password', 
        passwordStrengthMiddleware,
        (req, res) => res.json({ success: true })
      );

      const response = await request(app)
        .post('/test-password')
        .send({ password: 'StrongP@ssw0rd123' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Security Logging', () => {
    it('should log authentication attempts', async () => {
      const { securityLoggingMiddleware } = require('../middleware/security');
      const logSpy = jest.spyOn(SecurityService, 'logSecurityEvent');
      
      app.post('/auth/login', 
        securityLoggingMiddleware,
        (req, res) => res.status(401).json({ error: 'Invalid credentials' })
      );

      await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });
      
      expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({
        action: 'AUTHENTICATION_ATTEMPT',
        success: false,
        email: 'test@example.com',
        errorType: AuthErrorType.INVALID_CREDENTIALS
      }));
    });
  });

  describe('Error Response Format', () => {
    it('should return standardized error responses', () => {
      const error = SecurityService.createAuthError(
        AuthErrorType.INVALID_CREDENTIALS,
        'Test error',
        401,
        '/test/path',
        { additional: 'data' }
      );

      expect(error).toMatchObject({
        error: {
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'Test error',
          code: 401,
          details: { additional: 'data' }
        },
        timestamp: expect.any(String),
        path: '/test/path'
      });
    });
  });
});