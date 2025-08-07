import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ChatSidebar = ({ isOpen, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !socket) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setIsConnected(true);
        toast.success('Connected to support chat');
        
        setMessages([{
          id: Date.now(),
          text: 'Hello! I am your AI assistant. I can help you with invoice inquiries, credit validation, account information, and general questions. To validate credits, please provide your invoice ID, customer ID, and the credit amount you would like to apply.',
          sender: 'bot',
          type: 'greeting',
          timestamp: new Date()
        }]);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        toast.error('Disconnected from support chat');
      });

      newSocket.on('ai_response', (response) => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: response.message,
          sender: 'bot',
          type: response.type,
          details: response.details,
          timestamp: new Date()
        }]);
      });
    }

    return () => {
      // Don't close socket when component unmounts, only when chat is explicitly closed
    };
  }, [isOpen, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !isConnected) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    socket.emit('chat_message', { message: inputMessage });
    setInputMessage('');
  };

  const handleClose = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
      setMessages([]);
    }
    onClose();
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'help':
      case 'greeting':
        return <InformationCircleIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatMessageText = (text) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="fixed top-16 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-40" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex items-center justify-between p-4 border-b bg-primary-600 text-white">
        <div className="flex items-center space-x-3">
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
          <div>
            <h2 className="text-lg font-semibold">AI Support Chat</h2>
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className="text-primary-100">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-primary-700 rounded-lg transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs ${
              message.sender === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            } rounded-lg px-3 py-2 text-sm`}>
              {message.sender === 'bot' && (
                <div className="flex items-center space-x-2 mb-1">
                  {getMessageIcon(message.type)}
                  <span className="text-xs font-medium text-gray-600">
                    AI Assistant
                  </span>
                </div>
              )}
              <div className="whitespace-pre-wrap">
                {formatMessageText(message.text)}
              </div>
              {message.details && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  <strong>Details:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">
                    {JSON.stringify(message.details, null, 2)}
                  </pre>
                </div>
              )}
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 rounded-lg px-3 py-2 max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-xs text-gray-500">AI is typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-gray-50">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !isConnected}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSidebar;
