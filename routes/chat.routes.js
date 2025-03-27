const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { check } = require('express-validator');

router.post(
  '/',
  authMiddleware,
  [
    check('receiverId', 'Receiver ID is required').not().isEmpty(),
    check('text', 'Message text is required').not().isEmpty()
  ],
  chatController.sendMessage
);

router.get(
  '/:userId',
  authMiddleware,
  chatController.getMessages
);

module.exports = router;