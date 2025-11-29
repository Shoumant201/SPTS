// Theme configuration with dark colors and accessibility standards

export const colors = {
  // Primary brand colors
  primary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981', // Primary green for start/positive actions
    600: '#059669',
    700: '#047857',
    900: '#064E3B',
  },
  
  // Danger/Stop colors
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444', // Red for stop/negative actions
    600: '#DC2626',
    700: '#B91C1C',
    900: '#7F1D1D',
  },
  
  // Warning colors
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B', // Orange for warnings/incidents
    600: '#D97706',
    700: '#B45309',
    900: '#78350F',
  },
  
  // Gray scale for dark theme
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280', // Secondary button color
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937', // Card backgrounds
    900: '#111827', // Main dark background
    950: '#030712', // Deepest dark
  },
  
  // Semantic colors
  background: {
    primary: '#111827', // Main app background
    secondary: '#1F2937', // Card/component backgrounds
    tertiary: '#374151', // Elevated surfaces
  },
  
  text: {
    primary: '#FFFFFF', // Primary text on dark backgrounds
    secondary: '#E5E7EB', // Secondary text
    tertiary: '#9CA3AF', // Tertiary/disabled text
    inverse: '#111827', // Text on light backgrounds
  },
  
  border: {
    primary: '#374151',
    secondary: '#4B5563',
    focus: '#10B981', // Focus indicator color
  },
  
  // Status colors
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
};

export const typography = {
  // Font families (fallback to system fonts)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  
  // Font sizes following accessibility guidelines
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16, // Base font size for accessibility
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Line heights for readability
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12, // Standard button border radius
  lg: 16,
  xl: 24,
  full: 9999,
};

// Accessibility standards
export const accessibility = {
  // Minimum touch target sizes (iOS: 44pt, Android: 48dp)
  minTouchTarget: {
    width: 48,
    height: 48,
  },
  
  // Large touch targets for driver app
  largeTouchTarget: {
    width: 60,
    height: 60,
  },
  
  // Color contrast ratios (WCAG AA compliance)
  contrastRatios: {
    normal: 4.5, // Normal text
    large: 3.0,  // Large text (18pt+ or 14pt+ bold)
  },
  
  // Focus indicators
  focusIndicator: {
    width: 2,
    color: colors.border.focus,
    offset: 2,
  },
};

// Component-specific theme values
export const components = {
  button: {
    // Button heights
    height: {
      medium: accessibility.minTouchTarget.height,
      large: accessibility.largeTouchTarget.height,
    },
    
    // Button padding
    padding: {
      horizontal: spacing[6],
      vertical: spacing[3],
    },
    
    // Button border radius
    borderRadius: borderRadius.md,
    
    // Button typography
    typography: {
      medium: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.bold,
      },
      large: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
      },
    },
  },
  
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  
  input: {
    height: 56, // Large input fields for driver app
    borderRadius: borderRadius.md,
    padding: spacing[4],
    fontSize: typography.fontSize.base,
    borderWidth: 2,
  },
};

// Export default theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  accessibility,
  components,
};

export default theme;