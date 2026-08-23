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
    return res.json({ user: req.user });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch user data.' });
  }
};
