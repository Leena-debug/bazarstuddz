const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const db = require('../config/db');

// ========== CREATE EXCHANGE REQUEST ==========
router.post('/exchanges', protect, async (req, res) => {
  const { 
    product_id, 
    owner_id,
    proposed_product_title,
    proposed_product_price,
    proposed_product_description,
    proposed_product_images,
    meeting_place,
    message 
  } = req.body;
  
  const requester_id = req.user.id;

  if (!product_id || !owner_id) {
    return res.status(400).json({ success: false, message: 'Product ID and Owner ID are required' });
  }

  try {
    // Check if exchange already exists pending
    const existing = await db.query(
      `SELECT id, status FROM exchange_requests 
       WHERE product_id = $1 AND requester_id = $2 AND status = 'pending'`,
      [product_id, requester_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'You already have a pending exchange request for this product' });
    }

    // Get product details for notification
    const product = await db.query(
      'SELECT title FROM products WHERE id = $1',
      [product_id]
    );

    const result = await db.query(
      `INSERT INTO exchange_requests 
       (product_id, requester_id, owner_id, proposed_product_title, proposed_product_price, 
        proposed_product_description, proposed_product_images, meeting_place, message, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW())
       RETURNING *`,
      [product_id, requester_id, owner_id, proposed_product_title, proposed_product_price, 
       proposed_product_description, proposed_product_images || '[]', meeting_place || null, message]
    );

    // Get requester name for notification
    const requester = await db.query(
      'SELECT fullname FROM users WHERE id = $1',
      [requester_id]
    );
    const requesterName = requester.rows[0]?.fullname || 'Someone';

    // CREATE NOTIFICATION FOR THE SELLER
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, data, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        owner_id,
        '📦 New Exchange Request',
        `${requesterName} wants to exchange "${product.rows[0]?.title || 'your product'}" with you. Meeting place: ${meeting_place || 'To be discussed'}`,
        'exchange',
        JSON.stringify({ exchange_id: result.rows[0].id, product_id: product_id, requester_id: requester_id })
      ]
    );

    console.log(`✅ Exchange request created: ${result.rows[0].id}`);
    console.log(`🔔 Notification sent to seller: ${owner_id}`);
    console.log(`📍 Meeting place: ${meeting_place || 'Not specified'}`);

    res.json({ success: true, exchange: result.rows[0] });
  } catch (error) {
    console.error('Create exchange error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET MY EXCHANGE REQUESTS (SENT) ==========
router.get('/exchanges/sent', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT er.*, p.title as product_title, p.images as product_images,
              u.fullname as owner_name
       FROM exchange_requests er
       JOIN products p ON er.product_id = p.id
       JOIN users u ON er.owner_id = u.id
       WHERE er.requester_id = $1
       ORDER BY er.created_at DESC`,
      [userId]
    );

    res.json({ success: true, exchanges: result.rows });
  } catch (error) {
    console.error('Get sent exchanges error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET MY RECEIVED EXCHANGE REQUESTS ==========
router.get('/exchanges/received', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT er.*, p.title as product_title, p.images as product_images,
              u.fullname as requester_name
       FROM exchange_requests er
       JOIN products p ON er.product_id = p.id
       JOIN users u ON er.requester_id = u.id
       WHERE er.owner_id = $1
       ORDER BY er.created_at DESC`,
      [userId]
    );

    res.json({ success: true, exchanges: result.rows });
  } catch (error) {
    console.error('Get received exchanges error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET UNREAD EXCHANGE NOTIFICATIONS COUNT ==========
router.get('/exchanges/notifications/count', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = $1 AND type = 'exchange' AND is_read = false`,
      [userId]
    );

    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get exchange notifications count error:', error);
    res.json({ success: true, count: 0 });
  }
});

// ========== GET EXCHANGE NOTIFICATIONS ==========
router.get('/exchanges/notifications', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 AND type = 'exchange'
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error('Get exchange notifications error:', error);
    res.json({ success: true, notifications: [] });
  }
});

// ========== MARK EXCHANGE NOTIFICATION AS READ ==========
router.put('/exchanges/notifications/:id/read', protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET SINGLE EXCHANGE REQUEST ==========
router.get('/exchanges/:id', protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT er.*, p.title as product_title, p.images as product_images, p.price as product_price,
              u1.fullname as requester_name, u1.email as requester_email,
              u2.fullname as owner_name, u2.email as owner_email
       FROM exchange_requests er
       JOIN products p ON er.product_id = p.id
       JOIN users u1 ON er.requester_id = u1.id
       JOIN users u2 ON er.owner_id = u2.id
       WHERE er.id = $1 AND (er.requester_id = $2 OR er.owner_id = $2)`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exchange not found' });
    }

    // Get messages
    const messages = await db.query(
      `SELECT em.*, u.fullname as sender_name
       FROM exchange_messages em
       JOIN users u ON em.sender_id = u.id
       WHERE em.exchange_id = $1
       ORDER BY em.created_at ASC`,
      [id]
    );

    // Mark notification as read when user views exchange
    await db.query(
      `UPDATE notifications SET is_read = true 
       WHERE user_id = $2 AND data->>'exchange_id' = $1::text`,
      [id, userId]
    );

    res.json({ success: true, exchange: result.rows[0], messages: messages.rows });
  } catch (error) {
    console.error('Get exchange error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== UPDATE EXCHANGE STATUS ==========
router.put('/exchanges/:id/status', protect, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'accepted', 'rejected', 'countered'
  const userId = req.user.id;

  try {
    const exchange = await db.query(
      'SELECT * FROM exchange_requests WHERE id = $1',
      [id]
    );

    if (exchange.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exchange not found' });
    }

    // Only owner can accept/reject
    if (exchange.rows[0].owner_id !== userId && status !== 'countered') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await db.query(
      'UPDATE exchange_requests SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    // Create notification for the other party
    const otherPartyId = exchange.rows[0].requester_id === userId ? exchange.rows[0].owner_id : exchange.rows[0].requester_id;
    const statusMessage = status === 'accepted' ? 'accepted your exchange offer!' : (status === 'rejected' ? 'rejected your exchange offer.' : 'sent a counter offer.');
    
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, data, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        otherPartyId,
        '🔄 Exchange Update',
        `Your exchange request has been ${statusMessage}`,
        'exchange',
        JSON.stringify({ exchange_id: id })
      ]
    );

    res.json({ success: true, message: `Exchange ${status}` });
  } catch (error) {
    console.error('Update exchange error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== SEND EXCHANGE MESSAGE ==========
router.post('/exchanges/:id/messages', protect, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user.id;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  try {
    const exchange = await db.query(
      'SELECT * FROM exchange_requests WHERE id = $1',
      [id]
    );

    if (exchange.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Exchange not found' });
    }

    if (exchange.rows[0].requester_id !== userId && exchange.rows[0].owner_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const result = await db.query(
      `INSERT INTO exchange_messages (exchange_id, sender_id, message, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [id, userId, message.trim()]
    );

    // Send notification to the other party
    const otherPartyId = exchange.rows[0].requester_id === userId ? exchange.rows[0].owner_id : exchange.rows[0].requester_id;
    const senderName = await db.query('SELECT fullname FROM users WHERE id = $1', [userId]);
    
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, data, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        otherPartyId,
        '💬 New Exchange Message',
        `${senderName.rows[0]?.fullname || 'Someone'} sent a message about your exchange request.`,
        'exchange',
        JSON.stringify({ exchange_id: id })
      ]
    );

    res.json({ success: true, message: result.rows[0] });
  } catch (error) {
    console.error('Send exchange message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;