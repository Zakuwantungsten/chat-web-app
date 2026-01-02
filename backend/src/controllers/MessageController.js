const { Message, User, ChatRoom, UserChatRoom, File } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

class MessageController {
  // Send a new message
  static async sendMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { roomId } = req.params;
      const userId = req.user.id;
      const { content, messageType = 'text', replyToId, metadata, fileIds } = req.body;

      // Validate that either content or fileIds is provided
      if (!content && (!fileIds || fileIds.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Message must have either content or file attachments'
        });
      }

      // Check if user is a member of the chat room
      const membership = await UserChatRoom.findOne({
        where: { userId, chatRoomId: roomId }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this chat room'
        });
      }

      // Validate reply message if provided
      if (replyToId) {
        const replyMessage = await Message.findOne({
          where: { id: replyToId, chatRoomId: roomId }
        });

        if (!replyMessage) {
          return res.status(404).json({
            success: false,
            message: 'Reply message not found'
          });
        }
      }

      // Create the message
      const message = await Message.create({
        content,
        messageType,
        senderId: userId,
        chatRoomId: roomId,
        replyToId,
        metadata: metadata || {}
      });

      // Link files to message if provided
      if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
        const { File } = require('../models');
        await File.update(
          { messageId: message.id },
          { where: { id: fileIds, uploadedBy: userId } }
        );
      }

      // Update chat room's last activity
      await ChatRoom.update(
        { updatedAt: new Date() },
        { where: { id: roomId } }
      );

      // Get the full message with sender info
      const messageWithSender = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'firstName', 'lastName', 'role']
          },
          {
            model: Message,
            as: 'replyTo',
            attributes: ['id', 'content', 'messageType', 'createdAt'],
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'firstName', 'lastName']
            }],
            required: false
          },
          {
            model: File,
            as: 'attachments',
            attributes: ['id', 'filename', 'originalName', 'mimetype', 'size', 'fileType'],
            required: false
          }
        ]
      });

      // Emit socket event for real-time delivery
      if (req.io) {
        req.io.to(`room_${roomId}`).emit('new_message', messageWithSender);
      }

      // Create notifications for other room members
      const NotificationController = require('./NotificationController');
      const roomMembers = await UserChatRoom.findAll({
        where: { 
          chatRoomId: roomId,
          userId: { [Op.ne]: userId } // Exclude sender
        },
        attributes: ['userId']
      });

      const chatRoom = await ChatRoom.findByPk(roomId, {
        attributes: ['name']
      });

      for (const member of roomMembers) {
        await NotificationController.createNotification(member.userId, {
          type: 'message',
          title: `New message in ${chatRoom.name}`,
          message: messageWithSender.content?.substring(0, 100) || 'New message',
          relatedId: roomId,
          relatedType: 'chatroom',
          metadata: {
            messageId: message.id,
            senderId: userId,
            senderName: `${user.firstName} ${user.lastName}`
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: messageWithSender
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error.message
      });
    }
  }

  // Get messages for a chat room
  static async getRoomMessages(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      // Check if user is a member of the chat room
      const membership = await UserChatRoom.findOne({
        where: { userId, chatRoomId: roomId }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this chat room'
        });
      }

      // Get messages from when user joined
      const messages = await Message.findAndCountAll({
        where: {
          chatRoomId: roomId,
          createdAt: {
            [Op.gte]: membership.joinedAt
          },
          isDeleted: false
        },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'username', 'firstName', 'lastName', 'role']
          },
          {
            model: Message,
            as: 'replyTo',
            attributes: ['id', 'content', 'messageType', 'createdAt', 'senderId'],
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'firstName', 'lastName']
            }],
            required: false
          },
          {
            model: File,
            as: 'attachments',
            attributes: ['id', 'filename', 'originalName', 'mimetype', 'size', 'fileType', 'path'],
            required: false
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: messages.rows,
        pagination: {
          page,
          limit,
          total: messages.count,
          pages: Math.ceil(messages.count / limit)
        }
      });
    } catch (error) {
      console.error('Get room messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages',
        error: error.message
      });
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;
      const { messageId } = req.body; // Optional: specific message ID, otherwise marks all as read

      // Check if user is a member of the chat room
      const membership = await UserChatRoom.findOne({
        where: { userId, chatRoomId: roomId }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this chat room'
        });
      }

      if (messageId) {
        // Mark up to specific message as read
        const message = await Message.findOne({
          where: { id: messageId, chatRoomId: roomId }
        });

        if (!message) {
          return res.status(404).json({
            success: false,
            message: 'Message not found'
          });
        }

        await UserChatRoom.update(
          { lastReadAt: message.createdAt },
          { where: { userId, chatRoomId: roomId } }
        );
      } else {
        // Mark all messages as read
        await UserChatRoom.update(
          { lastReadAt: new Date() },
          { where: { userId, chatRoomId: roomId } }
        );
      }

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      console.error('Mark messages as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read',
        error: error.message
      });
    }
  }

  // Edit a message
  static async editMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { messageId } = req.params;
      const userId = req.user.id;
      const { content } = req.body;

      const message = await Message.findByPk(messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Check if user owns the message
      if (message.senderId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only edit your own messages'
        });
      }

      // Check if message is too old (e.g., 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (message.createdAt < fifteenMinutesAgo) {
        return res.status(400).json({
          success: false,
          message: 'Message is too old to edit'
        });
      }

      // Update message
      await message.update({
        content,
        isEdited: true,
        editedAt: new Date()
      });

      // Get updated message with sender info
      const updatedMessage = await Message.findByPk(messageId, {
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'firstName', 'lastName', 'role']
        }]
      });

      // TODO: Emit socket event for real-time update
      // io.to(message.chatRoomId).emit('messageEdited', updatedMessage);

      res.json({
        success: true,
        message: 'Message updated successfully',
        data: updatedMessage
      });
    } catch (error) {
      console.error('Edit message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to edit message',
        error: error.message
      });
    }
  }

  // Delete a message
  static async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      const message = await Message.findByPk(messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Check if user owns the message or is admin of the room
      const membership = await UserChatRoom.findOne({
        where: { userId, chatRoomId: message.chatRoomId }
      });

      if (!membership || (message.senderId !== userId && membership.role !== 'admin')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this message'
        });
      }

      // Soft delete the message
      await message.update({
        isDeleted: true,
        content: null,
        deletedAt: new Date(),
        deletedBy: userId
      });

      // TODO: Emit socket event for real-time update
      // io.to(message.chatRoomId).emit('messageDeleted', { messageId, deletedBy: userId });

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete message',
        error: error.message
      });
    }
  }

  // Search messages in a chat room
  static async searchMessages(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;
      const { query, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      // Check if user is a member of the chat room
      const membership = await UserChatRoom.findOne({
        where: { userId, chatRoomId: roomId }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this chat room'
        });
      }

      const messages = await Message.findAndCountAll({
        where: {
          chatRoomId: roomId,
          content: { [Op.like]: `%${query}%` },
          isDeleted: false,
          createdAt: { [Op.gte]: membership.joinedAt }
        },
        include: [{
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'firstName', 'lastName', 'role']
        }],
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: messages.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: messages.count,
          pages: Math.ceil(messages.count / limit)
        }
      });
    } catch (error) {
      console.error('Search messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search messages',
        error: error.message
      });
    }
  }
}

module.exports = MessageController;