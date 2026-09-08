import express from 'express';
import { getStorefront } from '../controllers/sellerController.js';

const router = express.Router();

// Public storefront
router.get('/storefront/:sellerId', getStorefront);

export default router;
