import React, { useState } from 'react';
import { 
  ClipboardDocumentListIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useChat } from '../App';

const WorkOrders = () => {
  const { openChat, isChatOpen } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock work orders data
  const workOrders = [
    {
      id: 'WO-2024-001',
      customer: 'Johnson Fleet Services',
      vehicle: '2019 Ford F-150',
      service: 'Transmission Rebuild',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'Mike Rodriguez',
      startDate: '2024-01-15',
      estimatedCompletion: '2024-01-18',
      progress: 65,
      amount: '$3,200'
    },
    {
      id: 'WO-2024-002',
      customer: 'Smith Auto Repair',
      vehicle: '2020 Chevrolet Silverado',
      service: 'Transmission Service',
      status: 'pending',
      priority: 'medium',
      assignedTo: 'Sarah Johnson',
      startDate: '2024-01-16',
      estimatedCompletion: '2024-01-17',
      progress: 0,
      amount: '$850'
    },
    {
      id: 'WO-2024-003',
      customer: 'Wilson Automotive',
      vehicle: '2018 Honda Accord',
      service: 'Diagnostic & Repair',
      status: 'completed',
      priority: 'low',
      assignedTo: 'David Chen',
      startDate: '2024-01-10',
      estimatedCompletion: '2024-01-12',
      progress: 100,
      amount: '$1,450'
    },
    {
      id: 'WO-2024-004',
      customer: 'Chen Motors',
      vehicle: '2021 Toyota Camry',
      service: 'Transmission Flush',
      status: 'urgent',
      priority: 'urgent',
      assignedTo: 'Mike Rodriguez',
      startDate: '2024-01-16',
      estimatedCompletion: '2024-01-16',
      progress: 25,
      amount: '$320'
    },
    {
      id: 'WO-2024-005',
      customer: 'Metro Auto Group',
      vehicle: '2022 BMW X5',
      service: 'Transmission Rebuild',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'Lisa Thompson',
      startDate: '2024-01-14',
      estimatedCompletion: '2024-01-19',
      progress: 40,
      amount: '$4,100'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="h-4 w-4" />;
      case 'in-progress': return <WrenchScrewdriverIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'urgent': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return <ClipboardDocumentListIcon className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredOrders = workOrders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: workOrders.length,
    pending: workOrders.filter(o => o.status === 'pending').length,
    'in-progress': workOrders.filter(o => o.status === 'in-progress').length,
    urgent: workOrders.filter(o => o.status === 'urgent').length,
    completed: workOrders.filter(o => o.status === 'completed').length
  };

  return (
    <div className={`min-h-screen bg-gray-50 w-full ${isChatOpen ? 'pr-4' : ''}`}>
      {/* Header Section */}
      <section className="bg-white shadow-sm border-b border-gray-200 py-6">
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${isChatOpen ? 'max-w-5xl' : 'max-w-7xl'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
              <p className="text-gray-600 mt-1">Manage and track all transmission service orders</p>
            </div>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              New Work Order
            </button>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-6">
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${isChatOpen ? 'max-w-5xl' : 'max-w-7xl'}`}>
          <div className={`grid grid-cols-1 gap-4 ${isChatOpen ? 'md:grid-cols-3 lg:grid-cols-5' : 'md:grid-cols-5'}`}>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{statusCounts['in-progress']}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-red-600">{statusCounts.urgent}</div>
              <div className="text-sm text-gray-600">Urgent</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-4">
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${isChatOpen ? 'max-w-5xl' : 'max-w-7xl'}`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by customer, vehicle, or work order ID..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="urgent">Urgent</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Work Orders Table */}
      <section className="py-4">
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${isChatOpen ? 'max-w-5xl' : 'max-w-7xl'}`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isChatOpen ? 'px-2' : 'px-6'}`}>
                      Work Order
                    </th>
                    <th className={`py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isChatOpen ? 'px-2' : 'px-6'}`}>
                      Customer & Vehicle
                    </th>
                    <th className={`py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isChatOpen ? 'px-2' : 'px-6'}`}>
                      Service
                    </th>
                    <th className={`py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isChatOpen ? 'px-2' : 'px-6'}`}>
                      Status
                    </th>
                    <th className={`py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isChatOpen ? 'hidden' : 'px-6'}`}>
                      Assigned To
                    </th>
                    <th className={`py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isChatOpen ? 'hidden' : 'px-6'}`}>
                      Progress
                    </th>
                    <th className={`py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isChatOpen ? 'hidden' : 'px-6'}`}>
                      Amount
                    </th>
                    <th className={`py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isChatOpen ? 'px-2' : 'px-6'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className={`py-4 whitespace-nowrap ${isChatOpen ? 'px-2' : 'px-6'}`}>
                        <div className="text-sm font-medium text-gray-900">{order.id}</div>
                        <div className="text-sm text-gray-500">
                          {order.startDate} - {order.estimatedCompletion}
                        </div>
                      </td>
                      <td className={`py-4 whitespace-nowrap ${isChatOpen ? 'px-2' : 'px-6'}`}>
                        <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                        <div className="text-sm text-gray-500">{order.vehicle}</div>
                      </td>
                      <td className={`py-4 whitespace-nowrap ${isChatOpen ? 'px-2' : 'px-6'}`}>
                        <div className="text-sm text-gray-900">{order.service}</div>
                        <div className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                          {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)} Priority
                        </div>
                      </td>
                      <td className={`py-4 whitespace-nowrap ${isChatOpen ? 'px-2' : 'px-6'}`}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </span>
                      </td>
                      <td className={`py-4 whitespace-nowrap text-sm text-gray-900 ${isChatOpen ? 'hidden' : 'px-6'}`}>
                        {order.assignedTo}
                      </td>
                      <td className={`py-4 whitespace-nowrap ${isChatOpen ? 'hidden' : 'px-6'}`}>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{width: `${order.progress}%`}}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{order.progress}%</span>
                        </div>
                      </td>
                      <td className={`py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${isChatOpen ? 'hidden' : 'px-6'}`}>
                        {order.amount}
                      </td>
                      <td className={`py-4 whitespace-nowrap text-sm font-medium ${isChatOpen ? 'px-2' : 'px-6'}`}>
                        <div className="flex space-x-2">
                          <button className="text-primary-600 hover:text-primary-900">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WorkOrders;
