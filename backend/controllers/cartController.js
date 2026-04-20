const db = require('../config/db');

// Create cart table if not exists
const createCartTable = `
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cart (user_id, product_id)
)`;
db.query(createCartTable);

// ADD to cart
exports.addToCart = (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;

  const query = `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE quantity = quantity + ?`;
  db.query(query, [user_id, product_id, quantity || 1, quantity || 1], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Added to cart' });
  });
};

// GET cart
exports.getCart = (req, res) => {
  const user_id = req.user.id;
  const query = `SELECT c.id, c.product_id, c.quantity, p.title, p.price, p.images 
                 FROM cart c 
                 JOIN products p ON c.product_id = p.id 
                 WHERE c.user_id = ?`;
  db.query(query, [user_id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    const total = results.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.json({ success: true, cart: results, total });
  });
};

// UPDATE cart quantity
exports.updateCartItem = (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const query = 'UPDATE cart SET quantity = ? WHERE id = ?';
  db.query(query, [quantity, id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Cart updated' });
  });
};

// REMOVE from cart
exports.removeFromCart = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM cart WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Removed from cart' });
  });
};