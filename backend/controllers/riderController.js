import pool from '../config/db.js';
import { emitToUser, emitToSeller, emitToRider, broadcastEvent } from '../socket/socketManager.js';
import { createNotificationRecord } from './notificationController.js';

/**
 * Helper to resolve rider ID safely
 */
const resolveRiderId = async (req) => {
  if (req.user?.riderProfile?.id) return req.user.riderProfile.id;
  if (req.user?.id) {
    const [riders] = await pool.query('SELECT id FROM riders WHERE user_id = ?', [req.user.id]);
    if (riders.length > 0) return riders[0].id;
  }
  if (req.query?.riderId) return parseInt(req.query.riderId);
  if (req.body?.riderId) return parseInt(req.body.riderId);
  return 1; // Default demo rider
};

/**
 * @desc Get current rider's profile, active delivery mission, and stats
 * @route GET /api/rider/profile
 */
export const getRiderProfile = async (req, res) => {
  try {
    const riderId = await resolveRiderId(req);

    const [riders] = await pool.query(
      `SELECT r.*, u.full_name, u.phone, u.email, u.avatar_url, u.address as user_address
       FROM riders r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [riderId]
    );

    if (riders.length === 0) {
      return res.status(404).json({ message: 'Rider profile not found' });
    }

    const rider = riders[0];

    // Fetch active assignments/deliveries
    const [activeOrders] = await pool.query(
      `SELECT o.*, u.full_name as buyer_name, u.phone as buyer_phone
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       WHERE o.rider_id = ? AND o.order_status IN ('RIDER_ASSIGNED', 'DELIVERED_TO_RIDER')
       ORDER BY o.created_at DESC`,
      [riderId]
    );

    // Fetch items and farm details for active orders
    for (const order of activeOrders) {
      const [items] = await pool.query(
        `SELECT oi.*, p.title, p.title_bn, p.image_url, p.unit, s.farm_name, s.district as farm_district, s.division as farm_division, s.upazila as farm_upazila, u.full_name as farmer_name, u.phone as farmer_phone
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN sellers s ON oi.seller_id = s.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
      if (items.length > 0) {
        order.farm = {
          name: items[0].farm_name,
          farmerName: items[0].farmer_name,
          farmerPhone: items[0].farmer_phone,
          district: items[0].farm_district,
          division: items[0].farm_division,
          upazila: items[0].farm_upazila
        };
      }
    }

    return res.json({
      success: true,
      rider,
      activeOrders
    });
  } catch (err) {
    console.error('Error fetching rider profile:', err);
    return res.status(500).json({ message: 'Failed to fetch rider profile', error: err.message });
  }
};

/**
 * @desc Get all available (IDLE) riders for farms to select
 * @route GET /api/rider/available
 */
export const getAvailableRiders = async (req, res) => {
  try {
    const { district, division } = req.query;

    const cleanDistrict = district && district !== 'undefined' && district !== 'null' ? district.trim().toLowerCase() : '';
    const cleanDivision = division && division !== 'undefined' && division !== 'null' ? division.trim().toLowerCase() : '';

    let query = `
      SELECT r.id, r.user_id, r.vehicle_type, r.vehicle_number, r.status, r.division, r.district, r.rating_avg, r.total_deliveries,
             u.full_name, u.phone, u.avatar_url,
             (CASE 
                WHEN ? != '' AND LOWER(r.district) = ? THEN 2
                WHEN ? != '' AND LOWER(r.division) = ? THEN 1
                ELSE 0 
              END) as is_nearby
      FROM riders r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'IDLE'
      ORDER BY is_nearby DESC, r.rating_avg DESC, r.total_deliveries DESC
    `;

    const [riders] = await pool.query(query, [cleanDistrict, cleanDistrict, cleanDivision, cleanDivision]);

    return res.json({ success: true, riders });
  } catch (err) {
    console.error('Error fetching available riders:', err);
    return res.status(500).json({ message: 'Failed to fetch riders', error: err.message });
  }
};

/**
 * @desc Farm assigns an IDLE rider to an order
 * @route POST /api/rider/assign
 */
export const assignRiderToOrder = async (req, res) => {
  try {
    const { orderId, riderId } = req.body;

    if (!orderId || !riderId) {
      return res.status(400).json({ message: 'orderId and riderId are required.' });
    }

    // 1. Check order
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    const order = orders[0];

    // 2. Check rider
    const [riders] = await pool.query(
      `SELECT r.*, u.full_name, u.phone FROM riders r JOIN users u ON r.user_id = u.id WHERE r.id = ?`,
      [riderId]
    );
    if (riders.length === 0) {
      return res.status(404).json({ message: 'Rider not found.' });
    }
    const rider = riders[0];

    // 3. Update order: rider_id, rider_assigned_at, order_status -> RIDER_ASSIGNED
    await pool.query(
      `UPDATE orders 
       SET rider_id = ?, rider_assigned_at = NOW(), order_status = 'RIDER_ASSIGNED'
       WHERE id = ?`,
      [riderId, orderId]
    );

    // 4. Update rider: status = 'ASSIGNED', current_order_id = orderId
    await pool.query(
      `UPDATE riders SET status = 'ASSIGNED', current_order_id = ? WHERE id = ?`,
      [orderId, riderId]
    );

    // 5. Send real-time notification to the rider
    await createNotificationRecord({
      userId: rider.user_id,
      type: 'ORDER',
      title: 'নতুন ডেলিভারি অনুরোধ!',
      title_bn: 'নতুন ডেলিভারি অনুরোধ এসেছে!',
      message: `অর্ডার #${order.order_number} ডেলিভারির জন্য আপনাকে নির্বাচন করা হয়েছে। অনুগ্রহ করে গ্রহণ করুন।`,
      message_bn: `অর্ডার #${order.order_number} ডেলিভারির জন্য আপনাকে নির্বাচন করা হয়েছে। অনুগ্রহ করে গ্রহণ করুন।`,
      link: '/rider/dashboard'
    });

    // 6. Socket emit to rider
    emitToRider(riderId, 'new_delivery_request', {
      orderId,
      orderNumber: order.order_number,
      totalAmount: order.total_amount_bdt,
      paymentMethod: order.payment_method,
      deliveryAddress: order.delivery_address
    });

    // 7. Socket emit to buyer & farm
    emitToUser(order.buyer_id, 'order_status_updated', {
      orderId,
      orderNumber: order.order_number,
      newStatus: 'RIDER_ASSIGNED',
      riderName: rider.full_name,
      riderPhone: rider.phone,
      vehicleType: rider.vehicle_type
    });

    broadcastEvent('order_updated', { orderId, orderStatus: 'RIDER_ASSIGNED' });

    return res.json({
      success: true,
      message: 'রাইডার সফলভাবে নির্ধারণ করা হয়েছে। রাইডারের নিশ্চিতকরণের অপেক্ষা করা হচ্ছে।',
      rider: {
        id: rider.id,
        name: rider.full_name,
        phone: rider.phone,
        vehicleType: rider.vehicle_type
      }
    });
  } catch (err) {
    console.error('Error assigning rider:', err);
    return res.status(500).json({ message: 'Failed to assign rider', error: err.message });
  }
};

/**
 * @desc Rider accepts the assigned delivery
 * @route POST /api/rider/accept
 */
export const acceptRide = async (req, res) => {
  try {
    const { orderId } = req.body;
    const riderId = await resolveRiderId(req);

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required.' });
    }

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    const order = orders[0];

    const [riders] = await pool.query(
      `SELECT r.*, u.full_name, u.phone FROM riders r JOIN users u ON r.user_id = u.id WHERE r.id = ?`,
      [riderId]
    );
    const rider = riders[0];

    // Update order status to DELIVERED_TO_RIDER
    await pool.query(
      `UPDATE orders 
       SET order_status = 'DELIVERED_TO_RIDER', rider_accepted_at = NOW()
       WHERE id = ?`,
      [orderId]
    );

    // Update rider status to ON_DELIVERY
    await pool.query(
      `UPDATE riders SET status = 'ON_DELIVERY', current_order_id = ? WHERE id = ?`,
      [orderId, riderId]
    );

    // Find sellers of this order to notify farm
    const [items] = await pool.query(
      `SELECT DISTINCT oi.seller_id, s.user_id as seller_user_id
       FROM order_items oi
       JOIN sellers s ON oi.seller_id = s.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    // Notify farm
    for (const item of items) {
      emitToSeller(item.seller_id, 'ride_accepted', {
        orderId,
        orderNumber: order.order_number,
        riderName: rider?.full_name,
        riderPhone: rider?.phone,
        newStatus: 'DELIVERED_TO_RIDER'
      });
      if (item.seller_user_id) {
        await createNotificationRecord({
          userId: item.seller_user_id,
          sellerId: item.seller_id,
          type: 'ORDER',
          title: 'রাইডার পণ্য গ্রহণ করেছেন',
          title_bn: 'রাইডার পণ্য গ্রহণ করেছেন',
          message: `রাইডার ${rider?.full_name} অর্ডার #${order.order_number} ডেলিভারির জন্য খামার থেকে গ্রহণ করেছেন।`,
          message_bn: `রাইডার ${rider?.full_name} অর্ডার #${order.order_number} ডেলিভারির জন্য খামার থেকে গ্রহণ করেছেন।`,
          link: '/seller/orders'
        });
      }
    }

    // Notify buyer
    emitToUser(order.buyer_id, 'order_status_updated', {
      orderId,
      orderNumber: order.order_number,
      newStatus: 'DELIVERED_TO_RIDER',
      riderName: rider?.full_name,
      riderPhone: rider?.phone,
      vehicleType: rider?.vehicle_type
    });

    await createNotificationRecord({
      userId: order.buyer_id,
      type: 'ORDER',
      title: 'পণ্য ডেলিভারির পথে!',
      title_bn: 'পণ্য ডেলিভারির পথে!',
      message: `রাইডার ${rider?.full_name} খামার থেকে আপনার তাজা পণ্য সংগ্রহ করেছেন এবং আপনার ঠিকানায় আসছেন।`,
      message_bn: `রাইডার ${rider?.full_name} খামার থেকে আপনার তাজা পণ্য সংগ্রহ করেছেন এবং আপনার ঠিকানায় আসছেন।`,
      link: '/account/orders'
    });

    broadcastEvent('order_updated', { orderId, orderStatus: 'DELIVERED_TO_RIDER' });

    return res.json({
      success: true,
      message: 'রাইড গ্রহণ সফল হয়েছে! পণ্য খামার থেকে গ্রহণ করে গ্রাহকের ঠিকানায় পৌঁছে দিন।',
      orderStatus: 'DELIVERED_TO_RIDER'
    });
  } catch (err) {
    console.error('Error accepting ride:', err);
    return res.status(500).json({ message: 'Failed to accept ride', error: err.message });
  }
};

/**
 * Helper to broadcast and emit order delivery & payment completion across all channels (Farm, Buyer, Rider)
 */
const notifyOrderDelivered = async (orderId, order) => {
  try {
    const [items] = await pool.query(
      `SELECT DISTINCT oi.seller_id, s.user_id as seller_user_id
       FROM order_items oi
       JOIN sellers s ON oi.seller_id = s.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    const payload = {
      orderId,
      orderNumber: order.order_number,
      orderStatus: 'DELIVERED',
      newStatus: 'DELIVERED',
      paymentStatus: 'PAID',
      buyer_paid_confirmed: 1,
      rider_paid_confirmed: 1
    };

    // 1. Broadcast to all connected clients (farm orders page, buyer app, rider portal)
    broadcastEvent('payment_handshake_complete', payload);
    broadcastEvent('order_updated', payload);
    broadcastEvent('order_status_updated', payload);

    // 2. Direct to Buyer
    emitToUser(order.buyer_id, 'payment_handshake_complete', payload);
    emitToUser(order.buyer_id, 'order_status_updated', payload);

    // 3. Direct to Rider
    if (order.rider_id) {
      emitToRider(order.rider_id, 'payment_handshake_complete', payload);
      emitToRider(order.rider_id, 'order_status_updated', payload);
    }

    // 4. Direct to All Involved Farms / Sellers
    for (const item of items) {
      emitToSeller(item.seller_id, 'payment_handshake_complete', payload);
      emitToSeller(item.seller_id, 'order_updated', payload);
      emitToSeller(item.seller_id, 'order_status_updated', payload);

      if (item.seller_user_id) {
        emitToUser(item.seller_user_id, 'payment_handshake_complete', payload);
        emitToUser(item.seller_user_id, 'order_updated', payload);
        emitToUser(item.seller_user_id, 'order_status_updated', payload);

        await createNotificationRecord({
          userId: item.seller_user_id,
          sellerId: item.seller_id,
          type: 'ORDER',
          title: 'ডেলিভারি সম্পন্ন হয়েছে!',
          title_bn: 'ডেলিভারি সম্পন্ন হয়েছে!',
          message: `অর্ডার #${order.order_number}-এর ডেলিভারি সফলভাবে সম্পন্ন হয়েছে ও পেমেন্ট গৃহীত হয়েছে।`,
          message_bn: `অর্ডার #${order.order_number}-এর ডেলিভারি সফলভাবে সম্পন্ন হয়েছে ও পেমেন্ট গৃহীত হয়েছে।`,
          link: '/seller/orders'
        });
      }
    }
  } catch (notifErr) {
    console.error('Non-blocking error in notifyOrderDelivered:', notifErr);
  }
};

/**
 * @desc Buyer confirms cash payment to rider (COD dual handshake)
 * @route POST /api/rider/confirm-buyer-payment
 */
export const confirmBuyerPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });
    const order = orders[0];

    // Mark buyer paid confirmed
    await pool.query('UPDATE orders SET buyer_paid_confirmed = 1 WHERE id = ?', [orderId]);

    // Check if rider also already confirmed
    const isBothConfirmed = order.rider_paid_confirmed === 1;

    if (isBothConfirmed) {
      // Complete Order!
      await pool.query(
        `UPDATE orders 
         SET payment_status = 'PAID', order_status = 'DELIVERED'
         WHERE id = ?`,
        [orderId]
      );

      // Release rider
      if (order.rider_id) {
        await pool.query(
          `UPDATE riders 
           SET status = 'IDLE', current_order_id = NULL, total_deliveries = total_deliveries + 1
           WHERE id = ?`,
          [order.rider_id]
        );
      }

      await notifyOrderDelivered(orderId, order);

      return res.json({
        success: true,
        bothConfirmed: true,
        message: 'পেমেন্ট ও ডেলিভারি উভয় পক্ষ দ্বারা সফলভাবে নিশ্চিত হয়েছে!'
      });
    } else {
      // Notify rider, farm and all listeners that buyer has pressed payment confirmed
      const singleConfirmPayload = {
        orderId,
        orderNumber: order.order_number,
        buyer_paid_confirmed: 1,
        rider_paid_confirmed: 0,
        message: 'গ্রাহক ক্যাশ পরিশোধ নিশ্চিত করেছেন। আপনার কনফার্মেশনের অপেক্ষা করা হচ্ছে।'
      };

      if (order.rider_id) {
        emitToRider(order.rider_id, 'buyer_payment_confirmed', singleConfirmPayload);
      }
      broadcastEvent('buyer_payment_confirmed', singleConfirmPayload);
      broadcastEvent('order_updated', singleConfirmPayload);

      return res.json({
        success: true,
        bothConfirmed: false,
        message: 'আপনার পেমেন্ট প্রদান নিশ্চিত হয়েছে। রাইডার ক্যাশ বুঝে নিয়ে নিশ্চিত করলেই ডেলিভারি সম্পন্ন হবে।'
      });
    }
  } catch (err) {
    console.error('Error confirming buyer payment:', err);
    return res.status(500).json({ message: 'Failed to confirm buyer payment', error: err.message });
  }
};

/**
 * @desc Rider confirms cash payment received from buyer (COD dual handshake)
 * @route POST /api/rider/confirm-rider-payment
 */
export const confirmRiderPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });
    const order = orders[0];

    // Mark rider paid confirmed
    await pool.query('UPDATE orders SET rider_paid_confirmed = 1 WHERE id = ?', [orderId]);

    // Check if buyer also already confirmed
    const isBothConfirmed = order.buyer_paid_confirmed === 1;

    if (isBothConfirmed) {
      // Complete Order!
      await pool.query(
        `UPDATE orders 
         SET payment_status = 'PAID', order_status = 'DELIVERED'
         WHERE id = ?`,
        [orderId]
      );

      // Release rider
      if (order.rider_id) {
        await pool.query(
          `UPDATE riders 
           SET status = 'IDLE', current_order_id = NULL, total_deliveries = total_deliveries + 1
           WHERE id = ?`,
          [order.rider_id]
        );
      }

      await notifyOrderDelivered(orderId, order);

      return res.json({
        success: true,
        bothConfirmed: true,
        message: 'পেমেন্ট ও ডেলিভারি উভয় পক্ষ দ্বারা সফলভাবে নিশ্চিত হয়েছে!'
      });
    } else {
      // Notify buyer, farm and all listeners that rider has confirmed receiving cash
      const singleConfirmPayload = {
        orderId,
        orderNumber: order.order_number,
        buyer_paid_confirmed: 0,
        rider_paid_confirmed: 1,
        message: 'রাইডার ক্যাশ বুঝে পেয়েছেন বলে নিশ্চিত করেছেন। অনুগ্রহ করে আপনিও কনফার্ম করুন।'
      };

      emitToUser(order.buyer_id, 'rider_payment_confirmed', singleConfirmPayload);
      broadcastEvent('rider_payment_confirmed', singleConfirmPayload);
      broadcastEvent('order_updated', singleConfirmPayload);

      return res.json({
        success: true,
        bothConfirmed: false,
        message: 'আপনি ক্যাশ গ্রহণ নিশ্চিত করেছেন। গ্রাহক পেমেন্ট নিশ্চিত করলেই অর্ডারটি সফলভাবে সম্পন্ন হবে।'
      });
    }
  } catch (err) {
    console.error('Error confirming rider payment:', err);
    return res.status(500).json({ message: 'Failed to confirm rider payment', error: err.message });
  }
};

/**
 * @desc Rider completes a prepaid delivery (bKash/Nagad/Rocket)
 * @route POST /api/rider/complete-delivery
 */
export const completePrepaidDelivery = async (req, res) => {
  try {
    const { orderId } = req.body;
    const riderId = await resolveRiderId(req);

    if (!orderId) return res.status(400).json({ message: 'orderId is required' });

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });
    const order = orders[0];

    // Update order status to DELIVERED
    await pool.query('UPDATE orders SET order_status = "DELIVERED" WHERE id = ?', [orderId]);

    // Release rider
    await pool.query(
      `UPDATE riders 
       SET status = 'IDLE', current_order_id = NULL, total_deliveries = total_deliveries + 1
       WHERE id = ?`,
      [riderId]
    );

    await notifyOrderDelivered(orderId, order);

    return res.json({
      success: true,
      message: 'পণ্য সফলভাবে গ্রাহকের কাছে হস্তান্তর করা হয়েছে!'
    });
  } catch (err) {
    console.error('Error completing prepaid delivery:', err);
    return res.status(500).json({ message: 'Failed to complete delivery', error: err.message });
  }
};

/**
 * @desc Toggle rider status between IDLE and OFFLINE
 * @route POST /api/rider/status
 */
export const toggleRiderStatus = async (req, res) => {
  try {
    const riderId = await resolveRiderId(req);
    const { status } = req.body; // 'IDLE' or 'OFFLINE'

    if (!['IDLE', 'OFFLINE'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Choose IDLE or OFFLINE.' });
    }

    await pool.query('UPDATE riders SET status = ? WHERE id = ?', [status, riderId]);

    return res.json({
      success: true,
      status,
      message: `রাইডার স্ট্যাটাস পরিবর্তিত হয়ে '${status}' হয়েছে।`
    });
  } catch (err) {
    console.error('Error toggling rider status:', err);
    return res.status(500).json({ message: 'Failed to toggle status', error: err.message });
  }
};

/**
 * @desc Get rider completed deliveries history & COD collections
 * @route GET /api/rider/history
 */
export const getRiderHistory = async (req, res) => {
  try {
    const riderId = await resolveRiderId(req);

    const [orders] = await pool.query(
      `SELECT o.*, u.full_name as buyer_name, u.phone as buyer_phone
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       WHERE o.rider_id = ? AND o.order_status = 'DELIVERED'
       ORDER BY o.created_at DESC
       LIMIT 50`,
      [riderId]
    );

    const totalDeliveries = orders.length;
    const totalCodCollected = orders
      .filter((o) => o.payment_method === 'COD')
      .reduce((sum, o) => sum + Number(o.total_amount_bdt || 0), 0);

    return res.json({
      success: true,
      orders,
      stats: {
        totalDeliveries,
        totalCodCollected
      }
    });
  } catch (err) {
    console.error('Error fetching rider history:', err);
    return res.status(500).json({ message: 'Failed to fetch history', error: err.message });
  }
};
