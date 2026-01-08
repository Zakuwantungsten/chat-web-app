import React, { useState } from 'react';
import './Chat.css';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Class Rep', content: 'Welcome to our class chat!', time: '10:30 AM' },
    { id: 2, sender: 'You', content: 'Thank you!', time: '10:32 AM' },
    { id: 3, sender: 'John', content: 'When is the next assignment due?', time: '10:35 AM' },
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'You',
        content: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Class Group Chat</h3>
        <span className="online-status">12 members online</span>
      </div>
      
      <div className="messages-container">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender === 'You' ? 'own-message' : ''}`}>
            <div className="message-sender">{msg.sender}</div>
            <div className="message-content">{msg.content}</div>
            <div className="message-time">{msg.time}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-btn">Send</button>
      </form>
    </div>
  );
};

export default Chat;