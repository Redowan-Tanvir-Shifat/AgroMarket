import express from 'express';
import {
  getStorefront,
  getSellerDashboardStats,
  getSellerProducts,
  getSellerProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  getSellerOrders,
  updateSellerOrderStatus,
  getSellerProfile,
  updateSellerProfile,
  softDeleteSellerOrder
} from '../controllers/sellerController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware: if bearer token is present verify it, otherwise proceed
const softAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }
  next();
};

// Public storefront
router.get('/storefront/:sellerId', getStorefront);

// Protected Seller Portal Endpoints
router.get('/dashboard', softAuth, getSellerDashboardStats);
router.get('/products', softAuth, getSellerProducts);
router.get('/products/:id', softAuth, getSellerProductById);
router.post('/products', softAuth, createProduct);
router.put('/products/:id', softAuth, updateProduct);
router.patch('/products/:id/stock', softAuth, updateProductStock);
router.delete('/products/:id', softAuth, deleteProduct);
router.get('/orders', softAuth, getSellerOrders);
router.patch('/orders/:id/status', softAuth, updateSellerOrderStatus);
router.delete('/orders/:id', softAuth, softDeleteSellerOrder);
router.get('/profile', softAuth, getSellerProfile);
router.put('/profile', softAuth, updateSellerProfile);

export default router;
