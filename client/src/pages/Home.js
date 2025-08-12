import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useChat } from '../App';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Home = () => {
  const { openChat, isChatOpen } = useChat();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Company Performance Metrics
  const performanceMetrics = [
    {
      icon: CurrencyDollarIcon,
      title: 'Monthly Revenue',
      value: '$847,250',
      change: '+12.5%',
      trend: 'up',
      period: 'vs last month'
    },
    {
      icon: ClipboardDocumentListIcon,
      title: 'Active Invoices',
      value: '156',
      change: '+8',
      trend: 'up',
      period: 'this week'
    },
    {
      icon: UserGroupIcon,
      title: 'Active Customers',
      value: '89',
      change: '+3',
      trend: 'up',
      period: 'this month'
    },
    {
      icon: ChartBarIcon,
      title: 'Credit Utilization',
      value: '73%',
      change: '-5%',
      trend: 'down',
      period: 'vs last month'
    }
  ];


  // Chart Data and Options
  const revenueChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Revenue',
        data: [650000, 720000, 680000, 750000, 820000, 780000, 850000, 890000, 920000, 880000, 950000, 847250],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const customerGrowthData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [
      {
        label: 'New Customers',
        data: [12, 18, 15, 22],
        backgroundColor: 'rgba(38, 46, 119, 0.8)',
      },
      {
        label: 'Returning Customers',
        data: [45, 52, 48, 67],
        backgroundColor: 'rgba(34, 33, 77, 1)',
      },
    ],
  };


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Insights</h1>
              <p className="text-gray-600 mt-1">Real-time business performance and operational metrics</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Last updated: {currentTime.toLocaleTimeString()}
              </div>
              <button
                onClick={openChat}
                className="bg-primary-600 text-white hover:bg-primary-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>AI Support</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isChatOpen ? 'lg:grid-cols-2' : 'lg:grid-cols-4'}`}>
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <metric.icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center space-x-1 text-sm font-medium ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.trend === 'up' ? (
                        <ArrowTrendingUpIcon className="h-4 w-4" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4" />
                      )}
                      <span>{metric.change}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{metric.period}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operational Statistics */}

      {/* Charts Section */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Revenue Trend Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
              <div className="h-80">
                <Line data={revenueChartData} options={chartOptions} />
              </div>
            </div>

            {/* Customer Growth Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Growth by Quarter</h3>
              <div className="h-80">
                <Bar data={customerGrowthData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          </div>
        </div>
      </section>

      {/* Advanced Analytics */}
      <section className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Real-time Metrics Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isChatOpen ? 'lg:grid-cols-2' : 'lg:grid-cols-4'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">73.2%</div>
              <div className="text-sm text-gray-600">Capacity Utilization</div>
              <div className="text-xs text-green-600 mt-2">↗ +5.1% this week</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">$42.8K</div>
              <div className="text-sm text-gray-600">Daily Average Revenue</div>
              <div className="text-xs text-green-600 mt-2">↗ +8.3% vs last month</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">127</div>
              <div className="text-sm text-gray-600">Active Customers</div>
              <div className="text-xs text-blue-600 mt-2">→ Stable base</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardDocumentListIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">3.8</div>
              <div className="text-sm text-gray-600">Avg. Days to Complete</div>
              <div className="text-xs text-green-600 mt-2">↗ -0.4 days improvement</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
