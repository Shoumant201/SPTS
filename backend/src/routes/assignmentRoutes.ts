import { Router } from 'express';
import { AssignmentController } from '../controllers/assignmentController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', AssignmentController.getAssignments);
router.get('/my', AssignmentController.getMyAssignments);
router.post('/', AssignmentController.createAssignment);
router.put('/:id', AssignmentController.updateAssignment);
router.delete('/:id', AssignmentController.deleteAssignment);

export default router;
