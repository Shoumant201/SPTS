import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { navigationService } from '../services/navigationService';

/**
 * Hook to guard authenticated routes
 * Redirects to login if user is not authenticated
 */
export const useAuthGuard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const isLoggedIn = await authService.isAuthenticated();
      setIsAuthenticated(isLoggedIn);
      
      // If not authenticated and navigation is ready, redirect to login
      if (!isLoggedIn && navigationService.isReady()) {
        const currentRoute = navigationService.getCurrentRoute();
        // Only redirect if not already on login screen
        if (currentRoute !== 'Login') {
          navigationService.navigateToLogin();
        }
      }
    } catch (error) {
      console.error('Auth guard error:', error);
      setIsAuthenticated(false);
      // On error, assume not authenticated and redirect to login
      if (navigationService.isReady()) {
        navigationService.navigateToLogin();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuthStatus = () => {
    checkAuthStatus();
  };

  return {
    isAuthenticated,
    isLoading,
    refreshAuthStatus,
  };
};

/**
 * Hook specifically for protecting screens that require authentication
 * Returns loading state while checking authentication
 */
export const useProtectedScreen = () => {
  const { isAuthenticated, isLoading } = useAuthGuard();

  // If not authenticated, the useAuthGuard will handle redirection
  // This hook just provides the loading state for protected screens
  return {
    isAuthenticated,
    isLoading,
    shouldShowContent: isAuthenticated === true,
  };
};

export default useAuthGuard;