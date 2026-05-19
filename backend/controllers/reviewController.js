const db = require('../config/db');

// Create reviews table
const createReviewsTable = `
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(createReviewsTable, (err) => {
  if (err) console.error('Reviews table error:', err);
  else console.log('✅ Reviews table ready');
});

// Create seller ratings table
const createSellerRatingsTable = `
CREATE TABLE IF NOT EXISTS seller_ratings (
  id SERIAL PRIMARY KEY,
  buyer_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(createSellerRatingsTable, (err) => {
  if (err) console.error('Seller ratings table error:', err);
  else console.log('✅ Seller ratings table ready');
});

// Create indexes
const createIndexes = `
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_ratings_seller_id ON seller_ratings(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_ratings_buyer_id ON seller_ratings(buyer_id);
`;

db.query(createIndexes, (err) => {
  if (err) console.error('Index creation error:', err);
  else console.log('✅ Indexes ready');
});

// Add columns to products table
const addProductColumns = `
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
`;

db.query(addProductColumns, (err) => {
  if (err) console.error('Add product columns error:', err);
  else console.log('✅ Product rating columns ready');
});

// Add columns to sellers table
const addSellerColumns = `
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,1) DEFAULT 0;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
`;

db.query(addSellerColumns, (err) => {
  if (err) console.error('Add seller columns error:', err);
  else console.log('✅ Seller rating columns ready');
});

// ==================== PRODUCT REVIEW FUNCTIONS ====================

exports.getUserReviews = (req, res) => {
  const user_id = req.user.id;

  const query = `
    SELECT r.*, p.title as product_title, p.images 
    FROM reviews r 
    JOIN products p ON r.product_id = p.id 
    WHERE r.user_id = $1 
    ORDER BY r.created_at DESC
  `;

  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error('Get reviews error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, reviews: results.rows });
  });
};

exports.getProductReviews = (req, res) => {
  const { productId } = req.params;

  const query = `
    SELECT r.*, u.fullname as user_name 
    FROM reviews r 
    JOIN users u ON r.user_id = u.id 
    WHERE r.product_id = $1 
    ORDER BY r.created_at DESC
  `;

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Get product reviews error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }

    let averageRating = 0;
    if (results.rows.length > 0) {
      const sum = results.rows.reduce((acc, review) => acc + review.rating, 0);
      averageRating = sum / results.rows.length;
    }

    res.json({
      success: true,
      reviews: results.rows,
      averageRating: averageRating,
      totalReviews: results.rows.length
    });
  });
};

exports.createReview = (req, res) => {
  const { product_id, rating, comment } = req.body;
  const user_id = req.user.id;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  const checkQuery = `SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2`;
  db.query(checkQuery, [user_id, product_id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (results.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    const insertQuery = `
      INSERT INTO reviews (user_id, product_id, rating, comment) 
      VALUES ($1, $2, $3, $4)
    `;

    db.query(insertQuery, [user_id, product_id, rating, comment], (err, result) => {
      if (err) {
        console.error('Create review error:', err);
        return res.status(500).json({ success: false, message: err.message });
      }

      updateProductAverageRating(product_id);

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        reviewId: result.insertId
      });
    });
  });
};

exports.updateReview = (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const user_id = req.user.id;

  const query = `UPDATE reviews SET rating = $1, comment = $2 WHERE id = $3 AND user_id = $4`;
  db.query(query, [rating, comment, id, user_id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    db.query(`SELECT product_id FROM reviews WHERE id = $1`, [id], (err, rows) => {
      if (rows && rows.rows[0]) {
        updateProductAverageRating(rows.rows[0].product_id);
      }
    });

    res.json({ success: true, message: 'Review updated successfully' });
  });
};

exports.deleteReview = (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  db.query(`SELECT product_id FROM reviews WHERE id = $1 AND user_id = $2`, [id, user_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (rows.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const product_id = rows.rows[0].product_id;

    db.query(`DELETE FROM reviews WHERE id = $1 AND user_id = $2`, [id, user_id], (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: err.message });
      }

      updateProductAverageRating(product_id);

      res.json({ success: true, message: 'Review deleted successfully' });
    });
  });
};

// ========== GET PURCHASED PRODUCTS (from orders, not just products) ==========
exports.getPurchasedProducts = (req, res) => {
  const user_id = req.user.id;

  const query = `
    SELECT DISTINCT p.id, p.title, p.price, p.images, p.description, oi.quantity, o.order_date
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = $1
    AND p.id NOT IN (
      SELECT product_id FROM reviews WHERE user_id = $2
    )
    ORDER BY o.order_date DESC
    LIMIT 30
  `;

  db.query(query, [user_id, user_id], (err, results) => {
    if (err) {
      console.error('Get purchased products error:', err);
      return res.json({
        success: true,
        products: []
      });
    }
    res.json({ success: true, products: results.rows });
  });
};

// ==================== SELLER RATING FUNCTIONS ====================

exports.getChattedSellers = (req, res) => {
  const buyer_id = req.user.id;

  const query = `
    SELECT DISTINCT s.id, s.user_id, s.avg_rating, s.rating_count, u.fullname as seller_name
    FROM sellers s
    JOIN users u ON s.user_id = u.id
    WHERE s.user_id IN (
      SELECT DISTINCT seller_id FROM messages WHERE buyer_id = $1
      UNION
      SELECT DISTINCT user_id FROM messages WHERE sender_id = $1 AND user_type = 'seller'
    )
    AND s.id NOT IN (
      SELECT seller_id FROM seller_ratings WHERE buyer_id = $2
    )
    LIMIT 20
  `;

  db.query(query, [buyer_id, buyer_id], (err, results) => {
    if (err) {
      console.error('Get chatted sellers error:', err);
      return res.json({
        success: true,
        sellers: []
      });
    }
    res.json({ success: true, sellers: results.rows });
  });
};

exports.getMySellerRatings = (req, res) => {
  const buyer_id = req.user.id;

  const query = `
    SELECT sr.*, u.fullname as seller_name, s.avg_rating as seller_avg_rating
    FROM seller_ratings sr
    JOIN sellers s ON sr.seller_id = s.id
    JOIN users u ON s.user_id = u.id
    WHERE sr.buyer_id = $1
    ORDER BY sr.created_at DESC
  `;

  db.query(query, [buyer_id], (err, results) => {
    if (err) {
      console.error('Get seller ratings error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, ratings: results.rows });
  });
};

exports.createSellerRating = (req, res) => {
  const { seller_id, rating, comment } = req.body;
  const buyer_id = req.user.id;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  const checkQuery = `SELECT id FROM seller_ratings WHERE buyer_id = $1 AND seller_id = $2`;
  db.query(checkQuery, [buyer_id, seller_id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (results.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this seller'
      });
    }

    const insertQuery = `
      INSERT INTO seller_ratings (buyer_id, seller_id, rating, comment) 
      VALUES ($1, $2, $3, $4)
    `;

    db.query(insertQuery, [buyer_id, seller_id, rating, comment], (err, result) => {
      if (err) {
        console.error('Create seller rating error:', err);
        return res.status(500).json({ success: false, message: err.message });
      }

      updateSellerAverageRating(seller_id);

      res.status(201).json({
        success: true,
        message: 'Seller rating submitted successfully',
        ratingId: result.insertId
      });
    });
  });
};

// ==================== HELPER FUNCTIONS ====================

const updateProductAverageRating = (product_id) => {
  const query = `
    SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
    FROM reviews 
    WHERE product_id = $1
  `;

  db.query(query, [product_id], (err, results) => {
    if (err || !results.rows[0]) return;

    const avgRating = parseFloat(results.rows[0].avg_rating || 0).toFixed(1);
    const reviewCount = results.rows[0].review_count || 0;

    const updateQuery = `
      UPDATE products 
      SET rating = $1, review_count = $2 
      WHERE id = $3
    `;
    db.query(updateQuery, [avgRating, reviewCount, product_id], (err) => {
      if (err) console.error('Update product rating error:', err);
    });
  });
};

const updateSellerAverageRating = (seller_id) => {
  const query = `
    SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count 
    FROM seller_ratings 
    WHERE seller_id = $1
  `;

  db.query(query, [seller_id], (err, results) => {
    if (err || !results.rows[0]) return;

    const avgRating = parseFloat(results.rows[0].avg_rating || 0).toFixed(1);
    const ratingCount = results.rows[0].rating_count || 0;

    const updateQuery = `
      UPDATE sellers 
      SET avg_rating = $1, rating_count = $2 
      WHERE id = $3
    `;
    db.query(updateQuery, [avgRating, ratingCount, seller_id], (err) => {
      if (err) console.error('Update seller rating error:', err);
    });
  });
};