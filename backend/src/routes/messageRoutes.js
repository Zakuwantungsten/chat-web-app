const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');
const auth = require('../middleware/auth');
const { 
  validateSendMessage,
  validateEditMessage,
  validateMessageId,
  validateGetRoomMessages,
  validateMarkAsRead,
  validateSearchMessages 
} = require('../middleware/chatValidation');

// Apply auth middleware to all routes
router.use(auth);

// POST /api/messages/:roomId/send - Send a message to a chat room
router.post('/:roomId/send', validateSendMessage, MessageController.sendMessage);

// GET /api/messages/:roomId - Get messages for a chat room
router.get('/:roomId', validateGetRoomMessages, MessageController.getRoomMessages);

// POST /api/messages/:roomId/read - Mark messages as read
router.post('/:roomId/read', validateMarkAsRead, MessageController.markMessagesAsRead);

// GET /api/messages/:roomId/search - Search messages in a chat room
router.get('/:roomId/search', validateSearchMessages, MessageController.searchMessages);

// PUT /api/messages/edit/:messageId - Edit a message
router.put('/edit/:messageId', validateEditMessage, MessageController.editMessage);

// DELETE /api/messages/:messageId - Delete a message
router.delete('/:messageId', validateMessageId, MessageController.deleteMessage);

module.exports = router;