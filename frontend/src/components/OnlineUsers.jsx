import React from 'react';
import { useSocket } from '../contexts/SocketContext';
import './OnlineUsers.css';

const OnlineUsers = ({ className = '' }) => {
  const { onlineUsers, getUserStatus } = useSocket();

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#25d366';
      case 'away': return '#ffc107';
      case 'busy': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'busy': return 'Busy';
      default: return 'Offline';
    }
  };

  if (onlineUsers.length === 0) {
    return (
      <div className={`online-users ${className}`}>
        <h3>Online Users</h3>
        <div className="no-users">
          <p>No users online</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`online-users ${className}`}>
      <h3>Online Users ({onlineUsers.length})</h3>
      <div className="users-list">
        {onlineUsers.map(user => (
          <div key={user.userId} className="user-item">
            <div className="user-avatar">
              {user.firstName?.[0] || user.username?.[0] || '?'}
            </div>
            <div className="user-details">
              <div className="user-name">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.username
                }
              </div>
              <div 
                className="user-status"
                style={{ color: getStatusColor(user.status) }}
              >
                <span className="status-indicator">●</span>
                {getStatusText(user.status)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineUsers;