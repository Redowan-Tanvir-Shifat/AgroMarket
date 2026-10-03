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
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public storefront
router.get('/storefront/:sellerId', getStorefront);

// Protected Seller Portal Endpoints
router.get('/dashboard', optionalAuth, getSellerDashboardStats);
router.get('/products', optionalAuth, getSellerProducts);
router.get('/products/:id', optionalAuth, getSellerProductById);
router.post('/products', optionalAuth, createProduct);
router.put('/products/:id', optionalAuth, updateProduct);
router.patch('/products/:id/stock', optionalAuth, updateProductStock);
router.delete('/products/:id', optionalAuth, deleteProduct);
router.get('/orders', optionalAuth, getSellerOrders);
router.patch('/orders/:id/status', optionalAuth, updateSellerOrderStatus);
router.delete('/orders/:id', optionalAuth, softDeleteSellerOrder);
router.get('/profile', optionalAuth, getSellerProfile);
router.put('/profile', optionalAuth, updateSellerProfile);

export default router;
