const db = require('../config/db');
const notificationController = require('./notificationController');

// ========== GET ALL CONVERSATIONS (CHAT LIST) ==========
exports.getConversations = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT DISTINCT 
        u.id, 
        u.fullname, 
        u.email,
        (SELECT message FROM messages 
         WHERE (sender_id = $1 AND receiver_id = u.id) 
            OR (sender_id = u.id AND receiver_id = $1)
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages 
         WHERE (sender_id = $1 AND receiver_id = u.id) 
            OR (sender_id = u.id AND receiver_id = $1)
         ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages 
         WHERE sender_id = u.id AND receiver_id = $1 AND is_read = FALSE) as unread_count
      FROM users u
      WHERE u.id IN (
        SELECT DISTINCT sender_id FROM messages WHERE receiver_id = $1
        UNION
        SELECT DISTINCT receiver_id FROM messages WHERE sender_id = $1
      )
      ORDER BY last_message_time DESC
    `;
    const result = await db.query(query, [userId]);
    
    res.json({ success: true, conversations: result.rows });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== GET MESSAGES BETWEEN TWO USERS ==========
exports.getMessages = async (req, res) => {
  const currentUserId = req.user.id;
  const { userId } = req.params;

  try {
    // Mark messages as read when user opens chat
    await db.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE',
      [userId, currentUserId]
    );

    const query = `
      SELECT * FROM messages 
      WHERE (sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `;
    const result = await db.query(query, [currentUserId, userId]);
    
    res.json({ success: true, messages: result.rows });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== SEND MESSAGE (WITH NOTIFICATION) ==========
exports.sendMessage = async (req, res) => {
  const { receiver_id, message } = req.body;
  const sender_id = req.user.id;

  if (!receiver_id || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Receiver ID and message are required' 
    });
  }

  try {
    // Insert message into database
    const insertQuery = `
      INSERT INTO messages (sender_id, receiver_id, message, is_read, created_at) 
      VALUES ($1, $2, $3, FALSE, NOW()) 
      RETURNING *
    `;
    const result = await db.query(insertQuery, [sender_id, receiver_id, message]);
    const newMessage = result.rows[0];

    // Get sender name for notification
    const senderQuery = `SELECT fullname FROM users WHERE id = $1`;
    const senderResult = await db.query(senderQuery, [sender_id]);
    const senderName = senderResult.rows[0]?.fullname || 'Someone';

    // Create notification for receiver
    await notificationController.createNotification(
      receiver_id,
      'message',
      'New Message',
      `${senderName} sent you a message`,
      { 
        message_id: newMessage.id, 
        sender_id: sender_id,
        sender_name: senderName
      }
    );

    res.status(201).json({ 
      success: true, 
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== MARK MESSAGE AS READ ==========
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const query = `
      UPDATE messages 
      SET is_read = TRUE 
      WHERE id = $1 AND receiver_id = $2 
      RETURNING *
    `;
    const result = await db.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    res.json({ success: true, message: 'Message marked as read' });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== GET UNREAD MESSAGE COUNT ==========
exports.getUnreadCount = async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT COUNT(*) as count FROM messages 
      WHERE receiver_id = $1 AND is_read = FALSE
    `;
    const result = await db.query(query, [userId]);
    
    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ========== DELETE MESSAGE ==========
exports.deleteMessage = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const query = `
      DELETE FROM messages 
      WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)
    `;
    const result = await db.query(query, [id, userId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};