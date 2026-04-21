const db = require('../config/db');

// GET all products
exports.getAllProducts = async (req, res) => {
  const query = 'SELECT * FROM products WHERE status = $1 ORDER BY created_at DESC';
  try {
    const result = await db.query(query, ['available']);
    res.json({ success: true, products: result.rows });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single product with seller info
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      p.*,
      s.id as seller_id,
      s.fullName as seller_name,
      s.email as seller_email,
      s.phone as seller_phone,
      s.rating as seller_rating,
      s.bio as seller_bio,
      s.avatar as seller_avatar,
      s.totalSales as seller_total_sales,
      s.university as seller_university,
      s.department as seller_department
    FROM products p
    LEFT JOIN sellers s ON p.seller_id = s.id
    WHERE p.id = $1
  `;
  try {
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE product
exports.createProduct = async (req, res) => {
  const { title, description, price, category, product_condition, images, seller_id } = req.body;
  const sellerId = seller_id || req.user?.id || 1;

  const query = `INSERT INTO products (title, description, price, category, product_condition, images, seller_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
  try {
    const result = await db.query(query, [title, description, price, category, product_condition, JSON.stringify(images || []), sellerId]);
    res.status(201).json({ 
      success: true, 
      message: 'Product created', 
      productId: result.rows[0].id 
    });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, category, product_condition, status } = req.body;
  const query = `UPDATE products SET title=$1, description=$2, price=$3, category=$4, product_condition=$5, status=$6, updated_at = CURRENT_TIMESTAMP WHERE id=$7`;
  try {
    await db.query(query, [title, description, price, category, product_condition, status, id]);
    res.json({ success: true, message: 'Product updated' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM products WHERE id = $1';
  try {
    await db.query(query, [id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// SEARCH products with seller info
exports.searchProducts = async (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;
  let query = `
    SELECT p.*, s.fullName as seller_name, s.rating as seller_rating
    FROM products p
    LEFT JOIN sellers s ON p.seller_id = s.id
    WHERE p.status = $1
  `;
  let params = ['available'];
  let paramCounter = 2;

  if (q) {
    query += ` AND (p.title LIKE $${paramCounter} OR p.description LIKE $${paramCounter})`;
    params.push(`%${q}%`, `%${q}%`);
    paramCounter += 2;
  }
  if (category && category !== 'All') {
    query += ` AND p.category = $${paramCounter}`;
    params.push(category);
    paramCounter++;
  }
  if (minPrice) {
    query += ` AND p.price >= $${paramCounter}`;
    params.push(minPrice);
    paramCounter++;
  }
  if (maxPrice) {
    query += ` AND p.price <= $${paramCounter}`;
    params.push(maxPrice);
    paramCounter++;
  }

  query += ' ORDER BY p.created_at DESC';

  try {
    const result = await db.query(query, params);
    res.json({ success: true, products: result.rows });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};