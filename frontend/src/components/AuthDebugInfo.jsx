import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthDebugInfo = () => {
  const { user, isAuthenticated, loading, token, error } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>Auth Debug Info:</strong></div>
      <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? user.username || user.email : 'None'}</div>
      <div>Token: {token ? `${token.substring(0, 20)}...` : 'None'}</div>
      <div>Error: {error || 'None'}</div>
    </div>
  );
};

export default AuthDebugInfo;