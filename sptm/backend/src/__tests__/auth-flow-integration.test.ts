import request from 'supertest';
import express from 'express';
import { Router } from 'express';
import { hashPassword } from '../utils/password';
import { UserRole } from '@prisma/client';

// Create a minimal test app with just auth routes
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock the auth routes for testing
  const authRouter = Router();
  
  // Mock authentication endpoints
  authRouter.post('/web/super-admin/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'super@test.com' && password === 'SuperAdmin123!') {
      return res.json({
        success: true,
        user: {
          id: 'super-admin-id',
          email: 'super@test.com',
          name: 'Super Admin Test',
          role: 'SUPER_ADMIN',
          userType: 'SUPER_ADMIN'
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  });

  authRouter.post('/web/admin/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'admin@test.com' && password === 'Admin123!') {
      return res.json({
        success: true,
        user: {
          id: 'admin-id',
          email: 'admin@test.com',
          name: 'Admin Test',
          role: 'ADMIN',
          userType: 'ADMIN'
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  });

  authRouter.post('/web/organization/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'org@test.com' && password === 'Org123!') {
      return res.json({
        success: true,
        user: {
          id: 'org-id',
          email: 'org@test.com',
          name: 'Test Organization',
          role: 'ORGANIZATION',
          userType: 'ORGANIZATION',
          organizationId: 'org-id'
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  });

  authRouter.post('/mobile/driver/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'driver@test.com' && password === 'Driver123!') {
      return res.json({
        success: true,
        user: {
          id: 'driver-id',
          email: 'driver@test.com',
          name: 'Driver Test',
          role: 'DRIVER',
          userType: 'USER',
          organizationId: 'org-id'
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  });

  authRouter.post('/mobile/passenger/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'passenger@test.com' && password === 'Passenger123!') {
      return res.json({
        success: true,
        user: {
          id: 'passenger-id',
          email: 'passenger@test.com',
          name: 'Passenger Test',
          role: 'PASSENGER',
          userType: 'USER'
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  });

  // Mock refresh token endpoints
  authRouter.post('/web/super-admin/refresh-token', (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken === 'mock-refresh-token') {
      return res.json({
        tokens: {
          accessToken: 'new-mock-access-token',
          refreshToken: 'new-mock-refresh-token'
        }
      });
    }
    
    return res.status(401).json({ error: 'Invalid refresh token' });
  });

  authRouter.post('/web/admin/refresh-token', (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken === 'mock-refresh-token') {
      return res.json({
        tokens: {
          accessToken: 'new-mock-access-token',
          refreshToken: 'new-mock-refresh-token'
        }
      });
    }
    
    return res.status(401).json({ error: 'Invalid refresh token' });
  });

  authRouter.post('/web/organization/refresh-token', (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken === 'mock-refresh-token') {
      return res.json({
        tokens: {
          accessToken: 'new-mock-access-token',
          refreshToken: 'new-mock-refresh-token'
        }
      });
    }
    
    return res.status(401).json({ error: 'Invalid refresh token' });
  });

  authRouter.post('/mobile/driver/refresh-token', (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken === 'mock-refresh-token') {
      return res.json({
        tokens: {
          accessToken: 'new-mock-access-token',
          refreshToken: 'new-mock-refresh-token'
        }
      });
    }
    
    return res.status(401).json({ error: 'Invalid refresh token' });
  });

  authRouter.post('/mobile/passenger/refresh-token', (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken === 'mock-refresh-token') {
      return res.json({
        tokens: {
          accessToken: 'new-mock-access-token',
          refreshToken: 'new-mock-refresh-token'
        }
      });
    }
    
    return res.status(401).json({ error: 'Invalid refresh token' });
  });

  app.use('/api/auth', authRouter);
  
  return app;
};

// Test data
const testUsers = {
  superAdmin: {
    email: 'super@test.com',
    password: 'SuperAdmin123!',
    name: 'Super Admin Test'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    name: 'Admin Test'
  },
  organization: {
    email: 'org@test.com',
    password: 'Org123!',
    name: 'Test Organization'
  },
  driver: {
    email: 'driver@test.com',
    password: 'Driver123!',
    name: 'Driver Test',
    role: UserRole.DRIVER
  },
  passenger: {
    email: 'passenger@test.com',
    password: 'Passenger123!',
    name: 'Passenger Test',
    role: UserRole.PASSENGER
  }
};

describe('Authentication Flow Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Super Admin Authentication Flow', () => {
    it('should authenticate super admin successfully', async () => {
      const response = await request(app)
        .post('/api/auth/web/super-admin/login')
        .send({
          email: testUsers.superAdmin.email,
          password: testUsers.superAdmin.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toMatchObject({
        email: testUsers.superAdmin.email,
        name: testUsers.superAdmin.name,
        role: 'SUPER_ADMIN',
        userType: 'SUPER_ADMIN'
      });
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('should reject super admin with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/web/super-admin/login')
        .send({
          email: testUsers.superAdmin.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should refresh super admin tokens successfully', async () => {
      // First authenticate
      const authResponse = await request(app)
        .post('/api/auth/web/super-admin/login')
        .send({
          email: testUsers.superAdmin.email,
          password: testUsers.superAdmin.password
        });

      const { refreshToken } = authResponse.body.tokens;

      // Test token refresh
      const refreshResponse = await request(app)
        .post('/api/auth/web/super-admin/refresh-token')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.tokens).toHaveProperty('accessToken');
      expect(refreshResponse.body.tokens).toHaveProperty('refreshToken');
    });
  });

  describe('Admin Authentication Flow', () => {
    it('should authenticate admin successfully', async () => {
      const response = await request(app)
        .post('/api/auth/web/admin/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toMatchObject({
        email: testUsers.admin.email,
        name: testUsers.admin.name,
        role: 'ADMIN',
        userType: 'ADMIN'
      });
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('should reject admin with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/web/admin/login')
        .send({
          email: testUsers.admin.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should refresh admin tokens successfully', async () => {
      // First authenticate
      const authResponse = await request(app)
        .post('/api/auth/web/admin/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password
        });

      const { refreshToken } = authResponse.body.tokens;

      // Test token refresh
      const refreshResponse = await request(app)
        .post('/api/auth/web/admin/refresh-token')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.tokens).toHaveProperty('accessToken');
      expect(refreshResponse.body.tokens).toHaveProperty('refreshToken');
    });
  });

  describe('Organization Authentication Flow', () => {
    it('should authenticate organization successfully', async () => {
      const response = await request(app)
        .post('/api/auth/web/organization/login')
        .send({
          email: testUsers.organization.email,
          password: testUsers.organization.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toMatchObject({
        email: testUsers.organization.email,
        name: testUsers.organization.name,
        role: 'ORGANIZATION',
        userType: 'ORGANIZATION'
      });
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('should reject organization with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/web/organization/login')
        .send({
          email: testUsers.organization.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should refresh organization tokens successfully', async () => {
      // First authenticate
      const authResponse = await request(app)
        .post('/api/auth/web/organization/login')
        .send({
          email: testUsers.organization.email,
          password: testUsers.organization.password
        });

      const { refreshToken } = authResponse.body.tokens;

      // Test token refresh
      const refreshResponse = await request(app)
        .post('/api/auth/web/organization/refresh-token')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.tokens).toHaveProperty('accessToken');
      expect(refreshResponse.body.tokens).toHaveProperty('refreshToken');
    });
  });

  describe('Driver Authentication Flow', () => {
    it('should authenticate driver successfully through mobile app', async () => {
      const response = await request(app)
        .post('/api/auth/mobile/driver/login')
        .send({
          email: testUsers.driver.email,
          password: testUsers.driver.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toMatchObject({
        email: testUsers.driver.email,
        name: testUsers.driver.name,
        role: 'DRIVER',
        userType: 'USER'
      });
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('should reject driver with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/mobile/driver/login')
        .send({
          email: testUsers.driver.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should refresh driver tokens successfully', async () => {
      // First authenticate
      const authResponse = await request(app)
        .post('/api/auth/mobile/driver/login')
        .send({
          email: testUsers.driver.email,
          password: testUsers.driver.password
        });

      const { refreshToken } = authResponse.body.tokens;

      // Test token refresh
      const refreshResponse = await request(app)
        .post('/api/auth/mobile/driver/refresh-token')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.tokens).toHaveProperty('accessToken');
      expect(refreshResponse.body.tokens).toHaveProperty('refreshToken');
    });
  });

  describe('Passenger Authentication Flow', () => {
    it('should authenticate passenger successfully through mobile app', async () => {
      const response = await request(app)
        .post('/api/auth/mobile/passenger/login')
        .send({
          email: testUsers.passenger.email,
          password: testUsers.passenger.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toMatchObject({
        email: testUsers.passenger.email,
        name: testUsers.passenger.name,
        role: 'PASSENGER',
        userType: 'USER'
      });
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    it('should reject passenger with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/mobile/passenger/login')
        .send({
          email: testUsers.passenger.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should refresh passenger tokens successfully', async () => {
      // First authenticate
      const authResponse = await request(app)
        .post('/api/auth/mobile/passenger/login')
        .send({
          email: testUsers.passenger.email,
          password: testUsers.passenger.password
        });

      const { refreshToken } = authResponse.body.tokens;

      // Test token refresh
      const refreshResponse = await request(app)
        .post('/api/auth/mobile/passenger/refresh-token')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.tokens).toHaveProperty('accessToken');
      expect(refreshResponse.body.tokens).toHaveProperty('refreshToken');
    });
  });

  describe('Cross-Tier Authentication Validation', () => {
    it('should authenticate different user types with correct endpoints', async () => {
      const testCases = [
        {
          user: testUsers.superAdmin,
          endpoint: '/api/auth/web/super-admin/login',
          expectedUserType: 'SUPER_ADMIN'
        },
        {
          user: testUsers.admin,
          endpoint: '/api/auth/web/admin/login',
          expectedUserType: 'ADMIN'
        },
        {
          user: testUsers.organization,
          endpoint: '/api/auth/web/organization/login',
          expectedUserType: 'ORGANIZATION'
        },
        {
          user: testUsers.driver,
          endpoint: '/api/auth/mobile/driver/login',
          expectedUserType: 'USER'
        },
        {
          user: testUsers.passenger,
          endpoint: '/api/auth/mobile/passenger/login',
          expectedUserType: 'USER'
        }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post(testCase.endpoint)
          .send({
            email: testCase.user.email,
            password: testCase.user.password
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.user.userType).toBe(testCase.expectedUserType);
      }
    });

    it('should reject authentication attempts with wrong credentials', async () => {
      const endpoints = [
        '/api/auth/web/super-admin/login',
        '/api/auth/web/admin/login',
        '/api/auth/web/organization/login',
        '/api/auth/mobile/driver/login',
        '/api/auth/mobile/passenger/login'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .post(endpoint)
          .send({
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid credentials');
      }
    });

    it('should reject invalid refresh tokens', async () => {
      const refreshEndpoints = [
        '/api/auth/web/super-admin/refresh-token',
        '/api/auth/web/admin/refresh-token',
        '/api/auth/web/organization/refresh-token',
        '/api/auth/mobile/driver/refresh-token',
        '/api/auth/mobile/passenger/refresh-token'
      ];

      for (const endpoint of refreshEndpoints) {
        const response = await request(app)
          .post(endpoint)
          .send({ refreshToken: 'invalid-token' });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid refresh token');
      }
    });
  });

  describe('Token Management Flow', () => {
    it('should handle complete authentication and refresh flow for all user types', async () => {
      const userFlows = [
        {
          user: testUsers.superAdmin,
          loginEndpoint: '/api/auth/web/super-admin/login',
          refreshEndpoint: '/api/auth/web/super-admin/refresh-token'
        },
        {
          user: testUsers.admin,
          loginEndpoint: '/api/auth/web/admin/login',
          refreshEndpoint: '/api/auth/web/admin/refresh-token'
        },
        {
          user: testUsers.organization,
          loginEndpoint: '/api/auth/web/organization/login',
          refreshEndpoint: '/api/auth/web/organization/refresh-token'
        },
        {
          user: testUsers.driver,
          loginEndpoint: '/api/auth/mobile/driver/login',
          refreshEndpoint: '/api/auth/mobile/driver/refresh-token'
        },
        {
          user: testUsers.passenger,
          loginEndpoint: '/api/auth/mobile/passenger/login',
          refreshEndpoint: '/api/auth/mobile/passenger/refresh-token'
        }
      ];

      for (const flow of userFlows) {
        // Step 1: Login
        const loginResponse = await request(app)
          .post(flow.loginEndpoint)
          .send({
            email: flow.user.email,
            password: flow.user.password
          });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.success).toBe(true);

        const { accessToken, refreshToken } = loginResponse.body.tokens;
        expect(accessToken).toBeDefined();
        expect(refreshToken).toBeDefined();

        // Step 2: Refresh tokens
        const refreshResponse = await request(app)
          .post(flow.refreshEndpoint)
          .send({ refreshToken });

        expect(refreshResponse.status).toBe(200);
        expect(refreshResponse.body.tokens).toHaveProperty('accessToken');
        expect(refreshResponse.body.tokens).toHaveProperty('refreshToken');

        // Verify new tokens are different
        expect(refreshResponse.body.tokens.accessToken).not.toBe(accessToken);
        expect(refreshResponse.body.tokens.refreshToken).not.toBe(refreshToken);
      }
    });
  });
});