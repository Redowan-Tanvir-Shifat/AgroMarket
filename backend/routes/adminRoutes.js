import express from 'express';
import {
  getAdminOverview,
  getAdminSellers,
  updateSellerVerification,
  getPriceDecayRadar
} from '../controllers/adminController.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all admin routes
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/overview', getAdminOverview);
router.get('/sellers', getAdminSellers);
router.patch('/sellers/:id/verify', updateSellerVerification);
router.get('/price-decay-radar', getPriceDecayRadar);

export default router;
