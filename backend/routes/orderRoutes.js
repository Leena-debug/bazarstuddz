// ========== GET PURCHASED PRODUCTS FOR REVIEW ==========
router.get('/purchased', protect, async (req, res) => {
  const userId = req.user.id;

  try {
    const query = `
      SELECT DISTINCT 
        p.id,
        p.title,
        p.price,
        p.images,
        p.category,
        o.created_at as purchase_date
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
        AND o.status = 'completed'
      ORDER BY o.created_at DESC
    `;
    
    const result = await db.query(query, [userId]);
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Get purchased products error:', error);
    // Return empty array instead of error
    res.json({ success: true, products: [] });
  }
});