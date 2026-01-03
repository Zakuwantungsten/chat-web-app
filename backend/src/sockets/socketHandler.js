const jwt = require('jsonwebtoken');
const { User, ChatRoom, UserChatRoom } = require('../models');

// Store connected users
const connectedUsers = new Map(); // userId -> { socketId, user, status }
const userSockets = new Map(); // socketId -> userId

// Connection throttling to prevent rapid reconnections
const connectionAttempts = new Map(); // userId -> { count, lastAttempt }
const MAX_CONNECTIONS_PER_MINUTE = 10;
const THROTTLE_WINDOW = 60 * 1000; // 1 minute

// User cache for socket authentication
const socketUserCache = new Map();
const SOCKET_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const socketHandler = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      
      // Check connection throttling
      const now = Date.now();
      const userAttempts = connectionAttempts.get(userId);
      
      if (userAttempts) {
        if (now - userAttempts.lastAttempt < THROTTLE_WINDOW) {
          if (userAttempts.count >= MAX_CONNECTIONS_PER_MINUTE) {
            return next(new Error('Too many connection attempts. Please wait.'));
          }
          userAttempts.count++;
        } else {
          userAttempts.count = 1;
        }
        userAttempts.lastAttempt = now;
      } else {
        connectionAttempts.set(userId, { count: 1, lastAttempt: now });
      }

      // Check user cache first
      const cacheKey = `socket_user_${userId}`;
      const cached = socketUserCache.get(cacheKey);
      
      let user;
      if (cached && (now - cached.timestamp) < SOCKET_CACHE_DURATION) {
        user = cached.user;
        console.log(`Using cached socket user data for user ${userId}`);
      } else {
        user = await User.findByPk(userId, {
          attributes: { exclude: ['password'] }
        });
        
        if (user) {
          socketUserCache.set(cacheKey, {
            user: user,
            timestamp: now
          });
          console.log(`Cached socket user data for user ${userId}`);
        }
      }

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    const user = socket.user;

    console.log(`User ${user.username} connected with socket ${socket.id}`);

    // Store user connection
    connectedUsers.set(userId, {
      socketId: socket.id,
      user: user,
      status: 'online',
      lastSeen: new Date()
    });
    userSockets.set(socket.id, userId);

    // Update user's online status in database
    await User.update(
      { isOnline: true, lastSeen: new Date() },
      { where: { id: userId } }
    );

    // Get user's chat rooms
    const userRooms = await UserChatRoom.findAll({
      where: { userId: userId },
      include: [{
        model: ChatRoom,
        as: 'chatRoom'
      }]
    });

    // Join socket to all user's chat rooms
    for (const membership of userRooms) {
      const roomId = membership.chatRoomId;
      socket.join(`room_${roomId}`);
      
      // Notify other room members that user is online
      socket.to(`room_${roomId}`).emit('user_online', {
        userId: userId,
        username: user.username,
        timestamp: new Date()
      });
    }

    // Emit updated online users list to all connections
    broadcastOnlineUsers(io);

    // Handle joining a room
    socket.on('join_room', async (data) => {
      try {
        const { roomId } = data;
        
        // Verify user is a member of this room
        const membership = await UserChatRoom.findOne({
          where: { userId: userId, chatRoomId: roomId }
        });

        if (!membership) {
          socket.emit('error', { message: 'Not a member of this room' });
          return;
        }

        socket.join(`room_${roomId}`);
        
        // Update last read message timestamp
        await membership.update({ lastReadAt: new Date() });
        
        socket.emit('joined_room', { roomId });
        
        // Notify others in room
        socket.to(`room_${roomId}`).emit('user_joined_room', {
          userId: userId,
          username: user.username,
          roomId: roomId,
          timestamp: new Date()
        });

        console.log(`User ${user.username} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle leaving a room
    socket.on('leave_room', async (data) => {
      try {
        const { roomId } = data;
        
        socket.leave(`room_${roomId}`);
        socket.emit('left_room', { roomId });
        
        // Notify others in room
        socket.to(`room_${roomId}`).emit('user_left_room', {
          userId: userId,
          username: user.username,
          roomId: roomId,
          timestamp: new Date()
        });

        console.log(`User ${user.username} left room ${roomId}`);
      } catch (error) {
        console.error('Error leaving room:', error);
        socket.emit('error', { message: 'Failed to leave room' });
      }
    });

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const { roomId, content, messageType = 'text' } = data;
        
        // Verify user is a member of this room
        const membership = await UserChatRoom.findOne({
          where: { userId: userId, chatRoomId: roomId }
        });

        if (!membership) {
          socket.emit('error', { message: 'Not a member of this room' });
          return;
        }

        // Create message in database (this should be done through API, but for real-time we emit first)
        const messageData = {
          id: Date.now(), // Temporary ID, will be replaced by database ID
          content: content,
          messageType: messageType,
          chatRoomId: roomId,
          senderId: userId,
          User: {
            id: userId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Emit to all users in the room (including sender)
        io.to(`room_${roomId}`).emit('new_message', messageData);
        
        // Update room's last activity
        await ChatRoom.update(
          { lastActivityAt: new Date() },
          { where: { id: roomId } }
        );

        console.log(`Message sent by ${user.username} to room ${roomId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { roomId } = data;
      socket.to(`room_${roomId}`).emit('user_typing_start', {
        userId: userId,
        username: user.username,
        roomId: roomId,
        timestamp: new Date()
      });
    });

    socket.on('typing_stop', (data) => {
      const { roomId } = data;
      socket.to(`room_${roomId}`).emit('user_typing_stop', {
        userId: userId,
        username: user.username,
        roomId: roomId,
        timestamp: new Date()
      });
    });

    // Handle message read receipts
    socket.on('message_read', async (data) => {
      try {
        const { roomId, messageId } = data;
        
        // Update user's last read message
        await UserChatRoom.update(
          { lastReadMessageId: messageId, lastReadAt: new Date() },
          { where: { userId: userId, chatRoomId: roomId } }
        );

        // Notify other room members
        socket.to(`room_${roomId}`).emit('message_read_by', {
          userId: userId,
          username: user.username,
          messageId: messageId,
          roomId: roomId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error updating read receipt:', error);
      }
    });

    // Handle status updates
    socket.on('update_status', async (data) => {
      try {
        const { status } = data; // 'online', 'away', 'busy'
        
        if (connectedUsers.has(userId)) {
          connectedUsers.get(userId).status = status;
        }

        // Broadcast status change to all connected users
        socket.broadcast.emit('user_status_change', {
          userId: userId,
          username: user.username,
          status: status,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error updating status:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${user.username} disconnected`);
      
      try {
        // Update user's offline status in database
        await User.update(
          { isOnline: false, lastSeen: new Date() },
          { where: { id: userId } }
        );

        // Get user's rooms to notify others
        const userRooms = await UserChatRoom.findAll({
          where: { userId: userId }
        });

        // Notify all rooms that user went offline
        for (const membership of userRooms) {
          const roomId = membership.chatRoomId;
          socket.to(`room_${roomId}`).emit('user_offline', {
            userId: userId,
            username: user.username,
            timestamp: new Date()
          });
        }

        // Remove from connected users
        connectedUsers.delete(userId);
        userSockets.delete(socket.id);

        // Broadcast updated online users list
        broadcastOnlineUsers(io);
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });

  // Helper function to broadcast online users
  const broadcastOnlineUsers = (io) => {
    const onlineUsers = Array.from(connectedUsers.values()).map(connection => ({
      userId: connection.user.id,
      username: connection.user.username,
      firstName: connection.user.firstName,
      lastName: connection.user.lastName,
      status: connection.status,
      lastSeen: connection.lastSeen
    }));

    io.emit('online_users_update', {
      users: onlineUsers,
      count: onlineUsers.length
    });
  };
};

module.exports = socketHandler;