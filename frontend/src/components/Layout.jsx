import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { ChatProvider } from '../contexts/ChatContext';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <ChatProvider>
      <div className="layout">
        <Header 
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
        <div className="layout-body">
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div 
              className="sidebar-overlay"
              onClick={closeSidebar}
            />
          )}
          
          <Sidebar 
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
          
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </ChatProvider>
  );
};

export default Layout;