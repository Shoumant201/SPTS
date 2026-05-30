import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/summary', AnalyticsController.getSummary);
router.get('/fleet', AnalyticsController.getFleetBreakdown);
router.get('/assignments', AnalyticsController.getAssignmentBreakdown);
router.get('/drivers', AnalyticsController.getDriverStats);
router.get('/routes', AnalyticsController.getRouteStats);

export default router;
