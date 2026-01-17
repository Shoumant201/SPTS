import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"${process.env.APP_NAME || 'SPTM'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string, userName: string): Promise<boolean> {
    const html = this.getPasswordResetTemplate(resetLink, userName);
    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - SPTM',
      html,
    });
  }

  async sendPasswordResetSuccessEmail(email: string, userName: string): Promise<boolean> {
    const html = this.getPasswordResetSuccessTemplate(userName);
    return this.sendEmail({
      to: email,
      subject: 'Password Changed Successfully - SPTM',
      html,
    });
  }

  private getPasswordResetTemplate(resetLink: string, userName: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); border-radius: 16px 16px 0 0;">
              <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 28px; font-weight: bold; color: #ffffff;">S</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">SPTM</h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Smart Public Transport Management</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 22px; font-weight: 600;">Password Reset Request</h2>
              <p style="margin: 0 0 24px; color: #64748b; font-size: 16px; line-height: 1.6;">
                Hello ${userName || 'there'},
              </p>
              <p style="margin: 0 0 24px; color: #64748b; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your SPTM account. Click the button below to create a new password.
              </p>
              
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0 32px;">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Link fallback -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0; word-break: break-all;">
                  <a href="${resetLink}" style="color: #3b82f6; font-size: 14px; text-decoration: none;">${resetLink}</a>
                </p>
              </div>
              
              <!-- Warning -->
              <div style="border-left: 4px solid #f59e0b; background-color: #fffbeb; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                </p>
              </div>
              
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                For security reasons, this link can only be used once.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px;">
                      This email was sent by SPTM - Smart Public Transport Management
                    </p>
                    <p style="margin: 0 0 16px; color: #94a3b8; font-size: 13px;">
                      © ${new Date().getFullYear()} SPTM. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      If you have any questions, contact us at 
                      <a href="mailto:support@sptm.com" style="color: #3b82f6; text-decoration: none;">support@sptm.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private getPasswordResetSuccessTemplate(userName: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed Successfully</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 16px 16px 0 0;">
              <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 28px; color: #ffffff;">✓</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Password Changed</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 22px; font-weight: 600;">Success!</h2>
              <p style="margin: 0 0 24px; color: #64748b; font-size: 16px; line-height: 1.6;">
                Hello ${userName || 'there'},
              </p>
              <p style="margin: 0 0 24px; color: #64748b; font-size: 16px; line-height: 1.6;">
                Your password has been successfully changed. You can now log in to your SPTM account with your new password.
              </p>
              
              <!-- Success Box -->
              <div style="background-color: #ecfdf5; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
                <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 500;">
                  🔐 Your account is now secure
                </p>
              </div>
              
              <!-- Warning -->
              <div style="border-left: 4px solid #ef4444; background-color: #fef2f2; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
                  <strong>🚨 Didn't make this change?</strong><br>
                  If you didn't change your password, please contact our support team immediately at 
                  <a href="mailto:support@sptm.com" style="color: #ef4444;">support@sptm.com</a>
                </p>
              </div>
              
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; color: #94a3b8; font-size: 13px;">
                      This email was sent by SPTM - Smart Public Transport Management
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 13px;">
                      © ${new Date().getFullYear()} SPTM. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

export const emailService = new EmailService();
