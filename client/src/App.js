import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatSidebar from './components/ChatSidebar';
import ChatToggle from './components/ChatToggle';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import CustomerData from './pages/CustomerData';
import './index.css';

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex flex-grow relative">
          {/* Main Content Area */}
          <main className={`flex-grow transition-all duration-300 ${
            isChatOpen ? 'w-[calc(100%-384px)]' : 'w-full'
          }`}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/customer-data" element={<CustomerData />} />
            </Routes>
          </main>

          {/* Chat Sidebar - Fixed position */}
          {isChatOpen && (
            <div className="w-96 flex-shrink-0">
              <ChatSidebar isOpen={isChatOpen} onClose={closeChat} />
            </div>
          )}
        </div>
        <div className={`transition-all duration-300 ${
          isChatOpen ? 'w-[calc(100%-384px)]' : 'w-full'
        }`}>
          <Footer />
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
  );
}

export default App;
