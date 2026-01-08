import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from '../contexts/ChatContext';
import MessageList from './MessageList';
import './ChatInterface.css';

const ChatInterface = () => {
  const { roomId } = useParams();
  const { user, api } = useAuth();
  const { socket, joinRoom, leaveRoom, sendMessage: sendSocketMessage, handleTyping, getTypingUsers, isConnected } = useSocket();
  const { setActiveChatRoom } = useChat();
  const navigate = useNavigate();
  
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [isUserInRoom, setIsUserInRoom] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  const messageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const lastTypingTime = useRef(0);
  const fileInputRef = useRef(null);

  const handleUserClick = async (sender) => {
    // Prevent users from starting a chat with themselves
    if (sender.id === user?.id) {
      console.log('Cannot start a chat with yourself');
      return;
    }

    try {
      // Check if a 1-on-1 chat already exists between current user and clicked user
      const response = await api.get('/api/chatrooms');
      const rooms = response.data.data || response.data || [];
      
      const existingChat = rooms.find(room => 
        (room.type === 'individual' || room.type === 'direct') && 
        room.members?.some(member => member.id === sender.id)
      );
      
      if (existingChat) {
        // Navigate to existing chat
        navigate(`/chat/${existingChat.id}`);
      } else {
        // Create new 1-on-1 chat
        const createResponse = await api.post('/api/chatrooms', {
          name: `${sender.firstName} ${sender.lastName}`,
          type: 'direct',
          members: [sender.id]
        });
        
        const newRoom = createResponse.data.data || createResponse.data;
        navigate(`/chat/${newRoom.id}`);
      }
    } catch (err) {
      console.error('Error starting chat:', err);
      setError('Failed to start chat with user');
    }
  };

  useEffect(() => {
    if (roomId) {
      loadChatRoom();
      loadMessages();
      checkUserMembership();
    }
    
    // Cleanup: clear active chat room when component unmounts
    return () => {
      setActiveChatRoom(null);
    };
  }, [roomId]);

  // Mark messages as read after chat room and user membership are loaded
  useEffect(() => {
    if (roomId && chatRoom && isUserInRoom) {
      markAsRead();
    }
  }, [roomId, chatRoom, isUserInRoom]);

  const markAsRead = async () => {
    try {
      await api.post(`/api/messages/${roomId}/read`, {});
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.io integration
  useEffect(() => {
    if (socket && roomId && isUserInRoom) {
      // Join the room
      joinRoom(roomId);

      // Listen for new messages
      const handleNewMessage = (messageData) => {
        setMessages(prev => [...prev, messageData]);
        // Mark as read since user is viewing this room
        markAsRead();
      };

      // Listen for message deletion
      const handleMessageDeleted = (data) => {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      };

      // Listen for typing indicators
      const updateTypingUsers = () => {
        setTypingUsers(getTypingUsers(roomId));
      };

      socket.on('new_message', handleNewMessage);
      socket.on('message_deleted', handleMessageDeleted);
      socket.on('user_typing_start', updateTypingUsers);
      socket.on('user_typing_stop', updateTypingUsers);

      // Cleanup
      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('message_deleted', handleMessageDeleted);
        socket.off('user_typing_start', updateTypingUsers);
        socket.off('user_typing_stop', updateTypingUsers);
        leaveRoom(roomId);
      };
    }
  }, [socket, roomId, isUserInRoom, joinRoom, leaveRoom, getTypingUsers]);

  // Update typing users when socket state changes
  useEffect(() => {
    if (roomId) {
      setTypingUsers(getTypingUsers(roomId));
    }
  }, [roomId, getTypingUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatRoom = async () => {
    try {
      const response = await api.get(`/api/chatrooms/${roomId}`);
      const roomData = response.data.data || response.data;
      console.log('Chat room data:', roomData); // Debug log
      setChatRoom(roomData);
      
      // Set active chat room in context for header
      setActiveChatRoom({
        id: roomData.id,
        name: roomData.name,
        type: roomData.type,
        members: roomData.members
      });
    } catch (err) {
      setError('Failed to load chat room details');
      console.error('Error loading chat room:', err);
    }
  };

  const loadMessages = async () => {
    try {
      console.log('Loading messages for room:', roomId);
      const response = await api.get(`/api/messages/${roomId}`);
      console.log('Messages response:', response.data);
      const messagesData = response.data.data || response.data || [];
      console.log('Parsed messages data:', messagesData);
      setMessages(Array.isArray(messagesData) ? messagesData : []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading messages - Full error:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to load messages');
      setLoading(false);
    }
  };

  const checkUserMembership = async () => {
    try {
      const response = await api.get('/api/chatrooms');
      const myRooms = response.data.data || response.data || [];
      const isMember = myRooms.some(room => room.id.toString() === roomId);
      setIsUserInRoom(isMember);
      
      if (!isMember) {
        setError('You are not a member of this chat room');
      }
    } catch (err) {
      console.error('Error checking membership:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && selectedFiles.length === 0) || sending || !isUserInRoom) return;

    setSending(true);
    const messageContent = newMessage.trim();
    const filesToUpload = [...selectedFiles];
    
    // Clear input and files immediately for better UX
    setNewMessage('');
    setSelectedFiles([]);
    
    try {
      // Upload files first if any
      let fileIds = [];
      if (filesToUpload.length > 0) {
        setUploading(true);
        for (const file of filesToUpload) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('roomId', roomId);

          const response = await api.post('/api/files/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          const fileData = response.data.data || response.data;
          fileIds.push(fileData.id);
        }
        setUploading(false);
      }

      // Prepare message data
      const messageData = {
        content: messageContent || (fileIds.length > 0 ? 'Sent a file' : ''),
        messageType: fileIds.length > 0 ? 'file' : 'text'
      };
      
      // Add fileIds only if we have files
      if (fileIds.length > 0) {
        messageData.fileIds = fileIds;
      }
      
      // Send through API for persistence
      const response = await api.post(`/api/messages/${roomId}/send`, messageData);
      
      // Message will be broadcast via socket from backend, no need to add locally
      // The socket listener will handle adding it to the UI
      
      setError('');
      
      // Focus back on input
      messageInputRef.current?.focus();
      
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
      // Restore message content and files on error
      setNewMessage(messageContent);
      setSelectedFiles(filesToUpload);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const joinChatRoom = async () => {
    try {
      await api.post(`/api/chatrooms/${roomId}/join`);
      setIsUserInRoom(true);
      setError('');
      loadChatRoom(); // Refresh room data
    } catch (err) {
      setError('Failed to join chat room');
      console.error('Error joining room:', err);
    }
  };

  const leaveChatRoom = async () => {
    if (window.confirm('Are you sure you want to leave this chat room?')) {
      try {
        await api.post(`/api/chatrooms/${roomId}/leave`);
        navigate('/chatrooms');
      } catch (err) {
        setError('Failed to leave chat room');
        console.error('Error leaving room:', err);
      }
    }
  };

  const getChatDisplayName = () => {
    if (!chatRoom) {
      console.log('No chatRoom data');
      return 'Loading...';
    }
    
    console.log('Chat room type:', chatRoom.type);
    console.log('Chat room members:', chatRoom.members);
    console.log('Current user:', user?.id);
    
    // For individual chats, show only the other person's name
    if ((chatRoom.type === 'individual' || chatRoom.type === 'direct') && chatRoom.members && Array.isArray(chatRoom.members)) {
      const otherMember = chatRoom.members.find(member => member.id !== user?.id);
      console.log('Other member:', otherMember);
      if (otherMember) {
        return `${otherMember.firstName || ''} ${otherMember.lastName || ''}`.trim() || otherMember.username || 'Unknown User';
      }
    }
    // For group chats, return the room name
    return chatRoom.name || 'Chat Room';
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicator
    if (isUserInRoom && socket && roomId) {
      const now = Date.now();
      lastTypingTime.current = now;
      
      // Trigger typing indicator
      handleTyping(roomId);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await api.delete(`/api/messages/${messageId}`);
      // Message will be removed via socket event
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };



  if (loading) {
    return <div className="chat-interface loading">Loading chat...</div>;
  }

  if (!chatRoom) {
    return <div className="chat-interface error">Chat room not found</div>;
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="chat-header-left">
          <button 
            className="back-btn"
            onClick={() => navigate('/chatrooms')}
            title="Back to chat rooms"
          >
            ← Back
          </button>
        </div>
        <div className="chat-header-center">
          <h2 className="chat-name">{getChatDisplayName()}</h2>
          {chatRoom.type === 'group' && chatRoom.memberCount > 0 && (
            <span className="member-count">{chatRoom.memberCount} members</span>
          )}
        </div>
        <div className="chat-header-right">
          {isUserInRoom ? (
            <>
              {!isConnected && (
                <span className="connection-status">Reconnecting...</span>
              )}
              <button className="leave-room-btn" onClick={leaveChatRoom}>
                Leave Room
              </button>
            </>
          ) : (
            <button className="join-room-btn" onClick={joinChatRoom}>
              Join Room
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="chat-content">
        {!isUserInRoom ? (
          <div className="not-member-message">
            <p>You are not a member of this chat room.</p>
            <button className="join-room-btn" onClick={joinChatRoom}>
              Join Room to Participate
            </button>
          </div>
        ) : (
          <>
            <MessageList 
              messages={messages} 
              currentUser={user}
              loading={loading}
              onUserClick={handleUserClick}
              onDeleteMessage={handleDeleteMessage}
            />
            {typingUsers.length > 0 && (
              <div className="typing-indicator">
                <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {isUserInRoom && (
        <form className="message-form" onSubmit={sendMessage}>
          {selectedFiles.length > 0 && (
            <div className="selected-files">
              {selectedFiles.map((file, index) => (
                <div key={index} className="selected-file">
                  <span className="file-icon">
                    {file.type.startsWith('image/') ? '🖼️' : 
                     file.type.startsWith('video/') ? '🎥' : 
                     file.type.startsWith('audio/') ? '🎵' : '📄'}
                  </span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                  <button 
                    type="button"
                    className="remove-file-btn"
                    onClick={() => removeFile(index)}
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="message-input-container">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
            />
            <button
              type="button"
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || sending}
              title="Attach file"
            >
              📎
            </button>
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={uploading ? "Uploading files..." : "Type a message..."}
              rows="1"
              maxLength="1000"
              disabled={sending || uploading || !isConnected}
              className="message-input"
            />
            <button 
              type="submit" 
              className="send-btn"
              disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || uploading}
            >
              {uploading ? '⏳' : sending ? '...' : 'Send'}
            </button>
          </div>
          <div className="message-form-info">
            <span className="char-count">{newMessage.length}/1000</span>
            <span className="send-hint">Press Enter to send, Shift+Enter for new line</span>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChatInterface;