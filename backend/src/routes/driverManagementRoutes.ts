import express from 'express';
import { DriverManagementController } from '../controllers/driverManagementController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Organization routes (for managing drivers)
router.get(
  '/organization/search',
  authenticate,
  DriverManagementController.searchDrivers
);

router.post(
  '/organization/send-request',
  authenticate,
  DriverManagementController.sendJoinRequest
);

router.get(
  '/organization/requests',
  authenticate,
  DriverManagementController.getOrganizationRequests
);

router.delete(
  '/organization/requests/:requestId',
  authenticate,
  DriverManagementController.cancelJoinRequest
);

router.get(
  '/organization/drivers',
  authenticate,
  DriverManagementController.getOrganizationDrivers
);

router.delete(
  '/organization/drivers/:driverId',
  authenticate,
  DriverManagementController.removeDriver
);

// Driver routes (for managing own profile and requests)
router.post(
  '/driver/validate-license',
  authenticate,
  DriverManagementController.validateLicense
);

router.get(
  '/driver/profile',
  authenticate,
  DriverManagementController.getDriverProfile
);

router.put(
  '/driver/profile',
  authenticate,
  DriverManagementController.updateDriverProfile
);

router.get(
  '/driver/requests',
  authenticate,
  DriverManagementController.getDriverRequests
);

router.post(
  '/driver/requests/:requestId/respond',
  authenticate,
  DriverManagementController.respondToRequest
);

export default router;
