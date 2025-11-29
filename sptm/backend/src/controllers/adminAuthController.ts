import { Request, Response } from 'express';
import { hashPassword } from '../utils/password';
import { authService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

export class AdminAuthController {
  /**
   * Admin login
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      const result = await authService.authenticateAdmin(email, password);

      if (!result.success) {
        return res.status(401).json({ 
          error: result.error || 'Authentication failed' 
        });
      }

      res.json({
        message: 'Admin login successful',
        user: result.user,
        tokens: result.tokens
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get Admin profile
   */
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const admin = await prisma.admin.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          _count: {
            select: {
              organizations: true
            }
          }
        }
      });

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      res.json({ admin });
    } catch (error) {
      console.error('Get Admin profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update Admin profile
   */
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { name, phone } = req.body;

      const updatedAdmin = await prisma.admin.update({
        where: { id: req.user.id },
        data: { name, phone },
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

      res.json({
        message: 'Profile updated successfully',
        admin: updatedAdmin
      });
    } catch (error) {
      console.error('Update Admin profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Change Admin password
   */
  static async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Current password and new password are required' 
        });
      }

      // Get admin with password
      const admin = await prisma.admin.findUnique({
        where: { id: req.user.id }
      });

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      // Verify current password using auth service
      const authResult = await authService.authenticateAdmin(
        admin.email, 
        currentPassword
      );

      if (!authResult.success) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await prisma.admin.update({
        where: { id: req.user.id },
        data: { password: hashedNewPassword }
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change Admin password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create Organization account (Admin only)
   */
  static async createOrganization(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { email, password, name, phone, address, licenseNumber } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ 
          error: 'Email, password, and name are required' 
        });
      }

      // Check if organization already exists
      const existingOrganization = await prisma.organization.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingOrganization) {
        return res.status(400).json({ 
          error: 'Organization already exists with this email' 
        });
      }

      // Check license number uniqueness if provided
      if (licenseNumber) {
        const existingLicense = await prisma.organization.findUnique({
          where: { licenseNumber }
        });

        if (existingLicense) {
          return res.status(400).json({ 
            error: 'Organization already exists with this license number' 
          });
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create organization
      const organization = await prisma.organization.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          phone,
          address,
          licenseNumber,
          createdBy: req.user.id
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          licenseNumber: true,
          isActive: true,
          createdAt: true,
          createdBy: true
        }
      });

      res.status(201).json({
        message: 'Organization created successfully',
        organization
      });
    } catch (error) {
      console.error('Create Organization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all Organizations managed by this Admin
   */
  static async getOrganizations(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const organizations = await prisma.organization.findMany({
        where: {
          createdBy: req.user.id
        },
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
          _count: {
            select: {
              users: true,
              vehicles: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({ organizations });
    } catch (error) {
      console.error('Get Organizations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get specific Organization details
   */
  static async getOrganization(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { organizationId } = req.params;

      const organization = await prisma.organization.findFirst({
        where: {
          id: organizationId,
          createdBy: req.user.id
        },
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
          updatedAt: true,
          _count: {
            select: {
              users: true,
              vehicles: true
            }
          }
        }
      });

      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      res.json({ organization });
    } catch (error) {
      console.error('Get Organization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update Organization status (Admin only)
   */
  static async updateOrganizationStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { organizationId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ 
          error: 'isActive must be a boolean value' 
        });
      }

      const updatedOrganization = await prisma.organization.updateMany({
        where: {
          id: organizationId,
          createdBy: req.user.id
        },
        data: { isActive }
      });

      if (updatedOrganization.count === 0) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      res.json({
        message: `Organization ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Update Organization status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get Admin dashboard data
   */
  static async getDashboardData(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get organizations managed by this admin
      const organizations = await prisma.organization.findMany({
        where: {
          createdBy: req.user.id
        },
        select: {
          id: true,
          name: true,
          isActive: true,
          _count: {
            select: {
              users: true,
              vehicles: true
            }
          }
        }
      });

      // Calculate summary statistics
      const totalOrganizations = organizations.length;
      const activeOrganizations = organizations.filter(org => org.isActive).length;
      const totalDrivers = organizations.reduce((sum, org) => sum + org._count.users, 0);
      const totalVehicles = organizations.reduce((sum, org) => sum + org._count.vehicles, 0);

      // Get recent organizations
      const recentOrganizations = await prisma.organization.findMany({
        where: {
          createdBy: req.user.id
        },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      res.json({
        summary: {
          totalOrganizations,
          activeOrganizations,
          totalDrivers,
          totalVehicles
        },
        organizations,
        recentOrganizations
      });
    } catch (error) {
      console.error('Get Admin dashboard data error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Refresh Admin token
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
      console.error('Admin refresh token error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  /**
   * Logout Admin
   */
  static async logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Clear refresh token
      await prisma.admin.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
      });

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Admin logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}