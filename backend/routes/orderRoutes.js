import express from 'express';
import {
  createOrder,
  getMyOrders,
  reorderOrder,
  updateOrderStatus,
  confirmOrderPayment,
  softDeleteOrder
} from '../controllers/orderController.js';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public or optional auth for createOrder (so demo guests can also checkout)
router.post('/', optionalAuth, createOrder);

// Authenticated / Soft-auth routes for smooth testing
router.get('/my-orders', optionalAuth, getMyOrders);
router.post('/:id/reorder', optionalAuth, reorderOrder);

router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/confirm-payment', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
}, confirmOrderPayment);

// Soft delete order (Buyer action: removes from buyer view, preserves in DB for admin)
router.delete('/:id', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
}, softDeleteOrder);

export default router;

