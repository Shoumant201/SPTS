import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';

const prisma = new PrismaClient();

export interface OtpResult {
  success: boolean;
  message: string;
  otpId?: string;
}

export interface OtpVerificationResult {
  success: boolean;
  message: string;
  userId?: string;
}

export class OtpService {
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;
  private readonly RATE_LIMIT_MINUTES = 1; // Minimum time between OTP requests

  /**
   * Generate and send OTP code
   */
  async sendOtp(phone: string, purpose: 'LOGIN' | 'REGISTRATION' | 'PHONE_VERIFICATION'): Promise<OtpResult> {
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(phone)) {
        return { success: false, message: 'Invalid phone number format' };
      }

      // Check rate limiting
      const recentOtp = await prisma.otpCode.findFirst({
        where: {
          phone,
          createdAt: {
            gte: new Date(Date.now() - this.RATE_LIMIT_MINUTES * 60 * 1000)
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (recentOtp) {
        return { 
          success: false, 
          message: `Please wait ${this.RATE_LIMIT_MINUTES} minute(s) before requesting another OTP` 
        };
      }

      // Generate 6-digit OTP
      const code = this.generateOtpCode();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Save OTP to database
      const otpRecord = await prisma.otpCode.create({
        data: {
          phone,
          code,
          purpose,
          expiresAt
        }
      });

      // Send SMS
      const smsResult = await this.sendSms(phone, code, purpose);
      
      if (!smsResult.success) {
        // Delete the OTP record if SMS failed
        await prisma.otpCode.delete({ where: { id: otpRecord.id } });
        return smsResult;
      }

      return {
        success: true,
        message: 'OTP sent successfully',
        otpId: otpRecord.id
      };

    } catch (error) {
      console.error('Error sending OTP:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(phone: string, code: string, purpose: 'LOGIN' | 'REGISTRATION' | 'PHONE_VERIFICATION'): Promise<OtpVerificationResult> {
    try {
      // Find valid OTP
      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          phone,
          code,
          purpose,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) {
        // Increment attempts for any matching OTP
        await prisma.otpCode.updateMany({
          where: {
            phone,
            purpose,
            isUsed: false,
            expiresAt: {
              gt: new Date()
            }
          },
          data: {
            attempts: {
              increment: 1
            }
          }
        });

        return { success: false, message: 'Invalid or expired OTP' };
      }

      // Check max attempts
      if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
        await prisma.otpCode.update({
          where: { id: otpRecord.id },
          data: { isUsed: true, usedAt: new Date() }
        });
        return { success: false, message: 'OTP has been blocked due to too many attempts' };
      }

      // Mark OTP as used
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: {
          isUsed: true,
          usedAt: new Date()
        }
      });

      // Clean up old OTPs for this phone
      await this.cleanupOldOtps(phone);

      return {
        success: true,
        message: 'OTP verified successfully'
      };

    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, message: 'Failed to verify OTP' };
    }
  }

  /**
   * Generate 6-digit OTP code using cryptographically secure random number
   */
  private generateOtpCode(): string {
    // Generate cryptographically secure random 6-digit OTP
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);
    const otp = (randomNumber % 900000) + 100000; // Ensures 6 digits (100000-999999)
    return otp.toString();
  }

  /**
   * Send SMS using various providers
   */
  private async sendSms(phone: string, code: string, purpose: string): Promise<OtpResult> {
    const message = this.getSmsMessage(code, purpose);

    // Try different SMS providers in order of preference
    const providers = [
      () => this.sendViaTwilio(phone, message),
      () => this.sendViaTextLocal(phone, message),
      () => this.sendViaSparrow(phone, message), // Popular in Nepal
      () => this.sendViaConsole(phone, message) // Fallback for development
    ];

    for (const provider of providers) {
      try {
        const result = await provider();
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.warn('SMS provider failed:', error);
        continue;
      }
    }

    return { success: false, message: 'All SMS providers failed' };
  }

  /**
   * Send SMS via Twilio
   */
  private async sendViaTwilio(phone: string, message: string): Promise<OtpResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await axios.post(url, new URLSearchParams({
      To: phone,
      From: fromNumber,
      Body: message
    }), {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data.sid) {
      return { success: true, message: 'SMS sent via Twilio' };
    }

    throw new Error('Twilio SMS failed');
  }

  /**
   * Send SMS via TextLocal (UK/India)
   */
  private async sendViaTextLocal(phone: string, message: string): Promise<OtpResult> {
    const apiKey = process.env.TEXTLOCAL_API_KEY;
    const sender = process.env.TEXTLOCAL_SENDER || 'SPTM';

    if (!apiKey) {
      throw new Error('TextLocal API key not configured');
    }

    const response = await axios.post('https://api.textlocal.in/send/', new URLSearchParams({
      apikey: apiKey,
      numbers: phone,
      message: message,
      sender: sender
    }));

    if (response.data.status === 'success') {
      return { success: true, message: 'SMS sent via TextLocal' };
    }

    throw new Error('TextLocal SMS failed');
  }

  /**
   * Send SMS via Sparrow SMS (Nepal)
   */
  private async sendViaSparrow(phone: string, message: string): Promise<OtpResult> {
    const token = process.env.SPARROW_SMS_TOKEN;
    const from = process.env.SPARROW_SMS_FROM || 'SPTM';

    if (!token) {
      throw new Error('Sparrow SMS token not configured');
    }

    const response = await axios.post('https://api.sparrowsms.com/v2/sms/', {
      token: token,
      from: from,
      to: phone,
      text: message
    });

    if (response.data.response_code === 200) {
      return { success: true, message: 'SMS sent via Sparrow SMS' };
    }

    throw new Error('Sparrow SMS failed');
  }

  /**
   * Console logging for development
   */
  private async sendViaConsole(phone: string, message: string): Promise<OtpResult> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Console SMS only available in development');
    }

    console.log('\n=== SMS NOTIFICATION ===');
    console.log(`To: ${phone}`);
    console.log(`Message: ${message}`);
    console.log('========================\n');

    return { success: true, message: 'SMS logged to console (development mode)' };
  }

  /**
   * Get SMS message based on purpose
   */
  private getSmsMessage(code: string, purpose: string): string {
    const appName = process.env.APP_NAME || 'SPTM';
    
    switch (purpose) {
      case 'LOGIN':
        return `Your ${appName} login code is: ${code}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;
      case 'REGISTRATION':
        return `Welcome to ${appName}! Your verification code is: ${code}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`;
      case 'PHONE_VERIFICATION':
        return `Your ${appName} phone verification code is: ${code}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`;
      default:
        return `Your ${appName} verification code is: ${code}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`;
    }
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid length (10-15 digits)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return false;
    }

    // Add more specific validation based on your region
    // For Nepal: starts with 98 and has 10 digits
    if (cleaned.startsWith('977') && cleaned.length === 13) {
      return true;
    }
    
    // For local Nepal numbers: starts with 98 and has 10 digits
    if (cleaned.startsWith('98') && cleaned.length === 10) {
      return true;
    }

    // International format validation
    return /^\+?[1-9]\d{1,14}$/.test(phone);
  }

  /**
   * Clean up old OTP codes
   */
  private async cleanupOldOtps(phone: string): Promise<void> {
    await prisma.otpCode.deleteMany({
      where: {
        phone,
        OR: [
          { isUsed: true },
          { expiresAt: { lt: new Date() } }
        ]
      }
    });
  }

  /**
   * Format phone number to international format
   */
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Nepal numbers
    if (cleaned.startsWith('98') && cleaned.length === 10) {
      return `+977${cleaned}`;
    }
    
    if (cleaned.startsWith('977')) {
      return `+${cleaned}`;
    }
    
    // Add + if not present for international numbers
    if (!phone.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return phone;
  }
}