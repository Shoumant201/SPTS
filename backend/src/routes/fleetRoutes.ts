import { Router } from 'express';
import { FleetController } from '../controllers/fleetController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Vehicle CRUD
router.get('/', FleetController.getVehicles);
router.get('/:id', FleetController.getVehicle);
router.post('/', FleetController.createVehicle);
router.put('/:id', FleetController.updateVehicle);
router.delete('/:id', FleetController.deleteVehicle);

// IoT device management
router.post('/:vehicleId/regenerate-token', FleetController.regenerateDeviceToken);

export default router;
