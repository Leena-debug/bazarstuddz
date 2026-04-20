const express = require('express');
const router = express.Router();
const { protectTest } = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const favoritesController = require('../controllers/favoritesController');

// Product routes
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
router.get('/search', productController.searchProducts);
router.post('/products', protectTest, productController.createProduct);
router.put('/products/:id', protectTest, productController.updateProduct);
router.delete('/products/:id', protectTest, productController.deleteProduct);

// Cart routes
router.post('/cart', protectTest, cartController.addToCart);
router.get('/cart', protectTest, cartController.getCart);
router.put('/cart/:id', protectTest, cartController.updateCartItem);
router.delete('/cart/:id', protectTest, cartController.removeFromCart);

// Favorites routes
router.post('/favorites', protectTest, favoritesController.addFavorite);
router.get('/favorites', protectTest, favoritesController.getFavorites);
router.delete('/favorites/:id', protectTest, favoritesController.removeFavorite);

module.exports = router;