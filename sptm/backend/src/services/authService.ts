import { UserRole } from '@prisma/client';
import { comparePassword } from '../utils/password';
import { generateTokens, validateTokenWithUserType, revokeRefreshToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { SecurityService } from './securityService';
import { AuthErrorType } from '../types/auth';

// Types and interfaces
export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  userType: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'USER';
  organizationId?: string;
  permissions?: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    userType: 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION' | 'USER';
    organizationId?: string;
  };
  tokens?: TokenPair;
  error?: string;
}

export interface AuthService {
  // Authentication methods
  authenticateSuperAdmin(email: string, password: string): Promise<AuthResult>;
  authenticateAdmin(email: string, password: string): Promise<AuthResult>;
  authenticateOrganization(email: string, password: string): Promise<AuthResult>;
  authenticateUser(email: string, password: string, role: UserRole): Promise<AuthResult>;
  
  // Token management
  generateTokens(payload: TokenPayload): TokenPair;
  refreshTokens(refreshToken: string): Promise<TokenPair>;
  revokeTokens(userId: string, userType: string): Promise<void>;
  
  // Authorization
  validateAccess(token: string, requiredRole: string, organizationId?: string): Promise<boolean>;
}

export class AuthServiceImpl implements AuthService {
  
  /**
   * Generate JWT tokens for authenticated user
   */
  generateTokens(payload: TokenPayload): TokenPair {
    return generateTokens({
      id: payload.id,
      email: payload.email,
      role: payload.role,
      userType: payload.userType,
      organizationId: payload.organizationId
    });
  }

  /**
   * Base authentication logic with password validation
   */
  private async validateCredentials(email: string, password: string, hashedPassword: string): Promise<boolean> {
    if (!email || !password) {
      return false;
    }
    
    return await comparePassword(password, hashedPassword);
  }

  /**
   * Update last login timestamp and refresh token
   */
  private async updateLoginInfo(table: string, id: string, refreshToken: string): Promise<void> {
    const updateData = {
      lastLoginAt: new Date(),
      refreshToken: refreshToken
    };

    switch (table) {
      case 'super_admins':
        await prisma.superAdmin.update({
          where: { id },
          data: updateData
        });
        break;
      case 'admins':
        await prisma.admin.update({
          where: { id },
          data: updateData
        });
        break;
      case 'organizations':
        await prisma.organization.update({
          where: { id },
          data: updateData
        });
        break;
      case 'users':
        await prisma.user.update({
          where: { id },
          data: updateData
        });
        break;
    }
  }

  /**
   * Authenticate Super Admin
   */
  async authenticateSuperAdmin(email: string, password: string): Promise<AuthResult> {
    try {
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!superAdmin) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check account lockout
      const lockoutCheck = SecurityService.checkAccountLockout('SUPER_ADMIN', superAdmin.id);
      if (lockoutCheck.locked) {
        return {
          success: false,
          error: 'Account is temporarily locked due to multiple failed login attempts'
        };
      }

      if (!superAdmin.isActive) {
        return {
          success: false,
          error: 'Account is inactive'
        };
      }

      const isValidPassword = await this.validateCredentials(email, password, superAdmin.password);
      if (!isValidPassword) {
        // Record failed attempt
        SecurityService.recordFailedAttempt('SUPER_ADMIN', superAdmin.id);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Record successful attempt (resets failed attempts)
      SecurityService.recordSuccessfulAttempt('SUPER_ADMIN', superAdmin.id);

      const tokenPayload: TokenPayload = {
        id: superAdmin.id,
        email: superAdmin.email,
        role: 'SUPER_ADMIN',
        userType: 'SUPER_ADMIN'
      };

      const tokens = this.generateTokens(tokenPayload);
      
      // Update login info
      await this.updateLoginInfo('super_admins', superAdmin.id, tokens.refreshToken);

      return {
        success: true,
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: 'SUPER_ADMIN',
          userType: 'SUPER_ADMIN'
        },
        tokens
      };
    } catch (error) {
      console.error('Super Admin authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Authenticate Admin
   */
  async authenticateAdmin(email: string, password: string): Promise<AuthResult> {
    try {
      const admin = await prisma.admin.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!admin) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check account lockout
      const lockoutCheck = SecurityService.checkAccountLockout('ADMIN', admin.id);
      if (lockoutCheck.locked) {
        return {
          success: false,
          error: 'Account is temporarily locked due to multiple failed login attempts'
        };
      }

      if (!admin.isActive) {
        return {
          success: false,
          error: 'Account is inactive'
        };
      }

      const isValidPassword = await this.validateCredentials(email, password, admin.password);
      if (!isValidPassword) {
        // Record failed attempt
        SecurityService.recordFailedAttempt('ADMIN', admin.id);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Record successful attempt (resets failed attempts)
      SecurityService.recordSuccessfulAttempt('ADMIN', admin.id);

      const tokenPayload: TokenPayload = {
        id: admin.id,
        email: admin.email,
        role: 'ADMIN',
        userType: 'ADMIN'
      };

      const tokens = this.generateTokens(tokenPayload);
      
      // Update login info
      await this.updateLoginInfo('admins', admin.id, tokens.refreshToken);

      return {
        success: true,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'ADMIN',
          userType: 'ADMIN'
        },
        tokens
      };
    } catch (error) {
      console.error('Admin authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Authenticate Organization
   */
  async authenticateOrganization(email: string, password: string): Promise<AuthResult> {
    try {
      const organization = await prisma.organization.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!organization) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check account lockout
      const lockoutCheck = SecurityService.checkAccountLockout('ORGANIZATION', organization.id);
      if (lockoutCheck.locked) {
        return {
          success: false,
          error: 'Account is temporarily locked due to multiple failed login attempts'
        };
      }

      if (!organization.isActive) {
        return {
          success: false,
          error: 'Account is inactive'
        };
      }

      const isValidPassword = await this.validateCredentials(email, password, organization.password);
      if (!isValidPassword) {
        // Record failed attempt
        SecurityService.recordFailedAttempt('ORGANIZATION', organization.id);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Record successful attempt (resets failed attempts)
      SecurityService.recordSuccessfulAttempt('ORGANIZATION', organization.id);

      const tokenPayload: TokenPayload = {
        id: organization.id,
        email: organization.email,
        role: 'ORGANIZATION',
        userType: 'ORGANIZATION',
        organizationId: organization.id
      };

      const tokens = this.generateTokens(tokenPayload);
      
      // Update login info
      await this.updateLoginInfo('organizations', organization.id, tokens.refreshToken);

      return {
        success: true,
        user: {
          id: organization.id,
          email: organization.email,
          name: organization.name,
          role: 'ORGANIZATION',
          userType: 'ORGANIZATION',
          organizationId: organization.id
        },
        tokens
      };
    } catch (error) {
      console.error('Organization authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Authenticate User (Driver or Passenger)
   */
  async authenticateUser(email: string, password: string, role: UserRole): Promise<AuthResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          organization: true
        }
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check account lockout
      const lockoutCheck = SecurityService.checkAccountLockout('USER', user.id);
      if (lockoutCheck.locked) {
        return {
          success: false,
          error: 'Account is temporarily locked due to multiple failed login attempts'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is inactive'
        };
      }

      // Validate role matches requested role
      if (user.role !== role) {
        return {
          success: false,
          error: 'Invalid role for this user'
        };
      }

      // For drivers, ensure they have an organization
      if (role === 'DRIVER' && !user.organizationId) {
        return {
          success: false,
          error: 'Driver must be assigned to an organization'
        };
      }

      const isValidPassword = await this.validateCredentials(email, password, user.password);
      if (!isValidPassword) {
        // Record failed attempt
        SecurityService.recordFailedAttempt('USER', user.id);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Record successful attempt (resets failed attempts)
      SecurityService.recordSuccessfulAttempt('USER', user.id);

      const tokenPayload: TokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        userType: 'USER',
        organizationId: user.organizationId || undefined
      };

      const tokens = this.generateTokens(tokenPayload);
      
      // Update login info
      await this.updateLoginInfo('users', user.id, tokens.refreshToken);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
          userType: 'USER',
          organizationId: user.organizationId || undefined
        },
        tokens
      };
    } catch (error) {
      console.error('User authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * Refresh tokens using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const { refreshTokens } = await import('../utils/jwt');
    return await refreshTokens(refreshToken);
  }

  /**
   * Revoke tokens for a user
   */
  async revokeTokens(userId: string, userType: string): Promise<void> {
    try {
      await revokeRefreshToken(userId, userType);
    } catch (error) {
      console.error('Token revocation error:', error);
      throw new Error('Failed to revoke tokens');
    }
  }

  /**
   * Validate access permissions
   */
  async validateAccess(token: string, requiredRole: string, organizationId?: string): Promise<boolean> {
    try {
      const decoded = await validateTokenWithUserType(token);
      
      // Check role hierarchy
      const userHierarchy = decoded.hierarchy || 0;
      const requiredHierarchy = this.getRoleHierarchy(requiredRole);
      
      if (userHierarchy < requiredHierarchy) {
        return false;
      }

      // Check organization boundary if required
      if (organizationId && decoded.userType === 'ORGANIZATION') {
        return decoded.organizationId === organizationId;
      }

      // Check if user has required permissions
      if (decoded.permissions?.includes('*')) {
        return true; // Super admin has all permissions
      }

      return decoded.permissions?.some(permission => 
        this.hasPermission(permission, requiredRole)
      ) || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get role hierarchy level
   */
  private getRoleHierarchy(role: string): number {
    const { ROLE_HIERARCHY } = require('../utils/jwt');
    return ROLE_HIERARCHY[role as keyof typeof ROLE_HIERARCHY] || 0;
  }

  /**
   * Check if permission allows access to required role
   */
  private hasPermission(permission: string, requiredRole: string): boolean {
    // Simple permission matching - can be enhanced based on requirements
    const [resource, action] = permission.split(':');
    const [requiredResource] = requiredRole.toLowerCase().split('_');
    
    return resource === requiredResource || permission === '*';
  }
}

// Export singleton instance
export const authService = new AuthServiceImpl();