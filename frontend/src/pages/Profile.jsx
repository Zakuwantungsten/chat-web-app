import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, api } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/api/users/profile');
      const userData = response.data.user;
      setProfile(userData);
      setEditedProfile(userData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEditedProfile({
      ...editedProfile,
      [e.target.name]: e.target.value
    });
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    try {
      const response = await api.put('/api/users/profile', {
        firstName: editedProfile.firstName,
        lastName: editedProfile.lastName,
        username: editedProfile.username,
        class: editedProfile.class
      });
      setProfile(response.data.user);
      setEditedProfile(response.data.user);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
    setSaveSuccess(false);
    setError('');
  };

  const handleAvatarChange = () => {
    // TODO: Implement avatar upload
    console.log('Avatar change clicked');
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading-message">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  const currentProfile = isEditing ? editedProfile : profile;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <button className="back-btn" onClick={() => window.history.back()}>
            ← Back
          </button>
          <h1>Profile Settings</h1>
          {!isEditing && (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          )}
        </div>

        <div className="profile-content">
          {saveSuccess && (
            <div className="success-message">Profile updated successfully!</div>
          )}
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-container">
              <div className="profile-avatar" onClick={handleAvatarChange}>
                <span className="avatar-text">
                  {currentProfile.firstName?.[0] || currentProfile.username?.[0] || '?'}
                </span>
                <div className="avatar-overlay">
                  <span>Change Photo</span>
                </div>
              </div>
            </div>
            <p className="avatar-hint">Tap to change profile photo</p>
          </div>

          {/* Profile Information */}
          <div className="profile-info">
            <div className="info-section">
              <div className="info-item">
                <label className="info-label">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={currentProfile.firstName || ''}
                    onChange={handleChange}
                    className="info-input"
                    placeholder="Enter your first name"
                  />
                ) : (
                  <div className="info-value">{currentProfile.firstName || 'Not set'}</div>
                )}
              </div>

              <div className="info-item">
                <label className="info-label">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={currentProfile.lastName || ''}
                    onChange={handleChange}
                    className="info-input"
                    placeholder="Enter your last name"
                  />
                ) : (
                  <div className="info-value">{currentProfile.lastName || 'Not set'}</div>
                )}
              </div>

              <div className="info-item">
                <label className="info-label">Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={currentProfile.username || ''}
                    onChange={handleChange}
                    className="info-input"
                    placeholder="Enter your username"
                  />
                ) : (
                  <div className="info-value">{currentProfile.username || 'Not set'}</div>
                )}
              </div>

              <div className="info-item">
                <label className="info-label">Email</label>
                <div className="info-value readonly">{currentProfile.email || 'Not set'}</div>
                {isEditing && <span className="readonly-hint">Cannot be changed</span>}
              </div>

              <div className="info-item">
                <label className="info-label">Student ID</label>
                <div className="info-value readonly">{currentProfile.studentId || 'Not assigned'}</div>
                {isEditing && <span className="readonly-hint">Cannot be changed</span>}
              </div>

              <div className="info-item">
                <label className="info-label">Class</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="class"
                    value={currentProfile.class || ''}
                    onChange={handleChange}
                    className="info-input"
                    placeholder="Enter your class"
                  />
                ) : (
                  <div className="info-value">{currentProfile.class || 'Not set'}</div>
                )}
              </div>

              <div className="info-item">
                <label className="info-label">Role</label>
                <div className="info-value readonly">
                  <span className="role-badge">{currentProfile.role || 'Student'}</span>
                </div>
                {isEditing && <span className="readonly-hint">Role is assigned by admin</span>}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="profile-actions">
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;