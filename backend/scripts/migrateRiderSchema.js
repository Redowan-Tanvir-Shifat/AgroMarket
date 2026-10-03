import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL } = process.env;

async function migrateRiderSchema() {
  console.log('🚴 Starting Rider Schema Migration & Seeding...');

  const sslConfig = (DB_SSL === 'true' || DB_SSL === '1')
    ? { rejectUnauthorized: false }
    : undefined;

  const targetDb = DB_NAME || 'agromarket';
  const connection = await mysql.createConnection({
    host: DB_HOST || 'localhost',
    port: parseInt(DB_PORT || '3306'),
    user: DB_USER || 'root',
    password: DB_PASSWORD || 'password',
    database: targetDb,
    ssl: sslConfig
  });

  try {
    // 1. Modify users role column to include 'rider'
    console.log('1. Updating users table role column...');
    try {
      await connection.query(`
        ALTER TABLE users 
        MODIFY COLUMN role ENUM('buyer', 'seller', 'admin', 'rider') NOT NULL DEFAULT 'buyer'
      `);
      console.log('✅ users.role updated to include rider.');
    } catch (err) {
      console.log('ℹ️ users.role modification note:', err.message);
    }

    // 2. Create riders table
    console.log('2. Creating riders table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS riders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        vehicle_type ENUM('BICYCLE', 'MOTORCYCLE', 'VAN', 'PICKUP_VAN') DEFAULT 'MOTORCYCLE',
        vehicle_number VARCHAR(50),
        license_nid VARCHAR(50),
        status ENUM('IDLE', 'ASSIGNED', 'ON_DELIVERY', 'OFFLINE') DEFAULT 'IDLE',
        division VARCHAR(50) DEFAULT 'Dhaka',
        district VARCHAR(50) DEFAULT 'Dhaka',
        upazila VARCHAR(50),
        current_order_id INT NULL,
        total_deliveries INT DEFAULT 0,
        rating_avg DECIMAL(3,2) DEFAULT 4.90,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('✅ riders table ready.');

    // 3. Extend orders table with rider and live COD payment handshake columns
    console.log('3. Extending orders table with rider and payment handshake columns...');
    
    // Check and add rider_id
    try {
      await connection.query(`ALTER TABLE orders ADD COLUMN rider_id INT NULL`);
      console.log('✅ Added rider_id to orders');
    } catch (e) { /* already exists */ }

    try {
      await connection.query(`ALTER TABLE orders ADD COLUMN rider_assigned_at TIMESTAMP NULL`);
      console.log('✅ Added rider_assigned_at to orders');
    } catch (e) { /* already exists */ }

    try {
      await connection.query(`ALTER TABLE orders ADD COLUMN rider_accepted_at TIMESTAMP NULL`);
      console.log('✅ Added rider_accepted_at to orders');
    } catch (e) { /* already exists */ }

    try {
      await connection.query(`ALTER TABLE orders ADD COLUMN buyer_paid_confirmed TINYINT(1) DEFAULT 0`);
      console.log('✅ Added buyer_paid_confirmed to orders');
    } catch (e) { /* already exists */ }

    try {
      await connection.query(`ALTER TABLE orders ADD COLUMN rider_paid_confirmed TINYINT(1) DEFAULT 0`);
      console.log('✅ Added rider_paid_confirmed to orders');
    } catch (e) { /* already exists */ }

    // Modify order_status to support RIDER_ASSIGNED and DELIVERED_TO_RIDER
    try {
      await connection.query(`
        ALTER TABLE orders 
        MODIFY COLUMN order_status ENUM(
          'PENDING', 
          'PROCESSING', 
          'RIDER_ASSIGNED', 
          'DELIVERED_TO_RIDER', 
          'READY_FOR_PICKUP', 
          'SHIPPED', 
          'DELIVERED', 
          'CANCELLED'
        ) DEFAULT 'PENDING'
      `);
      console.log('✅ orders.order_status enum updated with rider statuses.');
    } catch (err) {
      console.log('ℹ️ order_status modification note:', err.message);
    }

    // 4. Seed 3 Active Bangladeshi Riders
    console.log('4. Seeding default demo riders...');
    const hashedPassword = await bcrypt.hash('password', 10);

    const testRiders = [
      {
        fullName: 'করিম রাইডার (Karim Rider)',
        phone: '01700000003',
        email: 'karim.rider@agromarket.bd',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Mirpur',
        address: 'Mirpur-10, Dhaka',
        vehicleType: 'MOTORCYCLE',
        vehicleNumber: 'ঢাকা মেট্রো-হ ১২-৩৪৫৬',
        licenseNid: 'NID-19942691234567890',
        status: 'IDLE',
        rating: 4.95,
        deliveries: 42
      },
      {
        fullName: 'সুমন হোসেন (Sumon Hossain)',
        phone: '01700000004',
        email: 'sumon.rider@agromarket.bd',
        division: 'Rajshahi',
        district: 'Rajshahi',
        upazila: 'Boalia',
        address: 'Shaheb Bazar, Rajshahi',
        vehicleType: 'BICYCLE',
        vehicleNumber: 'রাজশাহী-বাইক-৮৮',
        licenseNid: 'NID-19985698765432100',
        status: 'IDLE',
        rating: 4.88,
        deliveries: 28
      },
      {
        fullName: 'তারিকুল ইসলাম (Tariqul Islam)',
        phone: '01700000005',
        email: 'tariqul.rider@agromarket.bd',
        division: 'Dhaka',
        district: 'Dhaka',
        upazila: 'Savar',
        address: 'Savar Bazar, Dhaka',
        vehicleType: 'PICKUP_VAN',
        vehicleNumber: 'ঢাকা মেট্রো-ড ৫৬-৭৮৯০',
        licenseNid: 'NID-19911234567890123',
        status: 'IDLE',
        rating: 4.92,
        deliveries: 65
      }
    ];

    for (const r of testRiders) {
      // Check if user exists
      const [existingUsers] = await connection.query('SELECT id FROM users WHERE phone = ?', [r.phone]);
      let userId;
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
        await connection.query(
          'UPDATE users SET role = "rider", full_name = ?, division = ?, district = ?, address = ? WHERE id = ?',
          [r.fullName, r.division, r.district, r.address, userId]
        );
      } else {
        const [userResult] = await connection.query(
          `INSERT INTO users (full_name, email, password_hash, role, phone, division, district, upazila, address)
           VALUES (?, ?, ?, 'rider', ?, ?, ?, ?, ?)`,
          [r.fullName, r.email, hashedPassword, r.phone, r.division, r.district, r.upazila, r.address]
        );
        userId = userResult.insertId;
      }

      // Check if rider record exists
      const [existingRiders] = await connection.query('SELECT id FROM riders WHERE user_id = ?', [userId]);
      if (existingRiders.length > 0) {
        await connection.query(
          `UPDATE riders SET 
           vehicle_type = ?, vehicle_number = ?, license_nid = ?, status = 'IDLE', division = ?, district = ?, rating_avg = ?, total_deliveries = ?
           WHERE user_id = ?`,
          [r.vehicleType, r.vehicleNumber, r.licenseNid, r.division, r.district, r.rating, r.deliveries, userId]
        );
      } else {
        await connection.query(
          `INSERT INTO riders (user_id, vehicle_type, vehicle_number, license_nid, status, division, district, upazila, total_deliveries, rating_avg)
           VALUES (?, ?, ?, ?, 'IDLE', ?, ?, ?, ?, ?)`,
          [userId, r.vehicleType, r.vehicleNumber, r.licenseNid, r.division, r.district, r.upazila, r.deliveries, r.rating]
        );
      }
      console.log(`✅ Seeded rider: ${r.fullName} (${r.phone} / password)`);
    }

    console.log('🎉 Rider migration & seed finished successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await connection.end();
  }
}

migrateRiderSchema();
