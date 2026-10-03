import express from 'express';
import { createReview, updateReview, deleteReview } from '../controllers/reviewController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', optionalAuth, createReview);
router.put('/:id', optionalAuth, updateReview);
router.delete('/:id', optionalAuth, deleteReview);

export default router;
