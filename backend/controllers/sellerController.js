import pool from '../config/db.js';
import { createNotificationRecord } from './notificationController.js';

// Helper to format datetime strings cleanly for MySQL TIMESTAMPDIFF calculations
const formatDbDatetime = (dt) => {
  if (!dt) return null;
  if (typeof dt === 'string') {
    const s = dt.replace('T', ' ');
    return s.length === 16 ? `${s}:00` : s.slice(0, 19);
  }
  if (dt instanceof Date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
  }
  return dt;
};

// Helper to resolve seller ID from auth or demo fallback
const resolveSellerId = async (req) => {
  if (req.user?.sellerProfile?.id) {
    return req.user.sellerProfile.id;
  }
  if (req.user?.id) {
    const [sellers] = await pool.query('SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    if (sellers.length > 0) return sellers[0].id;
  }
  if (req.query?.sellerId) {
    const parsed = parseInt(req.query.sellerId);
    if (!isNaN(parsed)) return parsed;
  }
  if (req.body?.sellerId) {
    const parsed = parseInt(req.body.sellerId);
    if (!isNaN(parsed)) return parsed;
  }
  return 1; // Default to main demo farmer (Rajshahi Mango Hub)
};

// @desc Get Seller Public Storefront profile and active produce
// @route GET /api/seller/storefront/:sellerId
export const getStorefront = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // 1. Fetch Seller & User info
    const [sellers] = await pool.query(
      `SELECT s.*, u.full_name as farmer_name, u.phone as farmer_phone, u.avatar_url as farmer_avatar
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [sellerId]
    );

    if (sellers.length === 0) {
      return res.status(404).json({ message: 'খামারের প্রোফাইল পাওয়া যায়নি (Seller not found)' });
    }

    const seller = sellers[0];

    // 2. Fetch all active crops listed by this seller
    const [products] = await pool.query(
      `SELECT * FROM v_active_products 
       WHERE seller_id = ? AND status != 'EXPIRED' AND computed_status != 'EXPIRED'
       ORDER BY harvest_date DESC`,
      [sellerId]
    );

    // 3. Category count breakdown for this farmer
    const categoryMap = {};
    products.forEach((p) => {
      const cat = p.category_name_en || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    return res.json({
      seller,
      products,
      stats: {
        totalProducts: products.length,
        ratingAvg: parseFloat(seller.rating_avg) || 4.9,
        totalRatings: seller.total_ratings || 15,
        categories: categoryMap
      }
    });
  } catch (err) {
    console.error('Error fetching seller storefront:', err);
    return res.status(500).json({ message: 'Failed to load storefront', error: err.message });
  }
};

// @desc Get Seller Dashboard Overview Metrics & KPI stats
// @route GET /api/seller/dashboard
export const getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req);

    // 1. Fetch Seller Info
    const [sellers] = await pool.query(
      `SELECT s.*, u.full_name as farmer_name, u.phone as farmer_phone, u.email as farmer_email, u.avatar_url as farmer_avatar
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [sellerId]
    );

    if (sellers.length === 0) {
      return res.status(404).json({ message: 'Seller account not found' });
    }
    const seller = sellers[0];

    // 2. Earnings & Orders Totals (excluding orders deleted by this seller)
    const [earningsRes] = await pool.query(
      `SELECT COALESCE(SUM(oi.subtotal_bdt), 0) as total_earnings,
              COUNT(DISTINCT oi.order_id) as total_orders
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.seller_id = ? AND o.deleted_by_seller = 0`,
      [sellerId]
    );
    const totalEarnings = parseFloat(earningsRes[0]?.total_earnings || 0);
    const totalOrders = parseInt(earningsRes[0]?.total_orders || 0);

    // 3. Pending / Active Orders Count (excluding orders deleted by this seller)
    const [pendingRes] = await pool.query(
      `SELECT COUNT(DISTINCT o.id) as pending_orders
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE oi.seller_id = ? AND o.deleted_by_seller = 0 AND o.order_status IN ('PENDING', 'PROCESSING', 'READY_FOR_PICKUP')`,
      [sellerId]
    );
    const pendingOrders = parseInt(pendingRes[0]?.pending_orders || 0);

    // 4. Produce / Inventory Stats
    const [cropsRes] = await pool.query(
      `SELECT COUNT(*) as total_crops,
              SUM(CASE WHEN stock_quantity <= low_stock_threshold AND computed_status != 'EXPIRED' THEN 1 ELSE 0 END) as low_stock_crops,
              SUM(CASE WHEN computed_status = 'EXPIRED' THEN 1 ELSE 0 END) as expired_crops,
              SUM(CASE WHEN computed_status = 'ACTIVE' THEN 1 ELSE 0 END) as active_crops
       FROM v_active_products
       WHERE seller_id = ? AND status != 'EXPIRED'`,
      [sellerId]
    );
    const cropStats = cropsRes[0] || {};

    // 5. Recent 5 Orders for this seller (excluding orders deleted by this seller)
    const [recentOrders] = await pool.query(
      `SELECT o.id, o.order_number, o.created_at, o.order_status, o.fulfillment_type,
              o.payment_method, o.payment_status, o.delivery_address,
              u.full_name as buyer_name, u.phone as buyer_phone,
              SUM(oi.quantity) as total_quantity,
              SUM(oi.subtotal_bdt) as seller_subtotal
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN users u ON o.buyer_id = u.id
       WHERE oi.seller_id = ? AND o.deleted_by_seller = 0
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [sellerId]
    );

    // 6. Urgent Low Stock & High Aging Produce
    const [urgentAlerts] = await pool.query(
      `SELECT * FROM v_active_products
       WHERE seller_id = ? AND status != 'EXPIRED' AND computed_status != 'EXPIRED' AND (stock_quantity <= low_stock_threshold OR age_in_days >= (max_shelf_life_days * 0.75))
       ORDER BY stock_quantity ASC
       LIMIT 4`,
      [sellerId]
    );

    // 7. Business Insights: Top Performing Produce
    const [topProductsRes] = await pool.query(
      `SELECT oi.product_id, p.title, p.title_bn, p.image_url, p.unit,
              SUM(oi.quantity) as total_quantity_sold,
              SUM(oi.subtotal_bdt) as total_revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.seller_id = ? AND o.deleted_by_seller = 0
       GROUP BY oi.product_id
       ORDER BY total_revenue DESC
       LIMIT 50`,
      [sellerId]
    );

    // 8. Business Insights: Fulfillment Channel Split (Delivery vs Pickup)
    const [fulfillmentRes] = await pool.query(
      `SELECT o.fulfillment_type,
              COUNT(DISTINCT o.id) as order_count,
              COALESCE(SUM(oi.subtotal_bdt), 0) as total_revenue
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE oi.seller_id = ? AND o.deleted_by_seller = 0
       GROUP BY o.fulfillment_type`,
      [sellerId]
    );

    let deliveryCount = 0;
    let deliveryRevenue = 0;
    let pickupCount = 0;
    let pickupRevenue = 0;

    fulfillmentRes.forEach(f => {
      if (f.fulfillment_type === 'DELIVERY') {
        deliveryCount = parseInt(f.order_count || 0);
        deliveryRevenue = parseFloat(f.total_revenue || 0);
      } else if (f.fulfillment_type === 'PICKUP') {
        pickupCount = parseInt(f.order_count || 0);
        pickupRevenue = parseFloat(f.total_revenue || 0);
      }
    });

    const totalFulfillmentOrders = deliveryCount + pickupCount;
    const deliveryPercent = totalFulfillmentOrders > 0 ? Math.round((deliveryCount / totalFulfillmentOrders) * 100) : 65;
    const pickupPercent = totalFulfillmentOrders > 0 ? 100 - deliveryPercent : 35;

    // 9. Business Insights: Unique Buyers & Repeat Rate
    const [buyersRes] = await pool.query(
      `SELECT COUNT(DISTINCT o.buyer_id) as unique_buyers
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE oi.seller_id = ? AND o.deleted_by_seller = 0`,
      [sellerId]
    );
    const uniqueBuyers = parseInt(buyersRes[0]?.unique_buyers || 0);
    const repeatCustomers = Math.max(0, totalOrders - uniqueBuyers);
    const repeatRate = totalOrders > 0 ? Math.min(100, Math.round((repeatCustomers / totalOrders) * 100)) : 0;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0;

    // 10. Business Insights: Real Spoilage Prevented & Revenue Recovered via Dynamic Price Decay
    const [decayRes] = await pool.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN oi.unit_price_at_purchase_bdt < p.base_price_bdt AND oi.unit_price_at_purchase_bdt > 0 THEN oi.quantity ELSE 0 END), 0) as real_decay_saved_kg,
         COALESCE(SUM(CASE WHEN oi.unit_price_at_purchase_bdt < p.base_price_bdt AND oi.unit_price_at_purchase_bdt > 0 THEN oi.subtotal_bdt ELSE 0 END), 0) as real_decay_saved_bdt
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.seller_id = ? AND o.deleted_by_seller = 0`,
      [sellerId]
    );
    const decaySavedKg = parseInt(decayRes[0]?.real_decay_saved_kg || 0);
    const decaySavedBdt = Math.round(parseFloat(decayRes[0]?.real_decay_saved_bdt || 0));

    // 11. Business Insights: Real Monthly Sales Revenue Trend (Last 6 Months from Database)
    const [monthlyDbRes] = await pool.query(
      `SELECT 
         DATE_FORMAT(o.created_at, '%Y-%m') as ym,
         COALESCE(SUM(oi.subtotal_bdt), 0) as month_revenue,
         COUNT(DISTINCT o.id) as month_orders
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.seller_id = ? AND o.deleted_by_seller = 0
       GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')`,
      [sellerId]
    );

    const monthMap = {};
    monthlyDbRes.forEach(r => {
      monthMap[r.ym] = {
        revenue: Math.round(parseFloat(r.month_revenue || 0)),
        orders: parseInt(r.month_orders || 0)
      };
    });

    const monthlyTrends = [
      { ym: '2026-04', month: 'Apr', labelBn: 'এপ্রিল' },
      { ym: '2026-05', month: 'May', labelBn: 'মে' },
      { ym: '2026-06', month: 'Jun', labelBn: 'জুন' },
      { ym: '2026-07', month: 'Jul', labelBn: 'জুলাই' },
      { ym: '2026-08', month: 'Aug', labelBn: 'আগস্ট' },
      { ym: '2026-09', month: 'Sep', labelBn: 'সেপ্টেম্বর', isCurrent: true }
    ].map(m => ({
      ...m,
      revenue: monthMap[m.ym]?.revenue || 0,
      orders: monthMap[m.ym]?.orders || 0
    }));

    // 12. Business Insights: Real Daily Sales (Last 7 Days)
    const [dailyDbRes] = await pool.query(
      `SELECT 
         DATE_FORMAT(o.created_at, '%Y-%m-%d') as order_date,
         COALESCE(SUM(oi.subtotal_bdt), 0) as day_revenue,
         COUNT(DISTINCT o.id) as day_orders
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.seller_id = ? AND o.deleted_by_seller = 0
       GROUP BY DATE_FORMAT(o.created_at, '%Y-%m-%d')`,
      [sellerId]
    );

    const dayMap = {};
    dailyDbRes.forEach(r => {
      dayMap[r.order_date] = {
        revenue: Math.round(parseFloat(r.day_revenue || 0)),
        orders: parseInt(r.day_orders || 0)
      };
    });

    const dailyTrends = [
      { date: '2026-09-04', label: '04 Sep', labelBn: '০৪ সেপ' },
      { date: '2026-09-05', label: '05 Sep', labelBn: '০৫ সেপ' },
      { date: '2026-09-06', label: '06 Sep', labelBn: '০৬ সেপ' },
      { date: '2026-09-07', label: '07 Sep', labelBn: '০৭ সেপ' },
      { date: '2026-09-08', label: '08 Sep', labelBn: '০৮ সেপ' },
      { date: '2026-09-09', label: '09 Sep', labelBn: '০৯ সেপ' },
      { date: '2026-09-10', label: '10 Sep', labelBn: '১০ সেপ', isCurrent: true }
    ].map(d => ({
      ...d,
      revenue: dayMap[d.date]?.revenue || 0,
      orders: dayMap[d.date]?.orders || 0
    }));

    return res.json({
      seller,
      kpis: {
        totalEarnings,
        totalOrders,
        pendingOrders,
        totalCrops: parseInt(cropStats.total_crops || 0),
        activeCrops: parseInt(cropStats.active_crops || 0),
        lowStockCrops: parseInt(cropStats.low_stock_crops || 0),
        expiredCrops: parseInt(cropStats.expired_crops || 0),
        ratingAvg: parseFloat(seller.rating_avg) || 4.9,
        totalRatings: seller.total_ratings || 0,
        estimatedWasteSavedKg: decaySavedKg
      },
      insights: {
        avgOrderValue,
        uniqueBuyers,
        repeatCustomers,
        repeatRate,
        fulfillment: {
          deliveryCount,
          deliveryRevenue,
          deliveryPercent,
          pickupCount,
          pickupRevenue,
          pickupPercent
        },
        topProducts: topProductsRes.map(p => ({
          productId: p.product_id,
          title: p.title,
          titleBn: p.title_bn,
          imageUrl: p.image_url,
          unit: p.unit,
          quantitySold: parseFloat(p.total_quantity_sold || 0),
          revenue: parseFloat(p.total_revenue || 0),
          revenueShare: totalEarnings > 0 ? Math.min(100, Math.round((parseFloat(p.total_revenue || 0) / totalEarnings) * 100)) : 0
        })),
        monthlyTrends,
        dailyTrends,
        spoilageSavedBdt: decaySavedBdt
      },
      recentOrders,
      urgentAlerts
    });
  } catch (err) {
    console.error('Error fetching seller dashboard stats:', err);
    return res.status(500).json({ message: 'Failed to fetch dashboard metrics', error: err.message });
  }
};

// @desc Get All Produce for Logged-In Seller with Dynamic Aging Metrics
// @route GET /api/seller/products
export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req);

    const [products] = await pool.query(
      `SELECT * FROM v_active_products
       WHERE seller_id = ? AND status != 'EXPIRED'
       ORDER BY id DESC`,
      [sellerId]
    );

    return res.json({
      count: products.length,
      products
    });
  } catch (err) {
    console.error('Error fetching seller products:', err);
    return res.status(500).json({ message: 'Failed to fetch inventory', error: err.message });
  }
};

// @desc Get Single Product Details for Editing
// @route GET /api/seller/products/:id
export const getSellerProductById = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req);
    const { id } = req.params;

    const [products] = await pool.query(
      `SELECT * FROM products WHERE id = ? AND seller_id = ?`,
      [id, sellerId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Crop listing not found or access denied' });
    }

    const product = products[0];

    // Fetch all images for this produce (up to 5 photos)
    const [imageRows] = await pool.query(
      `SELECT image_url, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
      [id]
    );
    product.images = imageRows.length > 0 ? imageRows.map(img => img.image_url) : [product.image_url].filter(Boolean);

    return res.json({ product });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch crop details', error: err.message });
  }
};

// @desc Add a New Crop Listing (Supports up to 5 photos)
// @route POST /api/seller/products
export const createProduct = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req);
    const {
      title,
      title_bn,
      category_id,
      description,
      base_price_bdt,
      min_floor_price_bdt,
      stock_quantity,
      low_stock_threshold = 10,
      harvest_date = new Date(),
      max_shelf_life_days = 7,
      unit = 'kg',
      image_url,
      images = [] // Max 5 photos
    } = req.body;

    if (!title || !base_price_bdt || !stock_quantity) {
      return res.status(400).json({ message: 'Title, base price, and stock quantity are required.' });
    }

    // Determine primary thumbnail image
    const validImages = Array.isArray(images) && images.length > 0 
      ? images.slice(0, 5) 
      : (image_url ? [image_url] : ['https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600']);
    const primaryImage = validImages[0];

    const [result] = await pool.query(
      `INSERT INTO products 
       (seller_id, category_id, title, title_bn, description, base_price_bdt, 
        min_floor_price_bdt, stock_quantity, low_stock_threshold, harvest_date, 
        max_shelf_life_days, unit, status, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)`,
      [
        sellerId,
        category_id || 1,
        title,
        title_bn || title,
        description || '',
        base_price_bdt,
        min_floor_price_bdt || (base_price_bdt * 0.6),
        stock_quantity,
        low_stock_threshold,
        formatDbDatetime(harvest_date) || formatDbDatetime(new Date()),
        max_shelf_life_days,
        unit,
        primaryImage
      ]
    );

    const productId = result.insertId;

    // Insert all uploaded photos into product_images table
    if (validImages.length > 0) {
      const imageRecords = validImages.map((url, idx) => [
        productId,
        url,
        idx === 0 ? 1 : 0,
        idx
      ]);
      await pool.query(
        `INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES ?`,
        [imageRecords]
      );
    }

    return res.status(201).json({
      message: 'নতুন ফসল সফলভাবে যুক্ত হয়েছে (Crop listed successfully)',
      productId,
      imageCount: validImages.length
    });
  } catch (err) {
    console.error('Error creating crop listing:', err);
    return res.status(500).json({ message: 'Failed to create product listing', error: err.message });
  }
};

// @desc Update Existing Crop Listing (Supports up to 5 photos)
// @route PUT /api/seller/products/:id
export const updateProduct = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req);
    const { id } = req.params;
    const {
      title,
      title_bn,
      category_id,
      description,
      base_price_bdt,
      min_floor_price_bdt,
      stock_quantity,
      low_stock_threshold,
      harvest_date,
      max_shelf_life_days,
      unit,
      status,
      image_url,
      images // Max 5 photos
    } = req.body;

    // Verify ownership
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ? AND seller_id = ?', [id, sellerId]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Crop not found or access denied' });
    }

    let finalImageUrl = image_url;
    if (Array.isArray(images) && images.length > 0) {
      finalImageUrl = images[0];
    }

    await pool.query(
      `UPDATE products SET
        title = COALESCE(?, title),
        title_bn = COALESCE(?, title_bn),
        category_id = COALESCE(?, category_id),
        description = COALESCE(?, description),
        base_price_bdt = COALESCE(?, base_price_bdt),
        min_floor_price_bdt = COALESCE(?, min_floor_price_bdt),
        stock_quantity = COALESCE(?, stock_quantity),
        low_stock_threshold = COALESCE(?, low_stock_threshold),
        harvest_date = COALESCE(?, harvest_date),
        max_shelf_life_days = COALESCE(?, max_shelf_life_days),
        unit = COALESCE(?, unit),
        status = COALESCE(?, status),
        image_url = COALESCE(?, image_url)
       WHERE id = ? AND seller_id = ?`,
      [
        title,
        title_bn,
        category_id,
        description,
        base_price_bdt,
        min_floor_price_bdt,
        stock_quantity,
        low_stock_threshold,
        formatDbDatetime(harvest_date),
        max_shelf_life_days,
        unit,
        status,
        finalImageUrl,
        id,
        sellerId
      ]
    );

    // Sync product_images if images array is provided
    if (Array.isArray(images) && images.length > 0) {
      const validImages = images.slice(0, 5);
      await pool.query('DELETE FROM product_images WHERE product_id = ?', [id]);
      const imageRecords = validImages.map((url, idx) => [
        id,
        url,
        idx === 0 ? 1 : 0,
        idx
      ]);
      await pool.query(
        `INSERT INTO product_images (product_id, image_url, is_primary, sort_order) VALUES ?`,
        [imageRecords]
      );
    }

    return res.json({ message: 'ফসল তথ্য সফলভাবে আপডেট হয়েছে (Crop updated successfully)' });
  } catch (err) {
    console.error('Error updating crop listing:', err);
    return res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
};

// @desc Quick Update Crop Stock
// @route PATCH /api/seller/products/:id/stock
export const updateProductStock = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req);
    const { id } = req.params;
    const { quantity, mode = 'set' } = req.body; // mode: 'set' or 'add'

    if (quantity === undefined || isNaN(quantity)) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    let sql;
    let params;
    if (mode === 'add') {
      sql = `UPDATE products SET stock_quantity = GREATEST(0, stock_quantity + ?) WHERE id = ? AND seller_id = ?`;
      params = [parseInt(quantity), id, sellerId];
    } else {
      sql = `UPDATE products SET stock_quantity = GREATEST(0, ?) WHERE id = ? AND seller_id = ?`;
      params = [parseInt(quantity), id, sellerId];
    }

    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Crop not found or access denied' });
    }

    // Get updated stock
    const [updated] = await pool.query('SELECT stock_quantity FROM products WHERE id = ?', [id]);

    return res.json({
      message: 'স্টক সফলভাবে আপডেট হয়েছে (Stock updated)',
      newStock: updated[0]?.stock_quantity
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update stock', error: err.message });
  }
};

// @desc Delete / Archive Crop Listing
// @route DELETE /api/seller/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req);
    const { id } = req.params;

    // 1. Check if product exists and belongs to seller
    const [products] = await pool.query(
      'SELECT id, title FROM products WHERE id = ? AND seller_id = ?',
      [id, sellerId]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Crop not found or access denied' });
    }

    // 2. Check if product has existing orders
    const [orderCheck] = await pool.query(
      'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
      [id]
    );
    const hasOrders = (orderCheck[0]?.count || 0) > 0;

    // 3. Remove wishlist entries so buyers no longer see it
    await pool.query('DELETE FROM wishlists WHERE product_id = ?', [id]);

    if (!hasOrders) {
      // Permanent Hard Delete: clean up reviews and product record
      await pool.query('DELETE FROM reviews WHERE product_id = ?', [id]);
      await pool.query('DELETE FROM products WHERE id = ? AND seller_id = ?', [id, sellerId]);
      return res.json({ message: 'ফসল সম্পূর্ণরূপে তালিকা থেকে মুছে ফেলা হয়েছে (Crop permanently removed)' });
    } else {
      // Soft Delete: has historical order references, archive it and zero out stock
      await pool.query(
        'UPDATE products SET status = "EXPIRED", stock_quantity = 0 WHERE id = ? AND seller_id = ?',
        [id, sellerId]
      );
      return res.json({ message: 'ফসল তালিকাভুক্ত থেকে প্রত্যাহার করা হয়েছে (Crop archived)' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
};

// @desc Get All Orders for Logged-In Seller
// @route GET /api/seller/orders
export const getSellerOrders = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req);

    // Fetch orders containing items for this seller (excluding orders deleted by this seller)
    const [orders] = await pool.query(
      `SELECT o.id, o.order_number, o.buyer_id, o.total_amount_bdt, o.fulfillment_type,
              o.payment_method, o.payment_status, o.order_status, o.delivery_address,
              o.created_at,
              u.id as buyer_user_id, u.full_name as buyer_name, u.phone as buyer_phone, u.email as buyer_email
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       WHERE o.id IN (SELECT DISTINCT order_id FROM order_items WHERE seller_id = ?)
         AND o.deleted_by_seller = 0
       ORDER BY o.created_at DESC`,
      [sellerId]
    );

    if (orders.length === 0) {
      return res.json({ orders: [] });
    }

    // Attach items for this seller for each order
    const orderIds = orders.map(o => o.id);
    const [items] = await pool.query(
      `SELECT oi.*, p.title, p.title_bn, p.unit, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.seller_id = ? AND oi.order_id IN (?)`,
      [sellerId, orderIds]
    );

    const itemsByOrder = {};
    items.forEach(it => {
      if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
      itemsByOrder[it.order_id].push(it);
    });

    const populatedOrders = orders.map(o => ({
      ...o,
      items: itemsByOrder[o.id] || [],
      sellerSubtotal: (itemsByOrder[o.id] || []).reduce((acc, it) => acc + parseFloat(it.subtotal_bdt || 0), 0)
    }));

    return res.json({ orders: populatedOrders });
  } catch (err) {
    console.error('Error fetching seller orders:', err);
    return res.status(500).json({ message: 'Failed to load seller orders', error: err.message });
  }
};

// @desc Update Order Status by Seller
// @route PATCH /api/seller/orders/:id/status
export const updateSellerOrderStatus = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req);
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'অবৈধ অর্ডার স্ট্যাটাস (Invalid status value)' });
    }

    // Verify this order contains items for this seller
    const [check] = await pool.query(
      `SELECT oi.id, o.payment_method, o.payment_status 
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.order_id = ? AND oi.seller_id = ?`,
      [id, sellerId]
    );

    if (check.length === 0) {
      return res.status(403).json({ message: 'এই অর্ডারের এক্সেস আপনার নেই (Access denied or not your order)' });
    }

    // Update order status. For COD orders, payment_status stays PENDING until buyer confirms payment
    await pool.query(
      'UPDATE orders SET order_status = ? WHERE id = ?',
      [status, id]
    );

    // Dispatch real-time alert to the buyer
    try {
      const [orders] = await pool.query('SELECT buyer_id, order_number FROM orders WHERE id = ?', [id]);
      const [sellers] = await pool.query('SELECT farm_name FROM sellers WHERE id = ?', [sellerId]);
      if (orders.length > 0) {
        const order = orders[0];
        const farmName = sellers.length > 0 ? sellers[0].farm_name : 'খামার';

        let title = `Order Update: #${order.order_number}`;
        let title_bn = `অর্ডার আপডেট: #${order.order_number}`;
        let message = `Your order status changed to ${status}.`;
        let message_bn = `আপনার অর্ডারের বর্তমান অবস্থা: ${status}।`;

        if (status === 'PROCESSING') {
          title = `Order Being Packaged #${order.order_number}`;
          title_bn = `অর্ডার প্যাকেজিং শুরু হয়েছে #${order.order_number}`;
          message = `${farmName} has begun harvesting and packaging your produce.`;
          message_bn = `${farmName} আপনার তাজা ফসল তোলা ও প্যাকেজিং শুরু করেছে।`;
        } else if (status === 'READY_FOR_PICKUP') {
          title = `Ready for Pickup! #${order.order_number}`;
          title_bn = `ফসল সংগ্রহের জন্য প্রস্তুত! #${order.order_number}`;
          message = `Your produce is packed and ready at the farm gate.`;
          message_bn = `${farmName} গেটে আপনার ফসল প্রস্তুত রয়েছে, সংগ্রহ করতে পারেন।`;
        } else if (status === 'SHIPPED') {
          title = `Order In Transit #${order.order_number}`;
          title_bn = `অর্ডার কুরিয়ারে প্রেরিত #${order.order_number}`;
          message = `${farmName} has handed your parcel over for delivery.`;
          message_bn = `${farmName} আপনার ঠিকানায় পার্সেলটি কুরিয়ারে হস্তান্তর করেছে।`;
        } else if (status === 'DELIVERED') {
          title = `Order Delivered #${order.order_number}`;
          title_bn = `অর্ডার ডেলিভারি সম্পন্ন #${order.order_number}`;
          message = `Your fresh crops have been delivered. Enjoy and leave a review!`;
          message_bn = `আপনার তাজা ফসল পৌঁছে গেছে। অনুগ্রহ করে একটি রিভিউ দিন!`;
        } else if (status === 'CANCELLED') {
          title = `Order Cancelled #${order.order_number}`;
          title_bn = `অর্ডার বাতিল করা হয়েছে #${order.order_number}`;
          message = `Your order #${order.order_number} has been cancelled.`;
          message_bn = `আপনার #${order.order_number} অর্ডারটি বাতিল করা হয়েছে।`;
        }

        await createNotificationRecord({
          userId: order.buyer_id,
          type: 'ORDER_STATUS',
          title,
          title_bn,
          message,
          message_bn,
          link: '/account/orders'
        });
      }
    } catch (notifErr) {
      console.error('Non-blocking error dispatching buyer status notification:', notifErr);
    }

    return res.json({
      success: true,
      message: 'অর্ডারের স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে (Order status updated)',
      status
    });
  } catch (err) {
    console.error('Error updating seller order status:', err);
    return res.status(500).json({ message: 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে', error: err.message });
  }
};

// @desc Get Seller Profile & Payout Info
// @route GET /api/seller/profile
export const getSellerProfile = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req);

    const [sellers] = await pool.query(
      `SELECT s.*, u.full_name, u.email, u.phone, u.address, u.avatar_url
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [sellerId]
    );

    if (sellers.length === 0) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }

    return res.json({ profile: sellers[0] });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load profile', error: err.message });
  }
};

// @desc Update Seller Profile & Digital Payout Settings (Supports Farm Cover, Logo, Owner Photo)
// @route PUT /api/seller/profile
export const updateSellerProfile = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req);
    const {
      farm_name,
      division,
      district,
      upazila,
      bio,
      cover_image_url,
      logo_image_url,
      owner_image_url,
      nid_trade_license,
      payout_method,
      payout_number,
      full_name,
      phone,
      address
    } = req.body;

    await pool.query(
      `UPDATE sellers SET
        farm_name = COALESCE(?, farm_name),
        division = COALESCE(?, division),
        district = COALESCE(?, district),
        upazila = COALESCE(?, upazila),
        bio = COALESCE(?, bio),
        cover_image_url = COALESCE(?, cover_image_url),
        logo_image_url = COALESCE(?, logo_image_url),
        owner_image_url = COALESCE(?, owner_image_url),
        nid_trade_license = COALESCE(?, nid_trade_license),
        payout_method = COALESCE(?, payout_method),
        payout_number = COALESCE(?, payout_number)
       WHERE id = ?`,
      [
        farm_name,
        division,
        district,
        upazila,
        bio,
        cover_image_url,
        logo_image_url,
        owner_image_url,
        nid_trade_license,
        payout_method,
        payout_number,
        sellerId
      ]
    );

    // Also update farmer user details if provided
    if (full_name || phone || address || owner_image_url) {
      const [sellers] = await pool.query('SELECT user_id FROM sellers WHERE id = ?', [sellerId]);
      if (sellers.length > 0 && sellers[0].user_id) {
        await pool.query(
          `UPDATE users SET
            full_name = COALESCE(?, full_name),
            phone = COALESCE(?, phone),
            address = COALESCE(?, address),
            avatar_url = COALESCE(?, avatar_url)
           WHERE id = ?`,
          [full_name, phone, address, owner_image_url, sellers[0].user_id]
        );
      }
    }

    // Fetch updated profile
    const [updated] = await pool.query(
      `SELECT s.*, u.full_name, u.email, u.phone, u.address, u.avatar_url
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [sellerId]
    );

    return res.json({
      success: true,
      message: 'খামারের প্রোফাইল ও ছবি সফলভাবে সংরক্ষিত হয়েছে (Profile saved successfully)',
      profile: updated[0] || null
    });
  } catch (err) {
    console.error('Error updating seller profile:', err);
    return res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

// @desc Soft delete order (Seller action: sets deleted_by_seller = 1)
// @route DELETE /api/seller/orders/:id
export const softDeleteSellerOrder = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req);
    const { id } = req.params;

    // Check that order exists and has items for this seller
    const [check] = await pool.query(
      `SELECT oi.id 
       FROM order_items oi
       WHERE oi.order_id = ? AND oi.seller_id = ?`,
      [id, sellerId]
    );

    if (check.length === 0) {
      return res.status(404).json({ message: 'অর্ডার পাওয়া যায়নি অথবা আপনার এই অর্ডারে এক্সেস নেই' });
    }

    // Mark as deleted by seller only (seller's UI). Admin preserves record in DB.
    await pool.query(
      `UPDATE orders 
       SET deleted_by_seller = 1, 
           deleted_at = NOW(), 
           is_deleted = CASE WHEN deleted_by_buyer = 1 THEN 1 ELSE 0 END 
       WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'অর্ডারটি সফলভাবে আপনার তালিকা থেকে মুছে ফেলা হয়েছে (Order removed from seller view)'
    });
  } catch (err) {
    console.error('Error soft deleting seller order:', err);
    return res.status(500).json({ message: 'অর্ডার মুছতে সমস্যা হয়েছে', error: err.message });
  }
};

