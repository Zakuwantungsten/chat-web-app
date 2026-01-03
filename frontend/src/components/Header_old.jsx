import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { connectionStatus, onlineUsers } = useSocket();

  const handleLogout = () => {
    logout();
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#25d366';
      case 'connecting': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="app-title">Student Chat</h1>
        <div className="header-info">
          {user && (
            <div className="user-info">
              <span className="user-welcome">
                Welcome, {user.firstName} {user.lastName}
                {user.role === 'class_rep' && <span className="role-badge">Class Rep</span>}
              </span>
              <div className="connection-info">
                <span 
                  className="connection-indicator" 
                  style={{ color: getStatusColor() }}
                  title={`Connection: ${connectionStatus}`}
                >
                  ● {connectionStatus}
                </span>
                {onlineUsers.length > 0 && (
                  <span className="online-count">
                    {onlineUsers.length} online
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <nav className="header-nav">
          <Link to="/chatrooms" className="nav-link">Chat Rooms</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </nav>
      </div>
    </header>
  );
};

export default Header;