const express = require('express');
const router = express.Router();
const ChatRoomController = require('../controllers/ChatRoomController');
const auth = require('../middleware/auth');
const { 
  validateCreateChatRoom, 
  validateUpdateChatRoom,
  validateRoomId,
  validateSearchChatRooms 
} = require('../middleware/chatValidation');

// Apply auth middleware to all routes
router.use(auth);

// GET /api/chatrooms - Get user's chat rooms
router.get('/', ChatRoomController.getUserChatRooms);

// GET /api/chatrooms/search - Search public chat rooms
router.get('/search', validateSearchChatRooms, ChatRoomController.searchChatRooms);

// POST /api/chatrooms - Create a new chat room
router.post('/', validateCreateChatRoom, ChatRoomController.createChatRoom);

// GET /api/chatrooms/:roomId - Get chat room details
router.get('/:roomId', validateRoomId, ChatRoomController.getChatRoomDetails);

// PUT /api/chatrooms/:roomId - Update chat room
router.put('/:roomId', validateUpdateChatRoom, ChatRoomController.updateChatRoom);

// DELETE /api/chatrooms/:roomId - Delete a chat room
router.delete('/:roomId', validateRoomId, ChatRoomController.deleteChatRoom);

// POST /api/chatrooms/:roomId/join - Join a chat room
router.post('/:roomId/join', validateRoomId, ChatRoomController.joinChatRoom);

// DELETE /api/chatrooms/:roomId/leave - Leave a chat room
router.delete('/:roomId/leave', validateRoomId, ChatRoomController.leaveChatRoom);

module.exports = router;