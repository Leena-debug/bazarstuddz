const db = require('../config/db');

// Create cart table if not exists
const createCartTable = `
CREATE TABLE IF NOT EXISTS cart (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

db.query(createCartTable, (err) => {
  if (err) console.error('Cart table error:', err);
  else console.log('✅ Cart table ready');
});

// ========== ADD TO CART ==========
exports.addToCart = (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;

  console.log(`📝 Add to cart - Product: ${product_id}, User: ${user_id}`);

  const checkQuery = `SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2`;
  db.query(checkQuery, [user_id, product_id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }

    if (results.rows.length > 0) {
      const newQuantity = results.rows[0].quantity + (quantity || 1);
      const updateQuery = `UPDATE cart SET quantity = $1 WHERE id = $2`;
      db.query(updateQuery, [newQuantity, results.rows[0].id], (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: 'Cart updated' });
      });
    } else {
      const insertQuery = `INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3)`;
      db.query(insertQuery, [user_id, product_id, quantity || 1], (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, message: 'Added to cart' });
      });
    }
  });
};

// ========== GET CART (WITH SELLER INFO FROM PRODUCTS) ==========
exports.getCart = (req, res) => {
  const user_id = req.user.id;

  const query = `
    SELECT 
      c.id as cart_id,
      c.product_id, 
      c.quantity, 
      p.title, 
      p.price, 
      p.images, 
      p.seller_id,
      COALESCE(u.fullname, 'Unknown Seller') as seller_name,
      COALESCE(u.email, '') as seller_email
    FROM cart c 
    JOIN products p ON c.product_id = p.id 
    LEFT JOIN users u ON p.seller_id = u.id
    WHERE c.user_id = $1
    ORDER BY c.added_at DESC
  `;

  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error('Get cart error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    
    console.log(`📦 Cart loaded: ${results.rows.length} items`);
    results.rows.forEach(item => {
      console.log(`   - ${item.title} | Seller: ${item.seller_name} (ID: ${item.seller_id})`);
    });
    
    const total = results.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.json({ success: true, cart: results.rows, total });
  });
};

// ========== UPDATE CART ITEM QUANTITY ==========
exports.updateCartItem = (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const user_id = req.user.id;

  const query = `UPDATE cart SET quantity = $1 WHERE id = $2 AND user_id = $3`;
  db.query(query, [quantity, id, user_id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }
    res.json({ success: true, message: 'Cart updated' });
  });
};

// ========== REMOVE FROM CART ==========
exports.removeFromCart = (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const query = `DELETE FROM cart WHERE id = $1 AND user_id = $2`;
  db.query(query, [id, user_id], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }
    res.json({ success: true, message: 'Removed from cart' });
  });
};

// ========== CHECKOUT (Legacy - Keep for compatibility) ==========
exports.checkout = (req, res) => {
  const user_id = req.user.id;

  const getCartQuery = `
    SELECT c.*, p.price as product_price, p.title, p.seller_id
    FROM cart c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.user_id = $1
  `;

  db.query(getCartQuery, [user_id], (err, cartItems) => {
    if (err) {
      console.error('❌ Get cart error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }

    if (cartItems.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const total = cartItems.rows.reduce((sum, item) => sum + (parseFloat(item.product_price) * item.quantity), 0);

    const createOrderQuery = `
      INSERT INTO orders (user_id, total_amount, status, payment_method, created_at) 
      VALUES ($1, $2, $3, $4, NOW()) 
      RETURNING id
    `;

    db.query(createOrderQuery, [user_id, total, 'completed', 'cash'], (err, orderResult) => {
      if (err) {
        console.error('❌ Create order error:', err);
        return res.status(500).json({ success: false, message: err.message });
      }

      const orderId = orderResult.rows[0].id;
      console.log(`✅ Order created with ID: ${orderId}, Total: ${total} DA`);

      const orderItemsQueries = cartItems.rows.map(item => {
        return new Promise((resolve, reject) => {
          const insertItemQuery = `
            INSERT INTO order_items (order_id, product_id, quantity, price_at_time) 
            VALUES ($1, $2, $3, $4)
          `;
          db.query(insertItemQuery, [orderId, item.product_id, item.quantity, item.product_price], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });

      Promise.all(orderItemsQueries)
        .then(() => {
          const clearCartQuery = `DELETE FROM cart WHERE user_id = $1`;
          db.query(clearCartQuery, [user_id], (err) => {
            if (err) console.error('⚠️ Clear cart error:', err);
            else console.log('🗑️ Cart cleared successfully');
          });

          res.json({
            success: true,
            message: 'Checkout completed successfully',
            orderId: orderId,
            total: total
          });
        })
        .catch((err) => {
          console.error('❌ Order items error:', err);
          res.status(500).json({ success: false, message: 'Failed to create order items' });
        });
    });
  });
};

// ========== SEND PURCHASE REQUESTS TO SELLERS ==========
exports.sendPurchaseRequests = async (req, res) => {
  const { items } = req.body;
  const buyerId = req.user.id;
  const buyerName = req.user.fullname;

  console.log(`📦 sendPurchaseRequests called with ${items?.length || 0} items`);
  console.log(`Buyer: ${buyerId} - ${buyerName}`);

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
      
      console.log(`Processing item: ${item.product_title || item.title}, Seller ID: ${sellerId}`);
      
      if (!sellerId) {
        console.log(`⚠️ No seller_id for item, fetching from database...`);
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
          console.log(`✅ Fetched seller ID ${sellerId} for product ${item.product_id}`);
        } else {
          sellerId = 1;
          sellerName = 'Admin';
          console.log(`⚠️ Using default seller (ID: 1) for product ${item.product_id}`);
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
      console.log('❌ No valid sellers found in cart items');
      return res.status(400).json({ 
        success: false, 
        message: 'No valid sellers found.' 
      });
    }

    console.log(`📦 Sending purchase requests to ${sellerGroups.size} seller(s)`);

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
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
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
      const itemsList = group.items.map(item => 
        `• ${item.quantity}x ${item.product_title || item.title} - ${item.price} DA`
      ).join('\n');
      
      const totalAmount = group.items.reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0);
      
      const messageText = `🛒 **New Purchase Request**\n\nHello! I would like to purchase the following items from you:\n\n${itemsList}\n\n**Total Amount:** ${totalAmount.toLocaleString()} DA\n\nPlease confirm if these items are available. Thank you!`;

      // Check if conversation already exists
      let conversationId;
      const existingConv = await db.query(
        `SELECT id FROM conversations 
         WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
        [buyerId, sellerId]
      );
      
      if (existingConv.rows.length > 0) {
        conversationId = existingConv.rows[0].id;
        await db.query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [conversationId]);
        console.log(`Using existing conversation ${conversationId}`);
      } else {
        const newConv = await db.query(
          `INSERT INTO conversations (user1_id, user2_id, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW())
           RETURNING id`,
          [buyerId, sellerId]
        );
        conversationId = newConv.rows[0].id;
        console.log(`Created new conversation ${conversationId}`);
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
        message_id: messageResult.rows[0].id,
        created_at: messageResult.rows[0].created_at
      });

      console.log(`✅ Purchase request sent to seller ${sellerId} (${group.seller_name})`);
    }

    // Clear the cart after successful sending
    for (const item of items) {
      if (item.cart_id) {
        await db.query(`DELETE FROM cart WHERE id = $1 AND user_id = $2`, [item.cart_id, buyerId]);
        console.log(`🗑️ Removed cart item ${item.cart_id}`);
      }
    }

    res.json({ 
      success: true, 
      message: `Purchase requests sent to ${sellerGroups.size} seller(s)`,
      messages: messages 
    });
  } catch (error) {
    console.error('Send purchase requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};