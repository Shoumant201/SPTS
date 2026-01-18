import { Response } from 'express';
import { hashPassword, comparePassword } from '../utils/password';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { SecurityService } from '../services/securityService';
import { AuthErrorType } from '../types/auth';

export class ProfileController {
  /**
   * Get current user profile
   */
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.TOKEN_INVALID,
          'Authentication required',
          401,
          req.path
        );
        return res.status(401).json(errorResponse);
      }

      let user = null;
      const { id, userType } = req.user;

      // Get user data based on user type
      switch (userType) {
        case 'SUPER_ADMIN':
          user = await prisma.superAdmin.findUnique({
            where: { id },
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
          break;

        case 'ADMIN':
          user = await prisma.admin.findUnique({
            where: { id },
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
              updatedAt: true
            }
          });
          break;

        case 'ORGANIZATION':
          user = await prisma.organization.findUnique({
            where: { id },
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              address: true,
              licenseNumber: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
              updatedAt: true
            }
          });
          break;

        default:
          const errorResponse = SecurityService.createAuthError(
            AuthErrorType.INSUFFICIENT_PERMISSIONS,
            'Invalid user type',
            403,
            req.path
          );
          return res.status(403).json(errorResponse);
      }

      if (!user) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.TOKEN_INVALID,
          'User not found',
          404,
          req.path
        );
        return res.status(404).json(errorResponse);
      }

      res.json({
        message: 'Profile retrieved successfully',
        user: {
          ...user,
          userType
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
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
   * Update user profile
   */
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.TOKEN_INVALID,
          'Authentication required',
          401,
          req.path
        );
        return res.status(401).json(errorResponse);
      }

      const { name, phone } = req.body;
      const { id, userType } = req.user;

      if (!name && !phone) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.INVALID_CREDENTIALS,
          'At least one field (name or phone) is required',
          400,
          req.path
        );
        return res.status(400).json(errorResponse);
      }

      // Build update data based on user type (SuperAdmin doesn't have phone field)
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      
      let updatedUser = null;

      // Update user data based on user type
      switch (userType) {
        case 'SUPER_ADMIN':
          // SuperAdmin doesn't have phone field, only update name
          const superAdminUpdateData: any = {};
          if (name !== undefined) superAdminUpdateData.name = name;
          
          if (Object.keys(superAdminUpdateData).length === 0) {
            const errorResponse = SecurityService.createAuthError(
              AuthErrorType.INVALID_CREDENTIALS,
              'No valid fields to update for Super Admin (only name is allowed)',
              400,
              req.path
            );
            return res.status(400).json(errorResponse);
          }

          updatedUser = await prisma.superAdmin.update({
            where: { id },
            data: superAdminUpdateData,
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
          break;

        case 'ADMIN':
          // Admin has both name and phone fields
          const adminUpdateData: any = {};
          if (name !== undefined) adminUpdateData.name = name;
          if (phone !== undefined) adminUpdateData.phone = phone;
          
          if (Object.keys(adminUpdateData).length === 0) {
            const errorResponse = SecurityService.createAuthError(
              AuthErrorType.INVALID_CREDENTIALS,
              'At least one field (name or phone) is required',
              400,
              req.path
            );
            return res.status(400).json(errorResponse);
          }

          updatedUser = await prisma.admin.update({
            where: { id },
            data: adminUpdateData,
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
              updatedAt: true
            }
          });
          break;

        case 'ORGANIZATION':
          // Organization has both name and phone fields
          const organizationUpdateData: any = {};
          if (name !== undefined) organizationUpdateData.name = name;
          if (phone !== undefined) organizationUpdateData.phone = phone;
          
          if (Object.keys(organizationUpdateData).length === 0) {
            const errorResponse = SecurityService.createAuthError(
              AuthErrorType.INVALID_CREDENTIALS,
              'At least one field (name or phone) is required',
              400,
              req.path
            );
            return res.status(400).json(errorResponse);
          }

          updatedUser = await prisma.organization.update({
            where: { id },
            data: organizationUpdateData,
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              address: true,
              licenseNumber: true,
              isActive: true,
              lastLoginAt: true,
              createdAt: true,
              updatedAt: true
            }
          });
          break;

        default:
          const errorResponse = SecurityService.createAuthError(
            AuthErrorType.INSUFFICIENT_PERMISSIONS,
            'Invalid user type',
            403,
            req.path
          );
          return res.status(403).json(errorResponse);
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          ...updatedUser,
          userType
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      const err = error as any;
      if (err.code === 'P2025') {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.TOKEN_INVALID,
          'User not found',
          404,
          req.path
        );
        return res.status(404).json(errorResponse);
      }
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
   * Change user password
   */
  static async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.TOKEN_INVALID,
          'Authentication required',
          401,
          req.path
        );
        return res.status(401).json(errorResponse);
      }

      const { currentPassword, newPassword } = req.body;
      const { id, userType } = req.user;

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

      let currentUser = null;

      // Get current user with password based on user type
      switch (userType) {
        case 'SUPER_ADMIN':
          currentUser = await prisma.superAdmin.findUnique({
            where: { id },
            select: { id: true, email: true, password: true }
          });
          break;

        case 'ADMIN':
          currentUser = await prisma.admin.findUnique({
            where: { id },
            select: { id: true, email: true, password: true }
          });
          break;

        case 'ORGANIZATION':
          currentUser = await prisma.organization.findUnique({
            where: { id },
            select: { id: true, email: true, password: true }
          });
          break;

        default:
          const errorResponse = SecurityService.createAuthError(
            AuthErrorType.INSUFFICIENT_PERMISSIONS,
            'Invalid user type',
            403,
            req.path
          );
          return res.status(403).json(errorResponse);
      }

      if (!currentUser) {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.TOKEN_INVALID,
          'User not found',
          404,
          req.path
        );
        return res.status(404).json(errorResponse);
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
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

      // Update password based on user type
      switch (userType) {
        case 'SUPER_ADMIN':
          await prisma.superAdmin.update({
            where: { id },
            data: { password: hashedNewPassword }
          });
          break;

        case 'ADMIN':
          await prisma.admin.update({
            where: { id },
            data: { password: hashedNewPassword }
          });
          break;

        case 'ORGANIZATION':
          await prisma.organization.update({
            where: { id },
            data: { password: hashedNewPassword }
          });
          break;
      }

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      const err = error as any;
      if (err.code === 'P2025') {
        const errorResponse = SecurityService.createAuthError(
          AuthErrorType.TOKEN_INVALID,
          'User not found',
          404,
          req.path
        );
        return res.status(404).json(errorResponse);
      }
      const errorResponse = SecurityService.createAuthError(
        AuthErrorType.TOKEN_INVALID,
        'Internal server error',
        500,
        req.path
      );
      res.status(500).json(errorResponse);
    }
  }
}