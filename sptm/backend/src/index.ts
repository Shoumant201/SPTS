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
import superAdminRoutes from './routes/superAdminRoutes';
import adminRoutes from './routes/adminRoutes';
import organizationAuthRoutes from './routes/organizationAuthRoutes';
import organizationRoutes from './routes/organizationRoutes';

// Import Swagger configuration
import { swaggerConfig, getEnvironmentConfig } from './config/swagger';
import createSwaggerUIOptions, { isSwaggerEnabled, getEnvironmentSummary } from './config/swaggerOptions';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Context']
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