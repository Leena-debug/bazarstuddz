const db = require('../config/db');

// ========== GET MY SELLER RATINGS ==========
exports.getMySellerRatings = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(`
      SELECT 
        sr.id,
        u.id as seller_id,
        u.fullname as seller_name,
        sr.rating,
        sr.comment,
        sr.created_at
      FROM seller_ratings sr
      JOIN users u ON sr.seller_id = u.id
      WHERE sr.buyer_id = $1
      ORDER BY sr.created_at DESC
    `, [userId]);
    
    res.json({ success: true, ratings: result.rows });
  } catch (error) {
    console.error('Get seller ratings error:', error);
    res.json({ success: true, ratings: [] });
  }
};

// ========== SUBMIT SELLER RATING ==========
exports.submitSellerRating = async (req, res) => {
  const { seller_id, rating, comment } = req.body;
  const buyer_id = req.user.id;

  if (!seller_id || !rating) {
    return res.status(400).json({ success: false, message: 'Seller ID and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  try {
    const result = await db.query(`
      INSERT INTO seller_ratings (buyer_id, seller_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (buyer_id, seller_id) 
      DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
      RETURNING *
    `, [buyer_id, seller_id, rating, comment || null]);
    
    res.json({ success: true, rating: result.rows[0] });
  } catch (error) {
    console.error('Submit seller rating error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};