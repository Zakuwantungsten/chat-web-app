const { Notification, User, ChatRoom, Message } = require('../models');
const { Op } = require('sequelize');

class NotificationController {
  // Get user notifications
  static async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const unreadOnly = req.query.unreadOnly === 'true';

      const whereClause = { userId };
      if (unreadOnly) {
        whereClause.isRead = false;
      }

      const notifications = await Notification.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      res.json({
        success: true,
        data: notifications.rows,
        pagination: {
          page,
          limit,
          total: notifications.count,
          pages: Math.ceil(notifications.count / limit)
        }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  }

  // Get unread notification count
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const count = await Notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  }

  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.update({
        isRead: true,
        readAt: new Date()
      });

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await Notification.update(
        { isRead: true, readAt: new Date() },
        { where: { userId, isRead: false } }
      );

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all as read',
        error: error.message
      });
    }
  }

  // Delete notification
  static async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOne({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      await notification.destroy();

      res.json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }

  // Create notification (helper method for internal use)
  static async createNotification(userId, data) {
    try {
      const notification = await Notification.create({
        userId,
        ...data
      });

      // Emit socket event if io is available
      const io = global.io;
      if (io) {
        io.to(`user_${userId}`).emit('new_notification', notification);
      }

      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      return null;
    }
  }
}

module.exports = NotificationController;
