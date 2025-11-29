import { Router } from 'express';
import { OrganizationAuthController } from '../controllers/organizationAuthController';
import { authenticate, authorizeRole, authorizeOrganization, authorizeContext, authorizePermission } from '../middleware/auth';
import { validate, authSchemas } from '../middleware/validation';

const router = Router();

// All routes require organization authentication and web context
router.use(authenticate);
router.use(authorizeRole('ORGANIZATION'));
router.use(authorizeContext(['web']));

// Profile management
router.get('/profile', OrganizationAuthController.getProfile);
router.put('/profile', OrganizationAuthController.updateProfile);
router.put('/change-password', validate(authSchemas.changePassword), OrganizationAuthController.changePassword);

// Fleet management (organization boundary enforced)
router.get('/drivers', authorizeOrganization, authorizePermission(['drivers:read']), OrganizationAuthController.getDrivers);
router.get('/drivers/:id', authorizeOrganization, authorizePermission(['drivers:read']), OrganizationAuthController.getDriver);
router.put('/drivers/:id/status', authorizeOrganization, authorizePermission(['drivers:update']), OrganizationAuthController.updateDriverStatus);

router.get('/vehicles', authorizeOrganization, authorizePermission(['vehicles:read']), OrganizationAuthController.getVehicles);

// Dashboard and analytics (organization-specific)
router.get('/dashboard', authorizeOrganization, authorizePermission(['organization:read']), OrganizationAuthController.getDashboardData);
router.get('/fleet-performance', authorizeOrganization, authorizePermission(['organization:read']), OrganizationAuthController.getFleetPerformance);

// Logout
router.post('/logout', OrganizationAuthController.logout);

export default router;