import pool from '../config/db.js';

// @desc Get buyer's wishlist items with latest dynamic price
// @route GET /api/wishlists
export const getWishlist = async (req, res) => {
  try {
    const buyerId = req.user ? req.user.id : 1;

    const [items] = await pool.query(
      `SELECT w.id as wishlist_id, w.created_at as saved_at, p.*
       FROM wishlists w
       JOIN v_active_products p ON w.product_id = p.id
       WHERE w.buyer_id = ? AND p.status != 'EXPIRED' AND p.computed_status != 'EXPIRED'
       ORDER BY w.created_at DESC`,
      [buyerId]
    );

    return res.json({ wishlist: items });
  } catch (err) {
    console.error('Error fetching wishlist:', err);
    return res.status(500).json({ message: 'Failed to fetch wishlist.', error: err.message });
  }
};

// @desc Add item to wishlist
// @route POST /api/wishlists
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const buyerId = req.user ? req.user.id : 1;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required.' });
    }

    // Insert or ignore if duplicate
    await pool.query(
      `INSERT IGNORE INTO wishlists (buyer_id, product_id) VALUES (?, ?)`,
      [buyerId, productId]
    );

    return res.status(201).json({ success: true, message: 'Item saved to wishlist' });
  } catch (err) {
    console.error('Error adding to wishlist:', err);
    return res.status(500).json({ message: 'Failed to add item to wishlist.', error: err.message });
  }
};

// @desc Remove item from wishlist
// @route DELETE /api/wishlists/:productId
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const buyerId = req.user ? req.user.id : 1;

    await pool.query(
      `DELETE FROM wishlists WHERE buyer_id = ? AND product_id = ?`,
      [buyerId, productId]
    );

    return res.json({ success: true, message: 'Item removed from wishlist' });
  } catch (err) {
    console.error('Error removing from wishlist:', err);
    return res.status(500).json({ message: 'Failed to remove from wishlist.', error: err.message });
  }
};
