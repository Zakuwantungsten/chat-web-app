import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import OnlineUsers from './OnlineUsers';
import './ChatRoomList.css';

const ChatRoomList = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomDescription, setEditRoomDescription] = useState('');
  const { user, api, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only load chat rooms when authentication is ready and user is authenticated
    if (isAuthenticated && !authLoading && user) {
      loadChatRooms();
      loadMyRooms();
    }
  }, [isAuthenticated, authLoading, user]);

  const loadChatRooms = async () => {
    try {
      console.log('Loading chat rooms... Auth state:', { isAuthenticated, authLoading, user: !!user });
      const response = await api.get('/api/chatrooms/search');
      console.log('Chat rooms loaded successfully:', response.data);
      setChatRooms(response.data.data || []);
    } catch (err) {
      console.error('Error loading chat rooms:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError('Authentication required. Please login again.');
      } else {
        setError('Failed to load chat rooms');
      }
    }
  };

  const loadMyRooms = async () => {
    try {
      console.log('Loading my rooms...');
      const response = await api.get('/api/chatrooms');
      setMyRooms(response.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading my rooms:', err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError('Authentication required. Please login again.');
      } else {
        setError('Failed to load your rooms');
      }
      setLoading(false);
    }
  };

  const createChatRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setCreating(true);
    try {
      const response = await api.post('/api/chatrooms', {
        name: newRoomName.trim(),
        description: newRoomDescription.trim() || null
      });

      // The room data is in response.data.data
      const createdRoom = response.data.data;
      
      // Automatically join the created room (creator is already a member, but refresh the lists)
      setNewRoomName('');
      setNewRoomDescription('');
      setShowCreateForm(false);
      loadChatRooms();
      loadMyRooms();
    } catch (err) {
      setError('Failed to create chat room');
      console.error('Error creating chat room:', err);
    } finally {
      setCreating(false);
    }
  };

  const joinChatRoom = async (roomId) => {
    if (!roomId) {
      console.error('Cannot join room: roomId is undefined');
      setError('Cannot join room: invalid room ID');
      return;
    }
    try {
      await api.post(`/api/chatrooms/${roomId}/join`);
      loadChatRooms();
      loadMyRooms();
    } catch (err) {
      setError('Failed to join chat room');
      console.error('Error joining chat room:', err);
    }
  };

  const leaveChatRoom = async (roomId) => {
    if (!roomId) {
      console.error('Cannot leave room: roomId is undefined');
      setError('Cannot leave room: invalid room ID');
      return;
    }
    try {
      await api.delete(`/api/chatrooms/${roomId}/leave`);
      loadChatRooms();
      loadMyRooms();
    } catch (err) {
      setError('Failed to leave chat room');
      console.error('Error leaving chat room:', err);
    }
  };

  const startEditRoom = (room) => {
    setEditingRoom(room.id);
    setEditRoomName(room.name);
    setEditRoomDescription(room.description || '');
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setEditRoomName('');
    setEditRoomDescription('');
  };

  const updateRoom = async (e, roomId) => {
    e.preventDefault();
    if (!editRoomName.trim()) return;

    try {
      await api.put(`/api/chatrooms/${roomId}`, {
        name: editRoomName.trim(),
        description: editRoomDescription.trim() || null
      });
      
      cancelEdit();
      loadChatRooms();
      loadMyRooms();
      setError('');
    } catch (err) {
      setError('Failed to update chat room');
      console.error('Error updating chat room:', err);
    }
  };

  const deleteRoom = async (roomId, roomName) => {
    if (!window.confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/api/chatrooms/${roomId}`);
      loadChatRooms();
      loadMyRooms();
      setError('');
    } catch (err) {
      setError('Failed to delete chat room');
      console.error('Error deleting chat room:', err);
    }
  };

  const openChatRoom = (roomId) => {
    if (!roomId) {
      console.error('Cannot open room: roomId is undefined');
      setError('Cannot open room: invalid room ID');
      return;
    }
    navigate(`/chat/${roomId}`);
  };

  const isUserInRoom = (roomId) => {
    if (!roomId) return false;
    return myRooms.some(room => room.id === roomId);
  };

  if (loading || authLoading) {
    return <div className="chat-room-list loading">Loading chat rooms...</div>;
  }

  if (!isAuthenticated) {
    return <div className="chat-room-list error">Please log in to view chat rooms.</div>;
  }

  return (
    <div className="chat-room-page">
      <div className="chat-room-main">
        <div className="chat-room-list">
          <div className="chat-room-header">
            <h2>Chat Rooms</h2>
            {user?.role === 'class_rep' && (
              <button 
                className="create-room-btn"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? 'Cancel' : 'Create Room'}
              </button>
            )}
          </div>

          {error && !authLoading && <div className="error-message">{error}</div>}

          {showCreateForm && user?.role === 'class_rep' && (
            <form className="create-room-form" onSubmit={createChatRoom}>
              <h3>Create New Chat Room</h3>
              <input
                type="text"
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                required
                maxLength="50"
              />
              <textarea
                placeholder="Description (optional)"
                value={newRoomDescription}
                onChange={(e) => setNewRoomDescription(e.target.value)}
                maxLength="200"
                rows="3"
              />
              <div className="form-actions">
                <button type="submit" disabled={creating || !newRoomName.trim()}>
                  {creating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          )}

          {myRooms.length > 0 && (
            <div className="my-rooms-section">
              <h3>My Rooms</h3>
              <div className="room-grid">
                {myRooms.map(room => (
                  <div key={room.id} className="room-card my-room">
                    {editingRoom === room.id ? (
                      <form onSubmit={(e) => updateRoom(e, room.id)} className="edit-room-form">
                        <input
                          type="text"
                          value={editRoomName}
                          onChange={(e) => setEditRoomName(e.target.value)}
                          placeholder="Room name"
                          required
                        />
                        <textarea
                          value={editRoomDescription}
                          onChange={(e) => setEditRoomDescription(e.target.value)}
                          placeholder="Description (optional)"
                        />
                        <div className="edit-actions">
                          <button type="submit" className="save-btn">Save</button>
                          <button type="button" onClick={cancelEdit} className="cancel-btn">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="room-info">
                          <h4>{room.name}</h4>
                          {room.description && <p className="room-description">{room.description}</p>}
                          <div className="room-meta">
                            <span className="member-count">{room.memberCount || 0} members</span>
                            <span className="room-type-badge">{room.type}</span>
                          </div>
                        </div>
                        <div className="room-actions">
                          <button 
                            className="open-chat-btn"
                            onClick={() => openChatRoom(room.id)}
                          >
                            Open Chat
                          </button>
                          {user?.role === 'class_rep' && room.type === 'group' && (
                            <>
                              <button 
                                className="edit-room-btn icon-btn"
                                onClick={() => startEditRoom(room)}
                                title="Edit room"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </button>
                              <button 
                                className="delete-room-btn icon-btn"
                                onClick={() => deleteRoom(room.id, room.name)}
                                title="Delete room"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                              </button>
                            </>
                          )}
                          {room.type === 'group' && (
                            <button 
                              className="leave-room-btn"
                              onClick={() => leaveChatRoom(room.id)}
                            >
                              Leave
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="all-rooms-section">
            <h3>All Rooms</h3>
            {chatRooms.length === 0 ? (
              <p className="no-rooms">No chat rooms available. Create one to get started!</p>
            ) : (
              <div className="room-grid">
                {chatRooms.map(room => (
                  <div key={room.id} className={`room-card ${isUserInRoom(room.id) ? 'joined' : ''}`}>
                    <div className="room-info">
                      <h4>{room.name}</h4>
                      {room.description && <p className="room-description">{room.description}</p>}
                      <div className="room-meta">
                        <span className="member-count">{room.memberCount || 0} members</span>
                        <span className="created-by">Created by {room.createdBy || 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="room-actions">
                      {isUserInRoom(room.id) ? (
                        <>
                          <button 
                            className="open-chat-btn"
                            onClick={() => openChatRoom(room.id)}
                          >
                            Open Chat
                          </button>
                          <button 
                            className="leave-room-btn"
                            onClick={() => leaveChatRoom(room.id)}
                          >
                            Leave
                          </button>
                        </>
                      ) : (
                        <button 
                          className="join-room-btn"
                          onClick={() => joinChatRoom(room.id)}
                        >
                          Join Room
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="chat-room-sidebar">
        <OnlineUsers />
      </div>
    </div>
  );
};

export default ChatRoomList;