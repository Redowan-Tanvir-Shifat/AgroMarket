import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getWishlist);
router.post('/', optionalAuth, addToWishlist);
router.delete('/:productId', optionalAuth, removeFromWishlist);

export default router;
