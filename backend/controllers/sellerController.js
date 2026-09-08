import pool from '../config/db.js';

// @desc Get Seller Public Storefront profile and active produce
// @route GET /api/seller/storefront/:sellerId
export const getStorefront = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // 1. Fetch Seller & User info
    const [sellers] = await pool.query(
      `SELECT s.*, u.full_name as farmer_name, u.phone as farmer_phone
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
       WHERE seller_id = ? AND computed_status != 'EXPIRED'
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
