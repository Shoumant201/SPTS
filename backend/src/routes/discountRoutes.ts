import express from 'express';
import {
  applyForDiscount,
  getMyApplications,
  getActiveDiscount,
  getApplicationById,
  cancelApplication,
  getAllApplications,
  reviewApplication,
  calculateFareWithDiscount,
} from '../controllers/discountController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Passenger routes
router.post('/apply', authenticate, applyForDiscount);
router.get('/my-applications', authenticate, getMyApplications);
router.get('/active', authenticate, getActiveDiscount);
router.get('/application/:id', authenticate, getApplicationById);
router.post('/cancel/:id', authenticate, cancelApplication);
router.post('/calculate-fare', authenticate, calculateFareWithDiscount);

// Admin routes (TODO: Add admin middleware)
router.get('/all', authenticate, getAllApplications);
router.post('/review/:id', authenticate, reviewApplication);

export default router;
