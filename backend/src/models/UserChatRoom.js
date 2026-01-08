const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserChatRoom = sequelize.define('UserChatRoom', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  chatRoomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ChatRooms',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('member', 'admin', 'moderator'),
    allowNull: false,
    defaultValue: 'member'
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  leftAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastReadMessageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Messages',
      key: 'id'
    }
  },
  lastReadAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationSettings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      muted: false,
      muteUntil: null,
      mentions: true,
      sounds: true
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'chatRoomId']
    },
    {
      fields: ['chatRoomId']
    },
    {
      fields: ['userId', 'isActive']
    }
  ]
});

module.exports = UserChatRoom;