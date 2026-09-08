import pool from '../config/db.js';

// @desc Add a review for a purchased product and update seller rating average
// @route POST /api/reviews
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, orderId } = req.body;
    const buyerId = req.user ? req.user.id : 1;

    if (!productId || !rating) {
      return res.status(400).json({ message: 'Product ID and Rating are required.' });
    }

    // 1. Insert review into reviews table
    const [result] = await pool.query(
      `INSERT INTO reviews (product_id, buyer_id, order_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [productId, buyerId, orderId || null, Math.min(5, Math.max(1, parseInt(rating))), comment || '']
    );

    // 2. Fetch seller_id for this product
    const [prods] = await pool.query(`SELECT seller_id FROM products WHERE id = ?`, [productId]);
    if (prods.length > 0) {
      const sellerId = prods[0].seller_id;

      // 3. Recalculate average rating for seller
      const [ratingStats] = await pool.query(
        `SELECT AVG(r.rating) as avg_rating, COUNT(r.id) as total_ratings
         FROM reviews r
         JOIN products p ON r.product_id = p.id
         WHERE p.seller_id = ?`,
        [sellerId]
      );

      const avgRating = parseFloat(ratingStats[0].avg_rating) || 4.8;
      const totalRatings = ratingStats[0].total_ratings || 1;

      await pool.query(
        `UPDATE sellers SET rating_avg = ?, total_ratings = ? WHERE id = ?`,
        [avgRating, totalRatings, sellerId]
      );
    }

    return res.status(201).json({
      id: result.insertId,
      product_id: productId,
      buyer_id: buyerId,
      rating: parseInt(rating),
      comment,
      buyer_name: req.user ? req.user.full_name : 'AgroMarket Buyer',
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error creating review:', err);
    return res.status(500).json({ message: 'Failed to submit review.', error: err.message });
  }
};
