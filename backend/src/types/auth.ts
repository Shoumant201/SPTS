export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ORGANIZATION_BOUNDARY_VIOLATION = 'ORGANIZATION_BOUNDARY_VIOLATION',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  CONTEXT_MISMATCH = 'CONTEXT_MISMATCH',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED'
}

export interface AuthErrorResponse {
  error: {
    type: AuthErrorType;
    message: string;
    code: number;
    details?: any;
  };
  timestamp: string;
  path: string;
}

export interface SecurityLogEntry {
  timestamp: Date;
  userType: string;
  email?: string;
  ipAddress: string;
  userAgent: string;
  action: string;
  success: boolean;
  errorType?: AuthErrorType;
  additionalData?: any;
}

export interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs: number;
}

export interface AccountLockoutConfig {
  maxFailedAttempts: number;
  lockoutDurationMs: number;
  resetTimeMs: number;
}