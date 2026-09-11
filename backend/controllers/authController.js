import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'agromarket_bangladesh_secret_key_2026';

// @desc Register User (Buyer or Farmer/Seller)
// @route POST /api/auth/register
export const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      role = 'buyer',
      division = 'Dhaka',
      district = 'Dhaka',
      upazila = '',
      address = '',
      // Seller specific fields
      farmName,
      farmDivision,
      farmDistrict,
      farmUpazila,
      farmAddress,
      nidTradeLicense,
      payoutMethod = 'BKASH',
      payoutNumber
    } = req.body;

    // Validation
    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: 'Full name, phone number, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (role === 'seller' && (!farmName || !farmDistrict)) {
      return res.status(400).json({ message: 'Farmer registration requires Farm Name and Farm District.' });
    }

    // Check if phone or email exists
    const [existingPhone] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existingPhone.length > 0) {
      return res.status(400).json({ message: 'This mobile number is already registered.' });
    }

    if (email && email.trim() !== '') {
      const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ message: 'This email address is already registered.' });
      }
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert User
    const [userResult] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, phone, division, district, upazila, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName,
        email && email.trim() !== '' ? email.trim() : null,
        hashedPassword,
        role,
        phone,
        division,
        district,
        upazila,
        address
      ]
    );

    const userId = userResult.insertId;
    let sellerProfile = null;

    // If Seller, Insert into Sellers profile table
    if (role === 'seller') {
      const [sellerResult] = await pool.query(
        `INSERT INTO sellers (user_id, farm_name, division, district, upazila, bio, nid_trade_license, payout_method, payout_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          farmName,
          farmDivision || division,
          farmDistrict || district,
          farmUpazila || upazila,
          farmAddress || address,
          nidTradeLicense || null,
          payoutMethod,
          payoutNumber || phone
        ]
      );

      const [sellers] = await pool.query('SELECT * FROM sellers WHERE id = ?', [sellerResult.insertId]);
      sellerProfile = sellers[0];
    }

    // Generate Token
    const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });

    const userObj = {
      id: userId,
      fullName,
      email: email || '',
      phone,
      role,
      division,
      district,
      upazila,
      address,
      avatar_url: null,
      sellerProfile
    };

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: userObj
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ message: 'Failed to create account.', error: err.message });
  }
};

// @desc Login User (Mobile/Email + Password)
// @route POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide mobile number/email and password.' });
    }

    // Search user by phone or email
    const [users] = await pool.query(
      `SELECT * FROM users WHERE phone = ? OR email = ?`,
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid mobile number/email or password.' });
    }

    const user = users[0];

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid mobile number/email or password.' });
    }

    let sellerProfile = null;
    if (user.role === 'seller') {
      const [sellers] = await pool.query('SELECT * FROM sellers WHERE user_id = ?', [user.id]);
      if (sellers.length > 0) {
        sellerProfile = sellers[0];
      }
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const userObj = {
      id: user.id,
      fullName: user.full_name,
      email: user.email || '',
      phone: user.phone,
      role: user.role,
      division: user.division,
      district: user.district,
      upazila: user.upazila,
      address: user.address,
      avatar_url: user.avatar_url || null,
      sellerProfile
    };

    return res.json({
      message: 'Login successful!',
      token,
      user: userObj
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ message: 'Login server error.', error: err.message });
  }
};

// @desc Get Current User
// @route GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = req.user;
    const userObj = {
      id: user.id,
      fullName: user.full_name,
      full_name: user.full_name,
      email: user.email || '',
      phone: user.phone,
      role: user.role,
      division: user.division,
      district: user.district,
      upazila: user.upazila,
      address: user.address,
      avatar_url: user.avatar_url || null,
      sellerProfile: user.sellerProfile || null
    };
    return res.json({ user: userObj });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch user data.' });
  }
};

// @desc Update Profile (Name, Phone, Email, Location, Avatar)
// @route PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      fullName,
      email,
      phone,
      division,
      district,
      upazila,
      address,
      avatar_url
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    // Check if phone is changed and already taken by another user
    if (phone && phone.trim() !== req.user.phone) {
      const [existingPhone] = await pool.query('SELECT id FROM users WHERE phone = ? AND id != ?', [phone.trim(), userId]);
      if (existingPhone.length > 0) {
        return res.status(400).json({ message: 'This phone number is already registered to another user' });
      }
    }

    // Check if email is changed and already taken
    if (email && email.trim() !== '' && email.trim() !== req.user.email) {
      const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email.trim(), userId]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ message: 'This email address is already registered to another user' });
      }
    }

    await pool.query(
      `UPDATE users SET 
        full_name = ?,
        email = ?,
        phone = COALESCE(?, phone),
        division = COALESCE(?, division),
        district = COALESCE(?, district),
        upazila = COALESCE(?, upazila),
        address = COALESCE(?, address),
        avatar_url = COALESCE(?, avatar_url)
       WHERE id = ?`,
      [
        fullName.trim(),
        email && email.trim() !== '' ? email.trim() : null,
        phone ? phone.trim() : null,
        division || null,
        district || null,
        upazila || null,
        address || null,
        avatar_url !== undefined ? avatar_url : null,
        userId
      ]
    );

    // Fetch refreshed user
    const [updatedUsers] = await pool.query(
      'SELECT id, full_name, email, phone, role, division, district, upazila, address, avatar_url FROM users WHERE id = ?',
      [userId]
    );

    const updatedUser = updatedUsers[0];
    let sellerProfile = null;
    if (updatedUser.role === 'seller') {
      const [sellers] = await pool.query('SELECT * FROM sellers WHERE user_id = ?', [userId]);
      if (sellers.length > 0) {
        sellerProfile = sellers[0];
      }
    }

    const userObj = {
      id: updatedUser.id,
      fullName: updatedUser.full_name,
      full_name: updatedUser.full_name,
      email: updatedUser.email || '',
      phone: updatedUser.phone,
      role: updatedUser.role,
      division: updatedUser.division,
      district: updatedUser.district,
      upazila: updatedUser.upazila,
      address: updatedUser.address,
      avatar_url: updatedUser.avatar_url,
      sellerProfile
    };

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: userObj
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

// @desc Change Password
// @route PUT /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get current password hash
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedNew, userId]);

    return res.json({
      success: true,
      message: 'Password changed successfully!'
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ message: 'Failed to change password', error: err.message });
  }
};

// @desc Get Buyer Profile Stats (Orders count, Wishlist count, Total spent)
// @route GET /api/auth/buyer-stats
export const getBuyerStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Total orders count and spent amount (excluding cancelled orders from spent amount)
    const [ordersCountRows] = await pool.query(
      `SELECT 
        COUNT(*) as total_orders, 
        COALESCE(SUM(CASE WHEN order_status <> 'CANCELLED' THEN total_amount_bdt ELSE 0 END), 0) as total_spent 
       FROM orders 
       WHERE buyer_id = ? AND (deleted_by_buyer = 0 OR deleted_by_buyer IS NULL)`,
      [userId]
    );

    // Wishlist count
    const [wishlistRows] = await pool.query(
      'SELECT COUNT(*) as total_wishlist FROM wishlists WHERE buyer_id = ?',
      [userId]
    );

    const totalOrders = parseInt(ordersCountRows[0]?.total_orders, 10) || 0;
    const totalSpent = Math.round((parseFloat(ordersCountRows[0]?.total_spent) || 0) * 100) / 100;
    const totalWishlist = parseInt(wishlistRows[0]?.total_wishlist, 10) || 0;

    return res.json({
      success: true,
      stats: {
        totalOrders,
        totalSpent,
        totalWishlist
      }
    });
  } catch (err) {
    console.error('Buyer stats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch buyer stats', error: err.message });
  }
};

