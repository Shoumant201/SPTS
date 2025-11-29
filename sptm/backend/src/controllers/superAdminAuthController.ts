import { Request, Response } from 'express';
import { hashPassword } from '../utils/password';
import { authService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { SecurityService } from '../services/securityService';
import { AuthErrorType } from '../types/auth';

export class SuperAdminAuthController {
  /**
   * Super Admin login
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.INVALID_CREDENTIALS,
          'Email and password are required',
          400,
          req.path
        );
        return res.status(400).json(errorResponse);
      }

      const result = await authService.authenticateSuperAdmin(email, password);

      if (!result.success) {
        let errorType = AuthErrorType.INVALID_CREDENTIALS;
        let statusCode = 401;

        if (result.error?.includes('locked')) {
          errorType = AuthErrorType.ACCOUNT_LOCKED;
          statusCode = 423;
        } else if (result.error?.includes('inactive')) {
          errorType = AuthErrorType.ACCOUNT_INACTIVE;
          statusCode = 403;
        }

        const errorResponse = SecurityService.createAuthError(
          errorType,
          result.error || 'Authentication failed',
          statusCode,
          req.path
        );
        return res.status(statusCode).json(errorResponse);
      }

      res.json({
        message: 'Super Admin login successful',
        user: result.user,
        tokens: result.tokens
      });
    } catch (error) {
      console.error('Super Admin login error:', error);
      const errorResponse = SecurityService.createAuthError(
        AuthErrorType.TOKEN_INVALID,
        'Internal server error',
        500,
        req.path
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get Super Admin profile
   */
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const superAdmin = await prisma.superAdmin.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!superAdmin) {
        return res.status(404).json({ error: 'Super Admin not found' });
      }

      res.json({ superAdmin });
    } catch (error) {
      console.error('Get Super Admin profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update Super Admin profile
   */
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { name } = req.body;

      const updatedSuperAdmin = await prisma.superAdmin.update({
        where: { id: req.user.id },
        data: { name },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({
        message: 'Profile updated successfully',
        superAdmin: updatedSuperAdmin
      });
    } catch (error) {
      console.error('Update Super Admin profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Change Super Admin password
   */
  static async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'SUPER_ADMIN') {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.INSUFFICIENT_PERMISSIONS,
          'Access denied',
          403,
          req.path
        );
        return res.status(403).json(errorResponse);
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.INVALID_CREDENTIALS,
          'Current password and new password are required',
          400,
          req.path
        );
        return res.status(400).json(errorResponse);
      }

      // Validate new password strength
      const passwordValidation = SecurityService.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.WEAK_PASSWORD,
          'Password does not meet security requirements',
          400,
          req.path,
          { requirements: passwordValidation.errors }
        );
        return res.status(400).json(errorResponse);
      }

      // Get super admin with password
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { id: req.user.id }
      });

      if (!superAdmin) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.INVALID_CREDENTIALS,
          'Super Admin not found',
          404,
          req.path
        );
        return res.status(404).json(errorResponse);
      }

      // Verify current password using auth service
      const authResult = await authService.authenticateSuperAdmin(
        superAdmin.email, 
        currentPassword
      );

      if (!authResult.success) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.INVALID_CREDENTIALS,
          'Current password is incorrect',
          400,
          req.path
        );
        return res.status(400).json(errorResponse);
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await prisma.superAdmin.update({
        where: { id: req.user.id },
        data: { password: hashedNewPassword }
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change Super Admin password error:', error);
      const errorResponse = SecurityService.createAuthError(
        AuthErrorType.TOKEN_INVALID,
        'Internal server error',
        500,
        req.path
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Create Admin account (Super Admin only)
   */
  static async createAdmin(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'SUPER_ADMIN') {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.INSUFFICIENT_PERMISSIONS,
          'Access denied',
          403,
          req.path
        );
        return res.status(403).json(errorResponse);
      }

      const { email, password, name, phone } = req.body;

      if (!email || !password || !name) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.INVALID_CREDENTIALS,
          'Email, password, and name are required',
          400,
          req.path
        );
        return res.status(400).json(errorResponse);
      }

      // Validate password strength
      const passwordValidation = SecurityService.validatePasswordStrength(password);
      if (!passwordValidation.valid) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.WEAK_PASSWORD,
          'Password does not meet security requirements',
          400,
          req.path,
          { requirements: passwordValidation.errors }
        );
        return res.status(400).json(errorResponse);
      }

      // Check if admin already exists
      const existingAdmin = await prisma.admin.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingAdmin) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.INVALID_CREDENTIALS,
          'Admin already exists with this email',
          400,
          req.path
        );
        return res.status(400).json(errorResponse);
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create admin
      const admin = await prisma.admin.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          phone,
          createdBy: req.user.id
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isActive: true,
          createdAt: true,
          createdBy: true
        }
      });

      res.status(201).json({
        message: 'Admin created successfully',
        admin
      });
    } catch (error) {
      console.error('Create Admin error:', error);
      const errorResponse = SecurityService.createAuthError(
        AuthErrorType.TOKEN_INVALID,
        'Internal server error',
        500,
        req.path
      );
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Get all Admins (Super Admin only)
   */
  static async getAdmins(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const admins = await prisma.admin.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          createdBy: true,
          _count: {
            select: {
              organizations: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({ admins });
    } catch (error) {
      console.error('Get Admins error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update Admin status (Super Admin only)
   */
  static async updateAdminStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { adminId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ 
          error: 'isActive must be a boolean value' 
        });
      }

      const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: { isActive },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true
        }
      });

      res.json({
        message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
        admin: updatedAdmin
      });
    } catch (error) {
      console.error('Update Admin status error:', error);
      const err = error as any;
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Admin not found' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Refresh Super Admin token
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const tokens = await authService.refreshTokens(refreshToken);

      res.json({ tokens });
    } catch (error) {
      console.error('Super Admin refresh token error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  /**
   * Logout Super Admin
   */
  static async logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Clear refresh token
      await prisma.superAdmin.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
      });

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Super Admin logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}