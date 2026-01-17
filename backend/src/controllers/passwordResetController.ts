import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { hashPassword } from '../utils/password';
import { emailService } from '../services/emailService';
import { SecurityService } from '../services/securityService';
import { AuthErrorType } from '../types/auth';

type UserType = 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZATION';

export class PasswordResetController {
  /**
   * Request password reset - sends email with reset link
   */
  static async requestReset(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Find user across all user types
      let user: { id: string; email: string; name: string } | null = null;
      let userType: UserType | null = null;

      // Check SuperAdmin
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, email: true, name: true }
      });
      if (superAdmin) {
        user = superAdmin;
        userType = 'SUPER_ADMIN';
      }

      // Check Admin
      if (!user) {
        const admin = await prisma.admin.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, email: true, name: true }
        });
        if (admin) {
          user = admin;
          userType = 'ADMIN';
        }
      }

      // Check Organization
      if (!user) {
        const organization = await prisma.organization.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, email: true, name: true }
        });
        if (organization) {
          user = organization;
          userType = 'ORGANIZATION';
        }
      }

      // Always return success to prevent email enumeration
      if (!user || !userType) {
        console.log(`Password reset requested for non-existent email: ${normalizedEmail}`);
        return res.json({ 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        });
      }

      // Delete any existing reset tokens for this email
      await prisma.passwordResetToken.deleteMany({
        where: { email: normalizedEmail }
      });

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in database
      await prisma.passwordResetToken.create({
        data: {
          email: normalizedEmail,
          token,
          userType,
          expiresAt
        }
      });

      // Generate reset link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetLink = `${frontendUrl}/reset-password?token=${token}`;

      // Send email
      const emailSent = await emailService.sendPasswordResetEmail(
        normalizedEmail,
        resetLink,
        user.name
      );

      if (!emailSent) {
        console.error(`Failed to send password reset email to: ${normalizedEmail}`);
      }

      res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Validate reset token
   */
  static async validateToken(req: Request, res: Response) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token }
      });

      if (!resetToken) {
        return res.status(400).json({ 
          error: 'Invalid or expired reset link',
          valid: false 
        });
      }

      if (resetToken.isUsed) {
        return res.status(400).json({ 
          error: 'This reset link has already been used',
          valid: false 
        });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ 
          error: 'This reset link has expired',
          valid: false 
        });
      }

      res.json({ 
        valid: true,
        email: resetToken.email,
        message: 'Token is valid' 
      });
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required' });
      }

      // Validate password strength
      const passwordValidation = SecurityService.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: 'Password does not meet security requirements',
          requirements: passwordValidation.errors
        });
      }

      // Find and validate token
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token }
      });

      if (!resetToken) {
        return res.status(400).json({ error: 'Invalid or expired reset link' });
      }

      if (resetToken.isUsed) {
        return res.status(400).json({ error: 'This reset link has already been used' });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: 'This reset link has expired' });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password based on user type
      let userName = '';
      
      switch (resetToken.userType) {
        case 'SUPER_ADMIN':
          const superAdmin = await prisma.superAdmin.update({
            where: { email: resetToken.email },
            data: { password: hashedPassword },
            select: { name: true }
          });
          userName = superAdmin.name;
          break;
          
        case 'ADMIN':
          const admin = await prisma.admin.update({
            where: { email: resetToken.email },
            data: { password: hashedPassword },
            select: { name: true }
          });
          userName = admin.name;
          break;
          
        case 'ORGANIZATION':
          const org = await prisma.organization.update({
            where: { email: resetToken.email },
            data: { password: hashedPassword },
            select: { name: true }
          });
          userName = org.name;
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid user type' });
      }

      // Mark token as used
      await prisma.passwordResetToken.update({
        where: { token },
        data: { 
          isUsed: true,
          usedAt: new Date()
        }
      });

      // Send confirmation email
      await emailService.sendPasswordResetSuccessEmail(resetToken.email, userName);

      res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
