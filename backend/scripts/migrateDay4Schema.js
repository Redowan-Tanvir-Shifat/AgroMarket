import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function migrate() {
  console.log('🔄 Running Day 4 Database Migration for Cloudinary & Media Uploads...');

  const connection = await mysql.createConnection({
    host: DB_HOST || 'localhost',
    port: parseInt(DB_PORT || '3306'),
    user: DB_USER || 'root',
    password: DB_PASSWORD || 'password',
    database: DB_NAME || 'agromarket'
  });

  try {
    // 1. Check & add columns to `sellers` table
    const [sellerColumns] = await connection.query(`SHOW COLUMNS FROM sellers;`);
    const colNames = sellerColumns.map(c => c.Field);

    if (!colNames.includes('cover_image_url')) {
      await connection.query(`ALTER TABLE sellers ADD COLUMN cover_image_url TEXT NULL AFTER bio;`);
      console.log('✅ Added cover_image_url to sellers table');
    }

    if (!colNames.includes('logo_image_url')) {
      await connection.query(`ALTER TABLE sellers ADD COLUMN logo_image_url TEXT NULL AFTER cover_image_url;`);
      console.log('✅ Added logo_image_url to sellers table');
    }

    if (!colNames.includes('owner_image_url')) {
      await connection.query(`ALTER TABLE sellers ADD COLUMN owner_image_url TEXT NULL AFTER logo_image_url;`);
      console.log('✅ Added owner_image_url to sellers table');
    }

    // 2. Check & add columns to `users` table
    const [userColumns] = await connection.query(`SHOW COLUMNS FROM users;`);
    const userColNames = userColumns.map(c => c.Field);

    if (!userColNames.includes('avatar_url')) {
      await connection.query(`ALTER TABLE users ADD COLUMN avatar_url TEXT NULL AFTER address;`);
      console.log('✅ Added avatar_url to users table');
    }

    // 3. Create `product_images` table for max 5 photos per produce
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Table product_images verified/created');

    // 4. Populate product_images for existing products
    await connection.query(`
      INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
      SELECT id, image_url, 1, 0 FROM products
      WHERE image_url IS NOT NULL AND image_url != ''
      AND id NOT IN (SELECT DISTINCT product_id FROM product_images);
    `);
    console.log('✅ Populated existing product image records into product_images');

    // 5. Also create notifications and chat tables if not exist for Day 4
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        title_bn VARCHAR(150),
        message TEXT NOT NULL,
        message_bn TEXT,
        link VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Table notifications verified/created');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buyer_id INT NOT NULL,
        seller_id INT NOT NULL,
        product_id INT NULL,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Table conversations verified/created');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        sender_id INT NOT NULL,
        sender_role ENUM('buyer', 'seller') NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('✅ Table messages verified/created');

    console.log('🎉 Day 4 Database Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration error:', err);
  } finally {
    await connection.end();
  }
}

migrate();
