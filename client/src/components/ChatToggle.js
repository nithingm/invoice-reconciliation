import React from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ChatToggle = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-0 focus:ring-primary-300 ${
        isOpen
          ? 'bg-transparent hover:bg-transparent'
          : 'bg-primary-600 hover:bg-primary-700'
      }`}
      style={{
        right: isOpen ? '408px' : '24px'
      }}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      <div className="flex items-center justify-center w-full h-full">
        {isOpen ? (
          <XMarkIcon className="h-6 w-6 text-blue" />
        ) : (
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
        )}
      </div>
    </button>
  );
};

export default ChatToggle;
