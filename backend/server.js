import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initSocketServer } from './socket/socketManager.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io Real-Time Core
initSocketServer(server);

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlists', wishlistRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Root and Health check endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'AgroMarket API & Socket.io Server running smoothly 🌾',
    endpoints: {
      health: '/api/health',
      products: '/api/products'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AgroMarket API & Socket.io Server running smoothly 🌾' });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AgroMarket API & Socket.io Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});
