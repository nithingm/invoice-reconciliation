import React, { useState, useEffect } from 'react';
import { UserIcon, CreditCardIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';

const CustomerData = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      setCustomers(data.customers);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch customer data');
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      const customer = await response.json();
      setSelectedCustomer(customer);
    } catch (err) {
      setError('Failed to fetch customer details');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'used': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchCustomers}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Credit Management</h1>
          <p className="mt-2 text-gray-600">
            View customer information, credits, and invoices for testing the chat system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Customers Overview</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => fetchCustomerDetails(customer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <UserIcon className="h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-500">{customer.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-600">
                          ${customer.totalActiveCredits}
                        </p>
                        <p className="text-xs text-gray-500">Active Credits</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <CreditCardIcon className="h-4 w-4 mx-auto text-gray-400" />
                        <p className="text-gray-600">{customer.activeCreditsCount} Active</p>
                      </div>
                      <div className="text-center">
                        <DocumentTextIcon className="h-4 w-4 mx-auto text-gray-400" />
                        <p className="text-gray-600">{customer.pendingInvoices} Pending</p>
                      </div>
                      <div className="text-center">
                        <CalendarIcon className="h-4 w-4 mx-auto text-gray-400" />
                        <p className="text-gray-600">{customer.totalInvoices} Total</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedCustomer ? `${selectedCustomer.name} Details` : 'Select a Customer'}
              </h2>
            </div>
            <div className="p-6">
              {selectedCustomer ? (
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <p><span className="font-medium">ID:</span> {selectedCustomer.id}</p>
                        <p><span className="font-medium">Name:</span> {selectedCustomer.name}</p>
                        <p><span className="font-medium">Email:</span> {selectedCustomer.email}</p>
                        <p><span className="font-medium">Phone:</span> {selectedCustomer.phone}</p>
                        <p><span className="font-medium">Join Date:</span> {formatDate(selectedCustomer.joinDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Credits */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Credits</h3>
                    <div className="space-y-3">
                      {selectedCustomer.credits.map((credit) => (
                        <div key={credit.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">${credit.amount}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(credit.status)}`}>
                              {credit.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{credit.description}</p>
                          <div className="text-xs text-gray-500">
                            <p>Earned: {formatDate(credit.earnedDate)}</p>
                            <p>Expires: {formatDate(credit.expiryDate)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Purchase History */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Purchase History</h3>
                    <div className="space-y-3">
                      {selectedCustomer.purchaseHistory.map((purchase, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{purchase.product}</span>
                            <span className="text-green-600 font-medium">${purchase.amount}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Invoice: {purchase.invoiceId}</p>
                            <p>Date: {formatDate(purchase.date)}</p>
                            <p>Credits Earned: ${purchase.creditsEarned}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <UserIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>Click on a customer to view their details</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Test Scenarios for Chat Bot</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Credit Balance Check</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>"Check credit balance for CUST001"</p>
                  <p>"What credits does John Smith have?"</p>
                  <p>"Show me my account balance"</p>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Credit Application</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p>"Apply $500 credit to invoice INV001"</p>
                  <p>"I want to use $250 credits for CUST001"</p>
                  <p>"Use credits on my latest invoice"</p>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2">Invoice Inquiries</h3>
                <div className="text-sm text-purple-800 space-y-1">
                  <p>"Check invoice INV002 status"</p>
                  <p>"What invoices does CUST002 have?"</p>
                  <p>"Show me my pending invoices"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerData;
