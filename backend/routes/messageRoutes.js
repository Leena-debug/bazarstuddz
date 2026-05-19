const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const db = require('../config/db');

// All message routes require authentication
router.use(protect);

// ========== CONVERSATIONS ROUTES ==========
// Get all conversations (chat list) for current user
router.get('/conversations', async (req, res) => {
  const userId = req.user.id;

  console.log(`📋 Fetching conversations for user: ${userId}`);

  try {
    const result = await db.query(
      `SELECT 
        c.id,
        c.user1_id,
        c.user2_id,
        c.created_at,
        c.updated_at,
        u1.fullname as user1_name,
        u2.fullname as user2_name,
        (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND receiver_id = $1 AND is_read = false) as unread_count
      FROM conversations c
      LEFT JOIN users u1 ON c.user1_id = u1.id
      LEFT JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY c.updated_at DESC`,
      [userId]
    );

    console.log(`✅ Found ${result.rows.length} conversations`);

    const conversations = result.rows.map(row => {
      const isUser1 = row.user1_id === userId;
      const otherUserId = isUser1 ? row.user2_id : row.user1_id;
      const otherUserName = isUser1 ? row.user2_name : row.user1_name;
      
      return {
        id: row.id,
        other_user_id: otherUserId,
        other_user_name: otherUserName || 'User',
        last_message: row.last_message,
        last_message_time: row.last_message_time,
        unread_count: parseInt(row.unread_count) || 0,
        updated_at: row.updated_at
      };
    });

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== DELETE ENTIRE CONVERSATION ==========
router.delete('/conversation/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  console.log(`🗑️ Deleting conversation ${conversationId} for user ${userId}`);

  try {
    const convCheck = await db.query(
      `SELECT id FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
      [conversationId, userId]
    );
    
    if (convCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    await db.query(`DELETE FROM messages WHERE conversation_id = $1`, [conversationId]);
    await db.query(`DELETE FROM conversations WHERE id = $1`, [conversationId]);
    
    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== MESSAGES ROUTES ==========
// Get messages between current user and another user
router.get('/:userId', async (req, res) => {
  const currentUserId = req.user.id;
  const { userId } = req.params;

  console.log(`💬 Fetching messages between ${currentUserId} and ${userId}`);

  try {
    let conversation = await db.query(
      `SELECT id FROM conversations 
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
      [currentUserId, userId]
    );

    let conversationId;
    if (conversation.rows.length === 0) {
      const newConv = await db.query(
        `INSERT INTO conversations (user1_id, user2_id, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id`,
        [currentUserId, userId]
      );
      conversationId = newConv.rows[0].id;
      console.log(`✅ Created new conversation ${conversationId}`);
    } else {
      conversationId = conversation.rows[0].id;
      console.log(`✅ Using existing conversation ${conversationId}`);
    }

    // Mark messages as read
    await db.query(
      `UPDATE messages SET is_read = true 
       WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false`,
      [conversationId, currentUserId]
    );

    // Get messages
    const messages = await db.query(
      `SELECT m.*, u.fullname as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    console.log(`✅ Found ${messages.rows.length} messages`);

    res.json({ success: true, messages: messages.rows, conversation_id: conversationId });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send a new message
router.post('/send', async (req, res) => {
  const { receiver_id, message, conversation_id } = req.body;
  const sender_id = req.user.id;

  console.log(`📤 Sending message from ${sender_id} to ${receiver_id}: "${message?.substring(0, 50)}"`);

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  try {
    let convId = conversation_id;

    if (!convId) {
      let conversation = await db.query(
        `SELECT id FROM conversations 
         WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
        [sender_id, receiver_id]
      );

      if (conversation.rows.length === 0) {
        const newConv = await db.query(
          `INSERT INTO conversations (user1_id, user2_id, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW())
           RETURNING id`,
          [sender_id, receiver_id]
        );
        convId = newConv.rows[0].id;
        console.log(`✅ Created new conversation ${convId}`);
      } else {
        convId = conversation.rows[0].id;
        console.log(`✅ Using existing conversation ${convId}`);
      }
    }

    // Insert message
    const result = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, message, is_read, created_at)
       VALUES ($1, $2, $3, $4, false, NOW())
       RETURNING id, created_at`,
      [convId, sender_id, receiver_id, message.trim()]
    );

    console.log(`✅ Message inserted with ID: ${result.rows[0].id}`);

    // Update conversation updated_at
    await db.query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
      [convId]
    );

    // Create notification for receiver
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, data, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW())`,
      [
        receiver_id,
        '💬 New Message',
        `${req.user.fullname} sent you a message`,
        'message',
        JSON.stringify({ conversation_id: convId, sender_id: sender_id })
      ]
    );

    res.json({ 
      success: true, 
      message: {
        id: result.rows[0].id,
        conversation_id: convId,
        sender_id: sender_id,
        receiver_id: receiver_id,
        message: message.trim(),
        is_read: false,
        created_at: result.rows[0].created_at
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark a message as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await db.query(
      `UPDATE messages SET is_read = true WHERE id = $1 AND receiver_id = $2`,
      [id, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all messages in a conversation as read
router.put('/conversation/:conversationId/read', async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  try {
    await db.query(
      `UPDATE messages SET is_read = true 
       WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = false`,
      [conversationId, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread message count
router.get('/unread/count', async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM messages 
       WHERE receiver_id = $1 AND is_read = false`,
      [userId]
    );
    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a single message
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await db.query(
      `DELETE FROM messages WHERE id = $1 AND sender_id = $2`,
      [id, userId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;