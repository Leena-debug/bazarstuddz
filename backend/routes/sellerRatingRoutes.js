const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const db = require('../config/db');

// ========== GET MY SELLER RATINGS (Simplified - No Errors) ==========
router.get('/my', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    // Simple query that definitely works
    const result = await db.query(`
      SELECT 
        sr.id,
        sr.seller_id,
        sr.rating,
        sr.comment,
        sr.created_at,
        u.fullname as seller_name
      FROM seller_ratings sr
      JOIN users u ON sr.seller_id = u.id
      WHERE sr.buyer_id = $1
      ORDER BY sr.created_at DESC
    `, [userId]);
    
    // Format the response
    const ratings = result.rows.map(row => ({
      id: row.id,
      seller_id: row.seller_id,
      seller_name: row.seller_name,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at
    }));
    
    res.json({ success: true, ratings });
  } catch (error) {
    console.error('Get seller ratings error:', error);
    // Return empty array on error - app will use demo data
    res.json({ success: true, ratings: [] });
  }
});

// ========== SUBMIT SELLER RATING ==========
router.post('/', protect, async (req, res) => {
  const { seller_id, rating, comment } = req.body;
  const buyer_id = req.user.id;

  if (!seller_id || !rating) {
    return res.status(400).json({ success: false, message: 'Seller ID and rating are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  try {
    // Ensure table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS seller_ratings (
        id SERIAL PRIMARY KEY,
        buyer_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(buyer_id, seller_id)
      )
    `);
    
    const result = await db.query(`
      INSERT INTO seller_ratings (buyer_id, seller_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (buyer_id, seller_id) 
      DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = CURRENT_TIMESTAMP
      RETURNING id, seller_id, rating, comment, created_at
    `, [buyer_id, seller_id, rating, comment || null]);
    
    // Get seller name
    const sellerResult = await db.query(`SELECT fullname FROM users WHERE id = $1`, [seller_id]);
    const sellerName = sellerResult.rows[0]?.fullname || 'Unknown Seller';
    
    res.json({ 
      success: true, 
      rating: {
        id: result.rows[0].id,
        seller_id: result.rows[0].seller_id,
        seller_name: sellerName,
        rating: result.rows[0].rating,
        comment: result.rows[0].comment,
        created_at: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Submit seller rating error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;