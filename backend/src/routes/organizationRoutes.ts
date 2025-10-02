import { Router } from 'express';
import { OrganizationController } from '../controllers/organizationController';
import { authenticate, authorizeRole, authorizeOrganization, authorizePermission } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Super Admin only routes
router.get('/', authorizeRole('SUPER_ADMIN'), OrganizationController.getAllOrganizations);
router.post('/', authorizeRole('SUPER_ADMIN'), OrganizationController.createOrganization);

// Organization access routes with boundary enforcement
router.get('/:id', authorizeOrganization, authorizePermission(['organizations:read']), OrganizationController.getOrganization);
router.put('/:id', authorizeRole('ADMIN'), authorizePermission(['organizations:update']), OrganizationController.updateOrganization);
router.get('/:id/users', authorizeOrganization, authorizePermission(['users:read']), OrganizationController.getOrganizationUsers);
router.get('/:id/vehicles', authorizeOrganization, authorizePermission(['vehicles:read']), OrganizationController.getOrganizationVehicles);

export default router;