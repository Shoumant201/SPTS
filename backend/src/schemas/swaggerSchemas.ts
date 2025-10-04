/**
 * Individual Swagger Schema Definitions
 * 
 * This file contains individual JSDoc comments for each schema to ensure
 * swagger-jsdoc can parse them all correctly.
 */

/**
 * @swagger
 * components:
 *   schemas:
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
 *           pattern: "^[a-zA-Z0-9]{25}$"
 *           description: Unique user identifier (25 character alphanumeric string)
 *           example: "cmik7w7h700037fm9zv7btfaz"
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 255
 *           description: User email address (valid email format, max 255 characters)
 *           example: "user@example.com"
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
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
 *           pattern: "^org_[a-zA-Z0-9]{9}$"
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
 *               pattern: "^[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+$"
 *               description: JWT access token (valid for 15 minutes)
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWlrN3c3aDcwMDAzN2ZtOXp2N2J0ZmF6IiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6IkRSSVZFUiIsInVzZXJUeXBlIjoiVVNFUiIsImlhdCI6MTczMjg3NjgwMCwiZXhwIjoxNzMyODc3NzAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
 *             refreshToken:
 *               type: string
 *               pattern: "^[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+\\.[A-Za-z0-9\\-_]+$"
 *               description: JWT refresh token (valid for 7 days)
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
 *           description: User email address (valid email format, max 255 characters)
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 1
 *           maxLength: 128
 *           description: User password (1-128 characters)
 *           example: "Password123!"
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
 *                     - $ref: '#/components/schemas/AccountLockoutDetails'
 *                     - $ref: '#/components/schemas/SecurityViolationDetails'
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
 *         userType:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *           description: User type that determines rate limit policy
 *           example: "USER"
 *         windowMs:
 *           type: integer
 *           description: Rate limit window duration in milliseconds
 *           example: 900000
 *         endpoint:
 *           type: string
 *           description: Specific endpoint that was rate limited
 *           example: "login"
 *         blockDuration:
 *           type: integer
 *           description: Duration of rate limit block in seconds
 *           example: 600
 *
 *     AccountLockoutDetails:
 *       type: object
 *       description: Details about account lockout status and configuration
 *       required:
 *         - lockedUntil
 *         - lockoutDuration
 *         - failedAttempts
 *         - maxFailedAttempts
 *         - userType
 *         - resetTime
 *       properties:
 *         lockedUntil:
 *           type: string
 *           format: date-time
 *           description: ISO timestamp when the account lockout expires
 *           example: "2025-11-29T12:30:00.000Z"
 *         lockoutDuration:
 *           type: integer
 *           description: Duration of the lockout in seconds
 *           example: 1800
 *         failedAttempts:
 *           type: integer
 *           description: Number of failed attempts that triggered the lockout
 *           example: 5
 *         maxFailedAttempts:
 *           type: integer
 *           description: Maximum allowed failed attempts before lockout
 *           example: 5
 *         userType:
 *           type: string
 *           enum: [SUPER_ADMIN, ADMIN, ORGANIZATION, USER]
 *           description: User type that determines lockout policy
 *           example: "USER"
 *         resetTime:
 *           type: string
 *           format: date-time
 *           description: When failed attempt counter resets
 *           example: "2025-11-29T14:00:00.000Z"
 *         notificationSent:
 *           type: boolean
 *           description: Whether security notification was sent
 *           example: true
 *         unlockMethod:
 *           type: string
 *           enum: [automatic, admin_unlock, password_reset]
 *           description: How the account can be unlocked
 *           example: "automatic"
 *
 *     SecurityViolationDetails:
 *       type: object
 *       description: Details about security violations and suspicious activity
 *       properties:
 *         violationType:
 *           type: string
 *           enum: [CONTEXT_MISMATCH, IP_SUSPICIOUS, MULTIPLE_LOCATIONS, RAPID_REQUESTS, PATTERN_ANOMALY]
 *           description: Type of security violation detected
 *           example: "CONTEXT_MISMATCH"
 *         severity:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           description: Severity level of the security violation
 *           example: "HIGH"
 *         detectionTime:
 *           type: string
 *           format: date-time
 *           description: When the violation was detected
 *           example: "2025-11-29T12:00:00.000Z"
 *         ipAddress:
 *           type: string
 *           description: IP address associated with the violation
 *           example: "192.168.1.100"
 *         userAgent:
 *           type: string
 *           description: User agent string from the request
 *           example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *         actionTaken:
 *           type: string
 *           enum: [LOGGED, IP_BLOCKED, ACCOUNT_LOCKED, ADMIN_NOTIFIED, INVESTIGATION_TRIGGERED]
 *           description: Action taken in response to the violation
 *           example: "IP_BLOCKED"
 *         investigationId:
 *           type: string
 *           description: ID for tracking security investigation
 *           example: "SEC-2025-1129-001"
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
 *
 *     RateLimitError:
 *       description: Rate limit exceeded - Too many requests
 *       headers:
 *         X-RateLimit-Limit:
 *           description: Maximum requests allowed in the time window
 *           schema:
 *             type: integer
 *           example: 5
 *         X-RateLimit-Remaining:
 *           description: Number of requests remaining in current window
 *           schema:
 *             type: integer
 *           example: 0
 *         X-RateLimit-Reset:
 *           description: Unix timestamp when the rate limit window resets
 *           schema:
 *             type: integer
 *           example: 1732877700
 *         Retry-After:
 *           description: Seconds to wait before making another request
 *           schema:
 *             type: integer
 *           example: 300
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           examples:
 *             rateLimitExceeded:
 *               summary: Standard rate limit exceeded
 *               value:
 *                 error:
 *                   type: "RATE_LIMIT_EXCEEDED"
 *                   message: "Too many requests. Please try again later."
 *                   code: 429
 *                   details:
 *                     retryAfter: 300
 *                     limit: 5
 *                     remaining: 0
 *                     resetTime: "2025-11-29T12:05:00.000Z"
 *                     userType: "USER"
 *                     windowMs: 900000
 *                     endpoint: "login"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/login"
 *             superAdminRateLimit:
 *               summary: Super admin rate limit exceeded
 *               value:
 *                 error:
 *                   type: "RATE_LIMIT_EXCEEDED"
 *                   message: "Too many requests. Please try again later."
 *                   code: 429
 *                   details:
 *                     retryAfter: 1800
 *                     limit: 10
 *                     remaining: 0
 *                     resetTime: "2025-11-29T12:30:00.000Z"
 *                     userType: "SUPER_ADMIN"
 *                     windowMs: 900000
 *                     blockDuration: 1800
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/web/super-admin/login"
 *
 *     SecurityError:
 *       description: Security-related errors including account lockout and security violations
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           examples:
 *             accountLocked:
 *               summary: Account locked due to failed attempts
 *               value:
 *                 error:
 *                   type: "ACCOUNT_LOCKED"
 *                   message: "Account is temporarily locked due to multiple failed login attempts"
 *                   code: 423
 *                   details:
 *                     lockedUntil: "2025-11-29T12:30:00.000Z"
 *                     lockoutDuration: 1800
 *                     failedAttempts: 5
 *                     maxFailedAttempts: 5
 *                     userType: "USER"
 *                     resetTime: "2025-11-29T14:00:00.000Z"
 *                     unlockMethod: "automatic"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/login"
 *             contextSecurityViolation:
 *               summary: Context security violation
 *               value:
 *                 error:
 *                   type: "CONTEXT_SECURITY_VIOLATION"
 *                   message: "Request context does not match user authorization"
 *                   code: 401
 *                   details:
 *                     userRole: "DRIVER"
 *                     requestContext: "web-dashboard"
 *                     allowedContexts: ["driver-app"]
 *                     violationType: "CONTEXT_MISMATCH"
 *                     severity: "HIGH"
 *                     actionTaken: "LOGGED"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/web/admin/login"
 *             ipBlocked:
 *               summary: IP address blocked due to security
 *               value:
 *                 error:
 *                   type: "IP_BLOCKED"
 *                   message: "IP address has been temporarily blocked due to suspicious activity"
 *                   code: 423
 *                   details:
 *                     ipAddress: "192.168.1.100"
 *                     blockedUntil: "2025-11-29T13:00:00.000Z"
 *                     reason: "Multiple failed authentication attempts"
 *                     blockDuration: 3600
 *                     violationType: "RAPID_REQUESTS"
 *                     severity: "MEDIUM"
 *                     actionTaken: "IP_BLOCKED"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/login"
 *
 *     ServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           examples:
 *             internalError:
 *               summary: Generic internal server error
 *               value:
 *                 error: "Internal server error"
 *                 timestamp: "2025-11-29T12:00:00.000Z"
 *                 path: "/api/auth/login"
 */

// Export response references for use in route documentation
export const SWAGGER_RESPONSES = {
    ValidationError: '#/components/responses/ValidationError',
    AuthenticationError: '#/components/responses/AuthenticationError',
    RateLimitError: '#/components/responses/RateLimitError',
    SecurityError: '#/components/responses/SecurityError',
    ServerError: '#/components/responses/ServerError'
} as const;

// Export schema references for use in route documentation
export const SWAGGER_SCHEMAS = {
    User: '#/components/schemas/User',
    AuthResponse: '#/components/schemas/AuthResponse',
    LoginRequest: '#/components/schemas/LoginRequest',
    ErrorResponse: '#/components/schemas/ErrorResponse',
    ValidationErrorDetails: '#/components/schemas/ValidationErrorDetails',
    RateLimitErrorDetails: '#/components/schemas/RateLimitErrorDetails',
    AccountLockoutDetails: '#/components/schemas/AccountLockoutDetails',
    SecurityViolationDetails: '#/components/schemas/SecurityViolationDetails'
} as const;