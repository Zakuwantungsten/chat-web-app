import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from '../contexts/ChatContext';
import NotificationBell from './NotificationBell';
import './Header.css';

const Header = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const { connectionStatus, onlineUsers } = useSocket();
  const { activeChatRoom } = useChat();

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
        <div className="header-left">
          <button 
            className="mobile-menu-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${sidebarOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <div className="app-title-section">
            <h1 className="app-title">
              {activeChatRoom ? (
                <>
                  {activeChatRoom.name}
                  {activeChatRoom.type === 'individual' && activeChatRoom.members && (
                    <span className="chat-subtitle">
                      {activeChatRoom.members
                        .filter(m => m.id !== user?.id)
                        .map(m => `${m.firstName} ${m.lastName}`)
                        .join(', ')}
                    </span>
                  )}
                </>
              ) : (
                'Student Chat'
              )}
            </h1>
          </div>
        </div>
        
        <div className="header-info">
          <div className="user-info">
            <span className="user-welcome">
              Welcome, {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.username || 'Guest'}
              <span className="role-badge">{user?.role || 'Student'}</span>
            </span>
            <div className="connection-info">
              <span 
                className="connection-indicator" 
                style={{ color: getStatusColor() }}
                title={`Connection: ${connectionStatus || 'connected'}`}
              >
                ● {connectionStatus || 'connected'}
              </span>
              <span className="online-count">
                {onlineUsers?.length || 0} online
              </span>
            </div>
          </div>
        </div>
        
        <nav className="header-nav">
          <NotificationBell />
          <Link to="/chatrooms" className="nav-link">Chat Rooms</Link>
          <Link to="/profile" className="nav-link">Profile</Link>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </nav>
      </div>
    </header>
  );
};

export default Header;