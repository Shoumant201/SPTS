import { Router } from 'express';
import { RouteController } from '../controllers/routeController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required) - for passengers
router.get('/public', RouteController.getPublicRoutes);
router.get('/public/search', RouteController.searchRoutes);
router.get('/public/:id', RouteController.getPublicRoute);

// Protected routes (authentication required) - for organizations/admins
router.use(authenticate);

router.get('/', RouteController.getRoutes);
router.get('/:id', RouteController.getRoute);
router.post('/', RouteController.createRoute);
router.put('/:id', RouteController.updateRoute);
router.delete('/:id', RouteController.deleteRoute);

export default router;
