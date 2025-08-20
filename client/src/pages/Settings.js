import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  CogIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  CircleStackIcon,
  ServerIcon,
  ChartBarIcon,
  KeyIcon,
  CpuChipIcon, // New Icon
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useChat } from '../App';

const Settings = () => {
  const { openChat } = useChat();
  const [activeTab, setActiveTab] = useState('general');

  // State for AI Settings
  const [aiModels, setAiModels] = useState({ ollama: [], gemini: [] });
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    // Fetch available AI models from the backend
    fetch('/api/ai/models')
      .then(res => res.json())
      .then(data => {
        setAiModels(data);
        // Set a default provider and model
        const firstProvider = Object.keys(data)[0];
        if (firstProvider) {
          setSelectedProvider(firstProvider);
          if (data[firstProvider] && data[firstProvider].length > 0) {
            setSelectedModel(data[firstProvider][0]);
          }
        }
      })
      .catch(error => {
        console.error("Failed to fetch AI models:", error);
        toast.error("Could not fetch AI models.");
      });
  }, []);

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'ai', name: 'AI Settings', icon: CpuChipIcon }, // New Tab
    { id: 'users', name: 'User Management', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'database', name: 'Database', icon: CircleStackIcon },
    { id: 'integrations', name: 'Integrations', icon: ServerIcon },
    { id: 'reports', name: 'Reports', icon: ChartBarIcon }
  ];

  const handleProviderChange = (e) => {
    const provider = e.target.value;
    setSelectedProvider(provider);
    // Set the default model for the newly selected provider
    if (aiModels[provider] && aiModels[provider].length > 0) {
      setSelectedModel(aiModels[provider][0]);
    } else {
      setSelectedModel('');
    }
  };

  const testGeminiService = (model) => {
    fetch('/api/ai/test-gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        toast.success('Gemini service is working!');
        console.log('Test response:', data);
      } else {
        toast.error(`Service test failed: ${data.error}`);
      }
    })
    .catch(error => {
      console.error("Failed to test Gemini service:", error);
      toast.error('Failed to test Gemini service. Please check your API key and network connection.');
    });
  };

  const handleSaveChanges = () => {
    // Save AI configuration
    if (activeTab === 'ai') {
      fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast.success(data.message);
        } else {
          toast.error('Failed to save AI configuration.');
        }
      })
      .catch(error => {
        console.error("Failed to save AI config:", error);
        toast.error('An error occurred while saving.');
      });
    }
    // Add logic to save other settings tabs here
  };

  const renderAiSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI Model Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ai-provider" className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
            <select 
              id="ai-provider" 
              className="w-full border border-gray-300 rounded-lg px-3 py-2" 
              value={selectedProvider} 
              onChange={handleProviderChange}
            >
              {Object.keys(aiModels).map(providerKey => (
                <option key={providerKey} value={providerKey}>
                  {providerKey === 'ollama' ? 'Ollama (Local)' : 
                   providerKey === 'gemini' ? 'Google Gemini' : 
                   providerKey === 'openai' ? 'OpenAI' : 
                   providerKey === 'anthropic' ? 'Anthropic' : 
                   providerKey.charAt(0).toUpperCase() + providerKey.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ai-model" className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <select 
              id="ai-model" 
              className="w-full border border-gray-300 rounded-lg px-3 py-2" 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!aiModels[selectedProvider] || aiModels[selectedProvider].length === 0}
            >
              {aiModels[selectedProvider] && aiModels[selectedProvider].length > 0 ? (
                aiModels[selectedProvider].map(model => (
                  <option key={model} value={model}>{model}</option>
                ))
              ) : (
                <option>No models available</option>
              )}
            </select>
          </div>
        </div>
        {selectedProvider === 'gemini' && (
          <div className="mt-4 space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Please ensure your Gemini API key is set in the `.env` file on the server as `GEMINI_API_KEY`.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-800 font-medium mb-2">Test Gemini Service</h4>
              <p className="text-blue-600 text-sm mb-3">
                Test if the Gemini service is working correctly with your API key.
              </p>
              <button
                onClick={() => testGeminiService(selectedModel)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Test Service
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="TransMaster Pro" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="Mon-Fri 8:00 AM - 6:00 PM" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
            <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="support@transmasterpro.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input type="tel" className="w-full border border-gray-300 rounded-lg px-3 py-2" defaultValue="(555) 123-4567" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto-save Work Orders</label>
              <p className="text-sm text-gray-500">Automatically save work order changes</p>
            </div>
            <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Email Notifications</label>
              <p className="text-sm text-gray-500">Send email alerts for important updates</p>
            </div>
            <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Dark Mode</label>
              <p className="text-sm text-gray-500">Use dark theme for the interface</p>
            </div>
            <input type="checkbox" className="h-4 w-4 text-primary-600" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">User Accounts</h3>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          Add New User
        </button>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">Mike Rodriguez</div>
                <div className="text-sm text-gray-500">mike@transmasterpro.com</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Administrator</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 hours ago</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                <button className="text-red-600 hover:text-red-900">Disable</button>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">Sarah Johnson</div>
                <div className="text-sm text-gray-500">sarah@transmasterpro.com</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Technician</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 day ago</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-primary-600 hover:text-primary-900 mr-3">Edit</button>
                <button className="text-red-600 hover:text-red-900">Disable</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Policies</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
              <p className="text-sm text-gray-500">Require 2FA for all user accounts</p>
            </div>
            <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Session Timeout</label>
              <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
            </div>
            <select className="border border-gray-300 rounded px-3 py-1">
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>2 hours</option>
              <option>4 hours</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Password Complexity</label>
              <p className="text-sm text-gray-500">Enforce strong password requirements</p>
            </div>
            <input type="checkbox" className="h-4 w-4 text-primary-600" defaultChecked />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Security</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <KeyIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">API Key</span>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="password" 
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" 
              defaultValue="sk-1234567890abcdef"
              readOnly 
            />
            <button className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700">
              Regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Database Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-800 font-medium">Connection Status</div>
            <div className="text-green-600 text-sm">Connected</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-800 font-medium">Total Records</div>
            <div className="text-blue-600 text-sm">15,847</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-yellow-800 font-medium">Last Backup</div>
            <div className="text-yellow-600 text-sm">2 hours ago</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Backup & Maintenance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Automatic Backups</label>
              <p className="text-sm text-gray-500">Schedule regular database backups</p>
            </div>
            <select className="border border-gray-300 rounded px-3 py-1">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
          <div className="flex space-x-3">
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
              Create Backup Now
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
              Optimize Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralSettings();
      case 'ai': return renderAiSettings(); // New case
      case 'users': return renderUserManagement();
      case 'security': return renderSecuritySettings();
      case 'database': return renderDatabaseSettings();
      case 'notifications':
        return <div className="text-gray-500">Notification settings coming soon...</div>;
      case 'integrations':
        return <div className="text-gray-500">Integration settings coming soon...</div>;
      case 'reports':
        return <div className="text-gray-500">Report settings coming soon...</div>;
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white shadow-sm border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-1">Configure system preferences and manage user accounts</p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {renderContent()}
              
              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveChanges}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

