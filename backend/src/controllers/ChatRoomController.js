const { ChatRoom, User, UserChatRoom, Message, sequelize } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

class ChatRoomController {
  // Create a new chat room
  static async createChatRoom(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { name, description, type = 'group', isPrivate = false, maxMembers, settings, members } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Only class reps can create group chats
      if (type === 'group' && userRole !== 'class_rep') {
        return res.status(403).json({
          success: false,
          message: 'Only class representatives can create group chats'
        });
      }

      // Create the chat room
      const chatRoom = await ChatRoom.create({
        name,
        description,
        type,
        isPrivate,
        maxMembers,
        createdBy: userId,
        settings: settings || {}
      });

      // Add the creator as an admin member
      await UserChatRoom.create({
        userId: userId,
        chatRoomId: chatRoom.id,
        role: 'admin',
        joinedAt: new Date()
      });

      // Add additional members if provided
      if (members && Array.isArray(members) && members.length > 0) {
        const memberPromises = members.map(memberId => 
          UserChatRoom.create({
            userId: memberId,
            chatRoomId: chatRoom.id,
            role: 'member',
            joinedAt: new Date()
          })
        );
        await Promise.all(memberPromises);
      }

      // Return the chat room with creator and members info
      const chatRoomWithDetails = await ChatRoom.findByPk(chatRoom.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName', 'role']
          },
          {
            model: User,
            as: 'members',
            attributes: ['id', 'username', 'firstName', 'lastName', 'role'],
            through: {
              attributes: ['role', 'joinedAt']
            }
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Chat room created successfully',
        data: chatRoomWithDetails
      });
    } catch (error) {
      console.error('Create chat room error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create chat room',
        error: error.message
      });
    }
  }

  // Get user's chat rooms
  static async getUserChatRooms(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const chatRooms = await ChatRoom.findAndCountAll({
        include: [
          {
            model: User,
            as: 'members',
            where: { id: userId },
            attributes: [],
            through: {
              attributes: ['role', 'joinedAt', 'lastReadAt']
            }
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ],
        limit,
        offset,
        order: [['updatedAt', 'DESC']],
        distinct: true
      });

      // Fetch last message and all members for each chat room
      const chatRoomsWithDetails = await Promise.all(
        chatRooms.rows.map(async (room) => {
          // Get user's membership to check last read time
          const membership = await UserChatRoom.findOne({
            where: { userId, chatRoomId: room.id },
            attributes: ['lastReadAt']
          });
          
          // Get last message
          const lastMessage = await Message.findOne({
            where: { chatRoomId: room.id },
            include: [{
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'firstName', 'lastName']
            }],
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'content', 'messageType', 'createdAt']
          });
          
          // Count unread messages
          const unreadCount = await Message.count({
            where: {
              chatRoomId: room.id,
              senderId: { [Op.ne]: userId }, // Exclude own messages
              createdAt: {
                [Op.gt]: membership?.lastReadAt || new Date(0)
              }
            }
          });
          
          // Get all members
          const allMembers = await User.findAll({
            include: [{
              model: ChatRoom,
              as: 'chatRooms',
              where: { id: room.id },
              attributes: [],
              through: {
                attributes: ['role', 'joinedAt']
              }
            }],
            attributes: ['id', 'username', 'firstName', 'lastName', 'role']
          });
          
          return {
            ...room.toJSON(),
            lastMessage: lastMessage ? lastMessage.toJSON() : null,
            members: allMembers.map(m => m.toJSON()),
            unreadCount
          };
        })
      );

      res.json({
        success: true,
        data: chatRoomsWithDetails,
        pagination: {
          page,
          limit,
          total: chatRooms.count,
          pages: Math.ceil(chatRooms.count / limit)
        }
      });
    } catch (error) {
      console.error('Get user chat rooms error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat rooms',
        error: error.message
      });
    }
  }

  // Get chat room details
  static async getChatRoomDetails(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;

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

      const chatRoom = await ChatRoom.findByPk(roomId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName', 'role']
          },
          {
            model: User,
            as: 'members',
            attributes: ['id', 'username', 'firstName', 'lastName', 'role', 'lastSeen'],
            through: {
              attributes: ['role', 'joinedAt', 'lastReadAt']
            }
          }
        ]
      });

      if (!chatRoom) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }

      // Count unread messages for this user
      const unreadCount = await Message.count({
        where: {
          chatRoomId: roomId,
          createdAt: {
            [Op.gt]: membership.lastReadAt || membership.joinedAt
          },
          senderId: {
            [Op.ne]: userId
          }
        }
      });

      res.json({
        success: true,
        data: {
          ...chatRoom.toJSON(),
          unreadCount,
          userRole: membership.role,
          userJoinedAt: membership.joinedAt
        }
      });
    } catch (error) {
      console.error('Get chat room details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat room details',
        error: error.message
      });
    }
  }

  // Join a chat room
  static async joinChatRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;

      // Check if chat room exists
      const chatRoom = await ChatRoom.findByPk(roomId);
      if (!chatRoom) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }

      // Check if already a member
      const existingMembership = await UserChatRoom.findOne({
        where: { userId, chatRoomId: roomId }
      });

      if (existingMembership) {
        return res.status(400).json({
          success: false,
          message: 'You are already a member of this chat room'
        });
      }

      // Check if chat room has max members limit
      if (chatRoom.maxMembers) {
        const currentMemberCount = await UserChatRoom.count({
          where: { chatRoomId: roomId }
        });

        if (currentMemberCount >= chatRoom.maxMembers) {
          return res.status(400).json({
            success: false,
            message: 'Chat room has reached maximum member limit'
          });
        }
      }

      // Add user to chat room
      await UserChatRoom.create({
        userId,
        chatRoomId: roomId,
        role: 'member',
        joinedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Successfully joined chat room'
      });
    } catch (error) {
      console.error('Join chat room error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join chat room',
        error: error.message
      });
    }
  }

  // Leave a chat room
  static async leaveChatRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;

      // Check if user is a member
      const membership = await UserChatRoom.findOne({
        where: { userId, chatRoomId: roomId }
      });

      if (!membership) {
        return res.status(404).json({
          success: false,
          message: 'You are not a member of this chat room'
        });
      }

      // Check if user is the creator
      const chatRoom = await ChatRoom.findByPk(roomId);
      if (chatRoom.createdBy === userId) {
        // Transfer ownership to another admin or delete room if no other admins
        const otherAdmins = await UserChatRoom.findAll({
          where: {
            chatRoomId: roomId,
            userId: { [Op.ne]: userId },
            role: 'admin'
          }
        });

        if (otherAdmins.length > 0) {
          // Transfer to first admin
          await chatRoom.update({ createdBy: otherAdmins[0].userId });
        } else {
          // Check for other members to promote
          const otherMembers = await UserChatRoom.findAll({
            where: {
              chatRoomId: roomId,
              userId: { [Op.ne]: userId }
            }
          });

          if (otherMembers.length > 0) {
            // Promote first member to admin and transfer ownership
            await UserChatRoom.update(
              { role: 'admin' },
              { where: { id: otherMembers[0].id } }
            );
            await chatRoom.update({ createdBy: otherMembers[0].userId });
          } else {
            // No other members, delete the chat room
            await ChatRoom.destroy({ where: { id: roomId } });
            return res.json({
              success: true,
              message: 'Left chat room. Room was deleted as you were the last member.'
            });
          }
        }
      }

      // Remove user from chat room
      await UserChatRoom.destroy({
        where: { userId, chatRoomId: roomId }
      });

      res.json({
        success: true,
        message: 'Successfully left chat room'
      });
    } catch (error) {
      console.error('Leave chat room error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to leave chat room',
        error: error.message
      });
    }
  }

  // Update chat room
  static async updateChatRoom(req, res) {
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
      const { name, description, maxMembers, settings } = req.body;

      // Check if user is admin of the chat room
      const membership = await UserChatRoom.findOne({
        where: { userId, chatRoomId: roomId, role: 'admin' }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'You must be an admin to update this chat room'
        });
      }

      const chatRoom = await ChatRoom.findByPk(roomId);
      if (!chatRoom) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }

      // Update chat room
      await chatRoom.update({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(maxMembers && { maxMembers }),
        ...(settings && { settings: { ...chatRoom.settings, ...settings } })
      });

      res.json({
        success: true,
        message: 'Chat room updated successfully',
        data: chatRoom
      });
    } catch (error) {
      console.error('Update chat room error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update chat room',
        error: error.message
      });
    }
  }

  // Search public chat rooms
  static async searchChatRooms(req, res) {
    try {
      const { query, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        isPrivate: false,
        ...(query && {
          [Op.or]: [
            { name: { [Op.like]: `%${query}%` } },
            { description: { [Op.like]: `%${query}%` } }
          ]
        })
      };

      const chatRooms = await ChatRoom.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'firstName', 'lastName']
          },
          {
            model: User,
            as: 'members',
            attributes: ['id'],
            through: { attributes: [] }
          }
        ],
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      // Add member count to each room
      const chatRoomsWithCount = chatRooms.rows.map(room => ({
        ...room.toJSON(),
        memberCount: room.members.length,
        members: undefined // Remove members array to keep response clean
      }));

      res.json({
        success: true,
        data: chatRoomsWithCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: chatRooms.count,
          pages: Math.ceil(chatRooms.count / limit)
        }
      });
    } catch (error) {
      console.error('Search chat rooms error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search chat rooms',
        error: error.message
      });
    }
  }

  // Delete a chat room
  static async deleteChatRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Only class reps can delete group chat rooms
      const chatRoom = await ChatRoom.findByPk(roomId);
      if (!chatRoom) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }

      // Check if user is class rep or room creator
      if (userRole !== 'class_rep' && chatRoom.createdBy !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only class representatives can delete group chat rooms'
        });
      }

      // Delete all related records
      await UserChatRoom.destroy({ where: { chatRoomId: roomId } });
      await Message.destroy({ where: { chatRoomId: roomId } });
      await chatRoom.destroy();

      res.json({
        success: true,
        message: 'Chat room deleted successfully'
      });
    } catch (error) {
      console.error('Delete chat room error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete chat room',
        error: error.message
      });
    }
  }
}

module.exports = ChatRoomController;