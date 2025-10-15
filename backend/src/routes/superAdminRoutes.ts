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

// Admin CRUD (Super Admin only)
router.get('/admins', SuperAdminAuthController.getAdmins);
router.get('/admins/:id', SuperAdminAuthController.getAdmin);
router.post('/admins', validate(authSchemas.createAdmin), SuperAdminAuthController.createAdmin);
router.put('/admins/:id', SuperAdminAuthController.updateAdmin);
router.put('/admins/:id/status', SuperAdminAuthController.updateAdminStatus);
router.delete('/admins/:id', SuperAdminAuthController.deleteAdmin);

// Organization CRUD (Super Admin can manage all organizations)
router.get('/organizations', SuperAdminAuthController.getOrganizations);
router.get('/organizations/:id', SuperAdminAuthController.getOrganization);
router.post('/organizations', validate(authSchemas.createOrganization), SuperAdminAuthController.createOrganization);
router.put('/organizations/:id', SuperAdminAuthController.updateOrganization);
router.delete('/organizations/:id', SuperAdminAuthController.deleteOrganization);

// Logout
router.post('/logout', SuperAdminAuthController.logout);

export default router;