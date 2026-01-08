const { User, ChatRoom, UserChatRoom } = require('../models');
const { body, validationResult } = require('express-validator');

class UserController {
  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: ChatRoom,
            as: 'chatRooms',
            through: {
              attributes: ['role', 'joinedAt', 'isActive']
            },
            attributes: ['id', 'name', 'type', 'avatar']
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        user
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Update user profile
  static updateProfileValidation = [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('class')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Class name must be less than 100 characters'),
    body('avatar')
      .optional()
      .isURL()
      .withMessage('Avatar must be a valid URL')
  ];

  static async updateProfile(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { firstName, lastName, username, class: userClass, avatar } = req.body;
      const userId = req.user.id;

      // Check if username is already taken by another user
      if (username) {
        const { Op } = require('sequelize');
        const existingUser = await User.findOne({
          where: {
            username,
            id: { [Op.ne]: userId } // Not the current user
          }
        });

        if (existingUser) {
          return res.status(409).json({
            error: 'Username already exists'
          });
        }
      }

      // Update user profile
      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (username !== undefined) updateData.username = username;
      if (userClass !== undefined) updateData.class = userClass;
      if (avatar !== undefined) updateData.avatar = avatar;

      await User.update(updateData, {
        where: { id: userId }
      });

      // Fetch updated user
      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Get all users (for class rep/admin)
  static async getAllUsers(req, res) {
    try {
      // Check if user has permission (class_rep or admin)
      if (!['class_rep', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions'
        });
      }

      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        order: [['firstName', 'ASC'], ['lastName', 'ASC']]
      });

      res.json({
        users
      });

    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Get users by class (for class rep)
  static async getUsersByClass(req, res) {
    try {
      const { className } = req.params;

      // Check permissions
      if (req.user.role !== 'class_rep' && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Only class representatives and admins can view class members'
        });
      }

      // If class rep, only allow viewing their own class
      let classFilter = className;
      if (req.user.role === 'class_rep') {
        classFilter = req.user.class;
      }

      const users = await User.findAll({
        where: { class: classFilter },
        attributes: { exclude: ['password'] },
        order: [['firstName', 'ASC'], ['lastName', 'ASC']]
      });

      res.json({
        users,
        class: classFilter
      });

    } catch (error) {
      console.error('Get users by class error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Update user online status
  static async updateOnlineStatus(req, res) {
    try {
      const { isOnline } = req.body;

      await req.user.update({
        isOnline: Boolean(isOnline),
        lastSeen: new Date()
      });

      res.json({
        message: 'Online status updated'
      });

    } catch (error) {
      console.error('Update online status error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

module.exports = UserController;