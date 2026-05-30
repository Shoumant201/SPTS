import express from 'express';
import { IncidentController } from '../controllers/incidentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Driver routes
router.post('/report', authenticate, IncidentController.reportIncident);
router.get('/my', authenticate, IncidentController.getDriverIncidents);

// Organization/Admin routes
router.get('/organization', authenticate, IncidentController.getOrganizationIncidents);
router.get('/active', authenticate, IncidentController.getActiveIncidents);
router.get('/stats', authenticate, IncidentController.getIncidentStats);
router.get('/:id', authenticate, IncidentController.getIncidentDetails);
router.patch('/:id/status', authenticate, IncidentController.updateIncidentStatus);

export default router;
