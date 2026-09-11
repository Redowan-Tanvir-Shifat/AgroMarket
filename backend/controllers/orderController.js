import pool from '../config/db.js';
import { createNotificationRecord } from './notificationController.js';

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
        'PENDING'
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

    // 3. Dispatch real-time notifications to each seller whose produce was ordered
    try {
      const sellerGroups = {};
      for (const item of items) {
        const sId = item.seller_id || 1;
        if (!sellerGroups[sId]) {
          sellerGroups[sId] = { itemsCount: 0, subtotal: 0 };
        }
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice) || Number(item.price) || 0;
        sellerGroups[sId].itemsCount += qty;
        sellerGroups[sId].subtotal += price * qty;
      }

      for (const [sId, sData] of Object.entries(sellerGroups)) {
        const [sellers] = await pool.query('SELECT user_id, farm_name FROM sellers WHERE id = ?', [sId]);
        if (sellers.length > 0) {
          const sellerUser = sellers[0];
          await createNotificationRecord({
            userId: sellerUser.user_id,
            sellerId: parseInt(sId),
            type: 'ORDER_NEW',
            title: `New Order Received! #${orderNumber}`,
            title_bn: `নতুন অর্ডার এসেছে! #${orderNumber}`,
            message: `Customer ordered ৳${sData.subtotal.toLocaleString()} worth of fresh produce (${sData.itemsCount} items).`,
            message_bn: `ক্রেতা ৳${sData.subtotal.toLocaleString()} টাকার তাজা ফসল অর্ডার করেছেন (${sData.itemsCount} টি পণ্য)।`,
            link: '/seller/orders'
          });
        }
      }
    } catch (notifErr) {
      console.error('Non-blocking error dispatching order notification:', notifErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: {
        id: orderId,
        orderNumber,
        totalAmount,
        fulfillmentType,
        paymentMethod,
        orderStatus: 'PENDING',
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

    // 1. Fetch orders (excluding orders deleted by this buyer)
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE buyer_id = ? AND deleted_by_buyer = 0 ORDER BY created_at DESC`,
      [buyerId]
    );

    if (orders.length === 0) {
      return res.json({ orders: [] });
    }

    const orderIds = orders.map((o) => o.id);

    // 2. Fetch items for these orders with seller/farm details
    const [items] = await pool.query(
      `SELECT oi.*, p.title, p.title_bn, p.image_url, p.unit, s.farm_name, s.district as farm_district, s.division as farm_division, s.upazila as farm_upazila, u.full_name as farmer_name, u.phone as farmer_phone
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN sellers s ON oi.seller_id = s.id
       LEFT JOIN users u ON s.user_id = u.id
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

    // Dispatch real-time alert to the buyer
    try {
      const [orders] = await pool.query('SELECT buyer_id, order_number FROM orders WHERE id = ?', [id]);
      if (orders.length > 0) {
        const order = orders[0];
        let title = `Order Update: #${order.order_number}`;
        let title_bn = `অর্ডার আপডেট: #${order.order_number}`;
        let message = `Your order status changed to ${status}.`;
        let message_bn = `আপনার অর্ডারের বর্তমান অবস্থা: ${status}।`;

        if (status === 'PROCESSING') {
          title = `Order Being Packaged #${order.order_number}`;
          title_bn = `অর্ডার প্যাকেজিং শুরু হয়েছে #${order.order_number}`;
          message = `The farm has begun harvesting and packaging your produce.`;
          message_bn = `খামার থেকে আপনার তাজা ফসল তোলা ও প্যাকেজিং শুরু হয়েছে।`;
        } else if (status === 'READY_FOR_PICKUP') {
          title = `Ready for Pickup! #${order.order_number}`;
          title_bn = `সংগ্রহের জন্য প্রস্তুত! #${order.order_number}`;
          message = `Your produce is packed and ready at the farm gate.`;
          message_bn = `আপনার ফসল প্রস্তুত রয়েছে, খামার গেট থেকে সংগ্রহ করতে পারেন।`;
        } else if (status === 'SHIPPED') {
          title = `Order In Transit #${order.order_number}`;
          title_bn = `অর্ডার কুরিয়ারে প্রেরিত #${order.order_number}`;
          message = `Your parcel is on the way to your delivery address.`;
          message_bn = `আপনার ঠিকানায় পাঠানোর জন্য পার্সেলটি কুরিয়ারে হস্তান্তর করা হয়েছে।`;
        } else if (status === 'DELIVERED') {
          title = `Order Delivered #${order.order_number}`;
          title_bn = `অর্ডার ডেলিভারি সম্পন্ন #${order.order_number}`;
          message = `Your fresh crops have been delivered. Enjoy and leave a review!`;
          message_bn = `আপনার তাজা ফসল পৌঁছে গেছে। অনুগ্রহ করে একটি রিভিউ দিন!`;
        }

        await createNotificationRecord({
          userId: order.buyer_id,
          type: 'ORDER_STATUS',
          title,
          title_bn,
          message,
          message_bn,
          link: '/buyer/orders'
        });
      }
    } catch (notifErr) {
      console.error('Non-blocking error dispatching buyer status notification:', notifErr);
    }

    return res.json({ success: true, message: `Order status updated to ${status}`, status });
  } catch (err) {
    console.error('Error updating order status:', err);
    return res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
};

// @desc Buyer confirms COD payment upon delivery
// @route PATCH /api/orders/:id/confirm-payment
export const confirmOrderPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await pool.query(
      'UPDATE orders SET payment_status = "PAID", order_status = "DELIVERED" WHERE id = ?',
      [id]
    );

    return res.json({
      success: true,
      message: 'পেমেন্ট সফলভাবে সম্পন্ন হয়েছে এবং ডেলিভারি নিশ্চিত হয়েছে (Payment confirmed & delivered)',
      order: {
        id: parseInt(id),
        payment_status: 'PAID',
        order_status: 'DELIVERED'
      }
    });
  } catch (err) {
    console.error('Error confirming order payment:', err);
    return res.status(500).json({ message: 'Failed to confirm payment', error: err.message });
  }
};

// @desc Soft delete order (Buyer action: sets deleted_by_buyer = 1)
// @route DELETE /api/orders/:id
export const softDeleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'অর্ডার পাওয়া যায়নি (Order not found)' });
    }

    // Mark as deleted by buyer only (buyer's UI). Admin preserves record in DB.
    await pool.query(
      `UPDATE orders 
       SET deleted_by_buyer = 1, 
           deleted_at = NOW(), 
           is_deleted = CASE WHEN deleted_by_seller = 1 THEN 1 ELSE 0 END 
       WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'অর্ডারটি সফলভাবে আপনার তালিকা থেকে মুছে ফেলা হয়েছে (Order removed from buyer view)'
    });
  } catch (err) {
    console.error('Error soft deleting buyer order:', err);
    return res.status(500).json({ message: 'অর্ডার মোছা ব্যর্থ হয়েছে (Failed to delete order)', error: err.message });
  }
};

