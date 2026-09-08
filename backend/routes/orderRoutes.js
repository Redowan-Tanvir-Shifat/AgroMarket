import express from 'express';
import { createOrder, getMyOrders, reorderOrder, updateOrderStatus } from '../controllers/orderController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public or optional auth for createOrder (so demo guests can also checkout)
router.post('/', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
}, createOrder);

// Authenticated routes
router.get('/my-orders', verifyToken, getMyOrders);
router.post('/:id/reorder', verifyToken, reorderOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;
