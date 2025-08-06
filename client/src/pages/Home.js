import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CogIcon, 
  ShieldCheckIcon, 
  ClockIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const features = [
    {
      icon: CogIcon,
      title: 'Expert Remanufacturing',
      description: 'Over 25 years of experience in transmission rebuilding with state-of-the-art equipment and techniques.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Quality Guarantee',
      description: 'All remanufactured transmissions come with comprehensive warranty and quality assurance.'
    },
    {
      icon: ClockIcon,
      title: 'Fast Turnaround',
      description: 'Quick processing times without compromising on quality. Most jobs completed within 3-5 business days.'
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'AI-Powered Support',
      description: 'Get instant help with invoice inquiries and credit validation through our intelligent chat system.'
    }
  ];

  const stats = [
    { number: '25+', label: 'Years Experience' },
    { number: '10,000+', label: 'Transmissions Rebuilt' },
    { number: '98%', label: 'Customer Satisfaction' },
    { number: '24/7', label: 'Support Available' }
  ];

  const testimonials = [
    {
      name: 'John Smith',
      company: 'Smith Auto Repair',
      text: 'TransMaster Pro has been our go-to for transmission rebuilds. Their quality is unmatched and the AI chat system makes managing invoices so easy.',
      rating: 5
    },
    {
      name: 'Sarah Johnson',
      company: 'Johnson Fleet Services',
      text: 'The credit validation system saved us hours of paperwork. Professional service and excellent communication throughout.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Professional Transmission
              <span className="block text-primary-200">Remanufacturing</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Industry-leading transmission rebuilding services with AI-powered customer support 
              for seamless invoice management and credit validation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/services"
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                View Services
              </Link>
              <Link
                to="/chat"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Start Chat Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose TransMaster Pro?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine decades of mechanical expertise with cutting-edge technology 
              to deliver superior transmission remanufacturing services.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Chat Highlight */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Smart Customer Support
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Our AI-powered chat system helps you instantly validate credits, 
                check invoice status, and get answers to your transmission service questions.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-primary-200" />
                  <span>Instant credit validation</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-primary-200" />
                  <span>Invoice status checking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-primary-200" />
                  <span>24/7 availability</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-primary-200" />
                  <span>Secure and private</span>
                </div>
              </div>
              <Link
                to="/chat"
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
                <span>Try Chat Support</span>
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">AI</span>
                  </div>
                  <span className="font-medium text-gray-900">TransMaster Assistant</span>
                </div>
                <p className="text-gray-700 text-sm">
                  Hello! I can help you validate credits for your transmission purchases. 
                  Please provide your invoice ID, customer ID, and credit amount.
                </p>
              </div>
              <div className="bg-primary-600 text-white rounded-lg p-4 ml-8">
                <p className="text-sm">
                  Hi! I need to validate $150 credit for invoice INV001, customer CUST001
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">AI</span>
                  </div>
                  <span className="font-medium text-gray-900">TransMaster Assistant</span>
                </div>
                <p className="text-gray-700 text-sm">
                  ✅ Credit validation successful! You can apply $150 in credits to invoice INV001. 
                  Your remaining credit balance will be $0.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Trusted by automotive professionals across the industry
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-automotive-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Contact us today for a quote on your transmission remanufacturing needs 
            or try our AI chat support for instant assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Get Quote
            </Link>
            <Link
              to="/chat"
              className="border-2 border-white text-white hover:bg-white hover:text-automotive-800 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Start Chat
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
