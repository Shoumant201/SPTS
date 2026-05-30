import { StackNavigationOptions } from '@react-navigation/stack';
import { TransitionPresets } from '@react-navigation/stack';

/**
 * Custom screen transition animations optimized for driver use
 * Focuses on smooth, predictable transitions that don't distract from driving
 */

// Fast and smooth slide transition for quick navigation
export const slideTransition: StackNavigationOptions = {
  ...TransitionPresets.SlideFromRightIOS,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 250, // Faster than default for quick access
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 200, // Even faster close for immediate response
      },
    },
  },
};

// Fade transition for modal-like screens (incident reporting, messages)
export const fadeTransition: StackNavigationOptions = {
  ...TransitionPresets.FadeFromBottomAndroid,
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 200,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 150,
      },
    },
  },
};

// No animation for critical screens (dashboard after login)
export const noTransition: StackNavigationOptions = {
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 0,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 0,
      },
    },
  },
};

// Bottom sheet style transition for quick actions
export const bottomSheetTransition: StackNavigationOptions = {
  ...TransitionPresets.ModalSlideFromBottomIOS,
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 200,
      },
    },
  },
};

/**
 * Get appropriate transition based on screen type and context
 */
export const getTransitionForScreen = (
  screenName: string,
  context?: 'modal' | 'main' | 'critical'
): StackNavigationOptions => {
  // Critical screens (login to dashboard) - no animation for immediate response
  if (context === 'critical' || screenName === 'Dashboard') {
    return noTransition;
  }

  // Modal-like screens - fade transition
  if (context === 'modal' || screenName === 'IncidentReport' || screenName === 'Messages') {
    return fadeTransition;
  }

  // Main navigation screens - slide transition
  return slideTransition;
};

/**
 * Animation presets for different use cases
 */
export const animationPresets = {
  // For main navigation between primary screens
  main: slideTransition,
  
  // For modal or overlay screens
  modal: fadeTransition,
  
  // For critical navigation (login success)
  critical: noTransition,
  
  // For quick action screens
  quickAction: bottomSheetTransition,
} as const;

export default animationPresets;