import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  BellIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Company Insights', href: '/', icon: HomeIcon },
    { name: 'Work Orders', href: '/work-orders', icon: ClipboardDocumentListIcon },
    { name: 'System Settings', href: '/settings', icon: CogIcon },
    { name: 'Notifications', href: '/notifications', icon: BellIcon },
    { name: 'Customer Data', href: '/customer-data', icon: UserGroupIcon },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">TransMaster</span>
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Vertical Sidebar */}
      <nav className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <Link to="/" className="flex items-center" onClick={() => setIsOpen(false)}>
              <div className="h-10 w-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <div className="ml-3">
                <span className="text-xl font-bold text-gray-900 block">TransMaster</span>
                <span className="text-sm text-gray-500">Pro Portal</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Bottom Section */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <div>TransMaster Pro v2.0</div>
              <div className="mt-1">Employee Portal</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
