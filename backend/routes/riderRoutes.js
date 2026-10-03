import express from 'express';
import {
  getRiderProfile,
  getAvailableRiders,
  assignRiderToOrder,
  acceptRide,
  confirmBuyerPayment,
  confirmRiderPayment,
  completePrepaidDelivery,
  toggleRiderStatus,
  getRiderHistory
} from '../controllers/riderController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', optionalAuth, getRiderProfile);
router.get('/available', optionalAuth, getAvailableRiders);
router.post('/assign', optionalAuth, assignRiderToOrder);
router.post('/accept', optionalAuth, acceptRide);
router.post('/confirm-buyer-payment', optionalAuth, confirmBuyerPayment);
router.post('/confirm-rider-payment', optionalAuth, confirmRiderPayment);
router.post('/complete-delivery', optionalAuth, completePrepaidDelivery);
router.post('/status', optionalAuth, toggleRiderStatus);
router.get('/history', optionalAuth, getRiderHistory);

export default router;
