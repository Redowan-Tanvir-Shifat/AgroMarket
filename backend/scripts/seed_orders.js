import pool from '../config/db.js';

async function seedOrders() {
  try {
    const [s2Check] = await pool.query('SELECT COUNT(*) as c FROM order_items WHERE seller_id = 2');
    if (s2Check[0].c === 0) {
      // Order 5 for Seller 2 (Miniket Rice & Lychee - Delivery)
      const [o5] = await pool.query(`
        INSERT INTO orders (buyer_id, order_number, total_amount_bdt, fulfillment_type, payment_method, delivery_address, payment_status, order_status)
        VALUES (1, 'AGRO-2026-3049', 2450.00, 'DELIVERY', 'BKASH', 'House 14, Road 5, Dhanmondi, Dhaka', 'PAID', 'PENDING')
      `);
      await pool.query(`
        INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price_at_purchase_bdt, subtotal_bdt)
        VALUES (?, 3, 2, 25, 78.00, 1950.00)
      `, [o5.insertId]);
      await pool.query(`
        INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price_at_purchase_bdt, subtotal_bdt)
        VALUES (?, 4, 2, 2, 250.00, 500.00)
      `, [o5.insertId]);

      // Order 6 for Seller 2 (Pickup)
      const [o6] = await pool.query(`
        INSERT INTO orders (buyer_id, order_number, total_amount_bdt, fulfillment_type, payment_method, delivery_address, payment_status, order_status)
        VALUES (2, 'AGRO-2026-6180', 780.00, 'PICKUP', 'COD', 'Farm Gate Pickup - Birol, Dinajpur', 'PENDING', 'READY_FOR_PICKUP')
      `);
      await pool.query(`
        INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price_at_purchase_bdt, subtotal_bdt)
        VALUES (?, 3, 2, 10, 78.00, 780.00)
      `, [o6.insertId]);
      console.log('Added demo orders for Seller 2');
    }

    // Add a PENDING order for Seller 1 if none exists
    const [s1Pending] = await pool.query(`
      SELECT COUNT(*) as c FROM orders o 
      JOIN order_items oi ON o.id = oi.order_id 
      WHERE oi.seller_id = 1 AND o.order_status = 'PENDING'
    `);
    if (s1Pending[0].c === 0) {
      const [o7] = await pool.query(`
        INSERT INTO orders (buyer_id, order_number, total_amount_bdt, fulfillment_type, payment_method, delivery_address, payment_status, order_status)
        VALUES (1, 'AGRO-2026-7721', 1900.00, 'DELIVERY', 'BKASH', 'Apartment 4B, Banani DOHS, Dhaka', 'PAID', 'PENDING')
      `);
      await pool.query(`
        INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price_at_purchase_bdt, subtotal_bdt)
        VALUES (?, 1, 1, 20, 95.00, 1900.00)
      `, [o7.insertId]);
      console.log('Added PENDING demo order for Seller 1');
    }

    console.log('Order seeding completed!');
  } catch (err) {
    console.error('Error seeding orders:', err);
  } finally {
    process.exit();
  }
}

seedOrders();
