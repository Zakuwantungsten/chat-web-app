const { body, param, query } = require('express-validator');

// Chat Room Validation
const validateCreateChatRoom = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Chat room name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('type')
    .optional()
    .isIn(['group', 'direct', 'individual'])
    .withMessage('Type must be either "group", "direct", or "individual"'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 500 })
    .withMessage('Max members must be between 2 and 500'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object')
];

const validateUpdateChatRoom = [
  param('roomId')
    .isInt()
    .withMessage('Room ID must be an integer'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Chat room name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 500 })
    .withMessage('Max members must be between 2 and 500'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('Settings must be an object')
];

const validateRoomId = [
  param('roomId')
    .isInt()
    .withMessage('Room ID must be an integer')
];

const validateSearchChatRooms = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('query')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query cannot be empty')
];

// Message Validation
const validateSendMessage = [
  param('roomId')
    .isInt()
    .withMessage('Room ID must be an integer'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'video', 'document', 'audio', 'location', 'system', 'file'])
    .withMessage('Invalid message type'),
  body('replyToId')
    .optional()
    .isInt()
    .withMessage('Reply to ID must be an integer'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  body('fileIds')
    .optional()
    .isArray()
    .withMessage('File IDs must be an array')
];

const validateEditMessage = [
  param('messageId')
    .isInt()
    .withMessage('Message ID must be an integer'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters')
];

const validateMessageId = [
  param('messageId')
    .isInt()
    .withMessage('Message ID must be an integer')
];

const validateGetRoomMessages = [
  param('roomId')
    .isInt()
    .withMessage('Room ID must be an integer'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const validateMarkAsRead = [
  param('roomId')
    .isInt()
    .withMessage('Room ID must be an integer'),
  body('messageId')
    .optional()
    .isInt()
    .withMessage('Message ID must be an integer')
];

const validateSearchMessages = [
  param('roomId')
    .isInt()
    .withMessage('Room ID must be an integer'),
  query('query')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query is required and cannot be empty'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

module.exports = {
  // Chat Room validations
  validateCreateChatRoom,
  validateUpdateChatRoom,
  validateRoomId,
  validateSearchChatRooms,
  
  // Message validations
  validateSendMessage,
  validateEditMessage,
  validateMessageId,
  validateGetRoomMessages,
  validateMarkAsRead,
  validateSearchMessages
};