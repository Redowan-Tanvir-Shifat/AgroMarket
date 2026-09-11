import pool from '../config/db.js';

// @desc Get active products with dynamic pricing & filters
// @route GET /api/products
export const getProducts = async (req, res) => {
  try {
    const { category, division, district, search, sort, limit = 20 } = req.query;

    let sql = `SELECT * FROM v_active_products WHERE status != 'EXPIRED' AND computed_status != 'EXPIRED'`;
    const params = [];

    if (category) {
      sql += ` AND (category_slug = ? OR category_name_en = ?)`;
      params.push(category, category);
    }

    if (division) {
      sql += ` AND farm_division = ?`;
      params.push(division);
    }

    if (district) {
      sql += ` AND farm_district = ?`;
      params.push(district);
    }

    if (search) {
      sql += ` AND (title LIKE ? OR description LIKE ? OR farm_name LIKE ? OR farm_district LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Sorting
    if (sort === 'freshness') {
      sql += ` ORDER BY harvest_date DESC`;
    } else if (sort === 'price_asc') {
      sql += ` ORDER BY current_dynamic_price_bdt ASC`;
    } else if (sort === 'price_desc') {
      sql += ` ORDER BY current_dynamic_price_bdt DESC`;
    } else if (sort === 'discount') {
      sql += ` ORDER BY (base_price_bdt - current_dynamic_price_bdt) DESC`;
    } else {
      sql += ` ORDER BY id DESC`;
    }

    sql += ` LIMIT ?`;
    params.push(parseInt(limit));

    const [products] = await pool.query(sql, params);

    return res.json({
      count: products.length,
      products
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ message: 'Failed to fetch produce catalog.', error: err.message });
  }
};

// @desc Get Home Page Overview & Featured Produce
// @route GET /api/products/home-summary
export const getHomeSummary = async (req, res) => {
  try {
    // 1. Categories with counts
    const [categories] = await pool.query(`
      SELECT c.*, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status != 'EXPIRED'
      GROUP BY c.id
    `);

    // 2. Featured Produce (Super Fresh / Top Rated Farmers)
    const [featured] = await pool.query(`
      SELECT * FROM v_active_products
      WHERE status != 'EXPIRED' AND computed_status != 'EXPIRED'
      ORDER BY harvest_date DESC
      LIMIT 6
    `);

    // 3. Dynamic Aging Deals (Items with active discounts due to harvest age)
    const [agingDeals] = await pool.query(`
      SELECT *, (base_price_bdt - current_dynamic_price_bdt) AS savings_bdt
      FROM v_active_products
      WHERE status != 'EXPIRED' AND computed_status != 'EXPIRED' AND current_dynamic_price_bdt < base_price_bdt
      ORDER BY savings_bdt DESC
      LIMIT 4
    `);

    // 4. Division Highlights
    const [divisionCounts] = await pool.query(`
      SELECT farm_division, COUNT(id) as total_produce, COUNT(DISTINCT seller_id) as total_farmers
      FROM v_active_products
      WHERE status != 'EXPIRED' AND computed_status != 'EXPIRED'
      GROUP BY farm_division
    `);

    return res.json({
      categories,
      featured,
      agingDeals,
      divisionCounts,
      stats: {
        totalFarmers: 120,
        totalDistricts: 64,
        directSavingsPercent: '25-35%',
        dailyFreshDeliveries: '450+'
      }
    });
  } catch (err) {
    console.error('Error fetching home summary:', err);
    return res.status(500).json({ message: 'Failed to load home page summary.', error: err.message });
  }
};

// @desc Get Single Product Details
// @route GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await pool.query(`SELECT * FROM v_active_products WHERE id = ? AND status != 'EXPIRED'`, [id]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];

    // Fetch Product Images (Up to 5 photos per produce)
    const [imageRows] = await pool.query(
      `SELECT image_url, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC`,
      [id]
    );
    product.images = imageRows.length > 0 ? imageRows.map(img => img.image_url) : [product.image_url].filter(Boolean);

    // Fetch Seller details
    const [sellerRows] = await pool.query(
      `SELECT s.*, u.full_name as farmer_name, u.phone as farmer_phone, u.avatar_url as farmer_avatar
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [product.seller_id]
    );
    if (sellerRows.length > 0) {
      product.seller = sellerRows[0];
    }

    // Fetch Reviews
    const [reviews] = await pool.query(`
      SELECT r.*, u.full_name as buyer_name
      FROM reviews r
      JOIN users u ON r.buyer_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [id]);

    return res.json({
      product,
      reviews
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch product details.', error: err.message });
  }
};
