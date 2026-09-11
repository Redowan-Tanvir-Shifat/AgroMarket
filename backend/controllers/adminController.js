import pool from '../config/db.js';
import { createNotificationRecord } from './notificationController.js';

/**
 * @desc Get Platform Admin Overview & KPI Metrics
 * @route GET /api/admin/overview
 */
export const getAdminOverview = async (req, res) => {
  try {
    // 1. Farmer & Buyer statistics
    const [[farmerStats]] = await pool.query(`
      SELECT 
        COUNT(*) AS total_farmers,
        SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) AS verified_farmers,
        SUM(CASE WHEN verification_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_farmers
      FROM sellers
    `);

    const [[buyerStats]] = await pool.query(`
      SELECT COUNT(*) AS total_buyers FROM users WHERE role = 'buyer'
    `);

    // 2. Products statistics
    const [[productStats]] = await pool.query(`
      SELECT 
        COUNT(*) AS total_products,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_products,
        SUM(CASE WHEN status = 'LOW_STOCK' THEN 1 ELSE 0 END) AS low_stock_products
      FROM products
    `);

    // 3. Orders & GMV
    const [[orderStats]] = await pool.query(`
      SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(total_amount_bdt), 0) AS total_gmv_bdt,
        SUM(CASE WHEN order_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_orders,
        SUM(CASE WHEN order_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders
      FROM orders
    `);

    // 4. Regional division distribution of farms
    const [divisionDistribution] = await pool.query(`
      SELECT division, COUNT(*) AS farm_count 
      FROM sellers 
      GROUP BY division 
      ORDER BY farm_count DESC
    `);

    // 5. Recent 6 platform orders
    const [recentOrders] = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount_bdt,
        o.order_status,
        o.payment_method,
        o.payment_status,
        o.created_at,
        u.full_name AS buyer_name,
        u.phone AS buyer_phone
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 6
    `);

    return res.json({
      success: true,
      stats: {
        totalFarmers: farmerStats.total_farmers || 0,
        verifiedFarmers: farmerStats.verified_farmers || 0,
        pendingFarmers: farmerStats.pending_farmers || 0,
        totalBuyers: buyerStats.total_buyers || 0,
        totalProducts: productStats.total_products || 0,
        activeProducts: productStats.active_products || 0,
        lowStockProducts: productStats.low_stock_products || 0,
        totalOrders: orderStats.total_orders || 0,
        totalGmvBdt: parseFloat(orderStats.total_gmv_bdt || 0),
        deliveredOrders: orderStats.delivered_orders || 0,
        pendingOrders: orderStats.pending_orders || 0
      },
      divisionDistribution,
      recentOrders
    });
  } catch (err) {
    console.error('Error fetching admin overview:', err);
    return res.status(500).json({ message: 'Failed to fetch admin dashboard metrics', error: err.message });
  }
};

/**
 * @desc Get list of sellers for verification audit
 * @route GET /api/admin/sellers
 */
export const getAdminSellers = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        s.id,
        s.user_id,
        s.farm_name,
        s.division,
        s.district,
        s.upazila,
        s.bio,
        s.logo_image_url,
        s.cover_image_url,
        s.owner_image_url,
        s.nid_trade_license,
        s.verification_status,
        s.verification_notes,
        s.rating_avg,
        s.payout_method,
        s.payout_number,
        s.created_at,
        u.full_name AS owner_name,
        u.phone AS owner_phone,
        u.email AS owner_email,
        (SELECT COUNT(*) FROM products p WHERE p.seller_id = s.id) AS total_crops
      FROM sellers s
      JOIN users u ON s.user_id = u.id
    `;

    const params = [];
    if (status && status !== 'ALL') {
      query += ` WHERE s.verification_status = ?`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY FIELD(s.verification_status, 'PENDING', 'REJECTED', 'VERIFIED'), s.created_at DESC`;

    const [sellers] = await pool.query(query, params);

    return res.json({
      success: true,
      sellers
    });
  } catch (err) {
    console.error('Error fetching admin sellers:', err);
    return res.status(500).json({ message: 'Failed to fetch sellers list', error: err.message });
  }
};

/**
 * @desc Update Farmer Verification Status (Approve / Reject)
 * @route PATCH /api/admin/sellers/:id/verify
 */
export const updateSellerVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['VERIFIED', 'PENDING', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }

    const [sellers] = await pool.query('SELECT * FROM sellers WHERE id = ?', [id]);
    if (sellers.length === 0) {
      return res.status(404).json({ message: 'Farmer storefront not found' });
    }

    const seller = sellers[0];

    await pool.query(
      `UPDATE sellers SET verification_status = ?, verification_notes = ? WHERE id = ?`,
      [status, notes || null, id]
    );

    // Notify farmer in real-time
    if (status === 'VERIFIED') {
      await createNotificationRecord({
        userId: seller.user_id,
        sellerId: seller.id,
        type: 'SYSTEM',
        title: 'ফার্ম যাচাইকরণ অনুমোদিত হয়েছে!',
        title_bn: 'ফার্ম যাচাইকরণ অনুমোদিত হয়েছে!',
        message: 'অভিনন্দন! আপনার খামার প্রোফাইল ও ট্রেড লাইসেন্স অ্যাডমিন কর্তৃক যাচাইকৃত হয়েছে।',
        message_bn: 'অভিনন্দন! আপনার খামার প্রোফাইল ও ট্রেড লাইসেন্স অ্যাডমিন কর্তৃক যাচাইকৃত হয়েছে।',
        link: '/seller/profile'
      });
    } else if (status === 'REJECTED') {
      await createNotificationRecord({
        userId: seller.user_id,
        sellerId: seller.id,
        type: 'SYSTEM',
        title: 'ফার্ম যাচাইকরণ স্থগিত করা হয়েছে',
        title_bn: 'ফার্ম যাচাইকরণ স্থগিত করা হয়েছে',
        message: notes || 'আপনার তথ্যে অসম্পূর্ণতা রয়েছে। সঠিক এনআইডি/ট্রেড লাইসেন্স আপলোড করুন।',
        message_bn: notes || 'আপনার তথ্যে অসম্পূর্ণতা রয়েছে। সঠিক এনআইডি/ট্রেড লাইসেন্স আপলোড করুন।',
        link: '/seller/profile'
      });
    }

    return res.json({
      success: true,
      message: `Farmer status updated to ${status}`,
      seller: { ...seller, verification_status: status, verification_notes: notes }
    });
  } catch (err) {
    console.error('Error updating seller verification:', err);
    return res.status(500).json({ message: 'Failed to update verification status', error: err.message });
  }
};

/**
 * @desc Crop Price Decay Monitor (Tracking real-time discount curves across catalog)
 * @route GET /api/admin/price-decay-radar
 */
export const getPriceDecayRadar = async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.title_bn,
        p.base_price_bdt,
        p.min_floor_price_bdt,
        p.stock_quantity,
        p.harvest_date,
        p.max_shelf_life_days,
        p.unit,
        p.status,
        s.farm_name,
        s.division,
        s.district
      FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE p.status = 'ACTIVE'
      ORDER BY p.harvest_date ASC
      LIMIT 50
    `);

    // Calculate simulated dynamic current price based on harvest age
    const monitoredProducts = products.map((item) => {
      const harvestTime = new Date(item.harvest_date).getTime();
      const now = new Date().getTime();
      const ageHours = Math.max(0, (now - harvestTime) / (1000 * 60 * 60));
      const totalLifespanHours = (item.max_shelf_life_days || 7) * 24;

      const basePrice = parseFloat(item.base_price_bdt);
      const floorPrice = parseFloat(item.min_floor_price_bdt);
      const freshnessRatio = Math.max(0, 1 - ageHours / totalLifespanHours);

      // Linear decay toward floor price
      const calculatedCurrentPrice = Math.round(floorPrice + (basePrice - floorPrice) * freshnessRatio);
      const discountPercent = Math.max(0, Math.round(((basePrice - calculatedCurrentPrice) / basePrice) * 100));

      return {
        ...item,
        current_dynamic_price: calculatedCurrentPrice,
        freshness_percent: Math.round(freshnessRatio * 100),
        discount_percent: discountPercent,
        hours_since_harvest: Math.round(ageHours),
        days_left: Math.max(0, Math.round((totalLifespanHours - ageHours) / 24))
      };
    });

    return res.json({
      success: true,
      products: monitoredProducts
    });
  } catch (err) {
    console.error('Error fetching price decay radar:', err);
    return res.status(500).json({ message: 'Failed to fetch decay radar data', error: err.message });
  }
};
