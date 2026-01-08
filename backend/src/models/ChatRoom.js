const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatRoom = sequelize.define('ChatRoom', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('individual', 'group', 'class'),
    allowNull: false,
    defaultValue: 'group'
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  maxMembers: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 2,
      max: 500
    }
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      allowFileUpload: true,
      maxFileSize: 52428800, // 50MB
      allowedFileTypes: ['image', 'video', 'document'],
      messagesRetentionDays: null
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['createdBy']
    },
    {
      fields: ['lastActivityAt']
    }
  ]
});

module.exports = ChatRoom;