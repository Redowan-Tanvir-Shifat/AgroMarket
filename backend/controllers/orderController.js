import pool from '../config/db.js';

// @desc Create a new order with bKash/Nagad/Rocket/COD & Delivery vs Pickup
// @route POST /api/orders
export const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { items, fulfillmentType, paymentMethod, deliveryAddress, totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart items cannot be empty.' });
    }

    // Buyer ID from verified JWT or default to 1 for demo/guest if not provided
    const buyerId = req.user ? req.user.id : 1;

    // Generate unique Bangladeshi Agricultural Order Number e.g. AGRO-2026-8742
    const orderNumber = `AGRO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    await connection.beginTransaction();

    // 1. Insert into orders table
    const [orderResult] = await connection.query(
      `INSERT INTO orders 
       (buyer_id, order_number, total_amount_bdt, fulfillment_type, payment_method, delivery_address, payment_status, order_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        buyerId,
        orderNumber,
        totalAmount,
        fulfillmentType || 'DELIVERY',
        paymentMethod || 'BKASH',
        deliveryAddress || 'Dhaka, Bangladesh',
        paymentMethod === 'COD' ? 'PENDING' : 'PAID',
        'PROCESSING'
      ]
    );

    const orderId = orderResult.insertId;

    // 2. Insert items into order_items and update stock
    for (const item of items) {
      // Look up seller_id if not present
      let sellerId = item.seller_id;
      if (!sellerId) {
        const [prod] = await connection.query('SELECT seller_id FROM products WHERE id = ?', [item.id]);
        sellerId = prod.length > 0 ? prod[0].seller_id : 1;
      }

      const itemQty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || Number(item.price) || 0;
      const subtotal = unitPrice * itemQty;

      await connection.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price_at_purchase_bdt, subtotal_bdt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.id, sellerId, itemQty, unitPrice, subtotal]
      );

      // Decrement product stock safely
      await connection.query(
        `UPDATE products 
         SET stock_quantity = GREATEST(0, stock_quantity - ?) 
         WHERE id = ?`,
        [itemQty, item.id]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully 🌾',
      order: {
        id: orderId,
        orderNumber,
        totalAmount,
        fulfillmentType,
        paymentMethod,
        orderStatus: 'PROCESSING',
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error('Error creating order:', err);
    return res.status(500).json({ message: 'Failed to complete checkout.', error: err.message });
  } finally {
    connection.release();
  }
};

// @desc Get authenticated buyer's orders with items
// @route GET /api/orders/my-orders
export const getMyOrders = async (req, res) => {
  try {
    const buyerId = req.user ? req.user.id : 1;

    // 1. Fetch orders
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC`,
      [buyerId]
    );

    if (orders.length === 0) {
      return res.json({ orders: [] });
    }

    const orderIds = orders.map((o) => o.id);

    // 2. Fetch items for these orders
    const [items] = await pool.query(
      `SELECT oi.*, p.title, p.title_bn, p.image_url, p.unit, s.farm_name, s.district as farm_district
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN sellers s ON oi.seller_id = s.id
       WHERE oi.order_id IN (?)`,
      [orderIds]
    );

    // 3. Attach items to corresponding orders
    const ordersWithItems = orders.map((order) => {
      const orderItems = items.filter((it) => it.order_id === order.id);
      return {
        ...order,
        items: orderItems
      };
    });

    return res.json({ orders: ordersWithItems });
  } catch (err) {
    console.error('Error fetching buyer orders:', err);
    return res.status(500).json({ message: 'Failed to fetch order history.', error: err.message });
  }
};

// @desc 1-Click Reorder: fetches current items and latest dynamic prices
// @route POST /api/orders/:id/reorder
export const reorderOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const [items] = await pool.query(
      `SELECT oi.product_id, oi.quantity, p.*
       FROM order_items oi
       JOIN v_active_products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json({ message: 'Previous order items not found or products expired.' });
    }

    return res.json({
      success: true,
      items: items.map((it) => ({
        id: it.id,
        title: it.title,
        title_bn: it.title_bn,
        image_url: it.image_url,
        unit: it.unit,
        selectedUnit: it.unit,
        unitPrice: parseFloat(it.current_dynamic_price_bdt || it.base_price_bdt),
        basePrice: it.base_price_bdt,
        farm_name: it.farm_name,
        farm_district: it.farm_district,
        quantity: it.quantity
      }))
    });
  } catch (err) {
    console.error('Error during reorder:', err);
    return res.status(500).json({ message: 'Failed to reorder items.', error: err.message });
  }
};

// @desc Update Order Status (Seller fulfillment in Day 3 / Admin / Status advance)
// @route PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    await pool.query('UPDATE orders SET order_status = ? WHERE id = ?', [status, id]);

    return res.json({ success: true, message: `Order status updated to ${status}`, status });
  } catch (err) {
    console.error('Error updating order status:', err);
    return res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
};

