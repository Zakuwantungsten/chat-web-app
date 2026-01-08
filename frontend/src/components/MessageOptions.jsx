import React, { useState, useRef, useEffect } from 'react';
import './MessageOptions.css';

const MessageOptions = ({ message, currentUser, onDelete, onCopy, onUserClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isOwnMessage = message.senderId === currentUser.id;
  const sender = message.sender || message.User;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setIsOpen(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
      setIsOpen(false);
    }
  };

  const handleReplyPrivately = () => {
    if (onUserClick && sender && sender.id !== currentUser.id) {
      onUserClick(sender);
      setIsOpen(false);
    }
  };

  const handleMessageUser = () => {
    if (onUserClick && sender && sender.id !== currentUser.id) {
      onUserClick(sender);
      setIsOpen(false);
    }
  };

  return (
    <div className="message-options" ref={dropdownRef}>
      <button
        className="message-options-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Message options"
        title="Message options"
      >
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="message-options-dropdown">
          <button className="option-item" onClick={() => setIsOpen(false)}>
            <span className="option-icon">↩️</span>
            <span className="option-text">Reply</span>
          </button>

          {!isOwnMessage && (
            <>
              <button className="option-item" onClick={handleReplyPrivately}>
                <span className="option-icon">👤</span>
                <span className="option-text">Reply privately</span>
              </button>

              <button className="option-item" onClick={handleMessageUser}>
                <span className="option-icon">💬</span>
                <span className="option-text">
                  Message {sender?.firstName || sender?.username || 'User'}
                </span>
              </button>
            </>
          )}

          {message.content && (
            <button className="option-item" onClick={handleCopy}>
              <span className="option-icon">📋</span>
              <span className="option-text">Copy</span>
            </button>
          )}

          <button className="option-item" onClick={() => setIsOpen(false)}>
            <span className="option-icon">😊</span>
            <span className="option-text">React</span>
          </button>

          <button className="option-item" onClick={() => setIsOpen(false)}>
            <span className="option-icon">➡️</span>
            <span className="option-text">Forward</span>
          </button>

          <button className="option-item" onClick={() => setIsOpen(false)}>
            <span className="option-icon">📌</span>
            <span className="option-text">Pin</span>
          </button>

          <button className="option-item" onClick={() => setIsOpen(false)}>
            <span className="option-icon">⭐</span>
            <span className="option-text">Star</span>
          </button>

          <div className="option-divider"></div>

          <button className="option-item" onClick={() => setIsOpen(false)}>
            <span className="option-icon">🚩</span>
            <span className="option-text">Report</span>
          </button>

          {(isOwnMessage || currentUser.role === 'admin') && onDelete && (
            <button className="option-item danger" onClick={handleDelete}>
              <span className="option-icon">🗑️</span>
              <span className="option-text">Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageOptions;
