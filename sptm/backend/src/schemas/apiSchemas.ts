/**
 * API Schemas for Swagger/OpenAPI Documentation
 * 
 * This file contains all the schema definitions used in the SPTM API documentation.
 * These schemas are used by swagger-jsdoc to generate the OpenAPI specification.
 * 
 * For comprehensive authentication flow examples, see:
 * - authFlowExamples.ts - Complete authentication flow examples
 * - AUTHENTICATION_FLOWS.md - Detailed documentation with examples
 */

// TypeScript interfaces for type safety
export interface APISchemas {
  User: UserSchema;
  AuthResponse: AuthResponseSchema;
  LoginRequest: LoginRequestSchema;
  RegisterRequest: RegisterRequestSchema;
  DriverRegisterRequest: DriverRegisterRequestSchema;
  PassengerRegisterRequest: PassengerRegisterRequestSchema;
  ChangePasswordRequest: ChangePasswordRequestSchema;
  TokenResponse: TokenResponseSchema;
  UserProfile: UserProfileSchema;
  Organization: OrganizationSchema;
  ErrorResponse: ErrorResponseSchema;
  ValidationErrorDetails: ValidationErrorDetailsSchema;
  RateLimitErrorDetails: RateLimitErrorDetailsSchema;
  RefreshTokenRequest: RefreshTokenRequestSchema;
  LogoutResponse: LogoutResponseSchema;
  HealthResponse: HealthResponseSchema;
  JWTPayload: JWTPayloadSchema;
  RefreshTokenPayload: RefreshTokenPayloadSchema;
}

export interface UserSchema {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'DRIVER' | 'PASSENGER';
  userType: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'USER';
  organizationId?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponseSchema {
  message: string;
  user: UserSchema;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginRequestSchema {
  email: string;
  password: string;
}

export interface RegisterRequestSchema {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'DRIVER' | 'PASSENGER';
  organizationId?: string;
}

export interface DriverRegisterRequestSchema extends RegisterRequestSchema {
  organizationId: string; // Required for drivers
}

export interface PassengerRegisterRequestSchema extends Omit<RegisterRequestSchema, 'organizationId'> {
  // No organizationId for passengers
}

export interface ChangePasswordRequestSchema {
  currentPassword: string;
  newPassword: string;
}

export interface TokenResponseSchema {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfileSchema extends UserSchema {
  phone?: string;
  organization?: OrganizationSchema | null;
  updatedAt: string;
}

export interface OrganizationSchema {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationErrorDetailsSchema {
  requirements?: string[];
  field?: string;
  value?: any;
}

export interface RateLimitErrorDetailsSchema {
  retryAfter: number;
  limit: number;
  remaining: number;
  resetTime: string;
}

export interface ErrorResponseSchema {
  error: string | {
    type: string;
    message: string;
    code: number;
    details?: ValidationErrorDetailsSchema | RateLimitErrorDetailsSchema | any;
  };
  timestamp: string;
  path: string;
}

export interface RefreshTokenRequestSchema {
  refreshToken: string;
}

export interface LogoutResponseSchema {
  message: string;
}

export interface HealthResponseSchema {
  status: string;
  message: string;
  timestamp: string;
}

export interface JWTPayloadSchema {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'DRIVER' | 'PASSENGER';
  userType: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'USER';
  organizationId?: string;
  permissions: string[];
  hierarchy: number;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayloadSchema {
  id: string;
  userType: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'USER';
  organizationId?: string;
  iat: number;
  exp: number;
}

// Type aliases for easier usage in other files
export type User = UserSchema;
export type AuthResponse = AuthResponseSchema;
export type LoginRequest = LoginRequestSchema;
export type RegisterRequest = RegisterRequestSchema;
export type DriverRegisterRequest = DriverRegisterRequestSchema;
export type PassengerRegisterRequest = PassengerRegisterRequestSchema;
export type ChangePasswordRequest = ChangePasswordRequestSchema;
export type TokenResponse = TokenResponseSchema;
export type UserProfile = UserProfileSchema;
export type Organization = OrganizationSchema;
export type ErrorResponse = ErrorResponseSchema;
export type ValidationErrorDetails = ValidationErrorDetailsSchema;
export type RateLimitErrorDetails = RateLimitErrorDetailsSchema;
export type RefreshTokenRequest = RefreshTokenRequestSchema;
export type LogoutResponse = LogoutResponseSchema;
export type HealthResponse = HealthResponseSchema;
export type JWTPayload = JWTPayloadSchema;
export type RefreshTokenPayload = RefreshTokenPayloadSchema;

// Enum types
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'DRIVER' | 'PASSENGER';
export type UserType = 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'USER';
export type AppContext = 'web-dashboard' | 'driver-app' | 'passenger-app';

// Schema patterns for validation
export const SCHEMA_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  NAME: /^[a-zA-Z\s\-\.\']+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  USER_ID: /^[a-zA-Z0-9]{25}$/,
  ORGANIZATION_ID: /^org_[a-zA-Z0-9]{9}$/,
  JWT_TOKEN: /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
} as const;

// Schema constraints
export const SCHEMA_CONSTRAINTS = {
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PHONE_MIN_LENGTH: 2,
  PHONE_MAX_LENGTH: 15,
  ORGANIZATION_NAME_MIN_LENGTH: 2,
  ORGANIZATION_NAME_MAX_LENGTH: 200,
  MESSAGE_MIN_LENGTH: 1,
  MESSAGE_MAX_LENGTH: 100
} as const;

// Schema defaults
export const SCHEMA_DEFAULTS = {
  USER_ACTIVE: true,
  ORGANIZATION_ACTIVE: true,
  TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_ATTEMPTS: 5
} as const;



/**
 * @swagger
 * components:
 *   schemas:
 *     RateLimitingAndSecurity:
 *       type: object
 *       description: |
 *         # Rate Limiting and Security Response Documentation
 *         
 *         The SPTM API implements comprehensive rate limiting and security measures to protect against abuse, brute force attacks, and unauthorized access. This documentation covers all rate limiting policies, account lockout mechanisms, and security-related error responses.
 *         
 *         ## Rate Limiting Overview
 *         
 *         ### Multi-Tier Rate Limiting System
 *         The API uses a sophisticated multi-tier rate limiting system that applies different limits based on user type, endpoint sensitivity, and request patterns:
 *         
 *         1. **User Type-Based Limits**: Different user types have different rate limits based on their authority level
 *         2. **Endpoint-Specific Limits**: Critical endpoints (authentication, registration) have stricter limits
 *         3. **IP-Based Tracking**: Rate limits are tracked per IP address to prevent distributed attacks
 *         4. **Progressive Penalties**: Repeated violations result in longer block durations
 *         
 *         ### Rate Limiting Configurations by User Type
 *         
 *         | User Type | Window | Max Attempts | Block Duration | Use Case |
 *         |-----------|--------|--------------|----------------|----------|
 *         | **SUPER_ADMIN** | 15 minutes | 10 attempts | 30 minutes | System administration |
 *         | **ADMIN** | 15 minutes | 8 attempts | 30 minutes | Regional management |
 *         | **ORGANIZATION** | 15 minutes | 6 attempts | 1 hour | Organization management |
 *         | **USER** (Driver/Passenger) | 5 minutes | 20 attempts | 10 minutes | Mobile app usage |
 *         
 *         **Configuration Details**:
 *         - **Window**: Time period for counting attempts
 *         - **Max Attempts**: Maximum requests allowed within the window
 *         - **Block Duration**: How long the user is blocked after exceeding limits
 *         
 *         ### Endpoint-Specific Rate Limits
 *         
 *         #### Authentication Endpoints
 *         ```
 *         POST /api/auth/"*"/login
 *         - Purpose: Prevent brute force attacks
 *         - Limit: 5 attempts per 15 minutes per IP
 *         - Block: 30 minutes after limit exceeded
 *         - Headers: X-RateLimit-* headers included in response
 *         ```
 *         
 *         #### Registration Endpoints
 *         ```
 *         POST /api/auth/"*"/register
 *         - Purpose: Prevent spam account creation
 *         - Limit: 3 attempts per hour per IP
 *         - Block: 2 hours after limit exceeded
 *         - Additional: Email domain validation
 *         ```
 *         
 *         #### Token Refresh Endpoints
 *         ```
 *         POST /api/auth/*"/refresh-token
 *         - Purpose: Prevent token abuse
 *         - Limit: 10 attempts per minute per user
 *         - Block: 5 minutes after limit exceeded
 *         - Context: User-specific tracking
 *         ```
 *         
 *         #### Profile Management Endpoints
 *         ```
 *         GET/PUT /api/auth/me, /api/auth/profile
 *         - Purpose: Prevent data scraping
 *         - Limit: 30 requests per minute per user
 *         - Block: 10 minutes after limit exceeded
 *         - Scope: Per authenticated user
 *         ```
 *         
 *         ## Rate Limit Headers
 *         
 *         All API responses include rate limiting headers to help clients manage their request patterns:
 *         
 *         ```http
 *         X-RateLimit-Limit: 20          # Maximum requests allowed in window
 *         X-RateLimit-Remaining: 15      # Requests remaining in current window
 *         X-RateLimit-Reset: 1732876800  # Unix timestamp when window resets
 *         X-RateLimit-Window: 300        # Window duration in seconds
 *         X-RateLimit-Policy: USER       # Rate limit policy applied
 *         ```
 *         
 *         ### Rate Limit Header Descriptions
 *         - **X-RateLimit-Limit**: Maximum number of requests allowed in the current window
 *         - **X-RateLimit-Remaining**: Number of requests remaining in the current window
 *         - **X-RateLimit-Reset**: Unix timestamp when the current window resets
 *         - **X-RateLimit-Window**: Duration of the rate limit window in seconds
 *         - **X-RateLimit-Policy**: The rate limiting policy being applied (USER, ADMIN, etc.)
 *         
 *         ## Account Lockout System
 *         
 *         ### Progressive Account Lockout
 *         The API implements a progressive account lockout system to protect against credential stuffing and brute force attacks:
 *         
 *         | User Type | Max Failed Attempts | Lockout Duration | Reset Time | Security Level |
 *         |-----------|-------------------|------------------|------------|----------------|
 *         | **SUPER_ADMIN** | 5 attempts | 30 minutes | 24 hours | Maximum |
 *         | **ADMIN** | 5 attempts | 1 hour | 24 hours | High |
 *         | **ORGANIZATION** | 3 attempts | 2 hours | 24 hours | Medium-High |
 *         | **USER** | 10 attempts | 5 minutes | 2 hours | Standard |
 *         
 *         **Lockout Mechanism**:
 *         1. **Failed Attempt Tracking**: Each failed login attempt is recorded per user
 *         2. **Progressive Penalties**: Lockout duration increases with user authority level
 *         3. **Automatic Reset**: Failed attempt counters reset after the reset time period
 *         4. **Immediate Unlock**: Successful login immediately clears failed attempt counter
 *         
 *         ### Account Lockout Triggers
 *         
 *         **Authentication Failures**:
 *         - Invalid email/password combinations
 *         - Attempts to access locked accounts
 *         - Context mismatch errors (wrong app context)
 *         - Expired or invalid token usage
 *         
 *         **Security Violations**:
 *         - Organization boundary violations
 *         - Permission escalation attempts
 *         - Suspicious request patterns
 *         - Multiple rapid failed attempts
 *         
 *         ## Security Response Types
 *         
 *         ### Rate Limit Exceeded (HTTP 429)
 *         
 *         **Response Structure**:
 *         ```json
 *         {
 *           "error": {
 *             "type": "RATE_LIMIT_EXCEEDED",
 *             "message": "Too many requests. Please try again later.",
 *             "code": 429,
 *             "details": {
 *               "retryAfter": 1800,
 *               "limit": 20,
 *               "remaining": 0,
 *               "resetTime": "2025-11-29T12:30:00.000Z",
 *               "policy": "USER",
 *               "windowDuration": 300
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/auth/mobile/driver/login"
 *         }
 *         ```
 *         
 *         **Response Headers**:
 *         ```http
 *         HTTP/1.1 429 Too Many Requests
 *         X-RateLimit-Limit: 20
 *         X-RateLimit-Remaining: 0
 *         X-RateLimit-Reset: 1732876800
 *         X-RateLimit-Window: 300
 *         X-RateLimit-Policy: USER
 *         Retry-After: 1800
 *         Content-Type: application/json
 *         ```
 *         
 *         ### Account Locked (HTTP 423)
 *         
 *         **Response Structure**:
 *         ```json
 *         {
 *           "error": {
 *             "type": "ACCOUNT_LOCKED",
 *             "message": "Account is temporarily locked due to multiple failed login attempts.",
 *             "code": 423,
 *             "details": {
 *               "lockedUntil": "2025-11-29T14:00:00.000Z",
 *               "failedAttempts": 5,
 *               "maxAttempts": 5,
 *               "lockoutDuration": 1800,
 *               "userType": "ORGANIZATION",
 *               "canRetryAt": "2025-11-29T14:00:00.000Z"
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/auth/web/organization/login"
 *         }
 *         ```
 *         
 *         **Response Headers**:
 *         ```http
 *         HTTP/1.1 423 Locked
 *         Retry-After: 1800
 *         Content-Type: application/json
 *         ```
 *         
 *         ### Security Validation Errors
 *         
 *         #### Weak Password (HTTP 400)
 *         ```json
 *         {
 *           "error": {
 *             "type": "WEAK_PASSWORD",
 *             "message": "Password does not meet security requirements.",
 *             "code": 400,
 *             "details": {
 *               "requirements": [
 *                 "Password must be at least 8 characters long",
 *                 "Password must contain at least one uppercase letter",
 *                 "Password must contain at least one special character"
 *               ],
 *               "passwordPolicy": {
 *                 "minLength": 8,
 *                 "requireUppercase": true,
 *                 "requireLowercase": true,
 *                 "requireNumbers": true,
 *                 "requireSpecialChars": true,
 *                 "allowedSpecialChars": "!@#$%^&*(),.?\":{}|<>"
 *               }
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/auth/mobile/passenger/register"
 *         }
 *         ```
 *         
 *         #### Context Mismatch (HTTP 401)
 *         ```json
 *         {
 *           "error": {
 *             "type": "CONTEXT_MISMATCH",
 *             "message": "User context does not match required application context.",
 *             "code": 401,
 *             "details": {
 *               "userRole": "DRIVER",
 *               "expectedContext": "driver-app",
 *               "actualContext": "web-dashboard",
 *               "allowedContexts": ["driver-app"],
 *               "securityViolation": true
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/auth/web/organization/login"
 *         }
 *         ```
 *         
 *         #### Organization Boundary Violation (HTTP 403)
 *         ```json
 *         {
 *           "error": {
 *             "type": "ORGANIZATION_BOUNDARY_VIOLATION",
 *             "message": "Cannot access data from other organizations.",
 *             "code": 403,
 *             "details": {
 *               "userOrganizationId": "org_123456789",
 *               "requestedOrganizationId": "org_987654321",
 *               "userType": "ORGANIZATION",
 *               "boundaryEnforcement": "STRICT",
 *               "securityViolation": true
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/organizations/org_987654321/drivers"
 *         }
 *         ```
 *         
 *         ## Security Best Practices
 *         
 *         ### Client-Side Rate Limit Handling
 *         
 *         **Proactive Rate Limit Management**:
 *         ```javascript
 *         // Check rate limit headers before making requests
 *         const checkRateLimit = (response) => {
 *           const remaining = parseInt(response.headers['x-ratelimit-remaining']);
 *           const reset = parseInt(response.headers['x-ratelimit-reset']);
 *           
 *           if (remaining < 5) {
 *             const waitTime = (reset * 1000) - Date.now();
 *             console.warn(`Rate limit low. Wait ${waitTime}ms before next request`);
 *           }
 *         };
 *         ```
 *         
 *         **Exponential Backoff Strategy**:
 *         ```javascript
 *         const retryWithBackoff = async (apiCall, maxRetries = 3) => {
 *           for (let attempt = 0; attempt < maxRetries; attempt++) {
 *             try {
 *               return await apiCall();
 *             } catch (error) {
 *               if (error.status === 429) {
 *                 const retryAfter = error.headers['retry-after'] || Math.pow(2, attempt);
 *                 await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
 *                 continue;
 *               }
 *               throw error;
 *             }
 *           }
 *         };
 *         ```
 *         
 *         ### Account Lockout Prevention
 *         
 *         **Login Attempt Management**:
 *         ```javascript
 *         // Track failed attempts and warn users
 *         const handleLoginError = (error) => {
 *           if (error.type === 'INVALID_CREDENTIALS') {
 *             const attempts = getFailedAttempts();
 *             if (attempts >= 3) {
 *               showWarning('Multiple failed attempts. Account may be locked soon.');
 *             }
 *           }
 *           
 *           if (error.type === 'ACCOUNT_LOCKED') {
 *             const lockedUntil = new Date(error.details.lockedUntil);
 *             showError(`Account locked until ${lockedUntil.toLocaleString()}`);
 *           }
 *         };
 *         ```
 *         
 *         ### Security Headers Validation
 *         
 *         **Required Security Headers**:
 *         ```javascript
 *         const securityHeaders = {
 *           'X-App-Context': 'driver-app', // Required for context validation
 *           'User-Agent': 'SPTM-Driver-App/1.0.0', // For security logging
 *           'X-Request-ID': generateRequestId(), // For request tracking
 *         };
 *         ```
 *         
 *         ### Token Security Best Practices
 *         
 *         **Token Refresh Strategy**:
 *         ```javascript
 *         // Refresh tokens before expiration to avoid rate limits
 *         const refreshTokenBeforeExpiry = (token) => {
 *           const payload = JSON.parse(atob(token.split('.')[1]));
 *           const expiryTime = payload.exp * 1000;
 *           const refreshTime = expiryTime - (5 * 60 * 1000); // 5 minutes before expiry
 *           
 *           setTimeout(() => {
 *             refreshAccessToken();
 *           }, refreshTime - Date.now());
 *         };
 *         ```
 *         
 *         ## Monitoring and Alerting
 *         
 *         ### Security Event Logging
 *         All security-related events are logged for monitoring and analysis:
 *         
 *         **Logged Events**:
 *         - Rate limit violations
 *         - Account lockout events
 *         - Failed authentication attempts
 *         - Context mismatch violations
 *         - Organization boundary violations
 *         - Suspicious request patterns
 *         
 *         **Log Entry Structure**:
 *         ```json
 *         {
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "userType": "ORGANIZATION",
 *           "email": "org@transport.com",
 *           "ipAddress": "192.168.1.100",
 *           "userAgent": "Mozilla/5.0...",
 *           "action": "RATE_LIMIT_EXCEEDED",
 *           "success": false,
 *           "errorType": "RATE_LIMIT_EXCEEDED",
 *           "additionalData": {
 *             "path": "/api/auth/web/organization/login",
 *             "resetTime": "2025-11-29T12:30:00.000Z"
 *           }
 *         }
 *         ```
 *         
 *         ### Alert Thresholds
 *         
 *         **High Priority Alerts**:
 *         - Multiple account lockouts from same IP (potential attack)
 *         - Rapid rate limit violations across multiple IPs (distributed attack)
 *         - Context mismatch patterns (potential credential compromise)
 *         - Organization boundary violations (data breach attempt)
 *         
 *         **Medium Priority Alerts**:
 *         - Unusual authentication patterns
 *         - High rate of password validation failures
 *         - Repeated token refresh failures
 *         - Geographic anomalies in access patterns
 *         
 *         ## Development and Testing
 *         
 *         ### Rate Limit Testing
 *         
 *         **Testing Rate Limits**:
 *         ```bash
 *         # Test rate limiting with curl
 *         for i in {1..25}; do
 *           curl -X POST http://localhost:3001/api/auth/mobile/driver/login \
 *             -H "Content-Type: application/json" \
 *             -H "X-App-Context: driver-app" \
 *             -d '{"email":"test@example.com","password":"wrong"}' \
 *             -w "Request $i: %{http_code}\n"
 *         done
 *         ```
 *         
 *         **Development Overrides**:
 *         ```javascript
 *         // Clear rate limits for testing (development only)
 *         if (process.env.NODE_ENV === 'development') {
 *           SecurityService.clearRateLimit('USER', '127.0.0.1');
 *           SecurityService.clearAccountLockout('USER', 'test-user-id');
 *         }
 *         ```
 *         
 *         ### Security Testing Checklist
 *         
 *         **Rate Limiting Tests**:
 *         - [ ] Verify rate limits are enforced per user type
 *         - [ ] Test rate limit headers are returned correctly
 *         - [ ] Confirm block durations are respected
 *         - [ ] Validate rate limit reset functionality
 *         
 *         **Account Lockout Tests**:
 *         - [ ] Test progressive lockout based on failed attempts
 *         - [ ] Verify lockout durations per user type
 *         - [ ] Confirm automatic unlock after lockout period
 *         - [ ] Test successful login resets failed attempts
 *         
 *         **Security Response Tests**:
 *         - [ ] Validate all error response formats
 *         - [ ] Test security headers in responses
 *         - [ ] Confirm proper HTTP status codes
 *         - [ ] Verify security event logging
 *         
 *         ## Production Considerations
 *         
 *         ### Performance Impact
 *         - Rate limiting adds minimal latency (~1-2ms per request)
 *         - In-memory stores are used for fast lookups
 *         - Periodic cleanup prevents memory leaks
 *         - Redis can be used for distributed deployments
 *         
 *         ### Scalability
 *         - Rate limits scale with user type and endpoint sensitivity
 *         - Distributed rate limiting available via Redis
 *         - Configurable limits per environment
 *         - Automatic cleanup of expired entries
 *         
 *         ### Monitoring Integration
 *         - Security events integrate with logging systems
 *         - Metrics available for monitoring dashboards
 *         - Alert integration for security incidents
 *         - Audit trails for compliance requirements
 *       properties:
 *         rateLimitPolicies:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userType:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *               windowMs:
 *                 type: integer
 *                 description: Rate limit window in milliseconds
 *               maxAttempts:
 *                 type: integer
 *                 description: Maximum attempts allowed in window
 *               blockDurationMs:
 *                 type: integer
 *                 description: Block duration in milliseconds after limit exceeded
 *           example:
 *             - userType: "SUPER_ADMIN"
 *               windowMs: 900000
 *               maxAttempts: 10
 *               blockDurationMs: 1800000
 *             - userType: "USER"
 *               windowMs: 300000
 *               maxAttempts: 20
 *               blockDurationMs: 600000
 *         lockoutPolicies:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userType:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *               maxFailedAttempts:
 *                 type: integer
 *                 description: Maximum failed attempts before lockout
 *               lockoutDurationMs:
 *                 type: integer
 *                 description: Account lockout duration in milliseconds
 *               resetTimeMs:
 *                 type: integer
 *                 description: Time after which failed attempts reset
 *           example:
 *             - userType: "ORGANIZATION"
 *               maxFailedAttempts: 3
 *               lockoutDurationMs: 7200000
 *               resetTimeMs: 86400000
 *         securityHeaders:
 *           type: object
 *           properties:
 *             rateLimitHeaders:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "X-RateLimit-Window", "X-RateLimit-Policy"]
 *             securityHeaders:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Retry-After", "X-Request-ID", "X-Security-Policy"]
 *
 *     RateLimitError:
 *       type: object
 *       description: Rate limit exceeded error response
 *       required:
 *         - error
 *         - timestamp
 *         - path
 *       properties:
 *         error:
 *           type: object
 *           required:
 *             - type
 *             - message
 *             - code
 *           properties:
 *             type:
 *               type: string
 *               enum: [RATE_LIMIT_EXCEEDED]
 *               description: Error type identifier
 *             message:
 *               type: string
 *               description: Human-readable error message
 *               example: "Too many requests. Please try again later."
 *             code:
 *               type: integer
 *               enum: [429]
 *               description: HTTP status code
 *             details:
 *               type: object
 *               properties:
 *                 retryAfter:
 *                   type: integer
 *                   description: Seconds to wait before retrying
 *                   example: 1800
 *                 limit:
 *                   type: integer
 *                   description: Maximum requests allowed in window
 *                   example: 20
 *                 remaining:
 *                   type: integer
 *                   description: Requests remaining in current window
 *                   example: 0
 *                 resetTime:
 *                   type: string
 *                   format: date-time
 *                   description: When the rate limit window resets
 *                   example: "2025-11-29T12:30:00.000Z"
 *                 policy:
 *                   type: string
 *                   enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *                   description: Rate limiting policy applied
 *                   example: "USER"
 *                 windowDuration:
 *                   type: integer
 *                   description: Rate limit window duration in seconds
 *                   example: 300
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Error timestamp
 *           example: "2025-11-29T12:00:00.000Z"
 *         path:
 *           type: string
 *           description: API endpoint path where error occurred
 *           example: "/api/auth/mobile/driver/login"
 *       example:
 *         error:
 *           type: "RATE_LIMIT_EXCEEDED"
 *           message: "Too many requests. Please try again later."
 *           code: 429
 *           details:
 *             retryAfter: 1800
 *             limit: 20
 *             remaining: 0
 *             resetTime: "2025-11-29T12:30:00.000Z"
 *             policy: "USER"
 *             windowDuration: 300
 *         timestamp: "2025-11-29T12:00:00.000Z"
 *         path: "/api/auth/mobile/driver/login"
 *
 *     AccountLockedError:
 *       type: object
 *       description: Account locked error response
 *       required:
 *         - error
 *         - timestamp
 *         - path
 *       properties:
 *         error:
 *           type: object
 *           required:
 *             - type
 *             - message
 *             - code
 *           properties:
 *             type:
 *               type: string
 *               enum: [ACCOUNT_LOCKED]
 *               description: Error type identifier
 *             message:
 *               type: string
 *               description: Human-readable error message
 *               example: "Account is temporarily locked due to multiple failed login attempts."
 *             code:
 *               type: integer
 *               enum: [423]
 *               description: HTTP status code
 *             details:
 *               type: object
 *               properties:
 *                 lockedUntil:
 *                   type: string
 *                   format: date-time
 *                   description: When the account lockout expires
 *                   example: "2025-11-29T14:00:00.000Z"
 *                 failedAttempts:
 *                   type: integer
 *                   description: Number of failed attempts that triggered lockout
 *                   example: 5
 *                 maxAttempts:
 *                   type: integer
 *                   description: Maximum allowed failed attempts
 *                   example: 5
 *                 lockoutDuration:
 *                   type: integer
 *                   description: Lockout duration in seconds
 *                   example: 1800
 *                 userType:
 *                   type: string
 *                   enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *                   description: User type that determines lockout policy
 *                   example: "ORGANIZATION"
 *                 canRetryAt:
 *                   type: string
 *                   format: date-time
 *                   description: When the user can attempt login again
 *                   example: "2025-11-29T14:00:00.000Z"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Error timestamp
 *           example: "2025-11-29T12:00:00.000Z"
 *         path:
 *           type: string
 *           description: API endpoint path where error occurred
 *           example: "/api/auth/web/organization/login"
 *       example:
 *         error:
 *           type: "ACCOUNT_LOCKED"
 *           message: "Account is temporarily locked due to multiple failed login attempts."
 *           code: 423
 *           details:
 *             lockedUntil: "2025-11-29T14:00:00.000Z"
 *             failedAttempts: 5
 *             maxAttempts: 5
 *             lockoutDuration: 1800
 *             userType: "ORGANIZATION"
 *             canRetryAt: "2025-11-29T14:00:00.000Z"
 *         timestamp: "2025-11-29T12:00:00.000Z"
 *         path: "/api/auth/web/organization/login"
 *
 *     SecurityValidationError:
 *       type: object
 *       description: Security validation error responses
 *       required:
 *         - error
 *         - timestamp
 *         - path
 *       properties:
 *         error:
 *           type: object
 *           required:
 *             - type
 *             - message
 *             - code
 *           properties:
 *             type:
 *               type: string
 *               enum: [WEAK_PASSWORD, CONTEXT_MISMATCH, ORGANIZATION_BOUNDARY_VIOLATION, INSUFFICIENT_PERMISSIONS]
 *               description: Security violation type
 *             message:
 *               type: string
 *               description: Human-readable error message
 *             code:
 *               type: integer
 *               enum: [400, 401, 403]
 *               description: HTTP status code
 *             details:
 *               type: object
 *               description: Additional error details specific to violation type
 *               oneOf:
 *                 - $ref: '#/components/schemas/WeakPasswordDetails'
 *                 - $ref: '#/components/schemas/ContextMismatchDetails'
 *                 - $ref: '#/components/schemas/OrganizationBoundaryDetails'
 *                 - $ref: '#/components/schemas/InsufficientPermissionsDetails'
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Error timestamp
 *         path:
 *           type: string
 *           description: API endpoint path where error occurred
 *
 *     WeakPasswordDetails:
 *       type: object
 *       description: Details for weak password validation errors
 *       properties:
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *           description: List of unmet password requirements
 *           example:
 *             - "Password must be at least 8 characters long"
 *             - "Password must contain at least one uppercase letter"
 *             - "Password must contain at least one special character"
 *         passwordPolicy:
 *           type: object
 *           properties:
 *             minLength:
 *               type: integer
 *               example: 8
 *             requireUppercase:
 *               type: boolean
 *               example: true
 *             requireLowercase:
 *               type: boolean
 *               example: true
 *             requireNumbers:
 *               type: boolean
 *               example: true
 *             requireSpecialChars:
 *               type: boolean
 *               example: true
 *             allowedSpecialChars:
 *               type: string
 *               example: "!@#$%^&*(),.?\":{}|<>"
 *
 *     ContextMismatchDetails:
 *       type: object
 *       description: Details for context mismatch errors
 *       properties:
 *         userRole:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, DRIVER, PASSENGER]
 *           description: User's role
 *           example: "DRIVER"
 *         expectedContext:
 *           type: string
 *           enum: [web-dashboard, driver-app, passenger-app]
 *           description: Expected application context for user's role
 *           example: "driver-app"
 *         actualContext:
 *           type: string
 *           enum: [web-dashboard, driver-app, passenger-app]
 *           description: Actual context provided in request
 *           example: "web-dashboard"
 *         allowedContexts:
 *           type: array
 *           items:
 *             type: string
 *             enum: [web-dashboard, driver-app, passenger-app]
 *           description: List of contexts allowed for user's role
 *           example: ["driver-app"]
 *         securityViolation:
 *           type: boolean
 *           description: Whether this represents a security violation
 *           example: true
 *
 *     OrganizationBoundaryDetails:
 *       type: object
 *       description: Details for organization boundary violation errors
 *       properties:
 *         userOrganizationId:
 *           type: string
 *           description: User's organization ID
 *           example: "org_123456789"
 *         requestedOrganizationId:
 *           type: string
 *           description: Organization ID requested in the operation
 *           example: "org_987654321"
 *         userType:
 *           type: string
 *           enum: [ORGANIZATION, DRIVER]
 *           description: User type subject to organization boundaries
 *           example: "ORGANIZATION"
 *         boundaryEnforcement:
 *           type: string
 *           enum: [STRICT, NONE]
 *           description: Type of boundary enforcement applied
 *           example: "STRICT"
 *         securityViolation:
 *           type: boolean
 *           description: Whether this represents a security violation
 *           example: true
 *
 *     InsufficientPermissionsDetails:
 *       type: object
 *       description: Details for insufficient permissions errors
 *       properties:
 *         requiredRole:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, DRIVER, PASSENGER]
 *           description: Required role for the operation
 *           example: "ADMIN"
 *         userRole:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, DRIVER, PASSENGER]
 *           description: Current user's role
 *           example: "ORGANIZATION"
 *         requiredPermissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Required permissions for the operation
 *           example: ["users:read", "users:create"]
 *         userPermissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Current user's permissions
 *           example: ["drivers:manage", "vehicles:manage"]
 *         authorityLevel:
 *           type: object
 *           properties:
 *             required:
 *               type: integer
 *               minimum: 1
 *               maximum: 4
 *               description: Required authority level
 *               example: 3
 *             current:
 *               type: integer
 *               minimum: 1
 *               maximum: 4
 *               description: Current user's authority level
 *               example: 2
 *
 *     RateLimitHeaders:
 *       type: object
 *       description: Rate limiting headers included in API responses
 *       properties:
 *         X-RateLimit-Limit:
 *           type: integer
 *           description: Maximum requests allowed in window
 *           example: 20
 *         X-RateLimit-Remaining:
 *           type: integer
 *           description: Requests remaining in current window
 *           example: 15
 *         X-RateLimit-Reset:
 *           type: integer
 *           description: Unix timestamp when window resets
 *           example: 1732876800
 *         X-RateLimit-Window:
 *           type: integer
 *           description: Window duration in seconds
 *           example: 300
 *         X-RateLimit-Policy:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *           description: Rate limit policy applied
 *           example: "USER"
 *         Retry-After:
 *           type: integer
 *           description: Seconds to wait before retrying (only when rate limited)
 *           example: 1800
 *
 *     SecurityBestPractices:
 *       type: object
 *       description: Security best practices for API usage
 *       properties:
 *         rateLimitHandling:
 *           type: object
 *           properties:
 *             proactiveManagement:
 *               type: string
 *               description: Monitor rate limit headers and adjust request patterns
 *               example: "Check X-RateLimit-Remaining header before making requests"
 *             exponentialBackoff:
 *               type: string
 *               description: Use exponential backoff when rate limited
 *               example: "Wait progressively longer between retry attempts"
 *             respectRetryAfter:
 *               type: string
 *               description: Always respect Retry-After header values
 *               example: "Wait specified seconds before retrying after 429 response"
 *         accountSecurity:
 *           type: object
 *           properties:
 *             strongPasswords:
 *               type: string
 *               description: Use strong passwords meeting all requirements
 *               example: "Minimum 8 chars with uppercase, lowercase, numbers, and special characters"
 *             contextValidation:
 *               type: string
 *               description: Always provide correct X-App-Context header
 *               example: "Use 'driver-app' context for driver authentication"
 *             tokenSecurity:
 *               type: string
 *               description: Secure token storage and transmission
 *               example: "Store tokens securely and refresh before expiration"
 *         errorHandling:
 *           type: object
 *           properties:
 *             gracefulDegradation:
 *               type: string
 *               description: Handle security errors gracefully
 *               example: "Show user-friendly messages for security violations"
 *             securityLogging:
 *               type: string
 *               description: Log security events for monitoring
 *               example: "Log failed attempts and security violations"
 *             userFeedback:
 *               type: string
 *               description: Provide clear feedback on security requirements
 *               example: "Show password requirements and lockout information"
 *
 *     RoleBasedAccessControl:
 *       type: object
 *       description: |
 *         # Role-Based Access Control (RBAC) System
 *         
 *         The SPTM API implements a comprehensive Role-Based Access Control system that governs user permissions, resource access, and organizational boundaries. This system ensures data security and proper authorization across all API endpoints.
 *         
 *         ## Access Control Architecture
 *         
 *         ### Multi-Layer Security Model
 *         The RBAC system operates on multiple layers:
 *         
 *         1. **Authentication Layer**: Verifies user identity via JWT tokens
 *         2. **Context Validation Layer**: Ensures proper application context (web/mobile)
 *         3. **Role Authorization Layer**: Validates user role permissions
 *         4. **Resource Access Layer**: Controls access to specific resources
 *         5. **Organization Boundary Layer**: Enforces data isolation between organizations
 *         
 *         ### Access Control Matrix
 *         The system uses a comprehensive access control matrix that defines:
 *         - What resources each user type can access
 *         - What operations each user type can perform
 *         - Whether organization boundaries apply
 *         - Which application contexts are allowed
 *         
 *         ## Permission Checking Mechanisms
 *         
 *         ### 1. Hierarchical Permission Checking
 *         ```typescript
 *         // Authority levels (higher can access lower level resources within scope)
 *         SUPER_ADMIN: 4  // Unrestricted system access
 *         ADMIN: 3        // Cross-organizational access
 *         ORGANIZATION: 2 // Organization-specific access
 *         USER: 1         // Individual user access (DRIVER/PASSENGER)
 *         ```
 *         
 *         **Implementation**:
 *         - Higher authority levels inherit permissions of lower levels
 *         - SUPER_ADMIN can perform any operation on any resource
 *         - ADMIN can manage organizations and users but not other admins
 *         - ORGANIZATION can manage only their own organization's resources
 *         - USER (DRIVER/PASSENGER) can only manage their own profile and assigned resources
 *         
 *         ### 2. Permission-Based Access Control
 *         Each user type has specific permissions defined in the access control matrix:
 *         
 *         **SUPER_ADMIN Permissions**:
 *         - `*` (wildcard - all permissions)
 *         - Unrestricted access to all system resources
 *         - Can manage admins, organizations, and system configuration
 *         
 *         **ADMIN Permissions**:
 *         - `organizations:read`, `organizations:create`, `organizations:update`
 *         - `users:read`, `routes:read`, `routes:create`, `routes:update`, `routes:delete`
 *         - `vehicles:read`, `trips:read`, `discounts:read`, `discounts:manage`
 *         - `verification:approve`, `verification:reject`, `system:metrics`
 *         
 *         **ORGANIZATION Permissions**:
 *         - `drivers:read`, `drivers:create`, `drivers:update`, `drivers:delete`
 *         - `vehicles:read`, `vehicles:create`, `vehicles:update`, `vehicles:delete`
 *         - `routes:read`, `trips:read`, `organization:read`, `organization:update`
 *         
 *         **DRIVER Permissions**:
 *         - `profile:read`, `profile:update`, `vehicle:read`
 *         - `routes:read`, `trips:read`, `trips:update-status`
 *         
 *         **PASSENGER Permissions**:
 *         - `profile:read`, `profile:update`, `trips:read`, `trips:create`
 *         - `routes:read`, `discounts:read`, `discounts:apply`, `verification:submit`
 *         
 *         ### 3. Resource-Based Access Control
 *         The system maps API resources to required permissions:
 *         
 *         ```typescript
 *         // Example resource permission mapping
 *         '/api/organizations': {
 *           GET: ['organizations:read'],
 *           POST: ['organizations:create'],
 *           PUT: ['organizations:update'],
 *           DELETE: ['organizations:delete']
 *         }
 *         ```
 *         
 *         **Enforcement Process**:
 *         1. Extract resource path and HTTP method from request
 *         2. Look up required permissions for the resource/method combination
 *         3. Check if user has all required permissions
 *         4. Allow or deny access based on permission check
 *         
 *         ### 4. Organization Boundary Enforcement
 *         
 *         **Boundary Rules**:
 *         - **No Boundary**: SUPER_ADMIN, ADMIN, PASSENGER
 *           - Can access resources across all organizations
 *           - Not restricted to specific organizational data
 *         
 *         - **Strict Boundary**: ORGANIZATION, DRIVER
 *           - Can only access resources within their own organization
 *           - Attempts to access other organizations' data are blocked
 *         
 *         **Enforcement Implementation**:
 *         ```typescript
 *         // Check if user type must respect organization boundaries
 *         if (hasOrganizationBoundary(userType)) {
 *           const requestedOrgId = extractOrganizationId(request);
 *           if (requestedOrgId && requestedOrgId !== user.organizationId) {
 *             throw new OrganizationBoundaryViolationError();
 *           }
 *         }
 *         ```
 *         
 *         ### 5. Context-Based Access Control
 *         
 *         **Context Validation**:
 *         - Web Dashboard (`web-dashboard`): SUPER_ADMIN, ADMIN, ORGANIZATION
 *         - Driver App (`driver-app`): DRIVER only
 *         - Passenger App (`passenger-app`): PASSENGER only
 *         
 *         **Enforcement Process**:
 *         1. Extract X-App-Context header from request
 *         2. Determine user's allowed contexts based on role
 *         3. Validate that requested context matches user's allowed contexts
 *         4. Block access if context mismatch detected
 *         
 *         ## Access Control Enforcement Points
 *         
 *         ### Middleware Chain
 *         The RBAC system is enforced through a series of middleware functions:
 *         
 *         1. **authenticate**: Verifies JWT token and extracts user information
 *         2. **authorizeRole**: Checks hierarchical role permissions
 *         3. **authorizeOrganization**: Enforces organization boundaries
 *         4. **authorizeContext**: Validates application context
 *         5. **authorizePermission**: Checks specific permissions
 *         6. **authorizeResource**: Validates resource access rights
 *         7. **authorizeMethod**: Checks HTTP method permissions
 *         
 *         ### Middleware Usage Examples
 *         
 *         **Role-Based Authorization**:
 *         ```typescript
 *         // Only ADMIN and above can access
 *         router.get('/admin/users', authenticate, authorizeRole('ADMIN'), getUserList);
 *         
 *         // Only SUPER_ADMIN can access
 *         router.post('/admin/create', authenticate, authorizeRole('SUPER_ADMIN'), createAdmin);
 *         ```
 *         
 *         **Permission-Based Authorization**:
 *         ```typescript
 *         // Requires specific permissions
 *         router.put('/organizations/:id', 
 *           authenticate, 
 *           authorizePermission(['organizations:update']), 
 *           updateOrganization
 *         );
 *         ```
 *         
 *         **Organization Boundary Enforcement**:
 *         ```typescript
 *         // Enforces organization boundaries
 *         router.get('/organizations/:organizationId/drivers', 
 *           authenticate, 
 *           authorizeOrganization, 
 *           getOrganizationDrivers
 *         );
 *         ```
 *         
 *         **Context-Based Authorization**:
 *         ```typescript
 *         // Only web dashboard users can access
 *         router.get('/admin/dashboard', 
 *           authenticate, 
 *           authorizeContext(['web']), 
 *           getDashboard
 *         );
 *         ```
 *         
 *         ## Error Handling and Security Responses
 *         
 *         ### Access Control Error Types
 *         
 *         **INSUFFICIENT_PERMISSIONS (403)**:
 *         ```json
 *         {
 *           "error": {
 *             "type": "INSUFFICIENT_PERMISSIONS",
 *             "message": "User does not have required permissions",
 *             "code": 403,
 *             "details": {
 *               "requiredRole": "ADMIN",
 *               "userRole": "ORGANIZATION",
 *               "requiredPermissions": ["users:read", "users:create"],
 *               "userPermissions": ["drivers:manage", "vehicles:manage"]
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/admin/users"
 *         }
 *         ```
 *         
 *         **ORGANIZATION_BOUNDARY_VIOLATION (403)**:
 *         ```json
 *         {
 *           "error": {
 *             "type": "ORGANIZATION_BOUNDARY_VIOLATION",
 *             "message": "Cannot access data from other organizations",
 *             "code": 403,
 *             "details": {
 *               "userOrganizationId": "org_123456789",
 *               "requestedOrganizationId": "org_987654321",
 *               "userType": "ORGANIZATION"
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/organizations/org_987654321/drivers"
 *         }
 *         ```
 *         
 *         **CONTEXT_MISMATCH (401)**:
 *         ```json
 *         {
 *           "error": {
 *             "type": "CONTEXT_MISMATCH",
 *             "message": "User context does not match required application context",
 *             "code": 401,
 *             "details": {
 *               "userRole": "DRIVER",
 *               "expectedContext": "driver-app",
 *               "actualContext": "web-dashboard",
 *               "allowedContexts": ["driver-app"]
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/auth/web/organization/login"
 *         }
 *         ```
 *         
 *         **RESOURCE_ACCESS_DENIED (403)**:
 *         ```json
 *         {
 *           "error": {
 *             "type": "RESOURCE_ACCESS_DENIED",
 *             "message": "User cannot access this resource",
 *             "code": 403,
 *             "details": {
 *               "resource": "vehicles",
 *               "userType": "PASSENGER",
 *               "allowedResources": ["trips", "routes", "discounts", "profile"]
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/vehicles"
 *         }
 *         ```
 *         
 *         **METHOD_NOT_ALLOWED (403)**:
 *         ```json
 *         {
 *           "error": {
 *             "type": "METHOD_NOT_ALLOWED",
 *             "message": "User does not have permission for this operation",
 *             "code": 403,
 *             "details": {
 *               "method": "DELETE",
 *               "resource": "/api/organizations",
 *               "userType": "ADMIN",
 *               "requiredPermissions": ["organizations:delete"],
 *               "userPermissions": ["organizations:read", "organizations:create", "organizations:update"]
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/organizations/org_123456789"
 *         }
 *         ```
 *         
 *         ## Security Best Practices
 *         
 *         ### Principle of Least Privilege
 *         - Users are granted only the minimum permissions necessary for their role
 *         - Permissions are explicitly defined rather than implicitly granted
 *         - Regular permission audits ensure no privilege escalation
 *         
 *         ### Defense in Depth
 *         - Multiple layers of security checks (authentication, authorization, context, boundaries)
 *         - Each layer provides independent security validation
 *         - Failure at any layer results in access denial
 *         
 *         ### Audit and Monitoring
 *         - All access control decisions are logged
 *         - Failed authorization attempts trigger security alerts
 *         - Regular access pattern analysis for anomaly detection
 *         
 *         ### Token Security
 *         - JWT tokens include role and context information
 *         - Tokens are validated on every request
 *         - Token context must match request context
 *         - Short token expiration times with refresh mechanism
 *         
 *         ## Implementation Guidelines
 *         
 *         ### Adding New Endpoints
 *         When adding new API endpoints, ensure:
 *         1. Appropriate middleware is applied for the endpoint's security requirements
 *         2. Required permissions are defined in the resource permission mapping
 *         3. Organization boundary rules are considered if applicable
 *         4. Context restrictions are properly configured
 *         
 *         ### Role Modifications
 *         When modifying user roles or permissions:
 *         1. Update the access control matrix configuration
 *         2. Test all affected endpoints for proper access control
 *         3. Update API documentation to reflect permission changes
 *         4. Consider impact on existing users and their access patterns
 *         
 *         ### Security Testing
 *         Regular security testing should include:
 *         1. Attempting to access resources with insufficient permissions
 *         2. Testing organization boundary violations
 *         3. Verifying context-based access restrictions
 *         4. Validating proper error responses for security violations
 *       properties:
 *         accessControlLayers:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Authentication", "Context Validation", "Role Authorization", "Resource Access", "Organization Boundary"]
 *         permissionTypes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Hierarchical", "Permission-Based", "Resource-Based", "Organization-Boundary", "Context-Based"]
 *         enforcementPoints:
 *           type: array
 *           items:
 *             type: string
 *           example: ["authenticate", "authorizeRole", "authorizeOrganization", "authorizeContext", "authorizePermission", "authorizeResource", "authorizeMethod"]
 *         errorTypes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["INSUFFICIENT_PERMISSIONS", "ORGANIZATION_BOUNDARY_VIOLATION", "CONTEXT_MISMATCH", "RESOURCE_ACCESS_DENIED", "METHOD_NOT_ALLOWED"]
 *
 *     UserTypeHierarchy:
 *       type: object
 *       description: Documentation of the user type hierarchy and access control system
 *       properties:
 *         hierarchy:
 *           type: array
 *           description: User types ordered by authority level (highest to lowest)
 *           items:
 *             type: object
 *             properties:
 *               userType:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *                 description: User type identifier
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, DRIVER, PASSENGER]
 *                 description: Specific role within the user type
 *               authorityLevel:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 4
 *                 description: Hierarchical authority level (4=highest, 1=lowest)
 *               organizationBoundary:
 *                 type: boolean
 *                 description: Whether user is restricted to their own organization
 *               contextAccess:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [web-dashboard, driver-app, passenger-app]
 *                 description: Allowed application contexts
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of permissions granted to this user type
 *           example:
 *             - userType: "SUPER_ADMIN"
 *               role: "SUPER_ADMIN"
 *               authorityLevel: 4
 *               organizationBoundary: false
 *               contextAccess: ["web-dashboard"]
 *               permissions: ["*"]
 *             - userType: "ADMIN"
 *               role: "ADMIN"
 *               authorityLevel: 3
 *               organizationBoundary: false
 *               contextAccess: ["web-dashboard"]
 *               permissions: ["organizations:read", "organizations:create", "users:read", "routes:manage"]
 *             - userType: "ORGANIZATION"
 *               role: "ORGANIZATION"
 *               authorityLevel: 2
 *               organizationBoundary: true
 *               contextAccess: ["web-dashboard"]
 *               permissions: ["drivers:manage", "vehicles:manage", "organization:update"]
 *             - userType: "USER"
 *               role: "DRIVER"
 *               authorityLevel: 1
 *               organizationBoundary: true
 *               contextAccess: ["driver-app"]
 *               permissions: ["profile:update", "vehicle:read", "trips:update-status"]
 *             - userType: "USER"
 *               role: "PASSENGER"
 *               authorityLevel: 1
 *               organizationBoundary: false
 *               contextAccess: ["passenger-app"]
 *               permissions: ["profile:update", "trips:create", "discounts:apply"]
 *         accessControlRules:
 *           type: object
 *           description: Access control rules and restrictions
 *           properties:
 *             hierarchicalAccess:
 *               type: string
 *               description: Higher authority levels can access lower level resources within scope
 *               example: "SUPER_ADMIN can access all resources, ADMIN can access organization/user resources"
 *             organizationBoundaryEnforcement:
 *               type: object
 *               properties:
 *                 noBoundary:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["SUPER_ADMIN", "ADMIN", "PASSENGER"]
 *                 strictBoundary:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["ORGANIZATION", "DRIVER"]
 *             contextBasedAccess:
 *               type: object
 *               properties:
 *                 web-dashboard:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["SUPER_ADMIN", "ADMIN", "ORGANIZATION"]
 *                 driver-app:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["DRIVER"]
 *                 passenger-app:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["PASSENGER"]
 *
 *     PermissionMatrix:
 *       type: object
 *       description: Detailed permission matrix showing what each user type can access
 *       properties:
 *         resources:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             properties:
 *               SUPER_ADMIN:
 *                 type: string
 *                 enum: [Full, Read, None]
 *               ADMIN:
 *                 type: string
 *                 enum: [Full, Read, None]
 *               ORGANIZATION:
 *                 type: string
 *                 enum: [Full, Read, Own Only, None]
 *               DRIVER:
 *                 type: string
 *                 enum: [Full, Read, Own Only, Assigned Only, None]
 *               PASSENGER:
 *                 type: string
 *                 enum: [Full, Read, Own Only, None]
 *           example:
 *             systemConfig:
 *               SUPER_ADMIN: "Full"
 *               ADMIN: "Read"
 *               ORGANIZATION: "None"
 *               DRIVER: "None"
 *               PASSENGER: "None"
 *             organizations:
 *               SUPER_ADMIN: "Full"
 *               ADMIN: "Full"
 *               ORGANIZATION: "Own Only"
 *               DRIVER: "None"
 *               PASSENGER: "None"
 *             users:
 *               SUPER_ADMIN: "Full"
 *               ADMIN: "Read"
 *               ORGANIZATION: "Own Only"
 *               DRIVER: "Own Only"
 *               PASSENGER: "Own Only"
 *             vehicles:
 *               SUPER_ADMIN: "Full"
 *               ADMIN: "Read"
 *               ORGANIZATION: "Own Only"
 *               DRIVER: "Assigned Only"
 *               PASSENGER: "Read"
 *             routes:
 *               SUPER_ADMIN: "Full"
 *               ADMIN: "Full"
 *               ORGANIZATION: "Read"
 *               DRIVER: "Read"
 *               PASSENGER: "Read"
 *             trips:
 *               SUPER_ADMIN: "Full"
 *               ADMIN: "Read"
 *               ORGANIZATION: "Own Only"
 *               DRIVER: "Own Only"
 *               PASSENGER: "Own Only"
 *
 *     AccessControlError:
 *       type: object
 *       description: Error response for access control violations
 *       required:
 *         - error
 *         - timestamp
 *         - path
 *       properties:
 *         error:
 *           type: object
 *           required:
 *             - type
 *             - message
 *             - code
 *           properties:
 *             type:
 *               type: string
 *               enum: [INSUFFICIENT_PERMISSIONS, ORGANIZATION_BOUNDARY_VIOLATION, CONTEXT_MISMATCH]
 *               description: Type of access control violation
 *             message:
 *               type: string
 *               description: Human-readable error message
 *             code:
 *               type: integer
 *               enum: [401, 403]
 *               description: HTTP status code
 *             details:
 *               type: object
 *               properties:
 *                 requiredRole:
 *                   type: string
 *                   description: Required role for the operation
 *                 userRole:
 *                   type: string
 *                   description: Current user's role
 *                 requiredPermissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Required permissions for the operation
 *                 userPermissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Current user's permissions
 *                 organizationBoundaryViolation:
           summary: Organization boundary violation error
           value:
             error:
               type: "ORGANIZATION_BOUNDARY_VIOLATION"
               message: "Cannot access data from other organizations"
               code: 403
               details:
                 userOrganizationId: "org_123456789"
                 requestedOrganizationId: "org_987654321"
                 userType: "ORGANIZATION"
             timestamp: "2025-11-29T12:00:00.000Z"
             path: "/api/organizations/org_987654321/drivers"
         contextMismatch:
           summary: Context mismatch error
           value:
             error:
               type: "CONTEXT_MISMATCH"
               message: "User context does not match required application context"
               code: 401
               details:
                 userRole: "DRIVER"
                 expectedContext: "driver-app"
                 actualContext: "web-dashboard"
                 allowedContexts: ["driver-app"]
             timestamp: "2025-11-29T12:00:00.000Z"
             path: "/api/auth/web/organization/login"

 *     JWTTokenStructure:
 *       type: object
 *       description: |
 *         # JWT Token Structure and Claims Documentation
 *         
 *         The SPTM API uses JSON Web Tokens (JWT) for authentication and authorization. This section provides comprehensive documentation of the token structure, claims, validation process, and security considerations.
 *         
 *         ## Token Types
 *         
 *         The system uses two types of JWT tokens:
 *         
 *         ### 1. Access Token
 *         - **Purpose**: Authenticates API requests and contains user permissions
 *         - **Expiration**: Variable based on user type (30m - 4h)
 *         - **Usage**: Included in Authorization header as Bearer token
 *         - **Claims**: Full user information and permissions
 *         
 *         ### 2. Refresh Token
 *         - **Purpose**: Generates new access tokens without re-authentication
 *         - **Expiration**: Variable based on user type (7d - 30d)
 *         - **Usage**: Sent to refresh token endpoints
 *         - **Claims**: Minimal user identification information
 *         
 *         ## Access Token Structure
 *         
 *         ### JWT Header
 *         ```json
 *         {
 *           "alg": "HS256",
 *           "typ": "JWT"
 *         }
 *         ```
 *         
 *         **Header Fields**:
 *         - `alg`: Algorithm used for signing (HMAC SHA-256)
 *         - `typ`: Token type (always "JWT")
 *         
 *         ### JWT Payload (Claims)
 *         ```json
 *         {
 *           "id": "cmik7w7h700037fm9zv7btfaz",
 *           "email": "admin@sptm.com",
 *           "role": "ADMIN",
 *           "userType": "ADMIN",
 *           "organizationId": null,
 *           "permissions": [
 *             "organizations:read",
 *             "organizations:create",
 *             "organizations:update",
 *             "users:read",
 *             "routes:read",
 *             "routes:create",
 *             "routes:update",
 *             "routes:delete",
 *             "vehicles:read",
 *             "trips:read"
 *           ],
 *           "hierarchy": 3,
 *           "iat": 1732881600,
 *           "exp": 1732885200
 *         }
 *         ```
 *         
 *         **Custom Claims**:
 *         - `id`: Unique user identifier (string)
 *         - `email`: User's email address (string)
 *         - `role`: Specific user role (SUPER_ADMIN | ADMIN | ORGANIZATION | DRIVER | PASSENGER)
 *         - `userType`: User type for access control (SUPER_ADMIN | ADMIN | ORGANIZATION | USER)
 *         - `organizationId`: Associated organization ID (string | null)
 *         - `permissions`: Array of granted permissions (string[])
 *         - `hierarchy`: Numerical authority level (1-4, higher = more authority)
 *         
 *         **Standard Claims**:
 *         - `iat`: Issued at timestamp (Unix timestamp)
 *         - `exp`: Expiration timestamp (Unix timestamp)
 *         
 *         ### JWT Signature
 *         The signature is created using HMAC SHA-256 with a secret key:
 *         ```
 *         HMACSHA256(
 *           base64UrlEncode(header) + "." + base64UrlEncode(payload),
 *           JWT_SECRET
 *         )
 *         ```
 *         
 *         ## Refresh Token Structure
 *         
 *         ### JWT Payload (Claims)
 *         ```json
 *         {
 *           "id": "cmik7w7h700037fm9zv7btfaz",
 *           "userType": "ADMIN",
 *           "organizationId": null,
 *           "iat": 1732881600,
 *           "exp": 1733486400
 *         }
 *         ```
 *         
 *         **Claims**:
 *         - `id`: Unique user identifier (string)
 *         - `userType`: User type for token refresh validation (string)
 *         - `organizationId`: Associated organization ID (string | null)
 *         - `iat`: Issued at timestamp (Unix timestamp)
 *         - `exp`: Expiration timestamp (Unix timestamp)
 *         
 *         ## Token Expiration by User Type
 *         
 *         Different user types have different token expiration times based on security requirements:
 *         
 *         | User Type | Access Token | Refresh Token | Rationale |
 *         |-----------|--------------|---------------|-----------|
 *         | SUPER_ADMIN | 30 minutes | 7 days | Highest security, frequent re-authentication |
 *         | ADMIN | 1 hour | 7 days | High security, administrative access |
 *         | ORGANIZATION | 2 hours | 14 days | Moderate security, business operations |
 *         | USER (DRIVER/PASSENGER) | 4 hours | 30 days | User convenience, mobile app usage |
 *         
 *         ## Permission System
 *         
 *         ### Permission Format
 *         Permissions follow the format: `resource:action`
 *         
 *         **Examples**:
 *         - `organizations:read` - Can read organization data
 *         - `users:create` - Can create new users
 *         - `vehicles:update` - Can update vehicle information
 *         - `*` - Wildcard permission (SUPER_ADMIN only)
 *         
 *         ### Permission Categories
 *         
 *         **System Permissions**:
 *         - `*` - All permissions (SUPER_ADMIN only)
 *         - `system:metrics` - Access system metrics
 *         - `system:config` - Modify system configuration
 *         
 *         **Organization Permissions**:
 *         - `organizations:read` - View organization information
 *         - `organizations:create` - Create new organizations
 *         - `organizations:update` - Modify organization details
 *         - `organizations:delete` - Remove organizations
 *         
 *         **User Management Permissions**:
 *         - `users:read` - View user information
 *         - `users:create` - Create new users
 *         - `users:update` - Modify user details
 *         - `users:delete` - Remove users
 *         
 *         **Driver Management Permissions**:
 *         - `drivers:read` - View driver information
 *         - `drivers:create` - Register new drivers
 *         - `drivers:update` - Modify driver details
 *         - `drivers:delete` - Remove drivers
 *         
 *         **Vehicle Management Permissions**:
 *         - `vehicles:read` - View vehicle information
 *         - `vehicles:create` - Add new vehicles
 *         - `vehicles:update` - Modify vehicle details
 *         - `vehicles:delete` - Remove vehicles
 *         
 *         **Route Management Permissions**:
 *         - `routes:read` - View route information
 *         - `routes:create` - Create new routes
 *         - `routes:update` - Modify route details
 *         - `routes:delete` - Remove routes
 *         
 *         **Trip Management Permissions**:
 *         - `trips:read` - View trip information
 *         - `trips:create` - Create new trips
 *         - `trips:update` - Modify trip details
 *         - `trips:update-status` - Update trip status only
 *         - `trips:delete` - Remove trips
 *         
 *         **Profile Management Permissions**:
 *         - `profile:read` - View own profile
 *         - `profile:update` - Modify own profile
 *         
 *         **Discount Management Permissions**:
 *         - `discounts:read` - View available discounts
 *         - `discounts:apply` - Apply discounts to trips
 *         - `discounts:manage` - Create/modify discount rules
 *         
 *         **Verification Permissions**:
 *         - `verification:submit` - Submit verification documents
 *         - `verification:approve` - Approve verification requests
 *         - `verification:reject` - Reject verification requests
 *         
 *         ## Hierarchy System
 *         
 *         The hierarchy field provides a numerical representation of user authority:
 *         
 *         ```typescript
 *         const ROLE_HIERARCHY = {
 *           SUPER_ADMIN: 4,  // Highest authority
 *           ADMIN: 3,        // Administrative authority
 *           ORGANIZATION: 2, // Organizational authority
 *           DRIVER: 1,       // Basic user authority
 *           PASSENGER: 1     // Basic user authority
 *         };
 *         ```
 *         
 *         **Hierarchy Rules**:
 *         - Higher hierarchy levels can access resources of lower levels (within scope)
 *         - Same hierarchy levels cannot access each other's resources (except SUPER_ADMIN)
 *         - Organization boundaries still apply regardless of hierarchy
 *         
 *         ## Token Validation Process
 *         
 *         ### 1. Token Extraction
 *         ```typescript
 *         // Extract token from Authorization header
 *         const authHeader = request.headers.authorization;
 *         const token = authHeader?.startsWith('Bearer ') 
 *           ? authHeader.substring(7) 
 *           : null;
 *         ```
 *         
 *         ### 2. Token Verification
 *         ```typescript
 *         // Verify token signature and expiration
 *         const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
 *         ```
 *         
 *         ### 3. User Validation
 *         ```typescript
 *         // Verify user still exists and is active
 *         const user = await getUserById(decoded.id, decoded.userType);
 *         if (!user || !user.isActive) {
 *           throw new Error('User not found or inactive');
 *         }
 *         ```
 *         
 *         ### 4. Permission Checking
 *         ```typescript
 *         // Check if user has required permissions
 *         const hasPermission = decoded.permissions.includes(requiredPermission) 
 *           || decoded.permissions.includes('*');
 *         ```
 *         
 *         ### 5. Context Validation
 *         ```typescript
 *         // Validate application context
 *         const appContext = request.headers['x-app-context'];
 *         const allowedContexts = getContextsForRole(decoded.role);
 *         if (!allowedContexts.includes(appContext)) {
 *           throw new Error('Context mismatch');
 *         }
 *         ```
 *         
 *         ## Token Refresh Process
 *         
 *         ### 1. Refresh Token Validation
 *         ```typescript
 *         // Verify refresh token
 *         const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
 *         ```
 *         
 *         ### 2. Database Verification
 *         ```typescript
 *         // Verify refresh token matches stored token
 *         const user = await getUserById(decoded.id, decoded.userType);
 *         if (user.refreshToken !== refreshToken) {
 *           throw new Error('Invalid refresh token');
 *         }
 *         ```
 *         
 *         ### 3. New Token Generation
 *         ```typescript
 *         // Generate new token pair
 *         const newTokens = generateTokens({
 *           id: user.id,
 *           email: user.email,
 *           role: user.role,
 *           userType: decoded.userType,
 *           organizationId: user.organizationId
 *         });
 *         ```
 *         
 *         ### 4. Database Update
 *         ```typescript
 *         // Update stored refresh token
 *         await updateUserRefreshToken(user.id, newTokens.refreshToken);
 *         ```
 *         
 *         ## Security Considerations
 *         
 *         ### Token Security
 *         - **Secret Management**: JWT secrets are stored as environment variables
 *         - **Algorithm**: Uses HMAC SHA-256 for signing (prevents algorithm confusion attacks)
 *         - **Expiration**: Short-lived access tokens with longer-lived refresh tokens
 *         - **Rotation**: Refresh tokens are rotated on each use
 *         
 *         ### Payload Security
 *         - **No Sensitive Data**: Passwords and sensitive information are never included
 *         - **Minimal Claims**: Only necessary information is included in tokens
 *         - **Validation**: All claims are validated on each request
 *         
 *         ### Storage Security
 *         - **Client Storage**: Tokens should be stored securely (secure HTTP-only cookies or secure storage)
 *         - **Transmission**: Always transmitted over HTTPS
 *         - **Revocation**: Refresh tokens can be revoked by updating database
 *         
 *         ## Token Usage Examples
 *         
 *         ### Making Authenticated Requests
 *         ```http
 *         GET /api/auth/me HTTP/1.1
 *         Host: api.sptm.com
 *         Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         X-App-Context: web-dashboard
 *         Content-Type: application/json
 *         ```
 *         
 *         ### Refreshing Tokens
 *         ```http
 *         POST /api/auth/web/admin/refresh-token HTTP/1.1
 *         Host: api.sptm.com
 *         Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         X-App-Context: web-dashboard
 *         Content-Type: application/json
 *         ```
 *         
 *         ### Token Response Format
 *         ```json
 *         {
 *           "message": "Login successful",
 *           "user": {
 *             "id": "cmik7w7h700037fm9zv7btfaz",
 *             "email": "admin@sptm.com",
 *             "name": "System Administrator",
 *             "role": "ADMIN",
 *             "userType": "ADMIN",
 *             "organizationId": null,
 *             "isActive": true,
 *             "createdAt": "2025-11-29T10:00:00.000Z"
 *           },
 *           "tokens": {
 *             "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaWs3dzdoNzAwMDM3Zm05enY3YnRmYXoiLCJlbWFpbCI6ImFkbWluQHNwdG0uY29tIiwicm9sZSI6IkFETUlOIiwidXNlclR5cGUiOiJBRE1JTiIsIm9yZ2FuaXphdGlvbklkIjpudWxsLCJwZXJtaXNzaW9ucyI6WyJvcmdhbml6YXRpb25zOnJlYWQiLCJvcmdhbml6YXRpb25zOmNyZWF0ZSIsInVzZXJzOnJlYWQiXSwiaGllcmFyY2h5IjozLCJpYXQiOjE3MzI4ODE2MDAsImV4cCI6MTczMjg4NTIwMH0.signature",
 *             "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtaWs3dzdoNzAwMDM3Zm05enY3YnRmYXoiLCJ1c2VyVHlwZSI6IkFETUlOIiwib3JnYW5pemF0aW9uSWQiOm51bGwsImlhdCI6MTczMjg4MTYwMCwiZXhwIjoxNzMzNDg2NDAwfQ.signature"
 *           }
 *         }
 *         ```
 *         
 *         ## Error Scenarios
 *         
 *         ### Invalid Token
 *         ```json
 *         {
 *           "error": {
 *             "type": "TOKEN_INVALID",
 *             "message": "Invalid or malformed JWT token",
 *             "code": 401,
 *             "details": {
 *               "reason": "Invalid signature"
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/auth/me"
 *         }
 *         ```
 *         
 *         ### Expired Token
 *         ```json
 *         {
 *           "error": {
 *             "type": "TOKEN_EXPIRED",
 *             "message": "JWT token has expired",
 *             "code": 401,
 *             "details": {
 *               "expiredAt": "2025-11-29T11:30:00.000Z",
 *               "currentTime": "2025-11-29T12:00:00.000Z"
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/auth/me"
 *         }
 *         ```
 *         
 *         ### Insufficient Permissions
 *         ```json
 *         {
 *           "error": {
 *             "type": "INSUFFICIENT_PERMISSIONS",
 *             "message": "User does not have required permissions",
 *             "code": 403,
 *             "details": {
 *               "requiredPermissions": ["organizations:create"],
 *               "userPermissions": ["organizations:read", "users:read"],
 *               "userRole": "ORGANIZATION",
 *               "hierarchy": 2
 *             }
 *           },
 *           "timestamp": "2025-11-29T12:00:00.000Z",
 *           "path": "/api/organizations"
 *         }
 *         ```
 *         
 *         ## Best Practices
 *         
 *         ### For API Consumers
 *         1. **Store Tokens Securely**: Use secure storage mechanisms
 *         2. **Handle Expiration**: Implement automatic token refresh
 *         3. **Include Context**: Always send X-App-Context header
 *         4. **Validate Responses**: Check for authentication errors
 *         5. **Logout Properly**: Clear tokens on logout
 *         
 *         ### For API Developers
 *         1. **Validate All Claims**: Don't trust token contents without validation
 *         2. **Check Permissions**: Verify user has required permissions
 *         3. **Enforce Boundaries**: Respect organization boundaries
 *         4. **Log Security Events**: Track authentication failures
 *         5. **Rotate Secrets**: Regularly update JWT secrets
 *         
 *         ## Token Debugging
 *         
 *         ### Decoding Tokens (Development Only)
 *         You can decode JWT tokens using online tools like jwt.io or programmatically:
 *         
 *         ```javascript
 *         // Decode token payload (without verification)
 *         const payload = JSON.parse(atob(token.split('.')[1]));
 *         console.log('Token payload:', payload);
 *         ```
 *         
 *         **Warning**: Never decode tokens in production without proper verification!
 *         
 *         ### Common Issues
 *         1. **Clock Skew**: Ensure server clocks are synchronized
 *         2. **Secret Mismatch**: Verify JWT_SECRET environment variable
 *         3. **Context Mismatch**: Check X-App-Context header
 *         4. **Expired Tokens**: Implement proper refresh logic
 *         5. **Permission Changes**: Tokens don't reflect real-time permission changes
 *       properties:
 *         tokenTypes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Access Token", "Refresh Token"]
 *         algorithms:
 *           type: array
 *           items:
 *             type: string
 *           example: ["HS256"]
 *         expirationTimes:
 *           type: object
 *           properties:
 *             SUPER_ADMIN:
 *               type: object
 *               properties:
 *                 access:
 *                   type: string
 *                   example: "30m"
 *                 refresh:
 *                   type: string
 *                   example: "7d"
 *             ADMIN:
 *               type: object
 *               properties:
 *                 access:
 *                   type: string
 *                   example: "1h"
 *                 refresh:
 *                   type: string
 *                   example: "7d"
 *             ORGANIZATION:
 *               type: object
 *               properties:
 *                 access:
 *                   type: string
 *                   example: "2h"
 *                 refresh:
 *                   type: string
 *                   example: "14d"
 *             USER:
 *               type: object
 *               properties:
 *                 access:
 *                   type: string
 *                   example: "4h"
 *                 refresh:
 *                   type: string
 *                   example: "30d"
 *         hierarchyLevels:
 *           type: object
 *           properties:
 *             SUPER_ADMIN:
 *               type: integer
 *               example: 4
 *             ADMIN:
 *               type: integer
 *               example: 3
 *             ORGANIZATION:
 *               type: integer
 *               example: 2
 *             DRIVER:
 *               type: integer
 *               example: 1
 *             PASSENGER:
 *               type: integer
 *               example: 1
 *
 *     JWTAccessToken:
 *       type: object
 *       description: JWT Access Token payload structure
 *       required:
 *         - id
 *         - email
 *         - role
 *         - userType
 *         - permissions
 *         - hierarchy
 *         - iat
 *         - exp
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user identifier
 *           example: "cmik7w7h700037fm9zv7btfaz"
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "admin@sptm.com"
 *         role:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, DRIVER, PASSENGER]
 *           description: Specific user role
 *           example: "ADMIN"
 *         userType:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *           description: User type for access control
 *           example: "ADMIN"
 *         organizationId:
 *           type: string
 *           nullable: true
 *           description: Associated organization ID (null for system users)
 *           example: null
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of granted permissions
 *           example: ["organizations:read", "organizations:create", "users:read", "routes:manage"]
 *         hierarchy:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *           description: Numerical authority level (4=highest, 1=lowest)
 *           example: 3
 *         iat:
 *           type: integer
 *           description: Issued at timestamp (Unix timestamp)
 *           example: 1732881600
 *         exp:
 *           type: integer
 *           description: Expiration timestamp (Unix timestamp)
 *           example: 1732885200
 *       examples:
 *         superAdminToken:
 *           summary: Super Admin access token
 *           value:
 *             id: "super_admin_id_123"
 *             email: "superadmin@sptm.com"
 *             role: "SUPER_ADMIN"
 *             userType: "SUPER_ADMIN"
 *             organizationId: null
 *             permissions: ["*"]
 *             hierarchy: 4
 *             iat: 1732881600
 *             exp: 1732883400
 *         adminToken:
 *           summary: Admin access token
 *           value:
 *             id: "admin_id_456"
 *             email: "admin@sptm.com"
 *             role: "ADMIN"
 *             userType: "ADMIN"
 *             organizationId: null
 *             permissions: ["organizations:read", "organizations:create", "users:read", "routes:manage"]
 *             hierarchy: 3
 *             iat: 1732881600
 *             exp: 1732885200
 *         organizationToken:
 *           summary: Organization access token
 *           value:
 *             id: "org_id_789"
 *             email: "org@transport.com"
 *             role: "ORGANIZATION"
 *             userType: "ORGANIZATION"
 *             organizationId: "org_123456789"
 *             permissions: ["drivers:manage", "vehicles:manage", "organization:update"]
 *             hierarchy: 2
 *             iat: 1732881600
 *             exp: 1732888800
 *         driverToken:
 *           summary: Driver access token
 *           value:
 *             id: "driver_id_101"
 *             email: "driver@transport.com"
 *             role: "DRIVER"
 *             userType: "USER"
 *             organizationId: "org_123456789"
 *             permissions: ["profile:update", "vehicle:read", "trips:update-status"]
 *             hierarchy: 1
 *             iat: 1732881600
 *             exp: 1732896000
 *         passengerToken:
 *           summary: Passenger access token
 *           value:
 *             id: "passenger_id_202"
 *             email: "passenger@example.com"
 *             role: "PASSENGER"
 *             userType: "USER"
 *             organizationId: null
 *             permissions: ["profile:update", "trips:create", "discounts:apply"]
 *             hierarchy: 1
 *             iat: 1732881600
 *             exp: 1732896000
 *
 *     JWTRefreshToken:
 *       type: object
 *       description: JWT Refresh Token payload structure
 *       required:
 *         - id
 *         - userType
 *         - iat
 *         - exp
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user identifier
 *           example: "cmik7w7h700037fm9zv7btfaz"
 *         userType:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *           description: User type for token refresh validation
 *           example: "ADMIN"
 *         organizationId:
 *           type: string
 *           nullable: true
 *           description: Associated organization ID (null for system users)
 *           example: null
 *         iat:
 *           type: integer
 *           description: Issued at timestamp (Unix timestamp)
 *           example: 1732881600
 *         exp:
 *           type: integer
 *           description: Expiration timestamp (Unix timestamp)
 *           example: 1733486400
 *       examples:
 *         adminRefreshToken:
 *           summary: Admin refresh token
 *           value:
 *             id: "admin_id_456"
 *             userType: "ADMIN"
 *             organizationId: null
 *             iat: 1732881600
 *             exp: 1733486400
 *         driverRefreshToken:
 *           summary: Driver refresh token
 *           value:
 *             id: "driver_id_101"
 *             userType: "USER"
 *             organizationId: "org_123456789"
 *             iat: 1732881600
 *             exp: 1735473600
 *
 *     TokenValidationError:
 *       type: object
 *       description: Error response for token validation failures
 *       required:
 *         - error
 *         - timestamp
 *         - path
 *       properties:
 *         error:
 *           type: object
 *           required:
 *             - type
 *             - message
 *             - code
 *           properties:
 *             type:
 *               type: string
 *               enum: [TOKEN_INVALID, TOKEN_EXPIRED, TOKEN_MALFORMED]
 *               description: Type of token validation error
 *             message:
 *               type: string
 *               description: Human-readable error message
 *             code:
 *               type: integer
 *               enum: [401]
 *               description: HTTP status code
 *             details:
 *               type: object
 *               properties:
 *                 reason:
 *                   type: string
 *                   description: Specific reason for token validation failure
 *                 expiredAt:
 *                   type: string
 *                   format: date-time
 *                   description: Token expiration timestamp (for expired tokens)
 *                 currentTime:
 *                   type: string
 *                   format: date-time
 *                   description: Current server timestamp (for expired tokens)
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Error timestamp
 *         path:
 *           type: string
 *           description: API endpoint path where error occurred
 *       examples:
 *         invalidToken:
 *           summary: Invalid token error
 *           value:
 *             error:
 *               type: "TOKEN_INVALID"
 *               message: "Invalid or malformed JWT token"
 *               code: 401
 *               details:
 *                 reason: "Invalid signature"
 *             timestamp: "2025-11-29T12:00:00.000Z"
 *             path: "/api/auth/me"
 *         expiredToken:
 *           summary: Expired token error
 *           value:
 *             error:
 *               type: "TOKEN_EXPIRED"
 *               message: "JWT token has expired"
 *               code: 401
 *               details:
 *                 reason: "Token expired"
 *                 expiredAt: "2025-11-29T11:30:00.000Z"
 *                 currentTime: "2025-11-29T12:00:00.000Z"
 *             timestamp: "2025-11-29T12:00:00.000Z"
 *             path: "/api/auth/me"
 *         malformedToken:
 *           summary: Malformed token error
 *           value:
 *             error:
 *               type: "TOKEN_MALFORMED"
 *               message: "JWT token is malformed"
 *               code: 401
 *               details:
 *                 reason: "Invalid token format"
 *             timestamp: "2025-11-29T12:00:00.000Z"
 *             path: "/api/auth/me"onId:
 *                   type: string
 *                   description: Organization ID involved in boundary violation
 *                 expectedContext:
 *                   type: string
 *                   description: Expected application context
 *                 actualContext:
 *                   type: string
 *                   description: Actual application context provided
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Error timestamp
 *         path:
 *           type: string
 *           description: API endpoint path where error occurred
 *       examples:
 *         insufficientPermissions:
 *           summary: Insufficient permissions error
 *           value:
 *             error:
 *               type: "INSUFFICIENT_PERMISSIONS"
 *               message: "User does not have required permissions to access this resource"
 *               code: 403
 *               details:
 *                 requiredRole: "ADMIN"
 *                 userRole: "ORGANIZATION"
 *                 requiredPermissions: ["users:read", "users:create"]
 *                 userPermissions: ["drivers:manage", "vehicles:manage"]
 *             timestamp: "2025-11-29T12:00:00.000Z"
 *             path: "/api/admin/users"
 *         organizationBoundaryViolation:
 *           summary: Organization boundary violation
 *           value:
 *             error:
 *               type: "ORGANIZATION_BOUNDARY_VIOLATION"
 *               message: "User cannot access resources outside their organization"
 *               code: 403
 *               details:
 *                 userRole: "ORGANIZATION"
 *                 userOrganizationId: "org_123456789"
 *                 requestedOrganizationId: "org_987654321"
 *             timestamp: "2025-11-29T12:00:00.000Z"
 *             path: "/api/organizations/org_987654321/drivers"
 *         contextMismatch:
 *           summary: Context mismatch error
 *           value:
 *             error:
 *               type: "CONTEXT_MISMATCH"
 *               message: "User context does not match required application context"
 *               code: 401
 *               details:
 *                 userRole: "DRIVER"
 *                 expectedContext: "driver-app"
 *                 actualContext: "web-dashboard"
 *                 allowedContexts: ["driver-app"]
 *             timestamp: "2025-11-29T12:00:00.000Z"
 *             path: "/api/auth/web/organization/login"
 *
 *     RoleTransition:
 *       type: object
 *       description: Documentation of role transition rules and restrictions
 *       properties:
 *         allowedTransitions:
 *           type: object
 *           description: Allowed role transitions and who can perform them
 *           properties:
 *             SUPER_ADMIN:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   from:
 *                     type: string
 *                   to:
 *                     type: string
 *                   conditions:
 *                     type: array
 *                     items:
 *                       type: string
 *               example:
 *                 - from: "ADMIN"
 *                   to: "SUPER_ADMIN"
 *                   conditions: ["Manual promotion by existing SUPER_ADMIN"]
 *                 - from: "ORGANIZATION"
 *                   to: "ADMIN"
 *                   conditions: ["Approval by SUPER_ADMIN", "Organization deactivation"]
 *             ADMIN:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   from:
 *                     type: string
 *                   to:
 *                     type: string
 *                   conditions:
 *                     type: array
 *                     items:
 *                       type: string
 *               example:
 *                 - from: "ORGANIZATION"
 *                   to: "ADMIN"
 *                   conditions: ["Approval by SUPER_ADMIN"]
 *         restrictedTransitions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *               reason:
 *                 type: string
 *           example:
 *             - from: "DRIVER"
 *               to: "ORGANIZATION"
 *               reason: "Drivers cannot become organization managers directly"
 *             - from: "PASSENGER"
 *               to: "ADMIN"
 *               reason: "Passengers cannot become system administrators"
 *             - from: "USER"
 *               to: "SUPER_ADMIN"
 *               reason: "Users cannot become super administrators directly"
 *
 *     ContextValidation:
 *       type: object
 *       description: Context validation rules and requirements
 *       properties:
 *         contextRequirements:
 *           type: object
 *           properties:
 *             web-dashboard:
 *               type: object
 *               properties:
 *                 allowedRoles:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["SUPER_ADMIN", "ADMIN", "ORGANIZATION"]
 *                 requiredHeaders:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["X-App-Context: web-dashboard"]
 *                 features:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["User management", "System configuration", "Reports and analytics"]
 *             driver-app:
 *               type: object
 *               properties:
 *                 allowedRoles:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["DRIVER"]
 *                 requiredHeaders:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["X-App-Context: driver-app"]
 *                 features:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Trip management", "Vehicle status", "Route navigation"]
 *             passenger-app:
 *               type: object
 *               properties:
 *                 allowedRoles:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["PASSENGER"]
 *                 requiredHeaders:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["X-App-Context: passenger-app"]
 *                 features:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Trip booking", "Discount management", "Route information"]
 *         validationRules:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               rule:
 *                 type: string
 *               description:
 *                 type: string
 *           example:
 *             - rule: "Context header must match user's allowed contexts"
 *               description: "X-App-Context header must be one of the contexts allowed for the user's role"
 *             - rule: "Web dashboard users cannot access mobile endpoints"
 *               description: "SUPER_ADMIN, ADMIN, ORGANIZATION cannot use driver-app or passenger-app contexts"
 *             - rule: "Mobile users cannot access web dashboard endpoints"
 *               description: "DRIVER and PASSENGER cannot use web-dashboard context"
 *             - rule: "Context validation occurs before authentication"
 *               description: "Invalid context results in 401 Unauthorized before credential validation"
 *
 *     AccessControlExample:
 *       type: object
 *       description: Example of access control enforcement
 *       required:
 *         - scenario
 *         - userType
 *         - userRole
 *         - requestedEndpoint
 *         - context
 *         - result
 *         - reason
 *       properties:
 *         scenario:
 *           type: string
 *           description: Description of the access control scenario
 *           example: "Organization manager accessing own drivers"
 *         userType:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *           description: User type attempting access
 *           example: "ORGANIZATION"
 *         userRole:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, DRIVER, PASSENGER]
 *           description: Specific role of the user
 *           example: "ORGANIZATION"
 *         userOrganizationId:
 *           type: string
 *           nullable: true
 *           description: Organization ID of the user (if applicable)
 *           example: "org_123456789"
 *         requestedEndpoint:
 *           type: string
 *           description: API endpoint being accessed
 *           example: "GET /api/organizations/org_123456789/drivers"
 *         context:
 *           type: string
 *           enum: [web-dashboard, driver-app, passenger-app]
 *           description: Application context being used
 *           example: "web-dashboard"
 *         result:
 *           type: string
 *           enum: [SUCCESS, ORGANIZATION_BOUNDARY_VIOLATION, CONTEXT_MISMATCH, INSUFFICIENT_PERMISSIONS]
 *           description: Result of the access control check
 *           example: "SUCCESS"
 *         httpStatus:
 *           type: integer
 *           description: HTTP status code (for violations)
 *           example: 403
 *         reason:
 *           type: string
 *           description: Explanation of why access was granted or denied
 *           example: "User can access resources within their own organization"
 *         errorResponse:
 *           $ref: '#/components/schemas/AccessControlError'
 *           nullable: true
 *           description: Error response object (for violations)
 *
 *     OrganizationBoundary:
 *       type: object
 *       description: Organization boundary enforcement rules and examples
 *       properties:
 *         boundaryRules:
 *           type: object
 *           properties:
 *             noBoundary:
 *               type: object
 *               properties:
 *                 userTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["SUPER_ADMIN", "ADMIN", "PASSENGER"]
 *                 description:
 *                   type: string
 *                   example: "Can access resources across all organizations"
 *                 reasoning:
 *                   type: string
 *                   example: "System-level roles or users not tied to specific organizations"
 *             strictBoundary:
 *               type: object
 *               properties:
 *                 userTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["ORGANIZATION", "DRIVER"]
 *                 description:
 *                   type: string
 *                   example: "Can only access resources within their own organization"
 *                 reasoning:
 *                   type: string
 *                   example: "Organization-specific roles that should not access other organizations' data"
 *         enforcementExamples:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               scenario:
 *                 type: string
 *               userType:
 *                 type: string
 *               userOrganizationId:
 *                 type: string
 *               requestedResource:
 *                 type: string
 *               allowed:
 *                 type: boolean
 *               reason:
 *                 type: string
 *           example:
 *             - scenario: "Organization manager accessing own drivers"
 *               userType: "ORGANIZATION"
 *               userOrganizationId: "org_123456789"
 *               requestedResource: "/api/organizations/org_123456789/drivers"
 *               allowed: true
 *               reason: "User can access resources within their own organization"
 *             - scenario: "Organization manager accessing other organization's drivers"
 *               userType: "ORGANIZATION"
 *               userOrganizationId: "org_123456789"
 *               requestedResource: "/api/organizations/org_987654321/drivers"
 *               allowed: false
 *               reason: "Organization boundary violation - cannot access other organizations"
 *             - scenario: "Driver accessing own organization's vehicles"
 *               userType: "DRIVER"
 *               userOrganizationId: "org_123456789"
 *               requestedResource: "/api/organizations/org_123456789/vehicles"
 *               allowed: true
 *               reason: "Driver can view vehicles within their organization"
 *             - scenario: "Admin accessing any organization"
 *               userType: "ADMIN"
 *               userOrganizationId: null
 *               requestedResource: "/api/organizations/org_987654321/drivers"
 *               allowed: true
 *               reason: "Admin has no organization boundary restrictions"
 *
 *
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *         - userType
 *         - isActive
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]{25}$'
 *           description: Unique user identifier (25 character alphanumeric string)
 *           example: "cmik7w7h700037fm9zv7btfaz"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
 *           description: User email address (valid email format, max 255 characters)
 *           example: "user@example.com"
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           pattern: '^[a-zA-Z\s\-\.\']+$'
 *           description: User full name (2-100 characters, letters, spaces, hyphens, dots, apostrophes only)
 *           example: "John Doe"
 *         role:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, DRIVER, PASSENGER]
 *           description: User role in the system
 *           example: "DRIVER"
 *         userType:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *           description: User type for access control (hierarchical permission level)
 *           example: "USER"
 *         organizationId:
 *           type: string
 *           pattern: '^org_[a-zA-Z0-9]{9}$'
 *           nullable: true
 *           description: Associated organization ID (required for drivers, format org_xxxxxxxxx)
 *           example: "org_123456789"
 *         isActive:
 *           type: boolean
 *           description: Whether the user account is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp (ISO 8601 format)
 *           example: "2025-11-29T10:00:00.000Z"
 *
 *     AuthResponse:
 *       type: object
 *       required:
 *         - message
 *         - user
 *         - tokens
 *       properties:
 *         message:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           description: Success message indicating authentication result
 *           example: "Login successful"
 *         user:
 *           $ref: '#/components/schemas/User'
 *         tokens:
 *           type: object
 *           required:
 *             - accessToken
 *             - refreshToken
 *           properties:
 *             accessToken:
 *               type: string
 *               pattern: '^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$'
 *               description: JWT access token (valid for 15 minutes, format xxx.yyy.zzz)
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWlrN3c3aDcwMDAzN2ZtOXp2N2J0ZmF6IiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IkRSSVZFUiIsInVzZXJUeXBlIjoiVVNFUiIsImlhdCI6MTczMjg3NjgwMCwiZXhwIjoxNzMyODc3NzAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
 *             refreshToken:
 *               type: string
 *               pattern: '^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$'
 *               description: JWT refresh token (valid for 7 days, format xxx.yyy.zzz)
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWlrN3c3aDcwMDAzN2ZtOXp2N2J0ZmF6IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3MzI4NzY4MDAsImV4cCI6MTczMzQ4MTYwMH0.cThIIoDvwdueQB468K5xDc5633seEFoqwxjF_xSJyQQ"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
 *           description: User email address (valid email format, max 255 characters)
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 1
 *           maxLength: 128
 *           description: User password (1-128 characters, any valid password format)
 *           example: "Password123!"
 *
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
 *           description: User email address (valid email format, max 255 characters, must be unique)
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           maxLength: 128
 *           pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
 *           description: User password (8-128 chars, must include uppercase, lowercase, numbers, special chars @$!%*?&)
 *           example: "Password123!"
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           pattern: '^[a-zA-Z\s\-\.\']+$'
 *           description: User full name (2-100 characters, letters, spaces, hyphens, dots, apostrophes only)
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           nullable: true
 *           pattern: '^\+?[1-9]\d{1,14}$'
 *           description: User phone number (E.164 format, optional + prefix, 2-15 digits)
 *           example: "+1234567890"
 *         role:
 *           type: string
 *           enum: [DRIVER, PASSENGER]
 *           description: User role (auto-set based on app context, not user-provided)
 *           example: "PASSENGER"
 *         organizationId:
 *           type: string
 *           pattern: '^org_[a-zA-Z0-9]{9}$'
 *           nullable: true
 *           description: Organization ID (required for driver registration, format org_xxxxxxxxx)
 *           example: "org_123456789"
 *
 *     DriverRegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *         - organizationId
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
 *           description: Driver email address (valid email format, max 255 characters, must be unique)
 *           example: "driver@transport.com"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           maxLength: 128
 *           pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
 *           description: Driver password (8-128 chars, must include uppercase, lowercase, numbers, special chars @$!%*?&)
 *           example: "DriverPass123!"
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           pattern: '^[a-zA-Z\s\-\.\']+$'
 *           description: Driver full name (2-100 characters, letters, spaces, hyphens, dots, apostrophes only)
 *           example: "John Driver"
 *         phone:
 *           type: string
 *           nullable: true
 *           pattern: '^\+?[1-9]\d{1,14}$'
 *           description: Driver phone number (E.164 format, optional + prefix, 2-15 digits)
 *           example: "+1234567890"
 *         organizationId:
 *           type: string
 *           pattern: '^org_[a-zA-Z0-9]{9}$'
 *           description: Organization ID that the driver belongs to (required for drivers, format org_xxxxxxxxx)
 *           example: "org_123456789"
 *         role:
 *           type: string
 *           enum: [DRIVER]
 *           description: User role (automatically set to DRIVER for driver registration)
 *           example: "DRIVER"
 *
 *     PassengerRegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
 *           description: Passenger email address (valid email format, max 255 characters, must be unique)
 *           example: "passenger@example.com"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           maxLength: 128
 *           pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
 *           description: Passenger password (8-128 chars, must include uppercase, lowercase, numbers, special chars @$!%*?&)
 *           example: "PassengerPass123!"
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           pattern: '^[a-zA-Z\s\-\.\']+$'
 *           description: Passenger full name (2-100 characters, letters, spaces, hyphens, dots, apostrophes only)
 *           example: "Jane Passenger"
 *         phone:
 *           type: string
 *           nullable: true
 *           pattern: '^\+?[1-9]\d{1,14}$'
 *           description: Passenger phone number (E.164 format, optional + prefix, 2-15 digits)
 *           example: "+1234567890"
 *         role:
 *           type: string
 *           enum: [PASSENGER]
 *           description: User role (automatically set to PASSENGER for passenger registration)
 *           example: "PASSENGER"
 *
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           minLength: 1
 *           maxLength: 128
 *           description: Current password (1-128 characters, must match existing password)
 *           example: "OldPassword123!"
 *         newPassword:
 *           type: string
 *           format: password
 *           minLength: 8
 *           maxLength: 128
 *           pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
 *           description: New password (8-128 chars, must include uppercase, lowercase, numbers, special chars @$!%*?&, must be different from current password)
 *           example: "NewPassword123!"
 *
 *     TokenResponse:
 *       type: object
 *       required:
 *         - accessToken
 *         - refreshToken
 *       properties:
 *         accessToken:
 *           type: string
 *           pattern: '^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$'
 *           description: New JWT access token (valid for 15 minutes, format xxx.yyy.zzz)
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
 *         refreshToken:
 *           type: string
 *           pattern: '^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$'
 *           description: New JWT refresh token (valid for 7 days, format xxx.yyy.zzz)
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.cThIIoDvwdueQB468K5xDc5633seEFoqwxjF_xSJyQQ"
 *
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           pattern: '^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$'
 *           description: JWT refresh token to be used for obtaining new access token
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWlrN3c3aDcwMDAzN2ZtOXp2N2J0ZmF6IiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3MzI4NzY4MDAsImV4cCI6MTczMzQ4MTYwMH0.cThIIoDvwdueQB468K5xDc5633seEFoqwxjF_xSJyQQ"
 *
 *     LogoutResponse:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           description: Logout success message
 *           example: "Logout successful"
 *
 *     HealthResponse:
 *       type: object
 *       required:
 *         - status
 *         - message
 *         - timestamp
 *       properties:
 *         status:
 *           type: string
 *           enum: [OK, ERROR]
 *           description: System health status
 *           example: "OK"
 *         message:
 *           type: string
 *           description: Health status message
 *           example: "SPTM Backend is running"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Health check timestamp
 *           example: "2025-11-29T12:00:00.000Z"
 *
 *     UserProfile:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *         - userType
 *         - isActive
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           pattern: '^[a-zA-Z0-9]{25}$'
 *           description: Unique user identifier (25 character alphanumeric string)
 *           example: "cmik7w7h700037fm9zv7btfaz"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
 *           description: User email address (valid email format, max 255 characters)
 *           example: "user@example.com"
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           pattern: '^[a-zA-Z\s\-\.\']+$'
 *           description: User full name (2-100 characters, letters, spaces, hyphens, dots, apostrophes only)
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           nullable: true
 *           pattern: '^\+?[1-9]\d{1,14}$'
 *           description: User phone number (E.164 format, optional + prefix, 2-15 digits)
 *           example: "+1234567890"
 *         role:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, DRIVER, PASSENGER]
 *           description: User role in the system
 *           example: "DRIVER"
 *         userType:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *           description: User type for access control (hierarchical permission level)
 *           example: "USER"
 *         organizationId:
 *           type: string
 *           pattern: '^org_[a-zA-Z0-9]{9}$'
 *           nullable: true
 *           description: Associated organization ID (required for drivers, format org_xxxxxxxxx)
 *           example: "org_123456789"
 *         organization:
 *           allOf:
 *             - $ref: '#/components/schemas/Organization'
 *             - nullable: true
 *           description: Associated organization details (populated for drivers)
 *         isActive:
 *           type: boolean
 *           description: Whether the user account is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp (ISO 8601 format)
 *           example: "2025-11-29T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp (ISO 8601 format)
 *           example: "2025-11-29T12:00:00.000Z"
 *
 *     Organization:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - email
 *         - isActive
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           pattern: '^org_[a-zA-Z0-9]{9}$'
 *           description: Unique organization identifier (format org_xxxxxxxxx)
 *           example: "org_123456789"
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *           pattern: '^[a-zA-Z0-9\s\-\.\'&,()]+$'
 *           description: Organization name (2-200 characters, alphanumeric, spaces, and common punctuation)
 *           example: "City Transport Authority"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
 *           description: Organization contact email (valid email format, max 255 characters)
 *           example: "contact@citytransport.com"
 *         isActive:
 *           type: boolean
 *           description: Whether the organization is active and accepting new drivers
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Organization creation timestamp (ISO 8601 format)
 *           example: "2025-11-29T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp (ISO 8601 format)
 *           example: "2025-11-29T12:00:00.000Z"
 *
 *     ValidationErrorDetails:
 *       type: object
 *       properties:
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *           description: List of validation requirements that failed
 *           example: ["Password must contain at least one uppercase letter", "Password must contain at least one special character"]
 *         field:
 *           type: string
 *           description: Field that failed validation
 *           example: "password"
 *         value:
 *           description: The invalid value (may be omitted for security)
 *
 *     RateLimitErrorDetails:
 *       type: object
 *       required:
 *         - retryAfter
 *         - limit
 *         - remaining
 *         - resetTime
 *       properties:
 *         retryAfter:
 *           type: integer
 *           description: Seconds to wait before retrying
 *           example: 300
 *         limit:
 *           type: integer
 *           description: Rate limit threshold
 *           example: 5
 *         remaining:
 *           type: integer
 *           description: Remaining requests in current window
 *           example: 0
 *         resetTime:
 *           type: string
 *           format: date-time
 *           description: When the rate limit window resets
 *           example: "2025-11-29T12:05:00.000Z"
 *
 *     ErrorResponse:
 *       type: object
 *       required:
 *         - error
 *         - timestamp
 *         - path
 *       properties:
 *         error:
 *           oneOf:
 *             - type: string
 *               description: Simple error message
 *               example: "Invalid email or password"
 *             - type: object
 *               required:
 *                 - type
 *                 - message
 *                 - code
 *               properties:
 *                 type:
 *                   type: string
 *                   description: Error type identifier
 *                   example: "WEAK_PASSWORD"
 *                 message:
 *                   type: string
 *                   description: Human-readable error message
 *                   example: "Password does not meet security requirements"
 *                 code:
 *                   type: integer
 *                   description: HTTP status code
 *                   example: 400
 *                 details:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/ValidationErrorDetails'
 *                     - $ref: '#/components/schemas/RateLimitErrorDetails'
 *                     - type: object
 *                       description: Additional error-specific details
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Error timestamp
 *           example: "2025-11-29T12:00:00.000Z"
 *         path:
 *           type: string
 *           description: API endpoint path where error occurred
 *           example: "/api/auth/login"
 *
 *   responses:
 *     ValidationError:
 *       description: Validation error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           examples:
 *             weakPassword:
 *               summary: Weak password error
 *               value:
 *                 error:
 *                   type: "WEAK_PASSWORD"
 *                   message: "Password does not meet security requirements"
 *                   code: 400
 *                   details:
 *                     requirements:
 *                       - "Password must contain at least one uppercase letter"
 *                       - "Password must contain at least one special character"
 *                       - "Password must be at least 8 characters long"
 *                     field: "password"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/register"
 *             missingFields:
 *               summary: Missing required fields
 *               value:
 *                 error: "Validation failed: email is required, password is required"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/login"
 *             invalidEmail:
 *               summary: Invalid email format
 *               value:
 *                 error:
 *                   type: "INVALID_EMAIL"
 *                   message: "Email format is invalid"
 *                   code: 400
 *                   details:
 *                     field: "email"
 *                     value: "invalid-email"
 *                     requirements: ["Email must be in valid format (user@domain.com)"]
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/register"
 *
 *     AuthenticationError:
 *       description: Authentication failed
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           examples:
 *             invalidCredentials:
 *               summary: Invalid credentials
 *               value:
 *                 error: "Invalid email or password"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/login"
 *             expiredToken:
 *               summary: Expired token
 *               value:
 *                 error: "Token has expired"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/me"
 *             contextMismatch:
 *               summary: Context mismatch error
 *               value:
 *                 error:
 *                   type: "CONTEXT_MISMATCH"
 *                   message: "User context does not match app context"
 *                   code: 401
 *                   details:
 *                     userContext: "web-dashboard"
 *                     appContext: "driver-app"
 *                     expectedContexts: ["driver-app"]
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/mobile/driver/login"
 *
 *     AuthorizationError:
 *       description: Authorization failed - insufficient permissions
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           examples:
 *             insufficientPermissions:
 *               summary: Insufficient permissions
 *               value:
 *                 error:
 *                   type: "INSUFFICIENT_PERMISSIONS"
 *                   message: "User does not have required permissions"
 *                   code: 403
 *                   details:
 *                     requiredRole: "ADMIN"
 *                     userRole: "USER"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/admin/users"
 *
 *     ConflictError:
 *       description: Resource conflict
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           examples:
 *             emailExists:
 *               summary: Email already exists
 *               value:
 *                 error: "User already exists with this email"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/register"
 *             accountLocked:
 *               summary: Account locked due to security
 *               value:
 *                 error:
 *                   type: "ACCOUNT_LOCKED"
 *                   message: "Account has been locked due to multiple failed login attempts"
 *                   code: 409
 *                   details:
 *                     lockoutDuration: 1800
 *                     attemptsRemaining: 0
 *                     unlockTime: "2025-11-29T12:30:00.000Z"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/login"
 *
 *     RateLimitError:
 *       description: Rate limit exceeded
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           examples:
 *             rateLimitExceeded:
 *               summary: Rate limit exceeded
 *               value:
 *                 error:
 *                   type: "RATE_LIMIT_EXCEEDED"
 *                   message: "Too many requests"
 *                   code: 429
 *                   details:
 *                     retryAfter: 300
 *                     limit: 5
 *                     remaining: 0
 *                     resetTime: "2025-11-29T12:05:00.000Z"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/login"
 *
 *     NotFoundError:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           examples:
 *             userNotFound:
 *               summary: User not found
 *               value:
 *                 error: "User not found"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/profile"
 *
 *     ServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           examples:
 *             internalError:
 *               summary: Internal server error
 *               value:
 *                 error: "Internal server error"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/login"
 *
 *     PermissionEnforcementMechanism:
 *       type: object
 *       description: |
 *         Detailed documentation of permission enforcement mechanisms and middleware chain.
 *         
 *         This schema documents how the RBAC system enforces permissions at runtime,
 *         including the middleware chain, validation processes, and decision logic.
 *       properties:
 *         middlewareChain:
 *           type: array
 *           description: Ordered list of middleware functions that enforce access control
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Middleware function name
 *               purpose:
 *                 type: string
 *                 description: What this middleware validates
 *               order:
 *                 type: integer
 *                 description: Execution order in the chain
 *               failureAction:
 *                 type: string
 *                 description: What happens when validation fails
 *           example:
 *             - name: "authenticate"
 *               purpose: "Verifies JWT token and extracts user information"
 *               order: 1
 *               failureAction: "Return 401 Unauthorized"
 *             - name: "authorizeRole"
 *               purpose: "Checks hierarchical role permissions"
 *               order: 2
 *               failureAction: "Return 403 Forbidden"
 *             - name: "authorizeOrganization"
 *               purpose: "Enforces organization boundaries"
 *               order: 3
 *               failureAction: "Return 403 Organization Boundary Violation"
 *             - name: "authorizeContext"
 *               purpose: "Validates application context"
 *               order: 4
 *               failureAction: "Return 401 Context Mismatch"
 *             - name: "authorizePermission"
 *               purpose: "Checks specific permissions"
 *               order: 5
 *               failureAction: "Return 403 Insufficient Permissions"
 *             - name: "authorizeResource"
 *               purpose: "Validates resource access rights"
 *               order: 6
 *               failureAction: "Return 403 Resource Access Denied"
 *             - name: "authorizeMethod"
 *               purpose: "Checks HTTP method permissions"
 *               order: 7
 *               failureAction: "Return 403 Method Not Allowed"
 *         validationProcess:
 *           type: object
 *           description: Step-by-step validation process for each request
 *           properties:
 *             steps:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   step:
 *                     type: integer
 *                   description:
 *                     type: string
 *                   validation:
 *                     type: string
 *                   onSuccess:
 *                     type: string
 *                   onFailure:
 *                     type: string
 *               example:
 *                 - step: 1
 *                   description: "Extract and verify JWT token"
 *                   validation: "Token signature, expiration, and format"
 *                   onSuccess: "Extract user information and continue"
 *                   onFailure: "Return 401 Unauthorized"
 *                 - step: 2
 *                   description: "Check user account status"
 *                   validation: "User exists and account is active"
 *                   onSuccess: "Continue to role validation"
 *                   onFailure: "Return 401 Account Inactive"
 *                 - step: 3
 *                   description: "Validate user role hierarchy"
 *                   validation: "User role meets minimum required level"
 *                   onSuccess: "Continue to organization validation"
 *                   onFailure: "Return 403 Insufficient Permissions"
 *                 - step: 4
 *                   description: "Check organization boundaries"
 *                   validation: "User can access requested organization's data"
 *                   onSuccess: "Continue to context validation"
 *                   onFailure: "Return 403 Organization Boundary Violation"
 *                 - step: 5
 *                   description: "Validate application context"
 *                   validation: "User's context matches request context"
 *                   onSuccess: "Continue to permission validation"
 *                   onFailure: "Return 401 Context Mismatch"
 *                 - step: 6
 *                   description: "Check specific permissions"
 *                   validation: "User has required permissions for operation"
 *                   onSuccess: "Continue to resource validation"
 *                   onFailure: "Return 403 Insufficient Permissions"
 *                 - step: 7
 *                   description: "Validate resource access"
 *                   validation: "User can access the specific resource"
 *                   onSuccess: "Continue to method validation"
 *                   onFailure: "Return 403 Resource Access Denied"
 *                 - step: 8
 *                   description: "Check HTTP method permissions"
 *                   validation: "User can perform the requested operation"
 *                   onSuccess: "Allow request to proceed"
 *                   onFailure: "Return 403 Method Not Allowed"
 *         decisionLogic:
 *           type: object
 *           description: Logic used to make access control decisions
 *           properties:
 *             hierarchicalCheck:
 *               type: string
 *               description: How hierarchical permissions are evaluated
 *               example: "userHierarchy >= requiredHierarchy && (userType === requiredType || userHierarchy > requiredHierarchy)"
 *             permissionCheck:
 *               type: string
 *               description: How specific permissions are validated
 *               example: "userPermissions.includes('*') || requiredPermissions.every(p => userPermissions.includes(p))"
 *             organizationBoundaryCheck:
 *               type: string
 *               description: How organization boundaries are enforced
 *               example: "!hasOrganizationBoundary(userType) || (requestedOrgId === userOrgId || !requestedOrgId)"
 *             contextCheck:
 *               type: string
 *               description: How context validation is performed
 *               example: "allowedContexts[userType].includes(requestContext)"
 *             resourceCheck:
 *               type: string
 *               description: How resource access is validated
 *               example: "accessControlMatrix[userType].canAccess.includes('*') || accessControlMatrix[userType].canAccess.includes(resource)"
 *
 *     AccessControlAuditLog:
 *       type: object
 *       description: |
 *         Access control audit logging schema for security monitoring and compliance.
 *         
 *         All access control decisions are logged for security analysis, compliance
 *         reporting, and anomaly detection.
 *       properties:
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the access control decision was made
 *           example: "2025-11-29T12:00:00.000Z"
 *         requestId:
 *           type: string
 *           description: Unique identifier for the request
 *           example: "req_abc123def456"
 *         userId:
 *           type: string
 *           description: ID of the user making the request
 *           example: "cmik7w7h700037fm9zv7btfaz"
 *         userType:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *           description: Type of user making the request
 *           example: "ORGANIZATION"
 *         userRole:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, DRIVER, PASSENGER]
 *           description: Role of user making the request
 *           example: "ORGANIZATION"
 *         organizationId:
 *           type: string
 *           nullable: true
 *           description: Organization ID of the user (if applicable)
 *           example: "org_123456789"
 *         requestedEndpoint:
 *           type: string
 *           description: API endpoint that was accessed
 *           example: "GET /api/organizations/org_123456789/drivers"
 *         requestedMethod:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH]
 *           description: HTTP method used
 *           example: "GET"
 *         appContext:
 *           type: string
 *           enum: [web-dashboard, driver-app, passenger-app]
 *           description: Application context used for the request
 *           example: "web-dashboard"
 *         ipAddress:
 *           type: string
 *           description: IP address of the client making the request
 *           example: "192.168.1.100"
 *         userAgent:
 *           type: string
 *           description: User agent string from the request
 *           example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *         accessDecision:
 *           type: string
 *           enum: [GRANTED, DENIED]
 *           description: Whether access was granted or denied
 *           example: "GRANTED"
 *         denialReason:
 *           type: string
 *           nullable: true
 *           enum: [INSUFFICIENT_PERMISSIONS, ORGANIZATION_BOUNDARY_VIOLATION, CONTEXT_MISMATCH, RESOURCE_ACCESS_DENIED, METHOD_NOT_ALLOWED, AUTHENTICATION_FAILED]
 *           description: Reason for access denial (if applicable)
 *           example: null
 *         middlewareResults:
 *           type: array
 *           description: Results from each middleware in the chain
 *           items:
 *             type: object
 *             properties:
 *               middleware:
 *                 type: string
 *                 description: Name of the middleware
 *               result:
 *                 type: string
 *                 enum: [PASS, FAIL]
 *                 description: Whether the middleware check passed or failed
 *               details:
 *                 type: object
 *                 description: Additional details about the middleware result
 *           example:
 *             - middleware: "authenticate"
 *               result: "PASS"
 *               details:
 *                 tokenValid: true
 *                 userFound: true
 *                 accountActive: true
 *             - middleware: "authorizeRole"
 *               result: "PASS"
 *               details:
 *                 requiredRole: "ORGANIZATION"
 *                 userRole: "ORGANIZATION"
 *                 hierarchyCheck: "PASS"
 *             - middleware: "authorizeOrganization"
 *               result: "PASS"
 *               details:
 *                 boundaryRequired: true
 *                 userOrgId: "org_123456789"
 *                 requestedOrgId: "org_123456789"
 *                 boundaryCheck: "PASS"
 *         responseTime:
 *           type: number
 *           description: Time taken to process the access control checks (in milliseconds)
 *           example: 45.2
 *         securityFlags:
 *           type: array
 *           description: Security flags raised during the access control check
 *           items:
 *             type: string
 *           example: []
 *         complianceData:
 *           type: object
 *           description: Additional data required for compliance reporting
 *           properties:
 *             dataClassification:
 *               type: string
 *               enum: [PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED]
 *               description: Classification of data accessed
 *               example: "CONFIDENTIAL"
 *             regulatoryRequirements:
 *               type: array
 *               items:
 *                 type: string
 *               description: Applicable regulatory requirements
 *               example: ["GDPR", "SOX"]
 *             auditTrail:
 *               type: boolean
 *               description: Whether this access requires audit trail
 *               example: true
 *
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtained from login endpoint. Include in Authorization header as "Bearer <token>"
 *     
 *     AppContext:
 *       type: apiKey
 *       in: header
 *       name: X-App-Context
 *       description: Application context header. Required for all authentication endpoints. Valid values are "passenger-app", "driver-app", "web-dashboard"
 */

// Export all schemas for use in route documentation
export const authenticationSchemas = {
  User: 'User',
  AuthResponse: 'AuthResponse',
  LoginRequest: 'LoginRequest',
  RegisterRequest: 'RegisterRequest',
  DriverRegisterRequest: 'DriverRegisterRequest',
  PassengerRegisterRequest: 'PassengerRegisterRequest',
  ChangePasswordRequest: 'ChangePasswordRequest',
  TokenResponse: 'TokenResponse',
  RefreshTokenRequest: 'RefreshTokenRequest',
  LogoutResponse: 'LogoutResponse',
  UserProfile: 'UserProfile',
  Organization: 'Organization',
  HealthResponse: 'HealthResponse',
  ErrorResponse: 'ErrorResponse',
  ValidationErrorDetails: 'ValidationErrorDetails',
  RateLimitErrorDetails: 'RateLimitErrorDetails',
  RoleBasedAccessControl: 'RoleBasedAccessControl',
  UserTypeHierarchy: 'UserTypeHierarchy',
  PermissionMatrix: 'PermissionMatrix',
  AccessControlError: 'AccessControlError',
  RoleTransition: 'RoleTransition',
  ContextValidation: 'ContextValidation',
  AccessControlExample: 'AccessControlExample',
  OrganizationBoundary: 'OrganizationBoundary',
  PermissionEnforcementMechanism: 'PermissionEnforcementMechanism',
  AccessControlAuditLog: 'AccessControlAuditLog'
} as const;

// Export response references for use in route documentation
export const responseReferences = {
  ValidationError: '#/components/responses/ValidationError',
  AuthenticationError: '#/components/responses/AuthenticationError',
  AuthorizationError: '#/components/responses/AuthorizationError',
  ConflictError: '#/components/responses/ConflictError',
  RateLimitError: '#/components/responses/RateLimitError',
  NotFoundError: '#/components/responses/NotFoundError',
  ServerError: '#/components/responses/ServerError'
} as const;

// Export schema references for use in route documentation
export const schemaReferences = {
  User: '#/components/schemas/User',
  AuthResponse: '#/components/schemas/AuthResponse',
  LoginRequest: '#/components/schemas/LoginRequest',
  RegisterRequest: '#/components/schemas/RegisterRequest',
  DriverRegisterRequest: '#/components/schemas/DriverRegisterRequest',
  PassengerRegisterRequest: '#/components/schemas/PassengerRegisterRequest',
  ChangePasswordRequest: '#/components/schemas/ChangePasswordRequest',
  TokenResponse: '#/components/schemas/TokenResponse',
  RefreshTokenRequest: '#/components/schemas/RefreshTokenRequest',
  LogoutResponse: '#/components/schemas/LogoutResponse',
  UserProfile: '#/components/schemas/UserProfile',
  Organization: '#/components/schemas/Organization',
  HealthResponse: '#/components/schemas/HealthResponse',
  ErrorResponse: '#/components/schemas/ErrorResponse',
  RoleBasedAccessControl: '#/components/schemas/RoleBasedAccessControl',
  UserTypeHierarchy: '#/components/schemas/UserTypeHierarchy',
  PermissionMatrix: '#/components/schemas/PermissionMatrix',
  AccessControlError: '#/components/schemas/AccessControlError',
  RoleTransition: '#/components/schemas/RoleTransition',
  ContextValidation: '#/components/schemas/ContextValidation',
  AccessControlExample: '#/components/schemas/AccessControlExample',
  OrganizationBoundary: '#/components/schemas/OrganizationBoundary',
  PermissionEnforcementMechanism: '#/components/schemas/PermissionEnforcementMechanism',
  AccessControlAuditLog: '#/components/schemas/AccessControlAuditLog'
} as const;

// Export security scheme references
export const securitySchemes = {
  BearerAuth: 'BearerAuth',
  AppContext: 'AppContext'
} as const;

// Type definitions for better TypeScript support
export type SchemaReference = typeof schemaReferences[keyof typeof schemaReferences];
export type ResponseReference = typeof responseReferences[keyof typeof responseReferences];
export type SecurityScheme = typeof securitySchemes[keyof typeof securitySchemes];