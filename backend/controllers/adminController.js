const db = require('../config/db');

// ========== REPORTS FUNCTIONS ==========

// Create a report (any authenticated user)
exports.createReport = async (req, res) => {
  const { reported_type, reported_id, reason } = req.body;
  const reporter_id = req.user.id;

  if (!reported_type || !reported_id || !reason) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    // Create table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER NOT NULL,
        reported_type VARCHAR(20) NOT NULL,
        reported_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        resolved_by INTEGER
      )
    `);

    const result = await db.query(`
      INSERT INTO reports (reporter_id, reported_type, reported_id, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [reporter_id, reported_type, reported_id, reason]);

    res.json({ success: true, message: 'Report submitted successfully', reportId: result.rows[0].id });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all reports (admin only)
exports.getAllReports = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, 
             u1.fullname as reporter_name,
             u2.fullname as resolved_by_name
      FROM reports r
      JOIN users u1 ON r.reporter_id = u1.id
      LEFT JOIN users u2 ON r.resolved_by = u2.id
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, reports: result.rows });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resolve a report (admin only)
exports.resolveReport = async (req, res) => {
  const { id } = req.params;
  const resolved_by = req.user.id;

  try {
    await db.query(`
      UPDATE reports 
      SET status = 'resolved', resolved_at = NOW(), resolved_by = $1 
      WHERE id = $2
    `, [resolved_by, id]);

    res.json({ success: true, message: 'Report resolved successfully' });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== USER MANAGEMENT FUNCTIONS ==========

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, fullname, email, phonenumber, user_type, role, points, rating, is_admin, created_at
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a user (admin only)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role, is_admin } = req.body;
  try {
    await db.query('UPDATE users SET role = $1, is_admin = $2 WHERE id = $3', [role, is_admin || false, id]);
    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== PRODUCT MANAGEMENT FUNCTIONS ==========

// Get all products (admin only)
exports.getAllProducts = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.fullname as seller_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a product (admin only) - WITH CASCADE DELETE
exports.deleteProductAdmin = async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`🗑️ Deleting product ${id} and all references...`);
    
    // 1. Delete from cart table
    const cartResult = await db.query('DELETE FROM cart WHERE product_id = $1 RETURNING id', [id]);
    console.log(`✅ Deleted ${cartResult.rowCount} cart entries`);
    
    // 2. Delete from favorites table
    const favResult = await db.query('DELETE FROM favorites WHERE product_id = $1 RETURNING id', [id]);
    console.log(`✅ Deleted ${favResult.rowCount} favorite entries`);
    
    // 3. Delete from order_items table (if exists)
    try {
      const orderResult = await db.query('DELETE FROM order_items WHERE product_id = $1 RETURNING id', [id]);
      console.log(`✅ Deleted ${orderResult.rowCount} order items`);
    } catch (err) {
      console.log('⚠️ order_items table may not exist yet');
    }
    
    // 4. Delete from reviews table
    const reviewResult = await db.query('DELETE FROM reviews WHERE product_id = $1 RETURNING id', [id]);
    console.log(`✅ Deleted ${reviewResult.rowCount} reviews`);
    
    // 5. Finally delete the product
    const productResult = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    
    if (productResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    console.log(`✅ Product ${id} deleted successfully`);
    res.json({ success: true, message: 'Product deleted successfully' });
    
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product status (admin only)
exports.updateProductStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE products SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true, message: 'Product status updated successfully' });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== REVIEW MANAGEMENT FUNCTIONS ==========

// Get all reviews (admin only)
exports.getAllReviews = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, u.fullname as user_name, p.title as product_title
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, reviews: result.rows });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a review (admin only)
exports.deleteReviewAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM reviews WHERE id = $1', [id]);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== STATISTICS FUNCTIONS ==========

// Get platform statistics (admin only)
exports.getStatistics = async (req, res) => {
  try {
    const stats = {};

    // Total users
    const usersResult = await db.query('SELECT COUNT(*) as total FROM users');
    stats.totalUsers = parseInt(usersResult.rows[0].total);

    // Total products
    const productsResult = await db.query('SELECT COUNT(*) as total FROM products');
    stats.totalProducts = parseInt(productsResult.rows[0].total);

    // Total orders and revenue
    const ordersResult = await db.query('SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as revenue FROM orders');
    stats.totalOrders = parseInt(ordersResult.rows[0].total);
    stats.totalRevenue = parseFloat(ordersResult.rows[0].revenue || 0);

    // Total reviews
    const reviewsResult = await db.query('SELECT COUNT(*) as total FROM reviews');
    stats.totalReviews = parseInt(reviewsResult.rows[0].total);

    // Active listings
    const activeResult = await db.query('SELECT COUNT(*) as total FROM products WHERE status = $1', ['available']);
    stats.activeListings = parseInt(activeResult.rows[0].total);

    // Sold items
    const soldResult = await db.query('SELECT COUNT(*) as total FROM products WHERE status = $1', ['sold']);
    stats.soldItems = parseInt(soldResult.rows[0].total);

    // Pending reports
    const reportsResult = await db.query('SELECT COUNT(*) as total FROM reports WHERE status = $1', ['pending']);
    stats.pendingReports = parseInt(reportsResult.rows[0].total);

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== SETTINGS FUNCTIONS ==========

// Get platform settings (admin only)
exports.getSettings = async (req, res) => {
  try {
    // Create settings table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(50) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER
      )
    `);

    // Insert default settings if not exists
    const defaultSettings = [
      ['site_name', 'Bazar Stud DZ'],
      ['contact_email', 'admin@bazarstuddz.com'],
      ['maintenance_mode', 'false'],
      ['auto_approve_products', 'true'],
      ['max_product_images', '5'],
      ['commission_rate', '5'],
      ['two_factor_auth', 'false'],
      ['session_timeout', '30'],
      ['email_notifications', 'true'],
      ['push_notifications', 'true'],
    ];

    for (const [key, value] of defaultSettings) {
      await db.query(`
        INSERT INTO platform_settings (setting_key, setting_value)
        VALUES ($1, $2)
        ON CONFLICT (setting_key) DO NOTHING
      `, [key, value]);
    }

    // Get all settings
    const result = await db.query('SELECT setting_key, setting_value FROM platform_settings');
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update platform settings (admin only)
exports.updateSettings = async (req, res) => {
  const { 
    site_name, 
    contact_email, 
    maintenance_mode, 
    auto_approve_products,
    max_product_images,
    commission_rate,
    two_factor_auth,
    session_timeout,
    email_notifications,
    push_notifications
  } = req.body;

  try {
    const updates = [
      ['site_name', site_name],
      ['contact_email', contact_email],
      ['maintenance_mode', maintenance_mode],
      ['auto_approve_products', auto_approve_products],
      ['max_product_images', max_product_images],
      ['commission_rate', commission_rate],
      ['two_factor_auth', two_factor_auth],
      ['session_timeout', session_timeout],
      ['email_notifications', email_notifications],
      ['push_notifications', push_notifications],
    ];

    for (const [key, value] of updates) {
      if (value !== undefined) {
        await db.query(`
          UPDATE platform_settings 
          SET setting_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
          WHERE setting_key = $3
        `, [value, req.user.id, key]);
      }
    }

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== BACKUP FUNCTIONS ==========

// Export backup (admin only)
exports.exportBackup = async (req, res) => {
  try {
    // Get all users
    const users = await db.query('SELECT id, fullname, email, phonenumber, role, points, rating, is_admin, created_at FROM users');
    
    // Get all products
    const products = await db.query('SELECT id, title, price, category, status, seller_id, created_at FROM products');
    
    // Get all orders
    const orders = await db.query('SELECT id, user_id, total_amount, status, created_at FROM orders');
    
    // Get all reviews
    const reviews = await db.query('SELECT id, product_id, user_id, rating, comment, created_at FROM reviews');

    const backup = {
      exported_at: new Date().toISOString(),
      exported_by: req.user.id,
      users: users.rows,
      products: products.rows,
      orders: orders.rows,
      reviews: reviews.rows,
      counts: {
        users: users.rows.length,
        products: products.rows.length,
        orders: orders.rows.length,
        reviews: reviews.rows.length,
      }
    };

    res.json({ 
      success: true, 
      backup,
      count: users.rows.length + products.rows.length + orders.rows.length + reviews.rows.length,
      message: 'Backup created successfully' 
    });
  } catch (error) {
    console.error('Export backup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== CACHE FUNCTIONS ==========

// Clear cache (admin only)
exports.clearCache = async (req, res) => {
  try {
    // Clear any cached data (implement based on your caching strategy)
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== RESET FUNCTIONS ==========

// Reset platform (⚠️ DANGER - only for super admin - user id 23)
exports.resetPlatform = async (req, res) => {
  try {
    // Check if user is super admin (id 23 - Aryna)
    if (req.user.id !== 23) {
      return res.status(403).json({ success: false, message: 'Only super admin can reset platform' });
    }

    // Delete all non-admin data
    await db.query('DELETE FROM reviews');
    await db.query('DELETE FROM orders');
    await db.query('DELETE FROM cart');
    await db.query('DELETE FROM messages');
    await db.query('DELETE FROM products');
    await db.query('DELETE FROM reports');
    await db.query('DELETE FROM notifications');
    
    // Delete regular users (keep admins)
    await db.query('DELETE FROM users WHERE is_admin = false');
    
    // Reset settings to defaults
    await db.query(`UPDATE platform_settings SET setting_value = 'false' WHERE setting_key = 'maintenance_mode'`);
    await db.query(`UPDATE platform_settings SET setting_value = 'true' WHERE setting_key = 'auto_approve_products'`);
    await db.query(`UPDATE platform_settings SET setting_value = '5' WHERE setting_key = 'max_product_images'`);
    await db.query(`UPDATE platform_settings SET setting_value = '5' WHERE setting_key = 'commission_rate'`);
    await db.query(`UPDATE platform_settings SET setting_value = '30' WHERE setting_key = 'session_timeout'`);

    res.json({ success: true, message: 'Platform reset completed successfully' });
  } catch (error) {
    console.error('Reset platform error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== PASSWORD RESET REQUESTS FUNCTIONS ==========

// Get all pending reset requests (admin only)
exports.getResetRequests = async (req, res) => {
  try {
    // Create table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255) NOT NULL,
        token_expiry TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        resolved_by INTEGER REFERENCES users(id)
      )
    `);

    const result = await db.query(`
      SELECT r.*, u.fullname, u.email 
      FROM password_reset_requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.requested_at DESC
    `);
    res.json({ success: true, requests: result.rows });
  } catch (error) {
    console.error('Get reset requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all resolved reset requests (admin only)
exports.getResolvedResetRequests = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, u.fullname, u.email, admin.fullname as resolved_by_name
      FROM password_reset_requests r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN users admin ON r.resolved_by = admin.id
      WHERE r.status = 'resolved'
      ORDER BY r.resolved_at DESC
      LIMIT 50
    `);
    res.json({ success: true, requests: result.rows });
  } catch (error) {
    console.error('Get resolved requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark reset request as resolved (admin only)
exports.resolveResetRequest = async (req, res) => {
  const { id } = req.params;
  const resolved_by = req.user.id;
  
  try {
    await db.query(`
      UPDATE password_reset_requests 
      SET status = 'resolved', resolved_at = NOW(), resolved_by = $1
      WHERE id = $2
    `, [resolved_by, id]);
    res.json({ success: true, message: 'Reset request marked as resolved' });
  } catch (error) {
    console.error('Resolve reset request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};