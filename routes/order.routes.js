const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { check } = require('express-validator');

router.post(
  '/cart',
  authMiddleware,
  [
    check('productId', 'Product ID is required').not().isEmpty(),
    check('quantity', 'Quantity must be at least 1').isInt({ min: 1 })
  ],
  orderController.addToCart
);

router.get(
  '/cart',
  authMiddleware,
  orderController.getCart
);

router.post(
  '/checkout',
  authMiddleware,
  [
    check('paymentMethod', 'Payment method is required').isIn(['card', 'bank', 'cash', 'liqpay', 'fondy']),
    check('shippingAddress', 'Shipping address is required').not().isEmpty(),
    check('contactPhone', 'Contact phone is required').not().isEmpty()
  ],
  orderController.createOrder
);

router.get(
  '/',
  authMiddleware,
  orderController.getUserOrders
);

module.exports = router;