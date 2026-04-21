const db = require('../config/db');

// Create favorites table if not exists (PostgreSQL version)
const createFavoritesTable = `
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
)`;

// Execute table creation (async/await)
const initTable = async () => {
  try {
    await db.query(createFavoritesTable);
    console.log('✅ Favorites table ready');
  } catch (err) {
    console.error('❌ Favorites table creation error:', err.message);
  }
};
initTable();

// ADD favorite
exports.addFavorite = async (req, res) => {
  const { product_id } = req.body;
  const user_id = req.user.id;

  const query = `INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT (user_id, product_id) DO NOTHING`;
  try {
    await db.query(query, [user_id, product_id]);
    res.json({ success: true, message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET favorites
exports.getFavorites = async (req, res) => {
  const user_id = req.user.id;
  const query = `SELECT p.* FROM favorites f 
                 JOIN products p ON f.product_id = p.id 
                 WHERE f.user_id = $1`;
  try {
    const result = await db.query(query, [user_id]);
    res.json({ success: true, favorites: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// REMOVE favorite
exports.removeFavorite = async (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM favorites WHERE id = $1`;
  try {
    await db.query(query, [id]);
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};