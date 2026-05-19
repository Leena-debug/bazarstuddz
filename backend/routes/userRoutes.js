const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const db = require('../config/db');

// ========== PUBLIC ROUTES ==========
router.post('/register', register);
router.post('/login', login);

// ========== PROTECTED ROUTES ==========
router.get('/me', protect, getMe);

// ========== SEARCH USER BY EMAIL ==========
router.get('/search', protect, async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const result = await db.query(`
      SELECT id, fullname, email, role, is_admin
      FROM users 
      WHERE email ILIKE $1
      LIMIT 1
    `, [`%${email}%`]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Search user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET SELLERS USER HAS CHATTED WITH ==========
router.get('/sellers/chatted', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT DISTINCT 
        u.id,
        u.fullname as seller_name,
        0 as avg_rating,
        0 as rating_count
      FROM messages m
      JOIN users u ON (m.sender_id = u.id OR m.receiver_id = u.id)
      WHERE (m.sender_id = $1 OR m.receiver_id = $1) 
        AND u.id != $1
        AND u.is_admin = false
      GROUP BY u.id, u.fullname
      ORDER BY u.fullname ASC
    `;
    
    const result = await db.query(query, [userId]);
    res.json({ success: true, sellers: result.rows });
  } catch (error) {
    console.error('Get chatted sellers error:', error);
    res.json({ success: true, sellers: [] });
  }
});

// ========== GET PURCHASED PRODUCTS ==========
router.get('/purchased', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT DISTINCT 
        p.id,
        p.title,
        p.price,
        p.images,
        p.category
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY p.id DESC
    `;
    
    let result = await db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      const demoQuery = `
        SELECT id, title, price, images, category
        FROM products 
        WHERE status = 'available'
        ORDER BY id DESC 
        LIMIT 6
      `;
      const demoResult = await db.query(demoQuery);
      result = demoResult;
    }
    
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Get purchased products error:', error);
    res.json({ success: true, products: [] });
  }
});

// ========== GET USER BY ID ==========
router.get('/:id', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT id, fullname, email, phonenumber, points, rating, role, user_type, is_admin, created_at
      FROM users 
      WHERE id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== UPDATE USER ==========
router.put('/:id', protect, async (req, res) => {
  const { id } = req.params;
  const { fullName, phoneNumber, role } = req.body;
  
  try {
    let updates = [];
    let values = [];
    let valueIndex = 1;
    
    if (fullName !== undefined) {
      updates.push(`fullname = $${valueIndex++}`);
      values.push(fullName);
    }
    if (phoneNumber !== undefined) {
      updates.push(`phonenumber = $${valueIndex++}`);
      values.push(phoneNumber);
    }
    if (role !== undefined) {
      updates.push(`role = $${valueIndex++}`);
      values.push(role);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }
    
    values.push(id);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${valueIndex} RETURNING id, fullname, email, phonenumber, role, is_admin`;
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'User updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== UPDATE USER ROLE ONLY ==========
router.put('/:id/role', protect, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  if (!role) {
    return res.status(400).json({ success: false, message: 'Role is required' });
  }
  
  try {
    const result = await db.query(`
      UPDATE users 
      SET role = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, role, is_admin
    `, [role, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'Role updated successfully', role: result.rows[0].role, is_admin: result.rows[0].is_admin });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== GET USER PREFERENCES ==========
router.get('/:id/preferences', protect, async (req, res) => {
  const { id } = req.params;
  
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        darkmode BOOLEAN DEFAULT FALSE,
        language VARCHAR(5) DEFAULT 'en',
        notifications BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);
    
    let result = await db.query('SELECT * FROM user_preferences WHERE user_id = $1', [id]);
    
    if (result.rows.length === 0) {
      await db.query('INSERT INTO user_preferences (user_id) VALUES ($1)', [id]);
      result = await db.query('SELECT * FROM user_preferences WHERE user_id = $1', [id]);
    }
    
    res.json({ 
      success: true, 
      preferences: {
        darkMode: result.rows[0].darkmode,
        language: result.rows[0].language,
        notifications: result.rows[0].notifications
      }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== UPDATE USER PREFERENCES ==========
router.put('/:id/preferences', protect, async (req, res) => {
  const { id } = req.params;
  const { darkMode, language, notifications } = req.body;
  
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        darkmode BOOLEAN DEFAULT FALSE,
        language VARCHAR(5) DEFAULT 'en',
        notifications BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(createTableQuery);
    
    let checkResult = await db.query('SELECT * FROM user_preferences WHERE user_id = $1', [id]);
    if (checkResult.rows.length === 0) {
      await db.query('INSERT INTO user_preferences (user_id) VALUES ($1)', [id]);
    }
    
    await db.query(
      `UPDATE user_preferences 
       SET darkmode = COALESCE($1, darkmode), 
           language = COALESCE($2, language), 
           notifications = COALESCE($3, notifications),
           updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $4`,
      [darkMode !== undefined ? darkMode : null, language || null, notifications !== undefined ? notifications : null, id]
    );
    
    res.json({ success: true, message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;