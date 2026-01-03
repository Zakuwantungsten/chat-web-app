import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map()); // roomId -> Set of usernames
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastError, setLastError] = useState(null);
  const { user, token, isAuthenticated } = useAuth();
  const typingTimeoutRef = useRef(new Map()); // roomId -> timeout
  const reconnectTimeoutRef = useRef(null);

  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  // Initialize socket connection with retry logic
  useEffect(() => {
    if (isAuthenticated && token && user) {
      const connectSocket = () => {
        console.log('Initializing socket connection...');
        
        const socketInstance = io('http://localhost:3001', {
          auth: {
            token: token
          },
          autoConnect: true,
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: reconnectDelay
        });

        setSocket(socketInstance);
        setConnectionStatus('connecting');

        // Connection event handlers
        socketInstance.on('connect', () => {
          console.log('Socket connected:', socketInstance.id);
          setConnectionStatus('connected');
          setReconnectAttempts(0);
          setLastError(null);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setConnectionStatus('error');
          setLastError(error.message);
          
          // Increment reconnect attempts
          setReconnectAttempts(prev => {
            const newAttempts = prev + 1;
            if (newAttempts >= maxReconnectAttempts) {
              setConnectionStatus('failed');
              console.error('Max reconnection attempts reached');
            }
            return newAttempts;
          });
        });

        socketInstance.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setConnectionStatus('disconnected');
          
          // If disconnection was unexpected, try to reconnect
          if (reason === 'io server disconnect' || reason === 'ping timeout') {
            setConnectionStatus('reconnecting');
          }
        });

        socketInstance.on('reconnect', (attemptNumber) => {
          console.log('Socket reconnected after', attemptNumber, 'attempts');
          setConnectionStatus('connected');
          setReconnectAttempts(0);
          setLastError(null);
        });

        socketInstance.on('reconnect_error', (error) => {
          console.error('Socket reconnection error:', error);
          setLastError(error.message);
        });

        socketInstance.on('reconnect_failed', () => {
          console.error('Socket reconnection failed');
          setConnectionStatus('failed');
        });

        // Online users updates
        socketInstance.on('online_users_update', (data) => {
          setOnlineUsers(data.users);
        });

        // User status updates
        socketInstance.on('user_online', (data) => {
          console.log(`User ${data.username} came online`);
        });

        socketInstance.on('user_offline', (data) => {
          console.log(`User ${data.username} went offline`);
        });

        socketInstance.on('user_status_change', (data) => {
          setOnlineUsers(prev => 
            prev.map(user => 
              user.userId === data.userId 
                ? { ...user, status: data.status }
                : user
            )
          );
        });

        // Typing indicators
        socketInstance.on('user_typing_start', (data) => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            if (!newMap.has(data.roomId)) {
              newMap.set(data.roomId, new Set());
            }
            newMap.get(data.roomId).add(data.username);
            return newMap;
          });
        });

        socketInstance.on('user_typing_stop', (data) => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            if (newMap.has(data.roomId)) {
              newMap.get(data.roomId).delete(data.username);
              if (newMap.get(data.roomId).size === 0) {
                newMap.delete(data.roomId);
              }
            }
            return newMap;
          });
        });

        // Enhanced error handling
        socketInstance.on('error', (error) => {
          console.error('Socket error:', error);
          setLastError(error.message || 'Unknown socket error');
        });

        return socketInstance;
      };

      const socketInstance = connectSocket();

      return () => {
        console.log('Cleaning up socket connection...');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        socketInstance.disconnect();
        setSocket(null);
        setConnectionStatus('disconnected');
        setOnlineUsers([]);
        setTypingUsers(new Map());
        setReconnectAttempts(0);
        setLastError(null);
      };
    } else {
      // Clean up socket if user is not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnectionStatus('disconnected');
        setOnlineUsers([]);
        setTypingUsers(new Map());
        setReconnectAttempts(0);
        setLastError(null);
      }
    }
  }, [isAuthenticated, token, user?.id]);

  // Join room function
  const joinRoom = (roomId) => {
    if (socket && roomId) {
      console.log(`Joining room ${roomId}`);
      socket.emit('join_room', { roomId });
    }
  };

  // Leave room function
  const leaveRoom = (roomId) => {
    if (socket && roomId) {
      console.log(`Leaving room ${roomId}`);
      socket.emit('leave_room', { roomId });
    }
  };

  // Send message function (for real-time, actual saving should still use API)
  const sendMessage = (roomId, content, messageType = 'text') => {
    if (socket && roomId && content?.trim()) {
      socket.emit('send_message', {
        roomId,
        content: content.trim(),
        messageType
      });
      return true;
    }
    return false;
  };

  // Typing indicator functions
  const startTyping = (roomId) => {
    if (socket && roomId) {
      socket.emit('typing_start', { roomId });
    }
  };

  const stopTyping = (roomId) => {
    if (socket && roomId) {
      socket.emit('typing_stop', { roomId });
      
      // Clear any existing timeout for this room
      if (typingTimeoutRef.current.has(roomId)) {
        clearTimeout(typingTimeoutRef.current.get(roomId));
        typingTimeoutRef.current.delete(roomId);
      }
    }
  };

  const handleTyping = (roomId) => {
    if (!socket || !roomId) return;

    // Start typing indicator
    startTyping(roomId);

    // Clear existing timeout for this room
    if (typingTimeoutRef.current.has(roomId)) {
      clearTimeout(typingTimeoutRef.current.get(roomId));
    }

    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      stopTyping(roomId);
    }, 1000); // Stop typing after 1 second of inactivity

    typingTimeoutRef.current.set(roomId, timeout);
  };

  // Mark message as read
  const markMessageAsRead = (roomId, messageId) => {
    if (socket && roomId && messageId) {
      socket.emit('message_read', { roomId, messageId });
    }
  };

  // Update user status
  const updateStatus = (status) => {
    if (socket && ['online', 'away', 'busy'].includes(status)) {
      socket.emit('update_status', { status });
    }
  };

  // Get typing users for a specific room
  const getTypingUsers = (roomId) => {
    const typingInRoom = typingUsers.get(roomId);
    return typingInRoom ? Array.from(typingInRoom) : [];
  };

  // Check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers.some(u => u.userId === userId && u.status === 'online');
  };

  // Get user status
  const getUserStatus = (userId) => {
    const onlineUser = onlineUsers.find(u => u.userId === userId);
    return onlineUser?.status || 'offline';
  };

  // Manual reconnection function
  const reconnectSocket = () => {
    if (socket && connectionStatus !== 'connected') {
      console.log('Manually reconnecting socket...');
      socket.connect();
    }
  };

  // Clear error function
  const clearError = () => {
    setLastError(null);
  };

  const value = {
    socket,
    connectionStatus,
    onlineUsers,
    typingUsers,
    reconnectAttempts,
    lastError,
    
    // Room functions
    joinRoom,
    leaveRoom,
    
    // Message functions
    sendMessage,
    markMessageAsRead,
    
    // Typing functions
    startTyping,
    stopTyping,
    handleTyping,
    getTypingUsers,
    
    // User functions
    updateStatus,
    isUserOnline,
    getUserStatus,
    
    // Connection functions
    reconnectSocket,
    clearError,
    
    // Computed values
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting' || connectionStatus === 'reconnecting',
    hasError: connectionStatus === 'error' || connectionStatus === 'failed'
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;