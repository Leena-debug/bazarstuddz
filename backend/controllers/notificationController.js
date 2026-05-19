const db = require('../config/db');

// Global io instance (will be set from server.js)
let ioInstance = null;

// Set Socket.io instance
const setIo = (io) => {
  ioInstance = io;
};

// ========== CREATE NOTIFICATION (with Socket.io real-time emit) ==========
const createNotification = async (userId, type, title, message, data = null) => {
  const query = `
    INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at) 
    VALUES ($1, $2, $3, $4, $5, FALSE, NOW()) 
    RETURNING *
  `;
  
  try {
    const result = await db.query(query, [userId, type, title, message, data ? JSON.stringify(data) : null]);
    const notification = result.rows[0];
    
    // Emit real-time notification to the specific user's room
    if (ioInstance) {
      ioInstance.to(`user_${userId}`).emit('new_notification', notification);
      console.log(`📢 Real-time notification sent to user ${userId}`);
    }
    
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

// ========== EXPORT CREATE NOTIFICATION FOR OTHER CONTROLLERS ==========
exports.createNotification = createNotification;
exports.setIo = setIo;

// ========== GET USER NOTIFICATIONS ==========
exports.getUserNotifications = async (req, res) => {
  const user_id = req.user.id;
  const { limit = 50, offset = 0 } = req.query;

  const query = `
    SELECT * FROM notifications 
    WHERE user_id = $1 
    ORDER BY created_at DESC 
    LIMIT $2 OFFSET $3
  `;

  try {
    const result = await db.query(query, [user_id, parseInt(limit), parseInt(offset)]);
    res.json({ success: true, notifications: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== GET UNREAD COUNT ==========
exports.getUnreadCount = async (req, res) => {
  const user_id = req.user.id;

  const query = `
    SELECT COUNT(*) as count FROM notifications 
    WHERE user_id = $1 AND is_read = FALSE
  `;

  try {
    const result = await db.query(query, [user_id]);
    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== MARK NOTIFICATION AS READ ==========
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const query = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE id = $1 AND user_id = $2 
    RETURNING *
  `;

  try {
    const result = await db.query(query, [id, user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification: result.rows[0] });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== MARK ALL AS READ ==========
exports.markAllAsRead = async (req, res) => {
  const user_id = req.user.id;

  const query = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE user_id = $1 AND is_read = FALSE
  `;

  try {
    await db.query(query, [user_id]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== DELETE NOTIFICATION ==========
exports.deleteNotification = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const query = `DELETE FROM notifications WHERE id = $1 AND user_id = $2`;

  try {
    const result = await db.query(query, [id, user_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== CREATE NOTIFICATION FOR NEW PRODUCT ==========
exports.notifyNewProduct = async (product, sellerName) => {
  // This would notify all buyers about a new product
  // You can implement this to notify specific user groups
  
  const query = `
    SELECT id FROM users WHERE role = 'student_buyer'
  `;
  
  try {
    const result = await db.query(query);
    const buyers = result.rows;
    
    for (const buyer of buyers) {
      await createNotification(
        buyer.id,
        'product',
        'New Product Available',
        `${sellerName} posted a new product: ${product.title}`,
        { product_id: product.id, product_title: product.title }
      );
    }
    console.log(`📢 New product notification sent to ${buyers.length} buyers`);
  } catch (error) {
    console.error('Notify new product error:', error);
  }
};

// ========== CREATE NOTIFICATION FOR ORDER STATUS ==========
exports.notifyOrderStatus = async (userId, orderId, status, amount) => {
  const statusMessages = {
    'completed': `Your order #${orderId} has been completed successfully!`,
    'shipped': `Your order #${orderId} has been shipped!`,
    'delivered': `Your order #${orderId} has been delivered!`,
    'cancelled': `Your order #${orderId} has been cancelled.`
  };
  
  const message = statusMessages[status] || `Your order #${orderId} status updated to ${status}`;
  
  await createNotification(
    userId,
    'order',
    `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message,
    { order_id: orderId, status: status, amount: amount }
  );
};

// ========== CREATE NOTIFICATION FOR NEW REVIEW ==========
exports.notifyNewReview = async (sellerId, productTitle, reviewerName, rating) => {
  await createNotification(
    sellerId,
    'review',
    'New Review Received',
    `${reviewerName} rated your product "${productTitle}" ${rating} stars`,
    { product_title: productTitle, rating: rating, reviewer: reviewerName }
  );
};

// ========== CREATE NOTIFICATION FOR CALL REQUEST ==========
exports.notifyCallRequest = async (receiverId, callerName, productTitle) => {
  await createNotification(
    receiverId,
    'call',
    'Call Request',
    `${callerName} wants to call you about "${productTitle}"`,
    { caller_name: callerName, product_title: productTitle, type: 'call_request' }
  );
};