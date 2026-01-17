import { Router } from 'express';
import { PasswordResetController } from '../controllers/passwordResetController';

const router = Router();

// Request password reset (send email)
router.post('/request', PasswordResetController.requestReset);

// Validate reset token
router.get('/validate/:token', PasswordResetController.validateToken);

// Reset password with token
router.post('/reset', PasswordResetController.resetPassword);

export default router;
