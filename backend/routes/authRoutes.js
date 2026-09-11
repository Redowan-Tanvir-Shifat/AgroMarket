import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getBuyerStats
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);
router.get('/buyer-stats', verifyToken, getBuyerStats);

export default router;
