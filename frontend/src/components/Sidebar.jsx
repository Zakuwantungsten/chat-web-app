import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { roomId: activeRoomId } = useParams();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { api, user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    loadChatRooms();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('new_message', handleNewMessage);
      socket.on('room_updated', loadChatRooms);
      
      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('room_updated', loadChatRooms);
      };
    }
  }, [socket]);

  const loadChatRooms = async () => {
    try {
      const response = await api.get('/api/chatrooms');
      setChatRooms(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading chat rooms:', err);
      setError('Failed to load chats');
      setLoading(false);
    }
  };

  const handleNewMessage = (messageData) => {
    // Update the last message and unread count for the room
    setChatRooms(prev => prev.map(room => {
      if (room.id === messageData.chatRoomId) {
        const isCurrentRoom = activeRoomId && room.id === parseInt(activeRoomId);
        const isOwnMessage = messageData.senderId === user?.id;
        
        // Show notification if not in current room and not own message
        if (!isCurrentRoom && !isOwnMessage && 'Notification' in window && Notification.permission === 'granted') {
          const sender = messageData.sender;
          const senderName = sender?.firstName && sender?.lastName 
            ? `${sender.firstName} ${sender.lastName}` 
            : sender?.username || 'Someone';
          
          const notification = new Notification(`${senderName} in ${room.name}`, {
            body: messageData.content || 'Sent a file',
            icon: '/favicon.ico',
            tag: `room-${room.id}`
          });
          
          notification.onclick = () => {
            window.focus();
            navigate(`/chat/${room.id}`);
            notification.close();
          };
        }
        
        return {
          ...room,
          lastMessage: messageData,
          lastMessageTime: messageData.createdAt,
          unreadCount: isCurrentRoom || isOwnMessage ? room.unreadCount || 0 : (room.unreadCount || 0) + 1
        };
      }
      return room;
    }));
  };

  const handleChatClick = async (roomId) => {
    // Reset unread count immediately for better UX
    setChatRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, unreadCount: 0 } : room
    ));
    
    navigate(`/chat/${roomId}`);
    // Close sidebar on mobile after selecting chat
    if (window.innerWidth <= 768) {
      onClose?.();
    }
  };

  const getChatDisplayName = (room) => {
    // For individual chats, show only the other person's name
    if ((room.type === 'individual' || room.type === 'direct') && room.members && Array.isArray(room.members)) {
      const otherMember = room.members.find(member => member.id !== user?.id);
      if (otherMember) {
        return `${otherMember.firstName || ''} ${otherMember.lastName || ''}`.trim() || otherMember.username || 'Unknown User';
      }
    }
    // For group chats or if no members info, return the room name
    return room.name || 'Unnamed Room';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // If this week, show day name
    const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Chats</h3>
        </div>
        <div className="loading-message">Loading chats...</div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Chats</h3>
        </div>
        <div className="error-message">{error}</div>
      </aside>
    );
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>Chats</h3>
      </div>
      
      {chatRooms.length === 0 ? (
        <div className="no-chats">
          <p>No chat rooms yet</p>
          <p className="hint">Join a chat room to start messaging</p>
        </div>
      ) : (
        <ul className="chat-list">
          {chatRooms.map(room => {
            const displayName = getChatDisplayName(room);
            return (
              <li 
                key={room.id} 
                className={`chat-item ${activeRoomId && room.id === parseInt(activeRoomId) ? 'active' : ''} ${room.unreadCount > 0 ? 'unread' : ''}`}
                onClick={() => handleChatClick(room.id)}
              >
                <div className="chat-avatar">
                  {displayName.charAt(0) || '?'}
                </div>
                <div className="chat-details">
                  <div className="chat-info">
                    <h4 className="chat-name">{displayName}</h4>
                    <span className="chat-time">
                      {formatTime(room.lastMessageTime || room.updatedAt)}
                    </span>
                  </div>
                  <p className="last-message">
                    {room.lastMessage?.content || room.description || 'No messages yet'}
                  </p>
                </div>
                {room.unreadCount > 0 && (
                  <span className="unread-count">{room.unreadCount}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
};

export default Sidebar;