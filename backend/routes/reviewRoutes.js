import express from 'express';
import { createReview, updateReview, deleteReview } from '../controllers/reviewController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Optional/Verified auth for review operations
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
};

router.post('/', optionalAuth, createReview);
router.put('/:id', optionalAuth, updateReview);
router.delete('/:id', optionalAuth, deleteReview);

export default router;
