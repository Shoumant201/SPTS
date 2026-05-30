import express from 'express';
import { TripController } from '../controllers/tripController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Driver trip management
router.post('/start', authenticate, TripController.startTrip);
router.patch('/:id/end', authenticate, TripController.endTrip);
router.get('/my', authenticate, TripController.getDriverTrips);
router.get('/active', authenticate, TripController.getActiveTrip);
router.get('/earnings', authenticate, TripController.getDriverEarnings);
router.get('/stats', authenticate, TripController.getTripStats);

export default router;
