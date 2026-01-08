import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ChatRoomList from './components/ChatRoomList';
import ChatInterface from './components/ChatInterface';
import ConnectionStatus from './components/ConnectionStatus';
import './App.css'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <ConnectionStatus />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/chatrooms" replace />} />
                <Route path="chatrooms" element={<ChatRoomList />} />
                <Route path="chat" element={<Navigate to="/chatrooms" replace />} />
                <Route path="chat/:roomId" element={<ChatInterface />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
