import express from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Optional/Verified auth for wishlist endpoints
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, getWishlist);
router.post('/', optionalAuth, addToWishlist);
router.delete('/:productId', optionalAuth, removeFromWishlist);

export default router;
