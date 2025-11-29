import { Router } from 'express';
import { UserAuthController } from '../controllers/authController';
import { authenticate, authorizeRole, authorizeContext, authorizePermission } from '../middleware/auth';
import { validate, authSchemas } from '../middleware/validation';
import { determineAuthContext, validateMobileAppContext } from '../middleware/contextDetermination';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 10 login requests per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (legacy endpoints with context determination)
router.post('/register',
  authLimiter,
  determineAuthContext,
  validateMobileAppContext,
  validate(authSchemas.register),
  UserAuthController.register
);

router.post('/login',
  loginLimiter,
  determineAuthContext,
  validateMobileAppContext,
  validate(authSchemas.login),
  UserAuthController.login
);

/**
 * @swagger
 * /api/user/refresh-token:
 *   post:
 *     tags: [Legacy Authentication]
 *     summary: Legacy refresh token endpoint
 *     description: |
 *       Legacy refresh token endpoint for backward compatibility. 
 *       **DEPRECATED**: Use the unified refresh token endpoints instead:
 *       - `/api/auth/mobile/driver/refresh-token` for drivers
 *       - `/api/auth/mobile/passenger/refresh-token` for passengers
 *       
 *       This endpoint automatically determines the user type from the token and refreshes accordingly.
 *       Requires X-App-Context header to determine the application context.
 *     deprecated: true
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [driver-app, passenger-app]
 *         description: Application context header
 *         example: "driver-app"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *           examples:
 *             driverRefresh:
 *               summary: Driver token refresh
 *               value:
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             passengerRefresh:
 *               summary: Passenger token refresh
 *               value:
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - tokens
 *               properties:
 *                 tokens:
 *                   $ref: '#/components/schemas/TokenResponse'
 *             examples:
 *               success:
 *                 summary: Successful token refresh
 *                 value:
 *                   tokens:
 *                     accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       400:
 *         description: Invalid or missing context header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingContext:
 *                 summary: Missing context header
 *                 value:
 *                   error: "X-App-Context header is required"
 *                   timestamp: "2025-11-29T12:00:00.000Z"
 *                   path: "/api/user/refresh-token"
 */
router.post('/refresh-token',
  determineAuthContext,
  UserAuthController.refreshToken
);

// Protected routes
router.get('/me', authenticate, UserAuthController.getMe);
router.post('/logout', authenticate, UserAuthController.logout);
router.get('/profile', authenticate, UserAuthController.getProfile);
router.put('/profile', authenticate, UserAuthController.updateProfile);
router.put('/change-password', authenticate, validate(authSchemas.changePassword), UserAuthController.changePassword);

// Role-specific routes with context and permission validation
router.get('/driver/assignments',
  authenticate,
  authorizeRole('DRIVER'),
  authorizeContext(['mobile-driver']),
  authorizePermission(['vehicle:read', 'routes:read']),
  UserAuthController.getDriverAssignments
);

router.get('/passenger/data',
  authenticate,
  authorizeRole('PASSENGER'),
  authorizeContext(['mobile-passenger']),
  authorizePermission(['profile:read', 'trips:read']),
  UserAuthController.getPassengerData
);

export default router;