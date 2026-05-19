const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ✅ PUBLIC ROUTES - No token required
router.post('/register', authController.register);
router.post('/login', authController.login);

// ✅ FORGOT PASSWORD ROUTES - Public (no token required)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// ✅ PROTECTED ROUTE - Needs token
router.get('/me', protect, authController.getMe);

module.exports = router;