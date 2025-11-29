import { Request, Response } from 'express';
import { hashPassword } from '../utils/password';
import { authService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { UserRole } from '@prisma/client';

export class UserAuthController {
  // Register new user (driver or passenger)
  static async register(req: Request, res: Response) {
    try {
      const { email, password, name, phone, role = 'PASSENGER', organizationId, context } = req.body;

      // Validate role
      if (!['DRIVER', 'PASSENGER'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be DRIVER or PASSENGER' });
      }

      // Validate context for mobile apps
      if (context && !['driver-app', 'passenger-app'].includes(context)) {
        return res.status(400).json({ error: 'Invalid context' });
      }

      // Validate role matches context
      if (context === 'driver-app' && role !== 'DRIVER') {
        return res.status(400).json({ error: 'Driver app requires DRIVER role' });
      }

      if (context === 'passenger-app' && role !== 'PASSENGER') {
        return res.status(400).json({ error: 'Passenger app requires PASSENGER role' });
      }

      // For drivers, organization is required
      if (role === 'DRIVER' && !organizationId) {
        return res.status(400).json({ error: 'Organization ID is required for drivers' });
      }

      // For passengers, organization should not be set
      if (role === 'PASSENGER' && organizationId) {
        return res.status(400).json({ error: 'Passengers cannot be assigned to organizations' });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // If driver, validate organization exists and is active
      if (role === 'DRIVER' && organizationId) {
        const organization = await prisma.organization.findUnique({
          where: { id: organizationId }
        });

        if (!organization || !organization.isActive) {
          return res.status(400).json({ error: 'Invalid or inactive organization' });
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          phone,
          role: role as UserRole,
          organizationId: role === 'DRIVER' ? organizationId : null
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          organizationId: true,
          createdAt: true
        }
      });

      // Generate tokens using auth service
      const tokens = authService.generateTokens({
        id: user.id,
        email: user.email,
        role: user.role,
        userType: 'USER',
        organizationId: user.organizationId || undefined
      });

      // Save refresh token
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken }
      });

      res.status(201).json({
        message: 'User registered successfully',
        user,
        tokens
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Login user (driver or passenger) with role-based validation
  static async login(req: Request, res: Response) {
    try {
      const { email, password, role, context } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      // Validate role if provided
      if (role && !['DRIVER', 'PASSENGER'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be DRIVER or PASSENGER' });
      }

      // Validate context for mobile apps
      if (context && !['driver-app', 'passenger-app'].includes(context)) {
        return res.status(400).json({ error: 'Invalid context' });
      }

      // Validate role matches context
      if (context === 'driver-app' && role && role !== 'DRIVER') {
        return res.status(400).json({ error: 'Driver app requires DRIVER role' });
      }

      if (context === 'passenger-app' && role && role !== 'PASSENGER') {
        return res.status(400).json({ error: 'Passenger app requires PASSENGER role' });
      }

      // If no role specified, try to determine from context
      let userRole = role;
      if (!userRole && context) {
        userRole = context === 'driver-app' ? 'DRIVER' : 'PASSENGER';
      }

      // If still no role, we'll authenticate and validate later
      if (userRole) {
        const result = await authService.authenticateUser(email, password, userRole as UserRole);
        
        if (!result.success) {
          return res.status(401).json({ 
            error: result.error || 'Authentication failed' 
          });
        }

        res.json({
          message: 'Login successful',
          user: result.user,
          tokens: result.tokens
        });
      } else {
        // Try both roles if no specific role requested
        let result = await authService.authenticateUser(email, password, UserRole.DRIVER);
        
        if (!result.success) {
          result = await authService.authenticateUser(email, password, UserRole.PASSENGER);
        }

        if (!result.success) {
          return res.status(401).json({ 
            error: 'Invalid credentials' 
          });
        }

        res.json({
          message: 'Login successful',
          user: result.user,
          tokens: result.tokens
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Refresh token for users
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const tokens = await authService.refreshTokens(refreshToken);

      res.json({ tokens });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  // Logout user
  static async logout(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'USER') {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Clear refresh token
      await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
      });

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get current user profile
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'USER') {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get current user (for token validation)
  static async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'USER') {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      res.json({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        userType: req.user.userType,
        organizationId: req.user.organizationId
      });
    } catch (error) {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Change password
  static async changePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'USER') {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Current password and new password are required' 
        });
      }

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password using auth service
      const authResult = await authService.authenticateUser(
        user.email, 
        currentPassword,
        user.role
      );

      if (!authResult.success) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedNewPassword }
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update user profile
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'USER') {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { name, phone } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: { name, phone },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Driver-specific: Get assigned vehicle and routes
  static async getDriverAssignments(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'USER' || req.user.role !== 'DRIVER') {
        return res.status(403).json({ error: 'Access denied. Driver role required.' });
      }

      // Get driver's organization and assignments
      const driver = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!driver || !driver.organizationId) {
        return res.status(400).json({ error: 'Driver not assigned to organization' });
      }

      // Get assigned vehicles (if any)
      const vehicles = await prisma.vehicle.findMany({
        where: {
          organizationId: driver.organizationId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          plateNumber: true,
          type: true,
          capacity: true
        }
      });

      res.json({
        driver,
        vehicles,
        organization: driver.organization
      });
    } catch (error) {
      console.error('Get driver assignments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Passenger-specific: Get trip history and discount profile
  static async getPassengerData(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.userType !== 'USER' || req.user.role !== 'PASSENGER') {
        return res.status(403).json({ error: 'Access denied. Passenger role required.' });
      }

      // Get passenger's trips
      const trips = await prisma.trip.findMany({
        where: {
          userId: req.user.id
        },
        select: {
          id: true,
          status: true,
          finalPrice: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20 // Limit recent trips
      });

      // Get discount profile if exists
      const discountProfile = await prisma.discountProfile.findUnique({
        where: {
          userId: req.user.id
        },
        select: {
          id: true,
          discountType: true,
          verificationStatus: true,
          expiresAt: true
        }
      });

      res.json({
        trips,
        discountProfile
      });
    } catch (error) {
      console.error('Get passenger data error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}