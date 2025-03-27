const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { check } = require('express-validator');

router.post(
  '/',
  authMiddleware,
  [
    check('productId', 'Product ID is required').not().isEmpty(),
    check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    check('comment', 'Comment must be at least 10 characters').optional().isLength({ min: 10 })
  ],
  reviewController.createReview
);

router.get(
  '/product/:productId',
  reviewController.getProductReviews
);

router.put(
  '/moderate/:reviewId',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    check('action', 'Action must be either approve or reject').isIn(['approve', 'reject'])
  ],
  reviewController.moderateReview
);

module.exports = router;