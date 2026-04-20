const db = require('../config/db');

// GET all products
exports.getAllProducts = (req, res) => {
  const query = 'SELECT * FROM products WHERE status = "available" ORDER BY created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, products: results });
  });
};

// GET single product
exports.getProductById = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM products WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: results[0] });
  });
};

// CREATE product
exports.createProduct = (req, res) => {
  const { title, description, price, category, product_condition, images } = req.body;
  const seller_id = req.user.id;

  const query = `INSERT INTO products (title, description, price, category, product_condition, images, seller_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.query(query, [title, description, price, category, product_condition, JSON.stringify(images || []), seller_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.status(201).json({ success: true, message: 'Product created', productId: result.insertId });
  });
};

// UPDATE product
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { title, description, price, category, product_condition, status } = req.body;
  const query = `UPDATE products SET title=?, description=?, price=?, category=?, product_condition=?, status=? WHERE id=?`;
  db.query(query, [title, description, price, category, product_condition, status, id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Product updated' });
  });
};

// DELETE product
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM products WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: 'Product deleted' });
  });
};

// SEARCH products
exports.searchProducts = (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;
  let query = 'SELECT * FROM products WHERE status = "available"';
  let params = [];

  if (q) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }
  if (minPrice) {
    query += ' AND price >= ?';
    params.push(minPrice);
  }
  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(maxPrice);
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, products: results });
  });
};