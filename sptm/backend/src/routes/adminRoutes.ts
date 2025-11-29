import { Router } from 'express';
import { AdminAuthController } from '../controllers/adminAuthController';
import { authenticate, authorizeRole, authorizeContext, authorizePermission } from '../middleware/auth';
import { validate, authSchemas } from '../middleware/validation';

const router = Router();

// All routes require admin authentication and web context
router.use(authenticate);
router.use(authorizeRole('ADMIN'));
router.use(authorizeContext(['web']));

// Profile management
router.get('/profile', AdminAuthController.getProfile);
router.put('/profile', AdminAuthController.updateProfile);
router.put('/change-password', validate(authSchemas.changePassword), AdminAuthController.changePassword);

// Organization management
router.get('/organizations', authorizePermission(['organizations:read']), AdminAuthController.getOrganizations);
router.post('/organizations', authorizePermission(['organizations:create']), validate(authSchemas.createOrganization), AdminAuthController.createOrganization);
router.get('/organizations/:id', authorizePermission(['organizations:read']), AdminAuthController.getOrganization);
router.put('/organizations/:id/status', authorizePermission(['organizations:update']), AdminAuthController.updateOrganizationStatus);

// Dashboard and analytics
router.get('/dashboard', authorizePermission(['system:metrics']), AdminAuthController.getDashboardData);

// Logout
router.post('/logout', AdminAuthController.logout);

export default router;