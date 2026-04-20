const jwt = require('jsonwebtoken');

// Real authentication (for when frontend has token)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
};

// Test version - fake user (use this for testing without login)
const protectTest = async (req, res, next) => {
  req.user = { id: 1 };
  next();
};

module.exports = { protect, protectTest };