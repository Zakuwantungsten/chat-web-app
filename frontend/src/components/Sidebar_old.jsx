import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const mockChats = [
    { id: 1, name: 'Class Group', lastMessage: 'Assignment due tomorrow', time: '2:30 PM' },
    { id: 2, name: 'Study Group', lastMessage: 'Meeting at library', time: '1:45 PM' },
    { id: 3, name: 'John Doe', lastMessage: 'Thanks for the notes!', time: '12:30 PM' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Chats</h3>
      </div>
      <div className="chat-list">
        {mockChats.map(chat => (
          <div key={chat.id} className="chat-item">
            <div className="chat-avatar">
              {chat.name.charAt(0)}
            </div>
            <div className="chat-details">
              <h4 className="chat-name">{chat.name}</h4>
              <p className="last-message">{chat.lastMessage}</p>
            </div>
            <span className="chat-time">{chat.time}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;