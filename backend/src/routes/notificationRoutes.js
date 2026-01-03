const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// GET /api/notifications - Get user's notifications
router.get('/', NotificationController.getUserNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', NotificationController.getUnreadCount);

// PUT /api/notifications/:notificationId/read - Mark as read
router.put('/:notificationId/read', NotificationController.markAsRead);

// PUT /api/notifications/mark-all-read - Mark all as read
router.put('/mark-all-read', NotificationController.markAllAsRead);

// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', NotificationController.deleteNotification);

module.exports = router;
