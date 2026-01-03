const sequelize = require('../config/database');

// Import all models
const User = require('./User');
const ChatRoom = require('./ChatRoom');
const Message = require('./Message');
const UserChatRoom = require('./UserChatRoom');
const File = require('./File');
const Notification = require('./Notification');

// Define associations
// User associations
User.hasMany(ChatRoom, { foreignKey: 'createdBy', as: 'createdChatRooms' });
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(File, { foreignKey: 'uploadedBy', as: 'uploadedFiles' });
User.belongsToMany(ChatRoom, { 
  through: UserChatRoom, 
  foreignKey: 'userId',
  otherKey: 'chatRoomId',
  as: 'chatRooms'
});

// ChatRoom associations
ChatRoom.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
ChatRoom.hasMany(Message, { foreignKey: 'chatRoomId', as: 'messages' });
ChatRoom.belongsToMany(User, { 
  through: UserChatRoom, 
  foreignKey: 'chatRoomId',
  otherKey: 'userId',
  as: 'members'
});
ChatRoom.hasMany(UserChatRoom, { foreignKey: 'chatRoomId', as: 'memberships' });

// Message associations
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(ChatRoom, { foreignKey: 'chatRoomId', as: 'chatRoom' });
Message.belongsTo(Message, { foreignKey: 'replyToId', as: 'replyTo' });
Message.hasMany(Message, { foreignKey: 'replyToId', as: 'replies' });
Message.hasMany(File, { foreignKey: 'messageId', as: 'attachments' });

// UserChatRoom associations
UserChatRoom.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserChatRoom.belongsTo(ChatRoom, { foreignKey: 'chatRoomId', as: 'chatRoom' });
UserChatRoom.belongsTo(Message, { foreignKey: 'lastReadMessageId', as: 'lastReadMessage' });

// File associations
File.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
File.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  ChatRoom,
  Message,
  UserChatRoom,
  File,
  Notification
};