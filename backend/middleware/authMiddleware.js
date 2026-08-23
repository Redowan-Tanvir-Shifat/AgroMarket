import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'agromarket_bangladesh_secret_key_2026');

    // Fetch user from DB
    const [users] = await pool.query(
      'SELECT id, full_name, email, phone, role, division, district, upazila, address FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'User account not found' });
    }

    req.user = users[0];

    // If user is a seller, attach seller profile ID
    if (req.user.role === 'seller') {
      const [sellers] = await pool.query('SELECT * FROM sellers WHERE user_id = ?', [req.user.id]);
      if (sellers.length > 0) {
        req.user.sellerProfile = sellers[0];
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires role: ${roles.join(' or ')}` });
    }
    next();
  };
};
