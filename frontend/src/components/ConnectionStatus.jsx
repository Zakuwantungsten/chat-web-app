import React from 'react';
import { useSocket } from '../contexts/SocketContext';
import './ConnectionStatus.css';

const ConnectionStatus = () => {
  const { 
    connectionStatus, 
    reconnectAttempts, 
    lastError, 
    reconnectSocket, 
    clearError,
    isConnected,
    isConnecting,
    hasError
  } = useSocket();

  if (isConnected) {
    return null; // Don't show anything when connected
  }

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting to chat server...';
      case 'reconnecting':
        return `Reconnecting... (attempt ${reconnectAttempts})`;
      case 'error':
        return 'Connection error. Retrying...';
      case 'failed':
        return 'Connection failed. Please check your internet connection.';
      case 'disconnected':
        return 'Disconnected from chat server.';
      default:
        return 'Connection status unknown';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connecting':
      case 'reconnecting':
        return '#ffc107';
      case 'error':
      case 'failed':
        return '#dc3545';
      case 'disconnected':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const canReconnect = connectionStatus === 'failed' || connectionStatus === 'disconnected';

  return (
    <div className="connection-status" style={{ backgroundColor: getStatusColor() }}>
      <div className="connection-status-content">
        <div className="status-info">
          <span className="status-icon">
            {isConnecting ? '🔄' : hasError ? '⚠️' : '📡'}
          </span>
          <span className="status-message">{getStatusMessage()}</span>
          {lastError && (
            <span className="error-detail">({lastError})</span>
          )}
        </div>
        
        <div className="status-actions">
          {lastError && (
            <button 
              className="clear-error-btn"
              onClick={clearError}
              title="Clear error message"
            >
              ✕
            </button>
          )}
          {canReconnect && (
            <button 
              className="reconnect-btn"
              onClick={reconnectSocket}
              title="Try to reconnect"
            >
              🔄 Reconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;