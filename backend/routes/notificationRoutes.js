const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const db = require('../config/db');

// All notification routes require authentication
router.use(protect);

// ========== GET USER NOTIFICATIONS ==========
router.get('/notifications', async (req, res) => {
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      `SELECT n.*, 
        CASE 
          WHEN n.type = 'exchange' THEN 'exchange'
          WHEN n.type = 'purchase_request' THEN 'purchase_request'
          WHEN n.type = 'message' THEN 'message'
          ELSE n.type 
        END as notification_type
       FROM notifications n
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 100`,
      [userId]
    );
    
    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.json({ success: true, notifications: [] });
  }
});

// ========== GET UNREAD COUNT ==========
router.get('/notifications/unread/count', async (req, res) => {
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.json({ success: true, count: 0 });
  }
});

// ========== MARK NOTIFICATION AS READ ==========
router.put('/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== MARK ALL NOTIFICATIONS AS READ ==========
router.put('/notifications/read/all', async (req, res) => {
  const userId = req.user.id;
  
  try {
    await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DELETE NOTIFICATION ==========
router.delete('/notifications/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;