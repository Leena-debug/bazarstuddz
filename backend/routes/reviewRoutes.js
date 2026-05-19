const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const reviewController = require('../controllers/reviewController');

// All routes require authentication
router.use(protect);

// ==================== PRODUCT REVIEW ROUTES ====================
router.get('/reviews/user', reviewController.getUserReviews);
router.get('/reviews/product/:productId', reviewController.getProductReviews);
router.post('/reviews', reviewController.createReview);
router.put('/reviews/:id', reviewController.updateReview);
router.delete('/reviews/:id', reviewController.deleteReview);
router.get('/orders/purchased', reviewController.getPurchasedProducts);

// ==================== SELLER RATING ROUTES ====================
router.get('/sellers/chatted', reviewController.getChattedSellers);
router.get('/seller-ratings/my', reviewController.getMySellerRatings);
router.post('/seller-ratings', reviewController.createSellerRating);

module.exports = router;