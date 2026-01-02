const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { File, Message, ChatRoom, UserChatRoom } = require('../models');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-rar-compressed',
    'video/mp4', 'video/mpeg', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

// Determine file type from mimetype
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || mimetype.includes('document') || 
      mimetype.includes('word') || mimetype.includes('excel') || 
      mimetype.includes('powerpoint') || mimetype.includes('text')) return 'document';
  return 'other';
};

// Upload file to chat room
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { roomId } = req.body;
    const userId = req.user.id;

    // Verify user is member of chat room if roomId provided
    if (roomId) {
      const membership = await UserChatRoom.findOne({
        where: { userId, chatRoomId: roomId }
      });

      if (!membership) {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this chat room'
        });
      }
    }

    // Create file record
    const file = await File.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      fileType: getFileType(req.file.mimetype),
      uploadedBy: userId,
      isPublic: false
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        mimetype: file.mimetype,
        size: file.size,
        fileType: file.fileType,
        url: `/api/files/${file.id}`
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    // Clean up file if it was uploaded
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
});

// Download/view file
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if file exists on disk
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // If file has a message, check if user is member of that chat room
    if (file.messageId) {
      const message = await Message.findByPk(file.messageId);
      if (message) {
        const membership = await UserChatRoom.findOne({
          where: { 
            userId: req.user.id, 
            chatRoomId: message.chatRoomId 
          }
        });

        if (!membership) {
          return res.status(403).json({
            success: false,
            message: 'You do not have access to this file'
          });
        }
      }
    }

    // Increment download count
    await file.increment('downloadCount');

    // Send file
    res.download(file.path, file.originalName);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
});

// Delete file
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id, {
      include: [{
        model: Message,
        as: 'message'
      }]
    });
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Only uploader or admin can delete
    if (file.uploadedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this file'
      });
    }

    // Delete file from disk
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete from database
    await file.destroy();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
});

module.exports = router;