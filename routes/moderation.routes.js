const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderation.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { check } = require('express-validator');

router.get(
  '/products/pending',
  authMiddleware,
  roleMiddleware(['admin', 'moderator']),
  moderationController.getPendingProducts
);

router.put(
  '/products/:productId',
  authMiddleware,
  roleMiddleware(['admin', 'moderator']),
  [
    check('action', 'Action must be either approve or reject').isIn(['approve', 'reject']),
    check('reason', 'Reason must be at least 10 characters').optional().isLength({ min: 10 })
  ],
  moderationController.moderateProduct
);

router.get(
  '/reported',
  authMiddleware,
  roleMiddleware(['admin', 'moderator']),
  moderationController.getReportedContent
);

module.exports = router;