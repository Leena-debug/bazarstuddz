const db = require('../config/db');

// Create cart table
const createCartTable = `
CREATE TABLE IF NOT EXISTS cart (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
)`;
db.query(createCartTable);

// ADD to cart
exports.addToCart = (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;

  const query = `INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE quantity = quantity + ?`;
  db.query(query, [user_id, product_id, quantity, quantity], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Added to cart' });
  });
};

// GET cart
exports.getCart = (req, res) => {
  const user_id = req.user.id;
  const query = `SELECT c.*, p.title, p.price, p.images 
                 FROM cart c JOIN products p ON c.product_id = p.id 
                 WHERE c.user_id = ?`;
  db.query(query, [user_id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    const total = results.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.json({ success: true, cart: results, total });
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