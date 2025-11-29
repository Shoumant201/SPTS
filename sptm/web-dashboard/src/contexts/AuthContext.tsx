'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserType, authApi } from '../services/api/auth';
import { TokenStorageService } from '../services/tokenStorage';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && TokenStorageService.isAuthenticated();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    
    try {
      const storedUser = TokenStorageService.getUser();
      const accessToken = TokenStorageService.getAccessToken();
      
      if (!storedUser || !accessToken) {
        setUser(null);
        return;
      }

      // Check if token is expired and try to refresh
      if (TokenStorageService.isTokenExpired()) {
        await refreshAuth();
        return;
      }

      // Verify token with backend
      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (error) {
        console.error('Token verification failed:', error);
        // Try to refresh token
        await refreshAuth();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      TokenStorageService.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, userType: UserType) => {
    setIsLoading(true);
    
    try {
      const response = await authApi.login({ email, password, userType });
      
      // Handle both new and legacy response formats
      const tokens = response.tokens || {
        accessToken: response.token!,
        refreshToken: response.refreshToken!
      };
      
      TokenStorageService.storeTokens(tokens, response.user);
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      const userType = TokenStorageService.getUserType();
      await authApi.logout(userType);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      TokenStorageService.clearTokens();
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const refreshToken = TokenStorageService.getRefreshToken();
      const userType = TokenStorageService.getUserType();
      
      if (!refreshToken || !userType) {
        throw new Error('No refresh token or user type available');
      }

      const response = await authApi.refreshToken(refreshToken, userType);
      const storedUser = TokenStorageService.getUser();
      
      if (!storedUser) {
        throw new Error('No stored user data');
      }

      TokenStorageService.storeTokens(response.tokens, storedUser);
      setUser(storedUser);
    } catch (error) {
      console.error('Token refresh failed:', error);
      TokenStorageService.clearTokens();
      setUser(null);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};