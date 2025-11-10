import { Router } from 'express';
import { PhoneAuthController } from '../controllers/phoneAuthController';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for OTP requests
const otpRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // 3 requests per minute per IP
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for OTP verification
const verifyRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 verification attempts per 5 minutes per IP
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @swagger
 * /api/phone-auth/send-otp:
 *   post:
 *     summary: Send OTP for login or registration
 *     tags: [Phone Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - purpose
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number (with or without country code)
 *                 example: "+9779812345678"
 *               purpose:
 *                 type: string
 *                 enum: [LOGIN, REGISTRATION]
 *                 description: Purpose of OTP
 *               role:
 *                 type: string
 *                 enum: [PASSENGER, DRIVER]
 *                 description: User role (required for registration)
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 expiresIn:
 *                   type: number
 *       400:
 *         description: Bad request
 *       404:
 *         description: Phone number not registered (for login)
 *       409:
 *         description: Phone number already registered (for registration)
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/send-otp', otpRateLimit, PhoneAuthController.sendOtp);

/**
 * @swagger
 * /api/phone-auth/verify-otp:
 *   post:
 *     summary: Verify OTP and login/register user
 *     tags: [Phone Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - code
 *               - purpose
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 example: "+9779812345678"
 *               code:
 *                 type: string
 *                 description: 6-digit OTP code
 *                 example: "123456"
 *               purpose:
 *                 type: string
 *                 enum: [LOGIN, REGISTRATION]
 *               name:
 *                 type: string
 *                 description: User name (required for registration)
 *               role:
 *                 type: string
 *                 enum: [PASSENGER, DRIVER]
 *                 description: User role (required for registration)
 *               deviceToken:
 *                 type: string
 *                 description: Device token for push notifications
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     expiresIn:
 *                       type: number
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found (for login)
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/verify-otp', verifyRateLimit, PhoneAuthController.verifyOtp);

/**
 * @swagger
 * /api/phone-auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Phone Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 expiresIn:
 *                   type: number
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh-token', PhoneAuthController.refreshToken);

/**
 * @swagger
 * /api/phone-auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Phone Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceToken:
 *                 type: string
 *                 description: Device token to remove
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticate, PhoneAuthController.logout);

/**
 * @swagger
 * /api/phone-auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Phone Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', authenticate, PhoneAuthController.getProfile);

/**
 * @swagger
 * /api/phone-auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Phone Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User name
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authenticate, PhoneAuthController.updateProfile);

export default router;