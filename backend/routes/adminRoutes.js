const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const db = require('../config/db');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const result = await db.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (result.rows[0]?.is_admin !== true) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ========== TEST ROUTE (to verify routes are working) ==========
router.get('/test', protect, isAdmin, (req, res) => {
  res.json({ success: true, message: 'Admin routes are working!' });
});

// ========== REPORT ROUTES ==========
router.post('/reports', protect, adminController.createReport);
router.get('/reports', protect, isAdmin, adminController.getAllReports);
router.put('/reports/:id/resolve', protect, isAdmin, adminController.resolveReport);
router.delete('/reports/clear', protect, isAdmin, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM reports RETURNING id');
    res.json({ success: true, count: result.rowCount, message: 'All reports cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.delete('/reports/clear-resolved', protect, isAdmin, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM reports WHERE status = $1 RETURNING id', ['resolved']);
    res.json({ success: true, count: result.rowCount, message: 'Resolved reports cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== USER MANAGEMENT ROUTES ==========
router.get('/users', protect, isAdmin, adminController.getAllUsers);
router.delete('/users/:id', protect, isAdmin, adminController.deleteUser);
router.put('/users/:id/role', protect, isAdmin, adminController.updateUserRole);
router.delete('/users/:id/products', protect, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM products WHERE seller_id = $1 RETURNING id', [id]);
    res.json({ success: true, count: result.rowCount, message: 'User products deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.delete('/users/:id/reviews', protect, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM reviews WHERE user_id = $1 RETURNING id', [id]);
    res.json({ success: true, count: result.rowCount, message: 'User reviews deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== PRODUCT MANAGEMENT ROUTES ==========
router.get('/products', protect, isAdmin, adminController.getAllProducts);
router.delete('/products/:id', protect, isAdmin, adminController.deleteProductAdmin);
router.put('/products/:id/status', protect, isAdmin, adminController.updateProductStatus);

// ========== REVIEW MANAGEMENT ROUTES ==========
router.get('/reviews', protect, isAdmin, adminController.getAllReviews);
router.delete('/reviews/:id', protect, isAdmin, adminController.deleteReviewAdmin);

// ========== STATISTICS ROUTES ==========
router.get('/statistics', protect, isAdmin, adminController.getStatistics);

// ========== SETTINGS ROUTES ==========
router.get('/settings', protect, isAdmin, adminController.getSettings);
router.put('/settings', protect, isAdmin, adminController.updateSettings);

// ========== BACKUP & MAINTENANCE ROUTES ==========
router.get('/backup', protect, isAdmin, adminController.exportBackup);
router.post('/clear-cache', protect, isAdmin, adminController.clearCache);
router.post('/reset', protect, isAdmin, adminController.resetPlatform);

// ========== PASSWORD RESET REQUESTS ROUTES ==========
// Get all pending reset requests (admin only)
router.get('/reset-requests', protect, isAdmin, adminController.getResetRequests);

// Get all resolved reset requests (admin only)
router.get('/reset-requests/resolved', protect, isAdmin, adminController.getResolvedResetRequests);

// Mark reset request as resolved (admin only)
router.put('/reset-requests/:id/resolve', protect, isAdmin, adminController.resolveResetRequest);

module.exports = router;