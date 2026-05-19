const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const cartController = require('../controllers/cartController');
const db = require('../config/db');

// Get cart - GET /api/cart
router.get('/cart', protect, cartController.getCart);

// Add to cart - POST /api/cart
router.post('/cart', protect, cartController.addToCart);

// Update cart item quantity - PUT /api/cart/:id
router.put('/cart/:id', protect, cartController.updateCartItem);

// Remove from cart - DELETE /api/cart/:id
router.delete('/cart/:id', protect, cartController.removeFromCart);

// Checkout - POST /api/cart/checkout (legacy)
router.post('/cart/checkout', protect, cartController.checkout);

// ========== SEND PURCHASE REQUESTS TO SELLERS ==========
router.post('/cart/send-purchase-requests', protect, async (req, res) => {
  const { items } = req.body;
  const buyerId = req.user.id;
  const buyerName = req.user.fullname;

  console.log('📦 Received items for purchase request:', JSON.stringify(items, null, 2));
  console.log(`Buyer ID: ${buyerId}, Buyer Name: ${buyerName}`);

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in cart' });
  }

  try {
    const messages = [];
    
    // Group items by seller
    const sellerGroups = new Map();
    
    for (const item of items) {
      let sellerId = item.seller_id;
      let sellerName = item.seller_name;
      
      console.log(`Processing item: ${item.product_title}, Seller ID from item: ${sellerId}`);
      
      // If seller_id is missing or 1, fetch from database
      if (!sellerId || sellerId === 1) {
        const productResult = await db.query(
          `SELECT p.seller_id, u.fullname as seller_name 
           FROM products p 
           LEFT JOIN users u ON p.seller_id = u.id 
           WHERE p.id = $1`,
          [item.product_id]
        );
        if (productResult.rows.length > 0 && productResult.rows[0].seller_id) {
          sellerId = productResult.rows[0].seller_id;
          sellerName = productResult.rows[0].seller_name;
          console.log(`✅ Fetched seller for product ${item.product_id}: ${sellerId} - ${sellerName}`);
        } else {
          sellerId = 1;
          sellerName = 'Admin';
        }
      }
      
      if (!sellerGroups.has(sellerId)) {
        sellerGroups.set(sellerId, {
          seller_id: sellerId,
          seller_name: sellerName || 'Seller',
          items: []
        });
      }
      sellerGroups.get(sellerId).items.push(item);
    }

    if (sellerGroups.size === 0) {
      console.log('❌ No valid sellers found');
      return res.status(400).json({ 
        success: false, 
        message: 'No valid sellers found.' 
      });
    }

    console.log(`📦 Sending to ${sellerGroups.size} seller(s)`);
    for (const [sid, grp] of sellerGroups) {
      console.log(`   Seller ${sid} (${grp.seller_name}): ${grp.items.length} items`);
    }

    // Create tables if they don't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER NOT NULL,
        user2_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user1_id, user2_id)
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255),
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create message for each seller
    for (const [sellerId, group] of sellerGroups) {
      console.log(`\n📨 Creating message for seller ${sellerId} (${group.seller_name})`);
      
      const itemsList = group.items.map(item => 
        `• ${item.quantity}x ${item.product_title} - ${item.price} DA`
      ).join('\n');
      
      const totalAmount = group.items.reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0);
      
      const messageText = `🛒 **New Purchase Request**\n\nHello! I would like to purchase the following items from you:\n\n${itemsList}\n\n**Total Amount:** ${totalAmount.toLocaleString()} DA\n\nPlease confirm if these items are available. Thank you!`;

      // Find or create conversation for THIS SPECIFIC seller
      let conversationId;
      const existingConv = await db.query(
        `SELECT id FROM conversations 
         WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
        [buyerId, sellerId]
      );
      
      if (existingConv.rows.length > 0) {
        conversationId = existingConv.rows[0].id;
        await db.query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [conversationId]);
        console.log(`   Using existing conversation ${conversationId}`);
      } else {
        const newConv = await db.query(
          `INSERT INTO conversations (user1_id, user2_id, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW())
           RETURNING id`,
          [buyerId, sellerId]
        );
        conversationId = newConv.rows[0].id;
        console.log(`   Created NEW conversation ${conversationId}`);
      }

      // Insert message
      const messageResult = await db.query(
        `INSERT INTO messages (conversation_id, sender_id, receiver_id, message, is_read, created_at)
         VALUES ($1, $2, $3, $4, false, NOW())
         RETURNING id, created_at`,
        [conversationId, buyerId, sellerId, messageText]
      );

      // Create notification for seller
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, data, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, false, NOW())`,
        [
          sellerId,
          '🛒 New Purchase Request',
          `${buyerName} wants to purchase ${group.items.length} item(s) from you. Total: ${totalAmount.toLocaleString()} DA`,
          'purchase_request',
          JSON.stringify({ 
            conversation_id: conversationId, 
            buyer_id: buyerId,
            items_count: group.items.length,
            total_amount: totalAmount
          })
        ]
      );

      messages.push({
        seller_id: sellerId,
        seller_name: group.seller_name,
        conversation_id: conversationId,
        message_id: messageResult.rows[0].id
      });

      console.log(`   ✅ Message ${messageResult.rows[0].id} sent to seller ${sellerId}`);
    }

    // Clear the cart
    for (const item of items) {
      if (item.cart_id) {
        await db.query(`DELETE FROM cart WHERE id = $1 AND user_id = $2`, [item.cart_id, buyerId]);
        console.log(`🗑️ Removed cart item ${item.cart_id}`);
      }
    }

    console.log(`\n✅ Successfully sent ${messages.length} messages to ${sellerGroups.size} sellers`);
    res.json({ 
      success: true, 
      message: `Purchase requests sent to ${sellerGroups.size} seller(s)`,
      messages: messages 
    });
  } catch (error) {
    console.error('Send purchase requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========== GET PURCHASE REQUESTS STATUS ==========
router.get('/cart/purchase-requests/status', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await db.query(
      `SELECT m.*, u.fullname as receiver_name,
              c.user1_id, c.user2_id
       FROM messages m
       JOIN users u ON m.receiver_id = u.id
       JOIN conversations c ON m.conversation_id = c.id
       WHERE m.sender_id = $1 AND m.message LIKE '🛒%'
       ORDER BY m.created_at DESC`,
      [userId]
    );

    res.json({ success: true, requests: result.rows });
  } catch (error) {
    console.error('Get purchase requests status error:', error);
    res.json({ success: true, requests: [] });
  }
});

module.exports = router;