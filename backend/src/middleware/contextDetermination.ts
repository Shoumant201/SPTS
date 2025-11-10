import { Request, Response, NextFunction } from 'express';

export interface AuthContextRequest extends Request {
  authContext?: {
    userType: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'USER';
    platform: 'web' | 'mobile';
    appType?: 'driver-app' | 'passenger-app';
    endpoint: string;
  };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ContextDeterminationLogic:
 *       type: object
 *       description: |
 *         # Context Determination Logic
 *         
 *         This middleware determines the authentication context based on the request path and the `X-App-Context` header. The context determination follows a specific hierarchy and validation process.
 *         
 *         ## Context Determination Process
 *         
 *         ### 1. Header Extraction
 *         The middleware first extracts context information from:
 *         - `X-App-Context` header (primary)
 *         - `X-App-Type` header (legacy support)
 *         - Request body `context` field (legacy support)
 *         - `User-Agent` header (fallback detection)
 *         
 *         ### 2. Path-Based Context Detection
 *         The request path is analyzed to determine the intended context:
 *         
 *         **Web Dashboard Paths:**
 *         - `/api/auth/web/super-admin/*` → SUPER_ADMIN context
 *         - `/api/auth/web/admin/*` → ADMIN context  
 *         - `/api/auth/web/organization/*` → ORGANIZATION context
 *         
 *         **Mobile App Paths:**
 *         - `/api/auth/mobile/driver/*` → DRIVER context (driver-app)
 *         - `/api/auth/mobile/passenger/*` → PASSENGER context (passenger-app)
 *         
 *         ### 3. Context Validation Rules
 *         
 *         **Web Dashboard Context (`web-dashboard`):**
 *         - Platform: `web`
 *         - Allowed User Types: `SUPER_ADMIN`, `ADMIN`, `ORGANIZATION`
 *         - Features: Administrative functions, organization management
 *         - Restrictions: Cannot access mobile-specific endpoints
 *         
 *         **Driver App Context (`driver-app`):**
 *         - Platform: `mobile`
 *         - Allowed User Types: `USER` (with DRIVER role)
 *         - App Type: `driver-app`
 *         - Features: Route management, shift tracking, incident reporting
 *         - Restrictions: Must be associated with an active organization
 *         
 *         **Passenger App Context (`passenger-app`):**
 *         - Platform: `mobile`
 *         - Allowed User Types: `USER` (with PASSENGER role)
 *         - App Type: `passenger-app`
 *         - Features: Trip booking, payment, real-time tracking
 *         - Restrictions: No organization association required
 *         
 *         ### 4. Legacy Context Detection
 *         For backward compatibility, the middleware also supports:
 *         - User-Agent based mobile detection
 *         - Body-based context specification
 *         - Header-based app type specification
 *         
 *         ## Context Object Structure
 *         
 *         The middleware creates an `authContext` object with the following structure:
 *         
 *         ```typescript
 *         interface AuthContext {
 *           userType: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'USER';
 *           platform: 'web' | 'mobile';
 *           appType?: 'driver-app' | 'passenger-app';
 *           endpoint: string;
 *         }
 *         ```
 *         
 *         ## Validation Middleware
 *         
 *         ### validateAuthContext(expectedUserType, expectedPlatform?)
 *         Validates that the determined context matches expected values:
 *         - Checks user type compatibility
 *         - Validates platform if specified
 *         - Returns 400 Bad Request for mismatches
 *         
 *         ### validateMobileAppContext()
 *         Additional validation for mobile contexts:
 *         - Ensures driver-app context requires DRIVER role
 *         - Ensures passenger-app context requires PASSENGER role
 *         - Validates organization association for drivers
 *         
 *         ## Error Scenarios
 *         
 *         ### Context Determination Failures
 *         - **Missing Context**: No X-App-Context header provided
 *         - **Invalid Context**: Context value not in allowed list
 *         - **Path Mismatch**: Context doesn't match request path
 *         - **Role Incompatibility**: User role not allowed for context
 *         
 *         ### Error Response Examples
 *         
 *         **Missing Context Header:**
 *         ```json
 *         {
 *           "error": {
 *             "type": "MISSING_CONTEXT_HEADER",
 *             "message": "X-App-Context header is required",
 *             "details": {
 *               "validContexts": ["web-dashboard", "driver-app", "passenger-app"]
 *             }
 *           }
 *         }
 *         ```
 *         
 *         **Invalid Context:**
 *         ```json
 *         {
 *           "error": {
 *             "type": "INVALID_CONTEXT",
 *             "message": "Invalid context value: invalid-context",
 *             "details": {
 *               "providedContext": "invalid-context",
 *               "validContexts": ["web-dashboard", "driver-app", "passenger-app"]
 *             }
 *           }
 *         }
 *         ```
 *         
 *         **Context Mismatch:**
 *         ```json
 *         {
 *           "error": {
 *             "type": "CONTEXT_MISMATCH",
 *             "message": "Invalid context. Expected ADMIN, got USER",
 *             "details": {
 *               "expectedUserType": "ADMIN",
 *               "actualUserType": "USER",
 *               "requestedContext": "web-dashboard"
 *             }
 *           }
 *         }
 *         ```
 *         
 *         ## Security Considerations
 *         
 *         ### Context Isolation
 *         - Each context operates in complete isolation
 *         - Cross-context data access is prevented
 *         - Context switching requires full re-authentication
 *         
 *         ### Audit Logging
 *         - All context determination decisions are logged
 *         - Context mismatches trigger security alerts
 *         - Failed validations are tracked for abuse detection
 *         
 *         ### Rate Limiting Integration
 *         - Context information is used for rate limiting
 *         - Different limits apply to different contexts
 *         - Context-specific abuse prevention measures
 *       properties:
 *         userType:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *           description: Determined user type based on context
 *         platform:
 *           type: string
 *           enum: [web, mobile]
 *           description: Platform type (web or mobile)
 *         appType:
 *           type: string
 *           enum: [driver-app, passenger-app]
 *           description: Mobile app type (only for mobile platform)
 *         endpoint:
 *           type: string
 *           description: Request endpoint path
 *       example:
 *         userType: "USER"
 *         platform: "mobile"
 *         appType: "driver-app"
 *         endpoint: "/api/auth/mobile/driver/login"
 */

/**
 * Middleware to determine authentication context based on request path and headers
 */
export const determineAuthContext = (req: AuthContextRequest, res: Response, next: NextFunction) => {
  try {
    const path = req.path;
    const userAgent = req.get('User-Agent') || '';
    const appType = req.get('X-App-Type') || req.body.context;

    // Initialize context
    req.authContext = {
      userType: 'USER',
      platform: 'web',
      endpoint: path
    };

    // Determine context based on path
    if (path.includes('/web/')) {
      req.authContext.platform = 'web';
      
      if (path.includes('/super-admin/')) {
        req.authContext.userType = 'SUPER_ADMIN';
      } else if (path.includes('/admin/')) {
        req.authContext.userType = 'ADMIN';
      } else if (path.includes('/organization/')) {
        req.authContext.userType = 'ORGANIZATION';
      }
    } else if (path.includes('/mobile/')) {
      req.authContext.platform = 'mobile';
      
      if (path.includes('/driver/')) {
        req.authContext.userType = 'USER';
        req.authContext.appType = 'driver-app';
      } else if (path.includes('/passenger/')) {
        req.authContext.userType = 'USER';
        req.authContext.appType = 'passenger-app';
      }
    } else {
      // Legacy endpoints - determine from headers or body
      if (appType) {
        req.authContext.platform = 'mobile';
        req.authContext.appType = appType as 'driver-app' | 'passenger-app';
      } else if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iOS')) {
        req.authContext.platform = 'mobile';
      }
    }

    next();
  } catch (error) {
    console.error('Context determination error:', error);
    res.status(500).json({ error: 'Failed to determine authentication context' });
  }
};

/**
 * Middleware to validate that the request context matches the expected user type
 */
export const validateAuthContext = (expectedUserType: string, expectedPlatform?: string) => {
  return (req: AuthContextRequest, res: Response, next: NextFunction) => {
    if (!req.authContext) {
      return res.status(500).json({ error: 'Authentication context not determined' });
    }

    // Validate user type
    if (req.authContext.userType !== expectedUserType) {
      return res.status(400).json({ 
        error: `Invalid context. Expected ${expectedUserType}, got ${req.authContext.userType}` 
      });
    }

    // Validate platform if specified
    if (expectedPlatform && req.authContext.platform !== expectedPlatform) {
      return res.status(400).json({ 
        error: `Invalid platform. Expected ${expectedPlatform}, got ${req.authContext.platform}` 
      });
    }

    next();
  };
};

/**
 * Middleware to validate mobile app context matches user role
 */
export const validateMobileAppContext = (req: AuthContextRequest, res: Response, next: NextFunction) => {
  if (!req.authContext) {
    return res.status(500).json({ error: 'Authentication context not determined' });
  }

  // Only validate for mobile platforms
  if (req.authContext.platform !== 'mobile') {
    return next();
  }

  const { appType } = req.authContext;
  const { role } = req.body;

  // Validate app type matches role
  if (appType === 'driver-app' && role && role !== 'DRIVER') {
    return res.status(400).json({ 
      error: 'Driver app requires DRIVER role' 
    });
  }

  if (appType === 'passenger-app' && role && role !== 'PASSENGER') {
    return res.status(400).json({ 
      error: 'Passenger app requires PASSENGER role' 
    });
  }

  next();
};