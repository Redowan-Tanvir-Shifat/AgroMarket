import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function initDatabase() {
  console.log('🌱 Initializing AgroMarket Database...');

  // Step 1: Connect without database selected to ensure DB exists
  const connection = await mysql.createConnection({
    host: DB_HOST || 'localhost',
    port: parseInt(DB_PORT || '3306'),
    user: DB_USER || 'root',
    password: DB_PASSWORD || 'password'
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database '${DB_NAME}' created or verified.`);
    await connection.changeUser({ database: DB_NAME });

    // Step 2: Create Tables
    console.log('📋 Creating SQL tables...');

    // Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('buyer', 'seller', 'admin') NOT NULL DEFAULT 'buyer',
        phone VARCHAR(20) NOT NULL UNIQUE,
        division VARCHAR(50) DEFAULT 'Dhaka',
        district VARCHAR(50) DEFAULT 'Dhaka',
        upazila VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Sellers Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sellers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        farm_name VARCHAR(150) NOT NULL,
        division VARCHAR(50) NOT NULL,
        district VARCHAR(50) NOT NULL,
        upazila VARCHAR(50),
        bio TEXT,
        nid_trade_license VARCHAR(50),
        payout_method ENUM('BKASH', 'NAGAD', 'ROCKET', 'BANK') DEFAULT 'BKASH',
        payout_number VARCHAR(20),
        rating_avg DECIMAL(3,2) DEFAULT 4.80,
        total_ratings INT DEFAULT 12,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Categories Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name_en VARCHAR(50) NOT NULL UNIQUE,
        name_bn VARCHAR(50) NOT NULL UNIQUE,
        slug VARCHAR(50) NOT NULL UNIQUE,
        icon_name VARCHAR(50) DEFAULT 'Sprout'
      ) ENGINE=InnoDB;
    `);

    // Products Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        category_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        title_bn VARCHAR(150),
        description TEXT,
        base_price_bdt DECIMAL(10,2) NOT NULL,
        min_floor_price_bdt DECIMAL(10,2) NOT NULL,
        stock_quantity INT NOT NULL DEFAULT 0,
        low_stock_threshold INT NOT NULL DEFAULT 10,
        harvest_date DATETIME NOT NULL,
        max_shelf_life_days INT NOT NULL DEFAULT 7,
        unit ENUM('kg', 'mon', 'dozen', 'piece', 'liter') NOT NULL DEFAULT 'kg',
        status ENUM('ACTIVE', 'LOW_STOCK', 'EXPIRED', 'OUT_OF_STOCK') DEFAULT 'ACTIVE',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB;
    `);

    // Orders Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buyer_id INT NOT NULL,
        order_number VARCHAR(50) NOT NULL UNIQUE,
        total_amount_bdt DECIMAL(10,2) NOT NULL,
        fulfillment_type ENUM('DELIVERY', 'PICKUP') DEFAULT 'DELIVERY',
        payment_method ENUM('BKASH', 'NAGAD', 'ROCKET', 'COD') DEFAULT 'BKASH',
        delivery_address TEXT,
        payment_status ENUM('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',
        order_status ENUM('PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Order Items Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        seller_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price_at_purchase_bdt DECIMAL(10,2) NOT NULL,
        subtotal_bdt DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Reviews Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        buyer_id INT NOT NULL,
        order_id INT,
        rating INT NOT NULL DEFAULT 5,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Wishlists Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buyer_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY user_prod_unique (buyer_id, product_id)
      ) ENGINE=InnoDB;
    `);

    // Create View for Real-Time Price Decay Calculation
    await connection.query(`
      CREATE OR REPLACE VIEW v_active_products AS
      SELECT 
        p.*,
        s.farm_name,
        s.division AS farm_division,
        s.district AS farm_district,
        s.upazila AS farm_upazila,
        s.rating_avg AS seller_rating,
        s.total_ratings AS seller_total_ratings,
        c.name_en AS category_name_en,
        c.name_bn AS category_name_bn,
        c.slug AS category_slug,
        TIMESTAMPDIFF(HOUR, p.harvest_date, NOW()) / 24.0 AS age_in_days,
        CASE 
          WHEN TIMESTAMPDIFF(HOUR, p.harvest_date, NOW()) / 24.0 >= p.max_shelf_life_days THEN 0.00
          WHEN (TIMESTAMPDIFF(HOUR, p.harvest_date, NOW()) / 24.0) / p.max_shelf_life_days <= 0.1 THEN p.base_price_bdt
          ELSE GREATEST(
            p.min_floor_price_bdt, 
            ROUND(p.base_price_bdt * (1 - (((TIMESTAMPDIFF(HOUR, p.harvest_date, NOW()) / 24.0) / p.max_shelf_life_days) - 0.1) * 0.7), 2)
          )
        END AS current_dynamic_price_bdt,
        CASE 
          WHEN TIMESTAMPDIFF(HOUR, p.harvest_date, NOW()) / 24.0 >= p.max_shelf_life_days THEN 'EXPIRED'
          WHEN p.stock_quantity <= 0 THEN 'OUT_OF_STOCK'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 'LOW_STOCK'
          ELSE 'ACTIVE'
        END AS computed_status
      FROM products p
      JOIN sellers s ON p.seller_id = s.id
      JOIN categories c ON p.category_id = c.id;
    `);

    console.log('✅ Tables and Active Products View created successfully.');

    // Step 3: Seed Default Data
    console.log('🌱 Seeding initial database records...');

    // Categories
    const categoriesData = [
      ['Fruits', 'ফলমূল', 'fruits', 'Apple'],
      ['Vegetables', 'শাকসবজি', 'vegetables', 'Carrot'],
      ['Rice & Grains', 'চাল ও খাদ্যশস্য', 'rice-grains', 'Wheat'],
      ['Spices', 'মসলাপাতি', 'spices', 'Flame'],
      ['Dairy & Eggs', 'দুগ্ধ ও ডিম', 'dairy-eggs', 'Milk']
    ];

    for (const cat of categoriesData) {
      await connection.query(
        `INSERT IGNORE INTO categories (name_en, name_bn, slug, icon_name) VALUES (?, ?, ?, ?)`,
        cat
      );
    }

    // Passwords hash
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Seed Users (Admin, Buyer, Farmers)
    // 1. Admin
    await connection.query(`
      INSERT IGNORE INTO users (full_name, email, password_hash, role, phone, division, district, address)
      VALUES ('System Admin', 'admin@agromarket.bd', ?, 'admin', '01700000000', 'Dhaka', 'Dhaka', 'Motijheel C/A, Dhaka')
    `, [hashedPassword]);

    // 2. Sample Buyer
    const [buyerResult] = await connection.query(`
      INSERT IGNORE INTO users (full_name, email, password_hash, role, phone, division, district, upazila, address)
      VALUES ('Tanvir Hossain', 'buyer@gmail.com', ?, 'buyer', '01711223344', 'Dhaka', 'Dhaka', 'Dhanmondi', 'House 42, Road 7A, Dhanmondi, Dhaka')
    `, [hashedPassword]);

    // 3. Farmer 1: Rajshahi Mango Farmer
    const [farmer1User] = await connection.query(`
      INSERT IGNORE INTO users (full_name, email, password_hash, role, phone, division, district, upazila, address)
      VALUES ('Md. Rafiqul Islam', 'rafiq.mango@agromarket.bd', ?, 'seller', '01715998877', 'Rajshahi', 'Rajshahi', 'Puthia', 'Puthia Mango Orchard, Rajshahi')
    `, [hashedPassword]);

    // 4. Farmer 2: Dinajpur Lychee & Rice Farmer
    const [farmer2User] = await connection.query(`
      INSERT IGNORE INTO users (full_name, email, password_hash, role, phone, division, district, upazila, address)
      VALUES ('Haji Tariqul Anam', 'tariq.dinajpur@agromarket.bd', ?, 'seller', '01812345678', 'Rangpur', 'Dinajpur', 'Biral', 'Biral Rice & Fruit Agro, Dinajpur')
    `, [hashedPassword]);

    // 5. Farmer 3: Bogura Fresh Vegetable Farmer
    const [farmer3User] = await connection.query(`
      INSERT IGNORE INTO users (full_name, email, password_hash, role, phone, division, district, upazila, address)
      VALUES ('Abul Kalam Azad', 'kalam.bogura@agromarket.bd', ?, 'seller', '01998765432', 'Rajshahi', 'Bogura', 'Mahasthangarh', 'Mahasthan Vegetable Farm, Bogura')
    `, [hashedPassword]);

    // Get User IDs for sellers
    const [userRows] = await connection.query(`SELECT id, email FROM users WHERE role = 'seller'`);
    for (const u of userRows) {
      if (u.email === 'rafiq.mango@agromarket.bd') {
        await connection.query(`
          INSERT IGNORE INTO sellers (user_id, farm_name, division, district, upazila, bio, nid_trade_license, payout_method, payout_number, rating_avg, total_ratings)
          VALUES (?, 'রাজশাহী অর্গানিক আম বাগান (Rajshahi Mango Hub)', 'Rajshahi', 'Rajshahi', 'Puthia', 'Premium chemical-free Rajshahi Himsagar and Langra mangoes direct from our orchard.', 'NID-1982736451', 'BKASH', '01715998877', 4.95, 48)
        `, [u.id]);
      } else if (u.email === 'tariq.dinajpur@agromarket.bd') {
        await connection.query(`
          INSERT IGNORE INTO sellers (user_id, farm_name, division, district, upazila, bio, nid_trade_license, payout_method, payout_number, rating_avg, total_ratings)
          VALUES (?, 'দিনাজপুর নাজিরশাইল ও লিচু এগ্রো', 'Rangpur', 'Dinajpur', 'Biral', 'Aromatic Katari Bhog, Miniket rice, and sweet China-3 lychees cultivated with organic fertilizer.', 'NID-5544332211', 'NAGAD', '01812345678', 4.88, 36)
        `, [u.id]);
      } else if (u.email === 'kalam.bogura@agromarket.bd') {
        await connection.query(`
          INSERT IGNORE INTO sellers (user_id, farm_name, division, district, upazila, bio, nid_trade_license, payout_method, payout_number, rating_avg, total_ratings)
          VALUES (?, 'বগুড়া মহাস্থান সবজি ভান্ডার', 'Rajshahi', 'Bogura', 'Mahasthangarh', 'Fresh daily harvested potatoes, green chilis, and seasonal vegetables straight from Bogura fertile fields.', 'NID-9988776655', 'BKASH', '01998765432', 4.78, 29)
        `, [u.id]);
      }
    }

    // Get category & seller IDs
    const [categories] = await connection.query(`SELECT id, slug FROM categories`);
    const catMap = {};
    categories.forEach(c => catMap[c.slug] = c.id);

    const [sellers] = await connection.query(`SELECT id, farm_name FROM sellers`);
    const seller1 = sellers.find(s => s.farm_name.includes('Rajshahi'))?.id;
    const seller2 = sellers.find(s => s.farm_name.includes('দিনাজপুর'))?.id;
    const seller3 = sellers.find(s => s.farm_name.includes('বগুড়া'))?.id;

    if (seller1 && seller2 && seller3) {
      // Clear old products to seed fresh realistic data
      await connection.query(`DELETE FROM products`);

      const now = new Date();
      // Helper date modifiers
      const hoursAgo = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');

      const seedProducts = [
        [
          seller1,
          catMap['fruits'],
          'Rajshahi Premium Himsagar Mango (রাজশাহীর হিমসাগর আম)',
          'রাজশাহীর বিখ্যাত মিষ্ট ও সুস্বাদু তাজা হিমসাগর আম। কোনো ক্ষতিকারক রাসায়নিক বা ফরমালিন মুক্ত।',
          120.00,
          90.00,
          450,
          20,
          hoursAgo(14), // Harvested 14 hours ago (Super Fresh!)
          7,
          'kg',
          'ACTIVE',
          'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80'
        ],
        [
          seller1,
          catMap['fruits'],
          'Rajshahi Langra Mango Bulk Mon (রাজশাহীর ল্যাংড়া আম - ১ মন)',
          'পাইকারি ক্রয়ের জন্য সরাসরি পুঠিয়া বাগান থেকে তোলা ৪০ কেজি ল্যাংড়া আম।',
          3800.00,
          3100.00,
          25,
          5,
          hoursAgo(36), // Harvested 36 hours ago (Aging Deal starting!)
          6,
          'mon',
          'ACTIVE',
          'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=800&q=80'
        ],
        [
          seller2,
          catMap['rice-grains'],
          'Dinajpur Premium Miniket Rice (দিনাজপুরের মিনিকেট চাল)',
          'দিনাজপুরের বিরল অঞ্চলের সুগন্ধযুক্ত ও চিকন প্রিমিয়াম মিনিকেট চাল।',
          72.00,
          65.00,
          1200,
          100,
          hoursAgo(48),
          30,
          'kg',
          'ACTIVE',
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80'
        ],
        [
          seller2,
          catMap['fruits'],
          'Dinajpur China-3 Lychee (দিনাজপুরের চায়না-৩ লিচু)',
          'দিনাজপুরের ঐতিহ্যবাহী টুকটুকে লাল মিষ্টি চায়না-৩ রসালো লিচু (১০০ পিস)।',
          550.00,
          400.00,
          80,
          15,
          hoursAgo(18),
          5,
          'piece',
          'ACTIVE',
          'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&w=800&q=80'
        ],
        [
          seller3,
          catMap['vegetables'],
          'Bogura Fresh Granola Potato (বগুড়ার লাল আলু)',
          'বগুড়ার মহাস্থানগড় থেকে সদ্য তোলা তাজা লাল গ্রানোলা আলু।',
          35.00,
          25.00,
          850,
          50,
          hoursAgo(8),
          20,
          'kg',
          'ACTIVE',
          'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80'
        ],
        [
          seller3,
          catMap['spices'],
          'Pabna Local Fresh Onion (পাবনার দেশি পেঁয়াজ)',
          'দেশিঝাঁঝালো তাজা পেঁয়াজ, দীর্ঘদিন সংরক্ষণ উপযোগী।',
          70.00,
          55.00,
          500,
          40,
          hoursAgo(24),
          45,
          'kg',
          'ACTIVE',
          'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=800&q=80'
        ],
        [
          seller3,
          catMap['vegetables'],
          'Fresh Green Chili (কাঁচা মরিচ)',
          'বগুড়ার চর অঞ্চল থেকে সংগৃহীত ঝাল কাঁচা মরিচ।',
          90.00,
          50.00,
          150,
          10,
          hoursAgo(50), // Harvested 50 hours ago -> Dynamic Aging Deal Price!
          4,
          'kg',
          'ACTIVE',
          'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80'
        ]
      ];

      for (const p of seedProducts) {
        await connection.query(
          `INSERT INTO products (seller_id, category_id, title, description, base_price_bdt, min_floor_price_bdt, stock_quantity, low_stock_threshold, harvest_date, max_shelf_life_days, unit, status, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          p
        );
      }
      console.log('✅ Seeded Bangladeshi agricultural products successfully.');
    }

    console.log('🎉 Database setup & initial seeding complete!');

  } catch (err) {
    console.error('❌ Error initializing database:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

initDatabase().catch(err => {
  console.error(err);
  process.exit(1);
});
