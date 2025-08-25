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

const ChatSidebar = ({ isOpen, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState({
    customerId: null,
    customerName: null,
    sessionId: null,
    lastInvoiceId: null,
    pendingCreditMemoId: null
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !socket) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setIsConnected(true);

        // Generate session ID for conversation tracking
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        setConversationContext(prev => ({ ...prev, sessionId }));

        setMessages([{
          id: Date.now(),
          text: '🤖 Hello! I am your enhanced AI assistant with intelligent clarification capabilities. I can help you with:\n\n• Invoice inquiries and credit validation\n• Quantity discrepancy reports\n• Damage reports and credit memos\n• Account balance and purchase history\n• General transmission service questions\n\n✨ **New Features:**\n• Smart ambiguity detection\n• Step-by-step confirmations\n• Context-aware conversations\n\nHow can I assist you today?',
          sender: 'bot',
          type: 'greeting',
          timestamp: new Date()
        }]);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
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

        // Update conversation context if provided
        if (response.context) {
          setConversationContext(prev => ({
            ...prev,
            ...response.context
          }));
        }
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

    // Send message with conversation context using Clarifying RAG Agent
    socket.emit('chat_message_agent', {
      message: inputMessage,
      context: conversationContext,
      messageHistory: messages.slice(-5) // Send last 5 messages for context
    });
    setInputMessage('');
  };

  const handleQuickResponse = (response) => {
    if (!socket || !isConnected) return;

    const userMessage = {
      id: Date.now(),
      text: response,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Send quick response using Clarifying RAG Agent
    socket.emit('chat_message_agent', {
      message: response,
      context: conversationContext,
      messageHistory: messages.slice(-5)
    });
  };

  const handleClose = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
      setMessages([]);
      setConversationContext({
        customerId: null,
        customerName: null,
        sessionId: null,
        lastInvoiceId: null,
        pendingCreditMemoId: null
      });
    }
    onClose();
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'clarification_needed':
        return <InformationCircleIcon className="h-4 w-4 text-blue-500" />;
      case 'confirmation_needed':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'help':
      case 'greeting':
        return <InformationCircleIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
  };

  const getMessageStyling = (type) => {
    switch (type) {
      case 'clarification_needed':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      case 'confirmation_needed':
        return 'bg-yellow-50 text-yellow-800 border border-yellow-200';
      case 'success':
        return 'bg-green-50 text-green-800 border border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMessageText = (text) => {
    // Split text into sections: main content and details
    const sections = text.split('---DETAILS---');
    const mainContent = sections[0];
    const detailsContent = sections[1];

    const formatLine = (line) => {
      // Handle **bold** markdown
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return <strong key={partIndex}>{boldText}</strong>;
        }
        return part;
      });
    };

    const mainLines = mainContent.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {formatLine(line)}
        {index < mainContent.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));

    return (
      <div>
        {mainLines}
        {detailsContent && <CollapsibleDetails content={detailsContent.trim()} />}
      </div>
    );
  };

  // Collapsible Details Component
  const CollapsibleDetails = ({ content }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
      <div className="mt-3 border-t pt-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>{isExpanded ? '▼' : '▶'}</span>
          <span className="font-medium">📋 Technical Details</span>
        </button>
        {isExpanded && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
              {content}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed top-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-40" style={{ height: '100vh' }}>
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
                : getMessageStyling(message.type)
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

              {/* Yes/No buttons for confirmation messages */}
              {message.type === 'confirmation_needed' && (
                <div className="mt-3 flex space-x-2">
                  <button
                    onClick={() => handleQuickResponse('yes')}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ✅ Yes, Proceed
                  </button>
                  <button
                    onClick={() => handleQuickResponse('no')}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    ❌ No, Cancel
                  </button>
                </div>
              )}

              {/* Option buttons for clarification messages */}
              {message.type === 'clarification_needed' && message.options && (
                <div className="mt-3 space-y-2">
                  {message.options.map((option, index) => (
                    <button
                      key={option.id || index}
                      onClick={() => handleQuickResponse(option.name || option.id)}
                      className="w-full text-left px-3 py-2 bg-blue-50 text-blue-800 text-sm rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      {option.name} {option.company && `(${option.company})`} - {option.id}
                    </button>
                  ))}
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
