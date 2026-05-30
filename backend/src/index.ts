import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Import routes
import authRoutes from './routes/authRoutes';
import unifiedAuthRoutes from './routes/unifiedAuthRoutes';
import phoneAuthRoutes from './routes/phoneAuthRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import adminRoutes from './routes/adminRoutes';
import organizationAuthRoutes from './routes/organizationAuthRoutes';
import organizationRoutes from './routes/organizationRoutes';
import passwordResetRoutes from './routes/passwordResetRoutes';
import profileRoutes from './routes/profileRoutes';
import driverManagementRoutes from './routes/driverManagementRoutes';
import fleetRoutes from './routes/fleetRoutes';
import routeManagementRoutes from './routes/routeManagementRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import locationRoutes from './routes/locationRoutes';
import incidentRoutes from './routes/incidentRoutes';
import tripRoutes from './routes/tripRoutes';
import busRoutes from './routes/busRoutes';
import walletRoutes from './routes/walletRoutes';
import discountRoutes from './routes/discountRoutes';
import seedRoutes from './routes/seedRoutes';

// Import Swagger configuration
import { swaggerConfig, getEnvironmentConfig } from './config/swagger';
import createSwaggerUIOptions, { isSwaggerEnabled, getEnvironmentSummary } from './config/swaggerOptions';
import { authenticate } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration - Allow mobile apps and web dashboard
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://spts.onrender.com',
  // Add your Vercel URL when deployed
  // 'https://your-app.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any origin (for mobile apps)
    // Mobile apps don't send Origin header
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Seed-Key', 'X-App-Context'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
}));

// Security middleware (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files for favicon and assets
app.use(express.static('public'));

// Swagger API Documentation - Environment-specific setup
const envConfig = getEnvironmentConfig();

if (isSwaggerEnabled(envConfig)) {
  const swaggerSpec = swaggerJsdoc(swaggerConfig);
  const swaggerUIOptions = createSwaggerUIOptions(envConfig);

  // Serve Swagger UI at /api-docs with enhanced configuration
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUIOptions));
  
  // Add a JSON endpoint for the OpenAPI spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('📚 Swagger UI enabled at /api-docs');
  console.log('📄 OpenAPI spec available at /api-docs.json');
  console.log(`📋 Environment Features: ${getEnvironmentSummary(envConfig)}`);
  console.log('🧪 Interactive "Try it out" functionality: ENABLED');
} else {
  // Provide a simple message when Swagger is disabled
  app.get('/api-docs', (req, res) => {
    res.status(404).json({
      error: 'API documentation is not available in this environment',
      message: 'Swagger UI is disabled for security reasons',
      environment: process.env.NODE_ENV || 'unknown'
    });
  });
  
  console.log('🚫 Swagger UI disabled for this environment');
}

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check endpoint
 *     description: Returns system health status
 *     security: []
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "SPTM Backend is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SPTM Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Development endpoint to reset rate limits
if (process.env.NODE_ENV !== 'production') {
  app.post('/dev/reset-rate-limits', (_req, res) => {
    try {
      const { SecurityService } = require('./services/securityService');
      SecurityService.clearStores();

      console.log('🔄 Rate limits and account lockouts cleared via dev endpoint');
      res.json({
        message: 'Rate limits and account lockouts cleared successfully',
        timestamp: new Date().toISOString(),
        note: 'This endpoint is only available in development mode'
      });
    } catch (error) {
      console.error('❌ Error clearing rate limits:', error);
      const err = error as Error;
      res.status(500).json({
        error: 'Failed to clear rate limits',
        details: err.message
      });
    }
  });
}

// Request logging middleware for debugging (moved before routes)
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  next();
});

// API routes
// Profile routes (authenticated users) - inline implementation
app.get('/api/profile', authenticate, async (req: any, res: any) => {
  try {
    const { ProfileController } = await import('./controllers/profileController');
    return ProfileController.getProfile(req, res);
  } catch (error) {
    console.error('Profile get error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/profile', authenticate, async (req: any, res: any) => {
  try {
    const { ProfileController } = await import('./controllers/profileController');
    return ProfileController.updateProfile(req, res);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/profile/password', authenticate, async (req: any, res: any) => {
  try {
    const { ProfileController } = await import('./controllers/profileController');
    return ProfileController.changePassword(req, res);
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Phone authentication for mobile apps
app.use('/api/phone-auth', phoneAuthRoutes);

// Driver management routes
app.use('/api/driver-management', driverManagementRoutes);

// Fleet management routes
app.use('/api/fleet', fleetRoutes);

// Route management routes
app.use('/api/routes', routeManagementRoutes);

// Bus assignment / schedule routes
app.use('/api/assignments', assignmentRoutes);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// Driver GPS location routes
app.use('/api/location', locationRoutes);

// Incident reporting routes
app.use('/api/incidents', incidentRoutes);

// Trip management routes
app.use('/api/trips', tripRoutes);

// Bus tracking routes (public - no auth required for nearby buses)
app.use('/api/buses', busRoutes);

// Wallet and tap system routes
app.use('/api/wallet', walletRoutes);

// Discount system routes
app.use('/api/discounts', discountRoutes);

// Database seeding routes (protected by SEED_KEY)
app.use('/api/seed', seedRoutes);

// IoT device data endpoint (no user auth — uses device token)
app.post('/api/iot/:deviceId/data', async (req: any, res: any) => {
  try {
    const { FleetController } = await import('./controllers/fleetController');
    return FleetController.updateIoTData(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Password reset routes (public - no auth required)
app.use('/api/password-reset', passwordResetRoutes);

// Unified authentication routes (new structure)
app.use('/api/auth', unifiedAuthRoutes);

// Tier-specific routes
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/organization', organizationAuthRoutes);

// Legacy routes (backward compatibility)
app.use('/api/user', authRoutes);
app.use('/api/organizations', organizationRoutes);

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('Request Body:', req.body);
  console.error('=============================');

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack
    })
  });
});

// Export app for testing
export { app };

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}