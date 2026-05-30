import express from 'express';
import { authenticate, authorizeRole } from '../middleware/auth';
import { LocationController } from '../controllers/locationController';

const router = express.Router();

// Shift lifecycle (driver only)
router.post('/shift/start', authenticate, authorizeRole('DRIVER'), LocationController.startShift);
router.post('/shift/end', authenticate, authorizeRole('DRIVER'), LocationController.endShift);
router.get('/shift/status', authenticate, authorizeRole('DRIVER'), LocationController.getShiftStatus);

// Driver posts their GPS position (driver app only)
router.post('/', authenticate, authorizeRole('DRIVER'), LocationController.updateLocation);

// Dashboard/passenger app reads all live driver positions
router.get('/live', authenticate, LocationController.getLiveLocations);

export default router;
