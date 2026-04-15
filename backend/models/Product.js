const db = require('../config/db');

// Create products table if not exists
const createProductTable = `
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(50),
  condition VARCHAR(20) DEFAULT 'Good',
  images TEXT,
  seller_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

db.query(createProductTable, (err) => {
  if (err) console.error('Product table error:', err);
  else console.log('✅ Products table ready');
});

module.exports = { db };