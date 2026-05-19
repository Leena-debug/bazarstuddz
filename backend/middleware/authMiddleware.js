const jwt = require('jsonwebtoken');
const db = require('../config/db');

// ========== REAL AUTHENTICATION ==========
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const query = `SELECT id, fullname, email, phonenumber, user_type, role, points, rating FROM users WHERE id = $1`;
      const result = await db.query(query, [decoded.id]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      
      req.user = result.rows[0];
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
};

module.exports = { protect };