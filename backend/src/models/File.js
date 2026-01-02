const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const File = sequelize.define('File', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  mimetype: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 52428800 // 50MB max
    }
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  url: {
    type: DataTypes.VIRTUAL,
    get() {
      return `/api/files/${this.id}`;
    }
  },
  fileType: {
    type: DataTypes.ENUM('image', 'video', 'audio', 'document', 'other'),
    allowNull: false
  },
  dimensions: {
    type: DataTypes.JSON,
    allowNull: true // For images/videos: { width: 1920, height: 1080 }
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true // For audio/video files in seconds
  },
  thumbnail: {
    type: DataTypes.STRING(255),
    allowNull: true // Thumbnail path for videos/images
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  messageId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Messages',
      key: 'id'
    }
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['uploadedBy']
    },
    {
      fields: ['messageId']
    },
    {
      fields: ['fileType']
    },
    {
      fields: ['createdAt']
    }
  ],
  hooks: {
    afterCreate: (file) => {
      // Could implement file processing hooks here
      console.log(`File uploaded: ${file.originalName} (${file.size} bytes)`);
    }
  }
});

module.exports = File;