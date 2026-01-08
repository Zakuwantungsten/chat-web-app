const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true // Can be null for file-only messages
  },
  messageType: {
    type: DataTypes.ENUM('text', 'file', 'image', 'video', 'audio', 'system'),
    allowNull: false,
    defaultValue: 'text'
  },
  replyToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Messages',
      key: 'id'
    }
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  senderId: {
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
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['chatRoomId', 'createdAt']
    },
    {
      fields: ['senderId']
    },
    {
      fields: ['messageType']
    },
    {
      fields: ['replyToId']
    }
  ]
});

module.exports = Message;