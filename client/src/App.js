import React, { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ChatSidebar from './components/ChatSidebar';
import ChatToggle from './components/ChatToggle';
import Home from './pages/Home';
import WorkOrders from './pages/WorkOrders';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import CustomerData from './pages/CustomerData';
import './index.css';

// Create Chat Context
const ChatContext = createContext();

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const openChat = () => {
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  return (
    <ChatContext.Provider value={{ openChat, closeChat, toggleChat, isChatOpen }}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />

          {/* Main Layout Container */}
          <div className="flex">
            {/* Main Content Area - with left padding for sidebar */}
            <main className={`flex-1 transition-all duration-300 lg:ml-64 ${
              isChatOpen ? 'mr-96' : 'mr-0'
            }`}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/work-orders" element={<WorkOrders />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/customer-data" element={<CustomerData />} />
              </Routes>
            </main>

            {/* Chat Sidebar - Fixed position, independent scrolling */}
            {isChatOpen && (
              <ChatSidebar isOpen={isChatOpen} onClose={closeChat} />
            )}
          </div>

          {/* Chat Toggle Button */}
          <ChatToggle onClick={toggleChat} isOpen={isChatOpen} />

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </ChatContext.Provider>
  );
}

export default App;
