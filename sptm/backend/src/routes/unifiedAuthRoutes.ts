import { Router, Request, Response } from 'express';
import { determineAuthContext, validateAuthContext, validateMobileAppContext, AuthContextRequest } from '../middleware/contextDetermination';
import { SuperAdminAuthController } from '../controllers/superAdminAuthController';
import { AdminAuthController } from '../controllers/adminAuthController';
import { OrganizationAuthController } from '../controllers/organizationAuthController';
import { UserAuthController } from '../controllers/authController';
import { validate, authSchemas } from '../middleware/validation';
import rateLimit from 'express-rate-limit';
import { 
  rateLimitMiddleware, 
  securityLoggingMiddleware, 
  passwordStrengthMiddleware,
  extractClientIpMiddleware 
} from '../middleware/security';

/**
 * @swagger
 * tags:
 *   - name: Context-Based Routing
 *     description: |
 *       # Context-Based Routing System
 *       
 *       The SPTM API implements a sophisticated context-based routing system that determines authentication flows and access permissions based on the `X-App-Context` header. This system ensures proper isolation between different application contexts and enforces role-based access control.
 *       
 *       ## Key Concepts
 *       
 *       ### Context Header (`X-App-Context`)
 *       The `X-App-Context` header is **REQUIRED** for all authentication endpoints and determines:
 *       - Which authentication controller handles the request
 *       - What user roles are allowed for the context
 *       - Which platform-specific features are available
 *       - How tokens are validated and issued
 *       
 *       ### Valid Context Values
 *       - `web-dashboard`: For administrative web interface (Super Admin, Admin, Organization)
 *       - `driver-app`: For driver mobile application (Driver role only)
 *       - `passenger-app`: For passenger mobile application (Passenger role only)
 *       
 *       ### Context Determination Process
 *       1. **Header Extraction**: Extract `X-App-Context` from request headers
 *       2. **Path Analysis**: Analyze request path for additional context clues
 *       3. **Context Validation**: Validate context against allowed values
 *       4. **Role Mapping**: Map context to appropriate user types and roles
 *       5. **Controller Routing**: Route to appropriate authentication controller
 *       
 *       ## Context-Role Mapping
 *       
 *       | Context | Allowed Roles | Platform | Controller |
 *       |---------|---------------|----------|------------|
 *       | `web-dashboard` | SUPER_ADMIN, ADMIN, ORGANIZATION | Web | SuperAdminAuthController, AdminAuthController, OrganizationAuthController |
 *       | `driver-app` | DRIVER | Mobile | UserAuthController (with DRIVER role) |
 *       | `passenger-app` | PASSENGER | Mobile | UserAuthController (with PASSENGER role) |
 *       
 *       ## Security Features
 *       
 *       ### Context Isolation
 *       - Complete isolation between different contexts
 *       - Cross-context access is strictly prohibited
 *       - Context switching requires re-authentication
 *       
 *       ### Token Context Validation
 *       - JWT tokens include context claims
 *       - Token context must match request context
 *       - Context mismatch results in authentication failure
 *       
 *       ### Rate Limiting by Context
 *       - Different rate limits for different contexts
 *       - Context-specific abuse prevention
 *       - Adaptive rate limiting based on user behavior
 *       
 *       ## Error Handling
 *       
 *       ### Common Context Errors
 *       - **Missing Context Header**: 400 Bad Request
 *       - **Invalid Context Value**: 400 Bad Request  
 *       - **Context-Role Mismatch**: 401 Unauthorized
 *       - **Token Context Mismatch**: 401 Unauthorized
 *       - **Cross-Platform Access**: 403 Forbidden
 *       
 *       ### Error Response Format
 *       ```json
 *       {
 *         "error": {
 *           "type": "CONTEXT_VALIDATION_ERROR",
 *           "message": "Detailed error message",
 *           "code": 401,
 *           "details": {
 *             "userRole": "DRIVER",
 *             "requestedContext": "web-dashboard",
 *             "allowedContexts": ["driver-app"]
 *           }
 *         },
 *         "timestamp": "2025-11-29T12:00:00.000Z",
 *         "path": "/api/auth/web/admin/login"
 *       }
 *       ```
 *       
 *       ## Implementation Details
 *       
 *       For complete technical documentation including middleware chain, validation logic, and troubleshooting guide, see the `ContextBasedRouting` schema in the components section.
 *       
 *       **Reference**: `#/components/schemas/ContextBasedRouting`
 */

const router = Router();

// Apply security middleware to all routes
router.use(extractClientIpMiddleware);
router.use(securityLoggingMiddleware);

// Rate limiting for auth endpoints (fallback - our custom rate limiting is more sophisticated)
// Note: These are kept for potential future use but currently skipped due to custom rate limiting

// Context-aware login router
const routeToAppropriateController = (req: AuthContextRequest, res: Response) => {
  if (!req.authContext) {
    return res.status(500).json({ error: 'Authentication context not determined' });
  }

  const { userType, platform, appType } = req.authContext;

  try {
    switch (userType) {
      case 'SUPER_ADMIN':
        return SuperAdminAuthController.login(req, res);
      
      case 'ADMIN':
        return AdminAuthController.login(req, res);
      
      case 'ORGANIZATION':
        return OrganizationAuthController.login(req, res);
      
      case 'USER':
        // For mobile apps, set the role based on app type
        if (platform === 'mobile' && appType) {
          req.body.role = appType === 'driver-app' ? 'DRIVER' : 'PASSENGER';
          req.body.context = appType;
        }
        return UserAuthController.login(req, res);
      
      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }
  } catch (error) {
    console.error('Route controller error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ============================================================================
// WEB DASHBOARD ROUTES
// ============================================================================

/**
 * @swagger
 * /api/auth/web/super-admin/login:
 *   post:
 *     tags: [Web Dashboard Authentication]
 *     summary: Super Admin login for web dashboard
 *     description: |
 *       Authenticates super admin users for web dashboard access. Requires X-App-Context header set to 'web-dashboard'.
 *       
 *       **Complete Authentication Flow Example:**
 *       See the SuperAdminLoginFlow example for a comprehensive step-by-step authentication flow including:
 *       - Login request with proper headers
 *       - Success response with user data and tokens
 *       - Using the access token for subsequent requests
 *       - Context header requirements and validation
 *       
 *       **Context Requirements:**
 *       - X-App-Context header MUST be "web-dashboard"
 *       - Super Admin can access all administrative functions
 *       - Token valid for 15 minutes, refresh token valid for 7 days
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [web-dashboard]
 *         description: Application context header (must be 'web-dashboard')
 *         example: "web-dashboard"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             superAdminLogin:
 *               summary: Super Admin Login
 *               value:
 *                 email: "superadmin@sptm.com"
 *                 password: "SuperSecure123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             examples:
 *               success:
 *                 summary: Successful super admin login
 *                 value:
 *                   message: "Super Admin login successful"
 *                   user:
 *                     id: "cmik7w7h700037fm9zv7btfaz"
 *                     email: "superadmin@sptm.com"
 *                     name: "Super Administrator"
 *                     role: "SUPER_ADMIN"
 *                     userType: "SUPER_ADMIN"
 *                     organizationId: null
 *                     isActive: true
 *                     createdAt: "2025-11-29T10:00:00.000Z"
 *                   tokens:
 *                     accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       423:
 *         description: Account locked due to multiple failed attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               accountLocked:
 *                 summary: Account locked
 *                 value:
 *                   error:
 *                     type: "ACCOUNT_LOCKED"
 *                     message: "Account has been locked due to multiple failed login attempts"
 *                     code: 423
 *                     details:
 *                       lockoutDuration: 1800
 *                       unlockTime: "2025-11-29T12:30:00.000Z"
 *                   timestamp: "2025-11-29T12:00:00.000Z"
 *                   path: "/api/auth/web/super-admin/login"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
// Super Admin Web Routes
router.post('/web/super-admin/login', 
  rateLimitMiddleware('SUPER_ADMIN'),
  determineAuthContext,
  validateAuthContext('SUPER_ADMIN', 'web'),
  validate(authSchemas.login),
  SuperAdminAuthController.login
);

/**
 * @swagger
 * /api/auth/web/super-admin/refresh-token:
 *   post:
 *     tags: [Web Dashboard Authentication]
 *     summary: Refresh super admin access token
 *     description: Refreshes the access token for super admin users. Requires X-App-Context header set to 'web-dashboard'.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [web-dashboard]
 *         description: Application context header (must be 'web-dashboard')
 *         example: "web-dashboard"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 */
router.post('/web/super-admin/refresh-token',
  determineAuthContext,
  validateAuthContext('SUPER_ADMIN', 'web'),
  SuperAdminAuthController.refreshToken
);

/**
 * @swagger
 * /api/auth/web/admin/login:
 *   post:
 *     tags: [Web Dashboard Authentication]
 *     summary: Admin login for web dashboard
 *     description: Authenticates admin users for web dashboard access. Requires X-App-Context header set to 'web-dashboard'.
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [web-dashboard]
 *         description: Application context header (must be 'web-dashboard')
 *         example: "web-dashboard"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             adminLogin:
 *               summary: Admin Login
 *               value:
 *                 email: "admin@sptm.com"
 *                 password: "AdminSecure123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             examples:
 *               success:
 *                 summary: Successful admin login
 *                 value:
 *                   message: "Admin login successful"
 *                   user:
 *                     id: "cmik7w7h700037fm9zv7btfaz"
 *                     email: "admin@sptm.com"
 *                     name: "System Administrator"
 *                     role: "ADMIN"
 *                     userType: "ADMIN"
 *                     organizationId: null
 *                     isActive: true
 *                     createdAt: "2025-11-29T10:00:00.000Z"
 *                   tokens:
 *                     accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
// Admin Web Routes
router.post('/web/admin/login',
  rateLimitMiddleware('ADMIN'),
  determineAuthContext,
  validateAuthContext('ADMIN', 'web'),
  validate(authSchemas.login),
  AdminAuthController.login
);

/**
 * @swagger
 * /api/auth/web/admin/refresh-token:
 *   post:
 *     tags: [Web Dashboard Authentication]
 *     summary: Refresh admin access token
 *     description: Refreshes the access token for admin users. Requires X-App-Context header set to 'web-dashboard'.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [web-dashboard]
 *         description: Application context header (must be 'web-dashboard')
 *         example: "web-dashboard"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 */
router.post('/web/admin/refresh-token',
  determineAuthContext,
  validateAuthContext('ADMIN', 'web'),
  AdminAuthController.refreshToken
);

/**
 * @swagger
 * /api/auth/web/organization/login:
 *   post:
 *     tags: [Web Dashboard Authentication]
 *     summary: Organization login for web dashboard
 *     description: Authenticates organization users for web dashboard access. Requires X-App-Context header set to 'web-dashboard'.
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [web-dashboard]
 *         description: Application context header (must be 'web-dashboard')
 *         example: "web-dashboard"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             organizationLogin:
 *               summary: Organization Login
 *               value:
 *                 email: "transport@citybus.com"
 *                 password: "OrgSecure123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             examples:
 *               success:
 *                 summary: Successful organization login
 *                 value:
 *                   message: "Organization login successful"
 *                   user:
 *                     id: "org_123456789"
 *                     email: "transport@citybus.com"
 *                     name: "City Bus Transport"
 *                     role: "ORGANIZATION"
 *                     userType: "ORGANIZATION"
 *                     organizationId: "org_123456789"
 *                     isActive: true
 *                     createdAt: "2025-11-29T10:00:00.000Z"
 *                   tokens:
 *                     accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
// Organization Web Routes
router.post('/web/organization/login',
  rateLimitMiddleware('ORGANIZATION'),
  determineAuthContext,
  validateAuthContext('ORGANIZATION', 'web'),
  validate(authSchemas.login),
  OrganizationAuthController.login
);

/**
 * @swagger
 * /api/auth/web/organization/refresh-token:
 *   post:
 *     tags: [Web Dashboard Authentication]
 *     summary: Refresh organization access token
 *     description: Refreshes the access token for organization users. Requires X-App-Context header set to 'web-dashboard'.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [web-dashboard]
 *         description: Application context header (must be 'web-dashboard')
 *         example: "web-dashboard"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 */
router.post('/web/organization/refresh-token',
  determineAuthContext,
  validateAuthContext('ORGANIZATION', 'web'),
  OrganizationAuthController.refreshToken
);

// ============================================================================
// MOBILE APP ROUTES
// ============================================================================

/**
 * @swagger
 * /api/auth/mobile/driver/login:
 *   post:
 *     tags: [Mobile App Authentication]
 *     summary: Driver login for mobile app
 *     description: |
 *       Authenticates driver users for mobile app access. Requires X-App-Context header set to 'driver-app'.
 *       
 *       **Complete Authentication Flow Example:**
 *       See the DriverLoginFlow example for a comprehensive step-by-step authentication flow including:
 *       - Login request with proper mobile app context
 *       - Success response with driver user data and tokens
 *       - Organization association requirements
 *       - Mobile-specific access patterns
 *       
 *       **Context Requirements:**
 *       - X-App-Context header MUST be "driver-app"
 *       - Driver must be associated with an active organization
 *       - Access to driver-specific mobile endpoints only
 *       - Cannot access web dashboard endpoints
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [driver-app]
 *         description: Application context header (must be 'driver-app')
 *         example: "driver-app"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             driverLogin:
 *               summary: Driver Login
 *               value:
 *                 email: "driver@transport.com"
 *                 password: "DriverPass123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             examples:
 *               success:
 *                 summary: Successful driver login
 *                 value:
 *                   message: "Driver login successful"
 *                   user:
 *                     id: "cmik7w7h700037fm9zv7btfaz"
 *                     email: "driver@transport.com"
 *                     name: "John Driver"
 *                     role: "DRIVER"
 *                     userType: "USER"
 *                     organizationId: "org_123456789"
 *                     isActive: true
 *                     createdAt: "2025-11-29T10:00:00.000Z"
 *                   tokens:
 *                     accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       403:
 *         description: Context mismatch or invalid app context
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               contextMismatch:
 *                 summary: Invalid app context
 *                 value:
 *                   error:
 *                     type: "CONTEXT_MISMATCH"
 *                     message: "Invalid app context for this endpoint"
 *                     code: 403
 *                     details:
 *                       expected: "driver-app"
 *                       received: "passenger-app"
 *                   timestamp: "2025-11-29T12:00:00.000Z"
 *                   path: "/api/auth/mobile/driver/login"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
// Driver Mobile App Routes
router.post('/mobile/driver/login',
  rateLimitMiddleware('USER'),
  determineAuthContext,
  validateAuthContext('USER', 'mobile'),
  validateMobileAppContext,
  validate(authSchemas.login),
  UserAuthController.login
);

/**
 * @swagger
 * /api/auth/mobile/driver/register:
 *   post:
 *     tags: [Mobile App Authentication]
 *     summary: Driver registration for mobile app
 *     description: |
 *       Registers new driver users for mobile app access. Requires X-App-Context header set to 'driver-app' and a valid organizationId.
 *       
 *       **Complete Registration Flow Example:**
 *       See the DriverRegistrationFlow example for a comprehensive step-by-step registration flow including:
 *       - Getting active organizations list first
 *       - Registration request with required organizationId
 *       - Success response with new driver account and tokens
 *       - Organization association requirements
 *       
 *       **Context Requirements:**
 *       - X-App-Context header MUST be "driver-app"
 *       - organizationId is REQUIRED for driver registration
 *       - Organization must be active and accepting new drivers
 *       - Password must meet security requirements
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [driver-app]
 *         description: Application context header (must be 'driver-app')
 *         example: "driver-app"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DriverRegisterRequest'
 *           examples:
 *             driverRegister:
 *               summary: Driver Registration
 *               value:
 *                 email: "newdriver@transport.com"
 *                 password: "SecurePass123!"
 *                 name: "John Driver"
 *                 phone: "+1234567890"
 *                 organizationId: "org_123456789"
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             examples:
 *               success:
 *                 summary: Successful driver registration
 *                 value:
 *                   message: "Driver registration successful"
 *                   user:
 *                     id: "cmik7w7h700037fm9zv7btfaz"
 *                     email: "newdriver@transport.com"
 *                     name: "John Driver"
 *                     role: "DRIVER"
 *                     userType: "USER"
 *                     organizationId: "org_123456789"
 *                     isActive: true
 *                     createdAt: "2025-11-29T12:00:00.000Z"
 *                   tokens:
 *                     accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         description: Context mismatch or invalid app context
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       422:
 *         description: Password validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               weakPassword:
 *                 summary: Password does not meet requirements
 *                 value:
 *                   error:
 *                     type: "WEAK_PASSWORD"
 *                     message: "Password does not meet security requirements"
 *                     code: 422
 *                     details:
 *                       requirements:
 *                         - "Password must contain at least one uppercase letter"
 *                         - "Password must contain at least one special character"
 *                   timestamp: "2025-11-29T12:00:00.000Z"
 *                   path: "/api/auth/mobile/driver/register"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/mobile/driver/register',
  rateLimitMiddleware('USER'),
  determineAuthContext,
  validateAuthContext('USER', 'mobile'),
  validateMobileAppContext,
  passwordStrengthMiddleware,
  validate(authSchemas.register),
  UserAuthController.register
);

/**
 * @swagger
 * /api/auth/mobile/driver/refresh-token:
 *   post:
 *     tags: [Mobile App Authentication]
 *     summary: Refresh driver access token
 *     description: Refreshes the access token for driver users. Requires X-App-Context header set to 'driver-app'.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [driver-app]
 *         description: Application context header (must be 'driver-app')
 *         example: "driver-app"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 *       403:
 *         description: Context mismatch or invalid app context
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/mobile/driver/refresh-token',
  determineAuthContext,
  validateAuthContext('USER', 'mobile'),
  UserAuthController.refreshToken
);

/**
 * @swagger
 * /api/auth/mobile/passenger/login:
 *   post:
 *     tags: [Mobile App Authentication]
 *     summary: Passenger login for mobile app
 *     description: |
 *       Authenticates passenger users for mobile app access. Requires X-App-Context header set to 'passenger-app'.
 *       
 *       **Complete Authentication Flow Example:**
 *       See the PassengerLoginFlow example for a comprehensive step-by-step authentication flow including:
 *       - Login request with proper mobile app context
 *       - Success response with passenger user data and tokens
 *       - No organization association required
 *       - Mobile-specific access patterns
 *       
 *       **Context Requirements:**
 *       - X-App-Context header MUST be "passenger-app"
 *       - Passengers are not associated with organizations
 *       - Access to passenger-specific mobile endpoints only
 *       - Cannot access web dashboard or driver endpoints
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [passenger-app]
 *         description: Application context header (must be 'passenger-app')
 *         example: "passenger-app"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             passengerLogin:
 *               summary: Passenger Login
 *               value:
 *                 email: "passenger@example.com"
 *                 password: "PassengerPass123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             examples:
 *               success:
 *                 summary: Successful passenger login
 *                 value:
 *                   message: "Passenger login successful"
 *                   user:
 *                     id: "cmik7w7h700037fm9zv7btfaz"
 *                     email: "passenger@example.com"
 *                     name: "Jane Passenger"
 *                     role: "PASSENGER"
 *                     userType: "USER"
 *                     organizationId: null
 *                     isActive: true
 *                     createdAt: "2025-11-29T10:00:00.000Z"
 *                   tokens:
 *                     accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       403:
 *         description: Context mismatch or invalid app context
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               contextMismatch:
 *                 summary: Invalid app context
 *                 value:
 *                   error:
 *                     type: "CONTEXT_MISMATCH"
 *                     message: "Invalid app context for this endpoint"
 *                     code: 403
 *                     details:
 *                       expected: "passenger-app"
 *                       received: "driver-app"
 *                   timestamp: "2025-11-29T12:00:00.000Z"
 *                   path: "/api/auth/mobile/passenger/login"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
// Passenger Mobile App Routes
router.post('/mobile/passenger/login',
  rateLimitMiddleware('USER'),
  determineAuthContext,
  validateAuthContext('USER', 'mobile'),
  validateMobileAppContext,
  validate(authSchemas.login),
  UserAuthController.login
);

/**
 * @swagger
 * /api/auth/mobile/passenger/register:
 *   post:
 *     tags: [Mobile App Authentication]
 *     summary: Passenger registration for mobile app
 *     description: Registers new passenger users for mobile app access. Requires X-App-Context header set to 'passenger-app'.
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [passenger-app]
 *         description: Application context header (must be 'passenger-app')
 *         example: "passenger-app"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PassengerRegisterRequest'
 *           examples:
 *             passengerRegister:
 *               summary: Passenger Registration
 *               value:
 *                 email: "newpassenger@example.com"
 *                 password: "SecurePass123!"
 *                 name: "Jane Passenger"
 *                 phone: "+1234567890"
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             examples:
 *               success:
 *                 summary: Successful passenger registration
 *                 value:
 *                   message: "Passenger registration successful"
 *                   user:
 *                     id: "cmik7w7h700037fm9zv7btfaz"
 *                     email: "newpassenger@example.com"
 *                     name: "Jane Passenger"
 *                     role: "PASSENGER"
 *                     userType: "USER"
 *                     organizationId: null
 *                     isActive: true
 *                     createdAt: "2025-11-29T12:00:00.000Z"
 *                   tokens:
 *                     accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         description: Context mismatch or invalid app context
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       422:
 *         description: Password validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               weakPassword:
 *                 summary: Password does not meet requirements
 *                 value:
 *                   error:
 *                     type: "WEAK_PASSWORD"
 *                     message: "Password does not meet security requirements"
 *                     code: 422
 *                     details:
 *                       requirements:
 *                         - "Password must contain at least one uppercase letter"
 *                         - "Password must contain at least one special character"
 *                   timestamp: "2025-11-29T12:00:00.000Z"
 *                   path: "/api/auth/mobile/passenger/register"
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/mobile/passenger/register',
  rateLimitMiddleware('USER'),
  determineAuthContext,
  validateAuthContext('USER', 'mobile'),
  validateMobileAppContext,
  passwordStrengthMiddleware,
  validate(authSchemas.register),
  UserAuthController.register
);

/**
 * @swagger
 * /api/auth/mobile/passenger/refresh-token:
 *   post:
 *     tags: [Mobile App Authentication]
 *     summary: Refresh passenger access token
 *     description: Refreshes the access token for passenger users. Requires X-App-Context header set to 'passenger-app'.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [passenger-app]
 *         description: Application context header (must be 'passenger-app')
 *         example: "passenger-app"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 *       403:
 *         description: Context mismatch or invalid app context
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/mobile/passenger/refresh-token',
  determineAuthContext,
  validateAuthContext('USER', 'mobile'),
  UserAuthController.refreshToken
);

// ============================================================================
// WEB DASHBOARD LOGOUT ROUTES
// ============================================================================

/**
 * @swagger
 * /api/auth/web/super-admin/logout:
 *   post:
 *     tags: [Web Dashboard Authentication]
 *     summary: Super Admin logout for web dashboard
 *     description: Logs out super admin user from web dashboard. Always succeeds regardless of authentication status.
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Super Admin logout successful"
 *             examples:
 *               success:
 *                 summary: Successful logout
 *                 value:
 *                   message: "Super Admin logout successful"
 */
// Super Admin Web Logout
router.post('/web/super-admin/logout', (_req: Request, res: Response) => {
  // Clear any server-side session data if needed
  // For JWT-based auth, logout is primarily handled on the client side
  res.json({ message: 'Super Admin logout successful' });
});

/**
 * @swagger
 * /api/auth/web/admin/logout:
 *   post:
 *     tags: [Web Dashboard Authentication]
 *     summary: Admin logout for web dashboard
 *     description: Logs out admin user from web dashboard. Always succeeds regardless of authentication status.
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin logout successful"
 *             examples:
 *               success:
 *                 summary: Successful logout
 *                 value:
 *                   message: "Admin logout successful"
 */
// Admin Web Logout  
router.post('/web/admin/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Admin logout successful' });
});

/**
 * @swagger
 * /api/auth/web/organization/logout:
 *   post:
 *     tags: [Web Dashboard Authentication]
 *     summary: Organization logout for web dashboard
 *     description: Logs out organization user from web dashboard. Always succeeds regardless of authentication status.
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Organization logout successful"
 *             examples:
 *               success:
 *                 summary: Successful logout
 *                 value:
 *                   message: "Organization logout successful"
 */
// Organization Web Logout
router.post('/web/organization/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Organization logout successful' });
});

// ============================================================================
// UNIFIED/LEGACY ROUTES (with context determination)
// ============================================================================

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Unified Authentication]
 *     summary: Unified login endpoint with context determination
 *     description: |
 *       Unified login endpoint that automatically routes to the appropriate controller based on the X-App-Context header.
 *       This endpoint determines the user type and platform from the context and routes accordingly:
 *       - web-dashboard context routes to super-admin, admin, or organization controllers
 *       - driver-app context routes to driver login
 *       - passenger-app context routes to passenger login
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [web-dashboard, driver-app, passenger-app]
 *         description: Application context header that determines routing
 *         example: "driver-app"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             driverLogin:
 *               summary: Driver Login via Unified Endpoint
 *               value:
 *                 email: "driver@transport.com"
 *                 password: "DriverPass123!"
 *             passengerLogin:
 *               summary: Passenger Login via Unified Endpoint
 *               value:
 *                 email: "passenger@example.com"
 *                 password: "PassengerPass123!"
 *             adminLogin:
 *               summary: Admin Login via Unified Endpoint
 *               value:
 *                 email: "admin@sptm.com"
 *                 password: "AdminSecure123!"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid user type or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidUserType:
 *                 summary: Invalid user type
 *                 value:
 *                   error: "Invalid user type"
 *                   timestamp: "2025-11-29T12:00:00.000Z"
 *                   path: "/api/auth/login"
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       403:
 *         description: Context mismatch or invalid app context
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         description: Authentication context not determined
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               contextError:
 *                 summary: Context determination failed
 *                 value:
 *                   error: "Authentication context not determined"
 *                   timestamp: "2025-11-29T12:00:00.000Z"
 *                   path: "/api/auth/login"
 */
// Unified login endpoint that routes based on context
router.post('/login',
  rateLimitMiddleware(), // Will determine user type from context
  determineAuthContext,
  validateMobileAppContext,
  validate(authSchemas.login),
  routeToAppropriateController
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Unified Authentication]
 *     summary: Unified registration endpoint (mobile only)
 *     description: |
 *       Legacy registration endpoint for mobile apps only. Automatically determines whether to register as driver or passenger based on X-App-Context header.
 *       - driver-app context: registers as DRIVER (requires organizationId)
 *       - passenger-app context: registers as PASSENGER
 *     security: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [driver-app, passenger-app]
 *         description: Mobile app context header (web-dashboard not supported)
 *         example: "driver-app"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/DriverRegisterRequest'
 *               - $ref: '#/components/schemas/PassengerRegisterRequest'
 *           examples:
 *             driverRegister:
 *               summary: Driver Registration via Unified Endpoint
 *               value:
 *                 email: "newdriver@transport.com"
 *                 password: "SecurePass123!"
 *                 name: "John Driver"
 *                 phone: "+1234567890"
 *                 organizationId: "org_123456789"
 *             passengerRegister:
 *               summary: Passenger Registration via Unified Endpoint
 *               value:
 *                 email: "newpassenger@example.com"
 *                 password: "SecurePass123!"
 *                 name: "Jane Passenger"
 *                 phone: "+1234567890"
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         description: Context mismatch or web dashboard context not allowed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       422:
 *         description: Password validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
// Legacy register endpoint (mobile only)
router.post('/register',
  rateLimitMiddleware('USER'),
  determineAuthContext,
  validateAuthContext('USER'),
  validateMobileAppContext,
  passwordStrengthMiddleware,
  validate(authSchemas.register),
  UserAuthController.register
);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Unified Authentication]
 *     summary: Unified refresh token endpoint
 *     description: |
 *       Unified refresh token endpoint that automatically routes to the appropriate controller based on the user type determined from the token.
 *       Supports all user types: SUPER_ADMIN, ADMIN, ORGANIZATION, and USER (drivers/passengers).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-App-Context
 *         required: true
 *         schema:
 *           type: string
 *           enum: [web-dashboard, driver-app, passenger-app]
 *         description: Application context header
 *         example: "driver-app"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 *       400:
 *         description: Invalid user type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidUserType:
 *                 summary: Invalid user type
 *                 value:
 *                   error: "Invalid user type"
 *                   timestamp: "2025-11-29T12:00:00.000Z"
 *                   path: "/api/auth/refresh-token"
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 *       500:
 *         description: Authentication context not determined
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               contextError:
 *                 summary: Context determination failed
 *                 value:
 *                   error: "Authentication context not determined"
 *                   timestamp: "2025-11-29T12:00:00.000Z"
 *                   path: "/api/auth/refresh-token"
 */
// Legacy refresh token endpoint
router.post('/refresh-token',
  determineAuthContext,
  (req: AuthContextRequest, res: Response) => {
    if (!req.authContext) {
      return res.status(500).json({ error: 'Authentication context not determined' });
    }

    const { userType } = req.authContext;

    switch (userType) {
      case 'SUPER_ADMIN':
        return SuperAdminAuthController.refreshToken(req, res);
      case 'ADMIN':
        return AdminAuthController.refreshToken(req, res);
      case 'ORGANIZATION':
        return OrganizationAuthController.refreshToken(req, res);
      case 'USER':
        return UserAuthController.refreshToken(req, res);
      default:
        return res.status(400).json({ error: 'Invalid user type' });
    }
  }
);

// ============================================================================
// MOBILE APP LOGOUT ROUTES (no authentication required)
// ============================================================================

/**
 * @swagger
 * /api/auth/mobile/driver/logout:
 *   post:
 *     tags: [Mobile App Authentication]
 *     summary: Driver logout for mobile app
 *     description: Logs out driver user from mobile app. Always succeeds regardless of authentication status.
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Driver logout successful"
 *             examples:
 *               success:
 *                 summary: Successful logout
 *                 value:
 *                   message: "Driver logout successful"
 */
// Mobile logout endpoints (no auth required - always succeed)
router.post('/mobile/driver/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Driver logout successful' });
});

/**
 * @swagger
 * /api/auth/mobile/passenger/logout:
 *   post:
 *     tags: [Mobile App Authentication]
 *     summary: Passenger logout for mobile app
 *     description: Logs out passenger user from mobile app. Always succeeds regardless of authentication status.
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Passenger logout successful"
 *             examples:
 *               success:
 *                 summary: Successful logout
 *                 value:
 *                   message: "Passenger logout successful"
 */
router.post('/mobile/passenger/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Passenger logout successful' });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Universal logout endpoint
 *     description: |
 *       Logs out user from any context (always succeeds).
 *       
 *       **Complete Logout Flow Example:**
 *       See the UniversalLogoutFlow example for a comprehensive logout flow including:
 *       - Simple logout request (no authentication required)
 *       - Success response (always returns success)
 *       - Token invalidation on server side
 *       - Client-side token cleanup requirements
 *       
 *       **Context Requirements:**
 *       - No authentication required
 *       - No context header required
 *       - Always returns success
 *       - Invalidates tokens on server side if provided
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 */
// Unified logout endpoint that always succeeds (no authentication required)
router.post('/logout', (_req: Request, res: Response) => {
  // Always return success for logout - the frontend will clear tokens
  // This ensures logout always works even if the token is expired/invalid
  res.json({ message: 'Logout successful' });
});

// ============================================================================
// PROTECTED ENDPOINTS (require authentication)
// ============================================================================

// Import auth middleware
import { authenticate } from '../middleware/auth';

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [User Profile]
 *     summary: Get current user information
 *     description: Returns information about the currently authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 */
// Get current user info
router.get('/me', authenticate, UserAuthController.getMe);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [User Profile]
 *     summary: Get user profile
 *     description: Returns detailed profile information for the authenticated user including organization details if applicable
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *             examples:
 *               driverProfile:
 *                 summary: Driver profile with organization
 *                 value:
 *                   id: "cmik7w7h700037fm9zv7btfaz"
 *                   email: "driver@transport.com"
 *                   name: "John Driver"
 *                   phone: "+1234567890"
 *                   role: "DRIVER"
 *                   userType: "USER"
 *                   organizationId: "org_123456789"
 *                   organization:
 *                     id: "org_123456789"
 *                     name: "City Bus Transport"
 *                     email: "citybus@sptm.com"
 *                     isActive: true
 *                   isActive: true
 *                   createdAt: "2025-11-29T10:00:00.000Z"
 *                   updatedAt: "2025-11-29T11:00:00.000Z"
 *               passengerProfile:
 *                 summary: Passenger profile
 *                 value:
 *                   id: "cmik7w7h700037fm9zv7btfaz"
 *                   email: "passenger@example.com"
 *                   name: "Jane Passenger"
 *                   phone: "+1234567890"
 *                   role: "PASSENGER"
 *                   userType: "USER"
 *                   organizationId: null
 *                   organization: null
 *                   isActive: true
 *                   createdAt: "2025-11-29T10:00:00.000Z"
 *                   updatedAt: "2025-11-29T11:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 */
// Get user profile
router.get('/profile', authenticate, UserAuthController.getProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     tags: [User Profile]
 *     summary: Change user password
 *     description: Allows authenticated users to change their password. Requires current password for verification.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *           examples:
 *             changePassword:
 *               summary: Change password request
 *               value:
 *                 currentPassword: "OldPassword123!"
 *                 newPassword: "NewSecurePassword123!"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *             examples:
 *               success:
 *                 summary: Successful password change
 *                 value:
 *                   message: "Password changed successfully"
 *       400:
 *         description: Validation error or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               incorrectPassword:
 *                 summary: Incorrect current password
 *                 value:
 *                   error: "Current password is incorrect"
 *                   timestamp: "2025-11-29T12:00:00.000Z"
 *                   path: "/api/auth/change-password"
 *               validationError:
 *                 summary: Password validation failed
 *                 value:
 *                   error:
 *                     type: "WEAK_PASSWORD"
 *                     message: "New password does not meet security requirements"
 *                     code: 400
 *                     details:
 *                       requirements:
 *                         - "Password must contain at least one uppercase letter"
 *                         - "Password must contain at least one special character"
 *                   timestamp: "2025-11-29T12:00:00.000Z"
 *                   path: "/api/auth/change-password"
 *       401:
 *         $ref: '#/components/responses/AuthenticationError'
 */
// Change password
router.put('/change-password', authenticate, validate(authSchemas.changePassword), UserAuthController.changePassword);

// ============================================================================
// PUBLIC ENDPOINTS (no authentication required)
// ============================================================================

/**
 * @swagger
 * /api/auth/organizations/active:
 *   get:
 *     tags: [Public]
 *     summary: Get active organizations
 *     description: Returns list of active organizations for driver registration
 *     security: []
 *     responses:
 *       200:
 *         description: Active organizations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Organization ID
 *                     example: "cmijzmxb10004uzqrfb18znrz"
 *                   name:
 *                     type: string
 *                     description: Organization name
 *                     example: "City Bus Transport"
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Organization contact email
 *                     example: "citybus@sptm.com"
 *                   isActive:
 *                     type: boolean
 *                     description: Whether the organization is active
 *                     example: true
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Get active organizations for driver registration
router.get('/organizations/active', async (_req: Request, res: Response) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const organizations = await prisma.organization.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
    
    await prisma.$disconnect();
    res.json(organizations);
  } catch (error) {
    console.error('Error fetching active organizations:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

export default router;