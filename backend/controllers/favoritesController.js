const db = require('../config/db');

// Create favorites table
const createFavoritesTable = `
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorite (user_id, product_id)
)`;
db.query(createFavoritesTable);

// ADD favorite
exports.addFavorite = (req, res) => {
  const { product_id } = req.body;
  const user_id = req.user.id;

  const query = `INSERT INTO favorites (user_id, product_id) VALUES (?, ?)`;
  db.query(query, [user_id, product_id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Added to favorites' });
  });
};

// GET favorites
exports.getFavorites = (req, res) => {
  const user_id = req.user.id;
  const query = `SELECT p.* FROM favorites f JOIN products p ON f.product_id = p.id WHERE f.user_id = ?`;
  db.query(query, [user_id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, favorites: results });
  });
};

// REMOVE favorite
exports.removeFavorite = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM favorites WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Removed from favorites' });
  });
};