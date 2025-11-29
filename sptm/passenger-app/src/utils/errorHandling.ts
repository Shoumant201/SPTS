// Error handling utility for passenger app

export interface ApiError {
  type?: string;
  message: string;
  code?: number;
  details?: any;
}

export interface ApiErrorResponse {
  error?: ApiError | string;
  message?: string;
  details?: any;
}

/**
 * Parse and format API errors into user-friendly messages
 */
export const parseApiError = (error: any): string => {
  // Handle network errors
  if (!error.response) {
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return 'Network connection failed. Please check your internet connection and try again.';
    }
    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return 'Unable to connect to server. Please check if the backend is running.';
    }
    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  const response = error.response;
  const status = response.status;
  const data = response.data as ApiErrorResponse;

  // Handle specific HTTP status codes
  switch (status) {
    case 400:
      return parseValidationError(data);
    case 401:
      return parseAuthError(data);
    case 403:
      return parseForbiddenError(data);
    case 404:
      return parseNotFoundError(data);
    case 409:
      return parseConflictError(data);
    case 422:
      return parseValidationError(data);
    case 429:
      return parseRateLimitError(data);
    case 500:
      return parseServerError(data);
    default:
      return data?.error?.message || data?.message || `Server error (${status}). Please try again.`;
  }
};

/**
 * Parse validation errors (400, 422)
 */
const parseValidationError = (data: ApiErrorResponse): string => {
  // Handle structured error object
  if (data.error && typeof data.error === 'object') {
    const error = data.error;
    
    switch (error.type) {
      case 'WEAK_PASSWORD':
        return 'Password is too weak. Please use at least 8 characters with uppercase, lowercase, numbers, and special characters.';
      case 'INVALID_EMAIL':
        return 'Please enter a valid email address.';
      case 'MISSING_REQUIRED_FIELD':
        return `${error.details?.field || 'Required field'} is missing. Please fill in all required fields.`;
      case 'INVALID_PHONE':
        return 'Please enter a valid phone number.';
      case 'PASSWORD_MISMATCH':
        return 'Passwords do not match. Please check and try again.';
      default:
        return error.message || 'Please check your input and try again.';
    }
  }

  // Handle simple error string
  if (typeof data.error === 'string') {
    // Common backend error messages and their user-friendly versions
    if (data.error.includes('User already exists') || data.error.includes('email already')) {
      return 'This email address is already registered. Please use a different email or try logging in instead.';
    }
    if (data.error.includes('Validation error')) {
      return 'Please check your input and ensure all required fields are filled correctly.';
    }
    if (data.error.includes('Invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (data.error.includes('Password')) {
      return 'Password does not meet requirements. Please use at least 8 characters with uppercase, lowercase, numbers, and special characters.';
    }
    return data.error;
  }

  // Handle validation details array
  if (data.details && Array.isArray(data.details)) {
    return data.details.join('. ') + '.';
  }

  return data.message || 'Please check your input and try again.';
};

/**
 * Parse authentication errors (401)
 */
const parseAuthError = (data: ApiErrorResponse): string => {
  if (data.error && typeof data.error === 'object') {
    const error = data.error;
    
    switch (error.type) {
      case 'INVALID_CREDENTIALS':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'ACCOUNT_LOCKED':
        return 'Your account is temporarily locked due to multiple failed attempts. Please try again later.';
      case 'ACCOUNT_INACTIVE':
        return 'Your account is inactive. Please contact support for assistance.';
      case 'EMAIL_NOT_VERIFIED':
        return 'Please verify your email address before logging in.';
      case 'TOKEN_EXPIRED':
        return 'Your session has expired. Please log in again.';
      case 'INVALID_TOKEN':
        return 'Invalid session. Please log in again.';
      default:
        return error.message || 'Authentication failed. Please log in again.';
    }
  }

  if (typeof data.error === 'string') {
    if (data.error.includes('Invalid credentials') || data.error.includes('Unauthorized')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    return data.error;
  }

  return 'Authentication failed. Please log in again.';
};

/**
 * Parse forbidden errors (403)
 */
const parseForbiddenError = (data: ApiErrorResponse): string => {
  if (data.error && typeof data.error === 'object') {
    const error = data.error;
    
    switch (error.type) {
      case 'CONTEXT_MISMATCH':
        return 'This account cannot be used with the passenger app. Please use the driver app or contact support.';
      case 'INSUFFICIENT_PERMISSIONS':
        return 'You do not have permission to perform this action.';
      case 'ROLE_MISMATCH':
        return 'Your account role does not match the passenger app. Please contact support.';
      default:
        return error.message || 'Access denied. You do not have permission to perform this action.';
    }
  }

  return 'Access denied. You do not have permission to perform this action.';
};

/**
 * Parse not found errors (404)
 */
const parseNotFoundError = (data: ApiErrorResponse): string => {
  if (data.error && typeof data.error === 'object') {
    return data.error.message || 'The requested resource was not found.';
  }
  
  if (typeof data.error === 'string') {
    if (data.error.includes('User not found')) {
      return 'Account not found. Please check your email address or register for a new account.';
    }
    if (data.error.includes('Route not found')) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    return data.error;
  }

  return 'The requested resource was not found.';
};

/**
 * Parse conflict errors (409)
 */
const parseConflictError = (data: ApiErrorResponse): string => {
  if (data.error && typeof data.error === 'object') {
    const error = data.error;
    
    switch (error.type) {
      case 'EMAIL_ALREADY_EXISTS':
        return 'This email address is already registered. Please use a different email or try logging in instead.';
      case 'DUPLICATE_ENTRY':
        return 'This information is already in use. Please try with different details.';
      default:
        return error.message || 'Conflict detected. Please check your information and try again.';
    }
  }

  if (typeof data.error === 'string') {
    if (data.error.includes('already exists') || data.error.includes('duplicate')) {
      return 'This information is already in use. Please try with different details.';
    }
    return data.error;
  }

  return 'Conflict detected. Please check your information and try again.';
};

/**
 * Parse rate limit errors (429)
 */
const parseRateLimitError = (data: ApiErrorResponse): string => {
  if (data.error && typeof data.error === 'object') {
    const error = data.error;
    
    if (error.type === 'RATE_LIMIT_EXCEEDED') {
      const retryAfter = error.details?.retryAfter;
      if (retryAfter) {
        const minutes = Math.ceil(retryAfter / 60);
        return `Too many attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`;
      }
      return 'Too many attempts. Please wait a few minutes before trying again.';
    }
    
    return error.message || 'Too many requests. Please wait a moment before trying again.';
  }

  return 'Too many requests. Please wait a moment before trying again.';
};

/**
 * Parse server errors (500)
 */
const parseServerError = (data: ApiErrorResponse): string => {
  if (data.error && typeof data.error === 'object') {
    return 'Server error occurred. Please try again later or contact support if the problem persists.';
  }

  return 'Server error occurred. Please try again later.';
};

/**
 * Get user-friendly error message for specific contexts
 */
export const getContextualErrorMessage = (error: any, context: 'login' | 'register' | 'profile' | 'general' = 'general'): string => {
  const baseMessage = parseApiError(error);

  // Add context-specific guidance for passenger app
  switch (context) {
    case 'login':
      if (baseMessage.includes('Invalid email or password')) {
        return baseMessage + ' If you forgot your password, please contact support.';
      }
      if (baseMessage.includes('driver app')) {
        return 'This account is for drivers only. Please use the driver app or register as a passenger.';
      }
      break;
    case 'register':
      if (baseMessage.includes('email address is already registered')) {
        return baseMessage + ' You can try logging in instead.';
      }
      if (baseMessage.includes('Password is too weak')) {
        return baseMessage + ' Example: MyPassword123!';
      }
      break;
    case 'profile':
      if (baseMessage.includes('Authentication failed')) {
        return 'Your session has expired. Please log in again to continue.';
      }
      break;
  }

  return baseMessage;
};