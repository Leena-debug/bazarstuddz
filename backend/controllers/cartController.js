const db = require('../config/db');

// Create cart table if not exists (PostgreSQL version)
const createCartTable = `
CREATE TABLE IF NOT EXISTS cart (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
)`;

// Execute table creation
const initTable = async () => {
  try {
    await db.query(createCartTable);
    console.log('✅ Cart table ready');
  } catch (err) {
    console.error('❌ Cart table creation error:', err.message);
  }
};
initTable();


// ADD to cart
exports.addToCart = async (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;
  const qty = quantity || 1;

  const query = `INSERT INTO cart (user_id, product_id, quantity) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (user_id, product_id) 
                 DO UPDATE SET quantity = cart.quantity + $3`;
  try {
    await db.query(query, [user_id, product_id, qty]);
    res.json({ success: true, message: 'Added to cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET cart
exports.getCart = async (req, res) => {
  const user_id = req.user.id;
  const query = `SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.images 
                 FROM cart c 
                 JOIN products p ON c.product_id = p.id 
                 WHERE c.user_id = $1`;
  try {
    const result = await db.query(query, [user_id]);
    const total = result.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.json({ success: true, cart: result.rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE cart quantity
exports.updateCartItem = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const query = 'UPDATE cart SET quantity = $1 WHERE id = $2';
  try {
    await db.query(query, [quantity, id]);
    res.json({ success: true, message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// REMOVE from cart
exports.removeFromCart = async (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM cart WHERE id = $1';
  try {
    await db.query(query, [id]);
    res.json({ success: true, message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};