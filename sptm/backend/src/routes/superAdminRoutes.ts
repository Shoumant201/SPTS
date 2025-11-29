import { Router } from 'express';
import { SuperAdminAuthController } from '../controllers/superAdminAuthController';
import { authenticate, authorizeRole, authorizeContext, authorizePermission } from '../middleware/auth';
import { validate, authSchemas } from '../middleware/validation';

const router = Router();

// All routes require super admin authentication and web context
router.use(authenticate);
router.use(authorizeRole('SUPER_ADMIN'));
router.use(authorizeContext(['web']));

// Profile management
router.get('/profile', SuperAdminAuthController.getProfile);
router.put('/profile', SuperAdminAuthController.updateProfile);
router.put('/change-password', validate(authSchemas.changePassword), SuperAdminAuthController.changePassword);

// Admin management (Super Admin has all permissions via '*')
router.get('/admins', SuperAdminAuthController.getAdmins);
router.post('/admins', validate(authSchemas.createAdmin), SuperAdminAuthController.createAdmin);
router.put('/admins/:id/status', SuperAdminAuthController.updateAdminStatus);

// Logout
router.post('/logout', SuperAdminAuthController.logout);

export default router;