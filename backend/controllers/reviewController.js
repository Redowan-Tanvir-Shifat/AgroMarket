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

// @desc Update a review (Only owner can edit)
// @route PUT /api/reviews/:id
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    // 1. Fetch existing review
    const [existing] = await pool.query('SELECT * FROM reviews WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'রিভিউ পাওয়া যায়নি (Review not found)' });
    }

    const review = existing[0];

    // 2. Ownership check: verify authenticated user is the buyer who wrote it
    if (req.user && review.buyer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'আপনি কেবল নিজের রিভিউ সম্পাদনা করতে পারবেন (Unauthorized)' });
    }

    const newRating = rating ? Math.min(5, Math.max(1, parseInt(rating))) : review.rating;
    const newComment = comment !== undefined ? comment : review.comment;

    // 3. Update review
    await pool.query(
      `UPDATE reviews SET rating = ?, comment = ? WHERE id = ?`,
      [newRating, newComment, id]
    );

    // 4. Recalculate average rating for seller
    const [prods] = await pool.query(`SELECT seller_id FROM products WHERE id = ?`, [review.product_id]);
    if (prods.length > 0) {
      const sellerId = prods[0].seller_id;
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

    return res.json({
      success: true,
      message: 'রিভিউ সফলভাবে আপডেট করা হয়েছে (Review updated successfully)',
      review: {
        ...review,
        rating: newRating,
        comment: newComment
      }
    });
  } catch (err) {
    console.error('Error updating review:', err);
    return res.status(500).json({ message: 'Failed to update review.', error: err.message });
  }
};

// @desc Delete a review (Only owner can delete)
// @route DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch existing review
    const [existing] = await pool.query('SELECT * FROM reviews WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'রিভিউ পাওয়া যায়নি (Review not found)' });
    }

    const review = existing[0];

    // 2. Ownership check: verify authenticated user is the buyer who wrote it
    if (req.user && review.buyer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'আপনি কেবল নিজের রিভিউ মুছতে পারবেন (Unauthorized)' });
    }

    // 3. Delete review
    await pool.query('DELETE FROM reviews WHERE id = ?', [id]);

    // 4. Recalculate average rating for seller
    const [prods] = await pool.query(`SELECT seller_id FROM products WHERE id = ?`, [review.product_id]);
    if (prods.length > 0) {
      const sellerId = prods[0].seller_id;
      const [ratingStats] = await pool.query(
        `SELECT AVG(r.rating) as avg_rating, COUNT(r.id) as total_ratings
         FROM reviews r
         JOIN products p ON r.product_id = p.id
         WHERE p.seller_id = ?`,
        [sellerId]
      );

      const avgRating = ratingStats[0].avg_rating ? parseFloat(ratingStats[0].avg_rating) : 5.0;
      const totalRatings = ratingStats[0].total_ratings || 0;

      await pool.query(
        `UPDATE sellers SET rating_avg = ?, total_ratings = ? WHERE id = ?`,
        [avgRating, totalRatings, sellerId]
      );
    }

    return res.json({
      success: true,
      message: 'রিভিউ সফলভাবে মুছে ফেলা হয়েছে (Review deleted successfully)'
    });
  } catch (err) {
    console.error('Error deleting review:', err);
    return res.status(500).json({ message: 'Failed to delete review.', error: err.message });
  }
};
