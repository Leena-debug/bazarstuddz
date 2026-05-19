const db = require('../config/db');

// ========== GET ALL PRODUCTS ==========
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

// ========== GET SINGLE PRODUCT WITH SELLER INFO ==========
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      p.*,
      u.id as seller_id,
      u.fullname as seller_name,
      u.email as seller_email,
      u.phonenumber as seller_phone,
      u.rating as seller_rating,
      u.user_type as seller_type,
      u.points as seller_points
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
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

// ========== CREATE PRODUCT ==========
exports.createProduct = async (req, res) => {
  const { title, description, price, category, product_condition, images } = req.body;
  const seller_id = req.user.id;

  console.log('📝 Creating product for seller:', seller_id);

  if (!title || !price) {
    return res.status(400).json({ success: false, message: 'Title and price are required' });
  }

  const query = `
    INSERT INTO products (title, description, price, category, product_condition, images, seller_id, status, created_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
    RETURNING id
  `;
  try {
    const result = await db.query(query, [
      title, 
      description || '', 
      price, 
      category || 'Other', 
      product_condition || 'Good', 
      JSON.stringify(images || []), 
      seller_id, 
      'available'
    ]);
    res.status(201).json({ 
      success: true, 
      message: 'Product created successfully', 
      productId: result.rows[0].id 
    });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== UPDATE PRODUCT ==========
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, category, product_condition, status } = req.body;
  const seller_id = req.user.id;

  const query = `
    UPDATE products 
    SET title=$1, description=$2, price=$3, category=$4, product_condition=$5, status=$6, updated_at = NOW() 
    WHERE id=$7 AND seller_id=$8
  `;
  try {
    const result = await db.query(query, [title, description, price, category, product_condition, status, id, seller_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not found or not authorized' });
    }
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== DELETE PRODUCT ==========
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  const seller_id = req.user.id;

  const query = 'DELETE FROM products WHERE id = $1 AND seller_id = $2';
  try {
    const result = await db.query(query, [id, seller_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not found or not authorized' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== SEARCH PRODUCTS ==========
exports.searchProducts = async (req, res) => {
  const { q, category, minPrice, maxPrice } = req.query;
  let query = `
    SELECT p.*, u.fullname as seller_name, u.rating as seller_rating
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE p.status = $1
  `;
  let params = ['available'];
  let paramCounter = 2;

  if (q) {
    query += ` AND (p.title ILIKE $${paramCounter} OR p.description ILIKE $${paramCounter})`;
    params.push(`%${q}%`);
    paramCounter++;
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