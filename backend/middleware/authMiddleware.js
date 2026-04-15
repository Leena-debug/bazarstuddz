const jwt = require('jsonwebtoken');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request
      req.user = { id: decoded.id };

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

/**
 * TEMPORARY VERSION - For testing without authentication
 * Use this if you don't have JWT token from frontend yet
 */
const protectTest = async (req, res, next) => {
  // Fake user for testing (remove this when authentication is ready)
  req.user = { id: 1 };
  next();
};

module.exports = { protect, protectTest };