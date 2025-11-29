import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { createRef } from 'react';
import { RootStackParamList } from '../types';

// Create a ref for the navigation container
export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();

/**
 * Navigation service for programmatic navigation throughout the app
 * Provides methods to navigate without direct access to navigation prop
 */
class NavigationService {
  /**
   * Navigate to a specific screen
   */
  navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName]
  ) {
    if (navigationRef.current?.isReady()) {
      navigationRef.current.navigate(name as any, params);
    }
  }

  /**
   * Go back to the previous screen
   */
  goBack() {
    if (navigationRef.current?.isReady() && navigationRef.current.canGoBack()) {
      navigationRef.current.goBack();
    }
  }

  /**
   * Reset the navigation stack to a specific screen
   * Useful for authentication flows
   */
  reset<RouteName extends keyof RootStackParamList>(
    routeName: RouteName,
    params?: RootStackParamList[RouteName]
  ) {
    if (navigationRef.current?.isReady()) {
      navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routeName as any, params }],
        })
      );
    }
  }

  /**
   * Replace the current screen with a new one
   */
  replace<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params?: RootStackParamList[RouteName]
  ) {
    if (navigationRef.current?.isReady()) {
      navigationRef.current.dispatch({
        ...CommonActions.navigate(name as any, params),
        type: 'REPLACE',
      });
    }
  }

  /**
   * Get the current route name
   */
  getCurrentRoute() {
    if (navigationRef.current?.isReady()) {
      return navigationRef.current.getCurrentRoute()?.name;
    }
    return null;
  }

  /**
   * Check if navigation is ready
   */
  isReady() {
    return navigationRef.current?.isReady() ?? false;
  }

  /**
   * Navigate to Dashboard and reset stack (used after successful login)
   */
  navigateToDashboard() {
    this.reset('Dashboard');
  }

  /**
   * Navigate to Login and reset stack (used for logout)
   */
  navigateToLogin() {
    this.reset('Login');
  }

  /**
   * Navigate to Route Map
   */
  navigateToRouteMap() {
    this.navigate('RouteMap');
  }

  /**
   * Navigate to Incident Report
   */
  navigateToIncidentReport() {
    this.navigate('IncidentReport');
  }

  /**
   * Navigate to Shift Summary
   */
  navigateToShiftSummary() {
    this.navigate('ShiftSummary');
  }

  /**
   * Navigate to Messages
   */
  navigateToMessages() {
    this.navigate('Messages');
  }
}

// Export singleton instance
export const navigationService = new NavigationService();
export default navigationService;