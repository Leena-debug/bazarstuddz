const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const db = require('../config/db');

// ========== GET ALL PRODUCTS ==========
router.get('/products', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.fullname as seller_name, u.phonenumber as seller_phone
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'available' OR p.status = 'sold'
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET PRODUCT BY ID ==========
router.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT p.*, u.fullname as seller_name, u.phonenumber as seller_phone
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== CREATE PRODUCT ==========
router.post('/products', protect, async (req, res) => {
  const { title, price, description, category, product_condition, images } = req.body;
  const seller_id = req.user.id;

  try {
    const result = await db.query(`
      INSERT INTO products (title, price, description, category, product_condition, images, seller_id, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'available', NOW())
      RETURNING *
    `, [title, price, description, category, product_condition, images || '[]', seller_id]);
    
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== UPDATE PRODUCT ==========
router.put('/products/:id', protect, async (req, res) => {
  const { id } = req.params;
  const { title, price, description, category, product_condition } = req.body;
  const userId = req.user.id;

  try {
    const check = await db.query('SELECT seller_id FROM products WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (check.rows[0].seller_id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own products' });
    }

    await db.query(`
      UPDATE products 
      SET title = $1, price = $2, description = $3, category = $4, product_condition = $5
      WHERE id = $6
    `, [title, price, description, category, product_condition, id]);
    
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== MARK AS SOLD ==========
router.put('/products/:id/status', protect, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  try {
    const check = await db.query('SELECT seller_id FROM products WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (check.rows[0].seller_id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only modify your own products' });
    }

    await db.query('UPDATE products SET status = $1 WHERE id = $2', [status, id]);
    
    res.json({ success: true, message: `Product marked as ${status}` });
  } catch (error) {
    console.error('Mark as sold error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DELETE PRODUCT ==========
router.delete('/products/:id', protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const check = await db.query('SELECT seller_id FROM products WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (check.rows[0].seller_id !== userId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own products' });
    }

    await db.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== FAVORITES ROUTES ==========
// Get all favorites
router.get('/favorites', protect, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(`
      SELECT p.*, u.fullname as seller_name
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [userId]);
    res.json({ success: true, favorites: result.rows });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.json({ success: true, favorites: [] });
  }
});

// Add to favorites - FIXED VERSION
router.post('/favorites', protect, async (req, res) => {
  const { product_id } = req.body;
  const userId = req.user.id;
  
  console.log('📝 Adding to favorites - User:', userId, 'Product:', product_id);
  
  try {
    // Create table if not exists with correct structure
    await db.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);
    
    // Insert without created_at (uses DEFAULT)
    const result = await db.query(`
      INSERT INTO favorites (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING id
    `, [userId, product_id]);
    
    if (result.rows.length > 0) {
      console.log('✅ Added to favorites successfully');
      res.json({ success: true, message: 'Added to favorites' });
    } else {
      console.log('⚠️ Product already in favorites');
      res.json({ success: true, message: 'Already in favorites' });
    }
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove from favorites
router.delete('/favorites/:id', protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    await db.query('DELETE FROM favorites WHERE user_id = $1 AND product_id = $2', [userId, id]);
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== CART ROUTES ==========
router.get('/cart', protect, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(`
      SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.images
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.id DESC
    `, [userId]);
    res.json({ success: true, cart: result.rows });
  } catch (error) {
    console.error('Get cart error:', error);
    res.json({ success: true, cart: [] });
  }
});

router.post('/cart', protect, async (req, res) => {
  const { product_id, quantity } = req.body;
  const userId = req.user.id;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);
    
    const existing = await db.query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );
    
    if (existing.rows.length > 0) {
      const newQuantity = existing.rows[0].quantity + (quantity || 1);
      await db.query('UPDATE cart SET quantity = $1 WHERE id = $2', [newQuantity, existing.rows[0].id]);
    } else {
      await db.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)',
        [userId, product_id, quantity || 1]
      );
    }
    res.json({ success: true, message: 'Added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/cart/:id', protect, async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;
  try {
    await db.query('UPDATE cart SET quantity = $1 WHERE id = $2 AND user_id = $3', [quantity, id, userId]);
    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/cart/:id', protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    await db.query('DELETE FROM cart WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ success: true, message: 'Removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;