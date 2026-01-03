import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MessageList.css';

const MessageList = ({ messages, currentUser, loading, onUserClick, onDeleteMessage }) => {
  const navigate = useNavigate();
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const formatMessageContent = (content) => {
    // Handle null, undefined, or empty content
    if (!content) return null;
    
    // Split by line breaks and map to JSX elements
    return content.split('\n').map((line, index, array) => (
      <span key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ));
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    // Ensure messages is an array
    const messageArray = Array.isArray(messages) ? messages : [];
    
    messageArray.forEach(message => {
      const date = new Date(message.createdAt);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          displayDate: formatDateGroup(date),
          messages: []
        };
      }
      
      groups[dateKey].messages.push(message);
    });
    
    return Object.values(groups);
  };

  const formatDateGroup = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { 
        month: 'long', 
        day: 'numeric' 
      });
    } else {
      return date.toLocaleDateString([], { 
        year: 'numeric',
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <div className="message-list loading">
        <div className="loading-spinner">Loading messages...</div>
      </div>
    );
  }

  // Ensure messages is an array
  const messageArray = Array.isArray(messages) ? messages : [];

  if (messageArray.length === 0) {
    return (
      <div className="message-list empty">
        <div className="empty-state">
          <p>No messages yet.</p>
          <p>Start the conversation!</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messageArray);

  return (
    <div className="message-list">
      {messageGroups.map(group => (
        <div key={group.date} className="message-group">
          <div className="date-divider">
            <span className="date-label">{group.displayDate}</span>
          </div>
          
          {group.messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUser.id;
            const previousMessage = index > 0 ? group.messages[index - 1] : null;
            const isConsecutive = previousMessage && 
              previousMessage.senderId === message.senderId &&
              (new Date(message.createdAt) - new Date(previousMessage.createdAt)) < 300000; // 5 minutes
            
            const sender = message.sender || message.User;
            
            return (
              <div
                key={message.id}
                className={`message ${isOwnMessage ? 'own-message' : 'other-message'} ${isConsecutive ? 'consecutive' : ''}`}
              >
                {!isOwnMessage && !isConsecutive && sender && (
                  <div className="message-author">
                    <span 
                      className={`author-name ${onUserClick && sender.id !== currentUser?.id ? 'clickable' : ''}`}
                      onClick={() => {
                        if (onUserClick && sender.id !== currentUser?.id) {
                          onUserClick(sender);
                        }
                      }}
                      title={onUserClick && sender.id !== currentUser?.id ? "Click to start a chat" : ""}
                      style={{ cursor: onUserClick && sender.id !== currentUser?.id ? 'pointer' : 'default' }}
                    >
                      {sender.firstName && sender.lastName
                        ? `${sender.firstName} ${sender.lastName}`
                        : sender.username || 'Unknown User'}
                    </span>
                    {sender.role && (
                      <span className="author-role">{sender.role}</span>
                    )}
                  </div>
                )}
                
                <div className="message-bubble">
                  {onDeleteMessage && (message.senderId === currentUser.id) && (
                    <button 
                      className="delete-message-btn"
                      onClick={() => onDeleteMessage(message.id)}
                      title="Delete message"
                      aria-label="Delete message"
                    >
                      🗑️
                    </button>
                  )}
                  {message.content && (
                    <div className="message-content">
                      {formatMessageContent(message.content)}
                    </div>
                  )}
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="message-attachments">
                      {message.attachments.map(file => (
                        <a 
                          key={file.id}
                          href={`/api/files/${file.id}`}
                          className="attachment"
                          download={file.originalName}
                          title={`Download ${file.originalName}`}
                        >
                          <span className="attachment-icon">
                            {file.fileType === 'image' ? '🖼️' : 
                             file.fileType === 'video' ? '🎥' : 
                             file.fileType === 'audio' ? '🎵' : 
                             file.fileType === 'document' ? '📄' : '📎'}
                          </span>
                          <span className="attachment-info">
                            <span className="attachment-name">{file.originalName}</span>
                            <span className="attachment-size">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                  
                  <div className="message-meta">
                    <span className="message-time">
                      {formatTimestamp(message.createdAt)}
                    </span>
                    {message.editedAt && (
                      <span className="edited-indicator" title={`Edited ${formatTimestamp(message.editedAt)}`}>
                        (edited)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MessageList;