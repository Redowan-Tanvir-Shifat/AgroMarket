import express from 'express';
import { getProducts, getHomeSummary, getProductById } from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/home-summary', getHomeSummary);
router.get('/:id', getProductById);

export default router;
