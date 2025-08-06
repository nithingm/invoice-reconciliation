import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      toast.success('Connected to support chat');
      
      // Add welcome message
      setMessages([{
        id: Date.now(),
        text: 'Hello! I\'m your AI assistant. I can help you with:\n\n• Invoice inquiries\n• Credit validation\n• Account information\n• General questions\n\nTo validate credits, please provide your invoice ID, customer ID, and the credit amount you\'d like to apply.',
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

    return () => {
      newSocket.close();
    };
  }, []);

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

  const getMessageIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'help':
      case 'greeting':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatMessage = (text) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const quickActions = [
    'Check my credits',
    'Validate invoice INV001',
    'Help with credit validation',
    'Contact support'
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            AI Customer Support Chat
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get instant help with invoice inquiries, credit validation, and account questions 
            through our AI-powered support system.
          </p>
          <div className="flex items-center justify-center mt-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${
                  message.sender === 'user' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                } rounded-lg px-4 py-3`}>
                  {message.sender === 'bot' && (
                    <div className="flex items-center space-x-2 mb-2">
                      {getMessageIcon(message.type)}
                      <span className="text-xs font-medium text-gray-600">
                        AI Assistant
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">
                    {formatMessage(message.text)}
                  </p>
                  {message.details && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
                      <div className="font-medium mb-1">Details:</div>
                      <div>Invoice: {message.details.invoiceId}</div>
                      <div>Customer: {message.details.customerId}</div>
                      {message.details.customerName && (
                        <div>Name: {message.details.customerName}</div>
                      )}
                      <div>Credit Applied: ${message.details.creditApplied}</div>
                      <div>Remaining Credits: ${message.details.remainingCredits}</div>
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-3 max-w-xs">
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

          {/* Quick Actions */}
          <div className="px-6 py-3 bg-gray-50 border-t">
            <div className="text-xs text-gray-600 mb-2">Quick actions:</div>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(action)}
                  className="text-xs bg-white hover:bg-gray-100 text-gray-700 px-3 py-1 rounded-full border transition-colors duration-200"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="p-6 border-t">
            <form onSubmit={sendMessage} className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message... (e.g., 'Validate $150 credit for invoice INV001, customer CUST001')"
                className="flex-1 input-field"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || !isConnected}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Credit Validation Format
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              To validate credits, include these details in your message:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Invoice ID (e.g., INV001)</li>
              <li>• Customer ID (e.g., CUST001)</li>
              <li>• Credit amount (e.g., $150)</li>
            </ul>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs font-medium text-gray-700 mb-1">Example:</div>
              <div className="text-xs text-gray-600">
                "Validate $150 credit for invoice INV001, customer CUST001"
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Need More Help?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              If you need additional assistance or have complex inquiries, 
              our human support team is available.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Phone:</span>
                <span className="text-gray-600">(555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Email:</span>
                <span className="text-gray-600">support@transmasterpro.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Hours:</span>
                <span className="text-gray-600">Mon-Fri 8AM-6PM EST</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
