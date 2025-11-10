import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { OtpService } from '../services/otpService';
import { z } from 'zod';

const prisma = new PrismaClient();
const otpService = new OtpService();

// Validation schemas
const sendOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  purpose: z.enum(['LOGIN', 'REGISTRATION']),
  role: z.enum(['PASSENGER', 'DRIVER']).optional()
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  code: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['LOGIN', 'REGISTRATION']),
  name: z.string().optional(),
  role: z.enum(['PASSENGER', 'DRIVER']).optional(),
  deviceToken: z.string().optional()
});

export class PhoneAuthController {
  /**
   * Send OTP for login or registration
   */
  static async sendOtp(req: Request, res: Response) {
    try {
      const { phone, purpose, role } = sendOtpSchema.parse(req.body);
      
      // Format phone number
      const formattedPhone = OtpService.formatPhoneNumber(phone);
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { phone: formattedPhone }
      });

      // Validation logic
      if (purpose === 'LOGIN' && !existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Phone number not registered. Please register first.'
        });
      }

      if (purpose === 'REGISTRATION' && existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already registered. Please login instead.'
        });
      }

      // Send OTP
      const result = await otpService.sendOtp(formattedPhone, purpose);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: result.message,
        phone: formattedPhone,
        expiresIn: 300 // 5 minutes in seconds
      });

    } catch (error) {
      console.error('Send OTP error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Verify OTP and login/register user
   */
  static async verifyOtp(req: Request, res: Response) {
    try {
      const { phone, code, purpose, name, role, deviceToken } = verifyOtpSchema.parse(req.body);
      
      // Format phone number
      const formattedPhone = OtpService.formatPhoneNumber(phone);
      
      // Verify OTP
      const otpResult = await otpService.verifyOtp(formattedPhone, code, purpose);
      
      if (!otpResult.success) {
        return res.status(400).json(otpResult);
      }

      let user;

      if (purpose === 'REGISTRATION') {
        // Create new user
        user = await prisma.user.create({
          data: {
            phone: formattedPhone,
            name: name || null,
            role: role || 'PASSENGER',
            isPhoneVerified: true,
            phoneVerifiedAt: new Date(),
            deviceTokens: deviceToken ? [deviceToken] : [],
            lastLoginAt: new Date()
          }
        });
      } else {
        // Login existing user
        user = await prisma.user.findUnique({
          where: { phone: formattedPhone }
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        // Update device tokens and last login
        const updatedDeviceTokens = user.deviceTokens || [];
        if (deviceToken && !updatedDeviceTokens.includes(deviceToken)) {
          updatedDeviceTokens.push(deviceToken);
          // Keep only last 5 device tokens
          if (updatedDeviceTokens.length > 5) {
            updatedDeviceTokens.splice(0, updatedDeviceTokens.length - 5);
          }
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            deviceTokens: updatedDeviceTokens,
            lastLoginAt: new Date()
          }
        });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { 
          userId: user.id, 
          phone: user.phone, 
          role: user.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' } // Longer expiry for mobile apps
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '30d' } // Long-lived refresh token
      );

      // Save refresh token
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken }
      });

      // Return user data without sensitive information
      const userData = {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        organizationId: user.organizationId,
        createdAt: user.createdAt
      };

      res.json({
        success: true,
        message: purpose === 'REGISTRATION' ? 'Registration successful' : 'Login successful',
        user: userData,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 604800 // 7 days in seconds
        }
      });

    } catch (error) {
      console.error('Verify OTP error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      // Find user with matching refresh token
      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          refreshToken: refreshToken
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        { 
          userId: user.id, 
          phone: user.phone, 
          role: user.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        accessToken: newAccessToken,
        expiresIn: 604800 // 7 days in seconds
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  /**
   * Logout user (remove device token)
   */
  static async logout(req: Request, res: Response) {
    try {
      const { deviceToken } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      // Remove device token and refresh token
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (user) {
        const updatedDeviceTokens = (user.deviceTokens || []).filter(
          token => token !== deviceToken
        );

        await prisma.user.update({
          where: { id: userId },
          data: {
            deviceTokens: updatedDeviceTokens,
            refreshToken: null
          }
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
          isPhoneVerified: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('Get profile error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { name } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { name },
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
          isPhoneVerified: true,
          organizationId: true,
          updatedAt: true
        }
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user
      });

    } catch (error) {
      console.error('Update profile error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}