import React, { useState } from 'react';
import { 
  BellIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useChat } from '../App';

const Notifications = () => {
  const { openChat } = useChat();
  const [filter, setFilter] = useState('all');

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Work Order Completed',
      message: 'Work Order WO-2024-003 for Wilson Automotive has been completed successfully.',
      timestamp: '2 minutes ago',
      read: false,
      category: 'work-order',
      details: {
        workOrder: 'WO-2024-003',
        customer: 'Wilson Automotive',
        technician: 'David Chen'
      }
    },
    {
      id: 2,
      type: 'warning',
      title: 'Urgent Work Order',
      message: 'Work Order WO-2024-004 requires immediate attention - customer waiting.',
      timestamp: '15 minutes ago',
      read: false,
      category: 'urgent',
      details: {
        workOrder: 'WO-2024-004',
        customer: 'Chen Motors',
        priority: 'Urgent'
      }
    },
    {
      id: 3,
      type: 'info',
      title: 'New Customer Registration',
      message: 'Metro Auto Group has been added to the customer database.',
      timestamp: '1 hour ago',
      read: true,
      category: 'customer',
      details: {
        customer: 'Metro Auto Group',
        contact: 'John Smith',
        phone: '(555) 987-6543'
      }
    },
    {
      id: 4,
      type: 'success',
      title: 'Payment Received',
      message: 'Payment of $3,200 received from Johnson Fleet Services for invoice INV-2024-001.',
      timestamp: '2 hours ago',
      read: true,
      category: 'payment',
      details: {
        amount: '$3,200',
        customer: 'Johnson Fleet Services',
        invoice: 'INV-2024-001'
      }
    },
    {
      id: 5,
      type: 'error',
      title: 'System Alert',
      message: 'Database backup failed. Please check system logs and retry.',
      timestamp: '3 hours ago',
      read: false,
      category: 'system',
      details: {
        error: 'Connection timeout',
        lastBackup: '2024-01-15 08:00 AM'
      }
    },
    {
      id: 6,
      type: 'info',
      title: 'Technician Assignment',
      message: 'Mike Rodriguez has been assigned to Work Order WO-2024-005.',
      timestamp: '4 hours ago',
      read: true,
      category: 'assignment',
      details: {
        technician: 'Mike Rodriguez',
        workOrder: 'WO-2024-005',
        customer: 'Metro Auto Group'
      }
    },
    {
      id: 7,
      type: 'warning',
      title: 'Inventory Low',
      message: 'Transmission fluid inventory is running low (5 units remaining).',
      timestamp: '1 day ago',
      read: true,
      category: 'inventory',
      details: {
        item: 'Transmission Fluid',
        remaining: '5 units',
        reorderLevel: '10 units'
      }
    }
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'warning': return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'error': return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'info': return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
      default: return <BellIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'work-order': return <WrenchScrewdriverIcon className="h-4 w-4" />;
      case 'customer': return <UserIcon className="h-4 w-4" />;
      case 'payment': return <CurrencyDollarIcon className="h-4 w-4" />;
      case 'system': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return <BellIcon className="h-4 w-4" />;
    }
  };

  const getNotificationBg = (type, read) => {
    if (!read) {
      switch (type) {
        case 'success': return 'bg-green-50 border-green-200';
        case 'warning': return 'bg-yellow-50 border-yellow-200';
        case 'error': return 'bg-red-50 border-red-200';
        case 'info': return 'bg-blue-50 border-blue-200';
        default: return 'bg-gray-50 border-gray-200';
      }
    }
    return 'bg-white border-gray-200';
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.category === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white shadow-sm border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BellIcon className="h-8 w-8 mr-3 text-primary-600" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">Stay updated with system alerts and important updates</p>
            </div>
            <div className="flex space-x-2">
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Mark All as Read
              </button>
              <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                Clear All
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
              <div className="text-sm text-gray-600">Total Notifications</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
              <div className="text-sm text-gray-600">Unread</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">
                {notifications.filter(n => n.type === 'warning').length}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.type === 'success').length}
              </div>
              <div className="text-sm text-gray-600">Success</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', name: 'All Notifications' },
                { id: 'unread', name: 'Unread' },
                { id: 'work-order', name: 'Work Orders' },
                { id: 'customer', name: 'Customers' },
                { id: 'payment', name: 'Payments' },
                { id: 'system', name: 'System' }
              ].map((filterOption) => (
                <button
                  key={filterOption.id}
                  onClick={() => setFilter(filterOption.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                    filter === filterOption.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications List */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${getNotificationBg(notification.type, notification.read)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {getCategoryIcon(notification.category)}
                          <span className="ml-1">{notification.category.replace('-', ' ')}</span>
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {notification.timestamp}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-600">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    {notification.details && (
                      <div className="mt-2 text-xs text-gray-500">
                        {Object.entries(notification.details).map(([key, value]) => (
                          <span key={key} className="mr-4">
                            <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span> {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You're all caught up! No notifications to display."
                  : `No ${filter} notifications found.`
                }
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Notifications;
