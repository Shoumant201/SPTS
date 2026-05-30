// Form validation utilities

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate a single field value against rules
 */
export const validateField = (value: string, rules: ValidationRule): ValidationResult => {
  // Required validation
  if (rules.required && (!value || value.trim().length === 0)) {
    return {
      isValid: false,
      error: 'This field is required',
    };
  }

  // Skip other validations if field is empty and not required
  if (!value || value.trim().length === 0) {
    return { isValid: true };
  }

  const trimmedValue = value.trim();

  // Minimum length validation
  if (rules.minLength && trimmedValue.length < rules.minLength) {
    return {
      isValid: false,
      error: `Must be at least ${rules.minLength} characters`,
    };
  }

  // Maximum length validation
  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    return {
      isValid: false,
      error: `Must be no more than ${rules.maxLength} characters`,
    };
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    return {
      isValid: false,
      error: 'Invalid format',
    };
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(trimmedValue);
    if (customError) {
      return {
        isValid: false,
        error: customError,
      };
    }
  }

  return { isValid: true };
};

/**
 * Validate multiple fields at once
 */
export const validateForm = (
  data: Record<string, string>,
  rules: Record<string, ValidationRule>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach(fieldName => {
    const value = data[fieldName] || '';
    const fieldRules = rules[fieldName];
    const result = validateField(value, fieldRules);

    if (!result.isValid && result.error) {
      errors[fieldName] = result.error;
    }
  });

  return errors;
};

// Common validation rules
export const commonRules = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
  } as ValidationRule,

  password: {
    required: true,
    minLength: 6,
    maxLength: 128,
  } as ValidationRule,

  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value.length > 254) {
        return 'Email address is too long';
      }
      return null;
    },
  } as ValidationRule,

  employeeId: {
    required: true,
    pattern: /^[A-Z0-9]+$/,
    minLength: 3,
    maxLength: 20,
  } as ValidationRule,

  phoneNumber: {
    pattern: /^\+?[\d\s\-\(\)]+$/,
    minLength: 10,
    maxLength: 20,
  } as ValidationRule,
};

/**
 * Real-time validation for login form
 */
export const validateLoginForm = (username: string, password: string) => {
  return validateForm(
    { username, password },
    {
      username: {
        required: true,
        minLength: 3,
        custom: (value: string) => {
          if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            return 'Username can only contain letters, numbers, underscores, and hyphens';
          }
          return null;
        },
      },
      password: {
        required: true,
        minLength: 6,
      },
    }
  );
};

/**
 * Check password strength
 */
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include special characters');
  }

  return { score, feedback };
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate and format employee ID
 */
export const validateEmployeeId = (employeeId: string): ValidationResult => {
  const trimmed = employeeId.trim().toUpperCase();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Employee ID is required',
    };
  }

  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Employee ID can only contain letters and numbers',
    };
  }

  if (trimmed.length < 3 || trimmed.length > 20) {
    return {
      isValid: false,
      error: 'Employee ID must be between 3 and 20 characters',
    };
  }

  return { isValid: true };
};

export default {
  validateField,
  validateForm,
  validateLoginForm,
  checkPasswordStrength,
  sanitizeInput,
  validateEmployeeId,
  commonRules,
};