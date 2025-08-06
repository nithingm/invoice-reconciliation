import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CogIcon, 
  WrenchScrewdriverIcon, 
  ClipboardDocumentCheckIcon,
  TruckIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const Services = () => {
  const mainServices = [
    {
      icon: CogIcon,
      title: 'Complete Transmission Remanufacturing',
      description: 'Full teardown, inspection, and rebuild of automatic and manual transmissions with OEM or upgraded components.',
      features: ['Complete disassembly and cleaning', 'Precision machining and reconditioning', 'New seals, gaskets, and filters', 'Performance testing and calibration'],
      price: 'Starting at $1,800'
    },
    {
      icon: WrenchScrewdriverIcon,
      title: 'Transmission Repair Services',
      description: 'Targeted repairs for specific transmission issues, from minor adjustments to major component replacement.',
      features: ['Diagnostic testing', 'Valve body repair', 'Torque converter service', 'Electrical system repair'],
      price: 'Starting at $500'
    },
    {
      icon: ClipboardDocumentCheckIcon,
      title: 'Diagnostic & Inspection',
      description: 'Comprehensive transmission analysis using state-of-the-art diagnostic equipment and expert evaluation.',
      features: ['Computer diagnostic scan', 'Road test evaluation', 'Fluid analysis', 'Detailed inspection report'],
      price: 'Starting at $150'
    },
    {
      icon: TruckIcon,
      title: 'Fleet Services',
      description: 'Specialized transmission services for commercial fleets with volume pricing and priority scheduling.',
      features: ['Volume discounts', 'Priority scheduling', 'Fleet management reporting', 'Preventive maintenance programs'],
      price: 'Custom pricing'
    }
  ];

  const transmissionTypes = [
    '4L60E', '4L80E', '4T65E', '6T70', '6T80', 'CVT', 'Manual 5-Speed', 'Manual 6-Speed',
    'Allison 1000', 'Ford 6R80', 'ZF 8HP', 'Toyota U660E', 'Honda CVT', 'Nissan CVT'
  ];

  const processSteps = [
    {
      step: '1',
      title: 'Initial Inspection',
      description: 'Comprehensive diagnostic evaluation and damage assessment'
    },
    {
      step: '2',
      title: 'Complete Disassembly',
      description: 'Careful teardown with detailed documentation of all components'
    },
    {
      step: '3',
      title: 'Cleaning & Machining',
      description: 'Professional cleaning and precision machining of reusable parts'
    },
    {
      step: '4',
      title: 'Reassembly',
      description: 'Expert reassembly with new seals, gaskets, and upgraded components'
    },
    {
      step: '5',
      title: 'Testing & Calibration',
      description: 'Comprehensive testing and performance calibration'
    },
    {
      step: '6',
      title: 'Quality Assurance',
      description: 'Final inspection and quality control before delivery'
    }
  ];

  const warranties = [
    {
      type: 'Standard Warranty',
      duration: '12 months / 12,000 miles',
      coverage: 'Parts and labor for manufacturing defects',
      price: 'Included'
    },
    {
      type: 'Extended Warranty',
      duration: '24 months / 24,000 miles',
      coverage: 'Comprehensive coverage including wear items',
      price: '+$200'
    },
    {
      type: 'Commercial Warranty',
      duration: '18 months / 18,000 miles',
      coverage: 'Heavy-duty coverage for commercial vehicles',
      price: '+$150'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Our Services
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto mb-8">
              Professional transmission remanufacturing services with industry-leading 
              quality standards and comprehensive warranty coverage.
            </p>
            <Link
              to="/chat"
              className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span>Get Instant Quote</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Professional Transmission Services
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive solutions for all your transmission needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {mainServices.map((service, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <service.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {service.description}
                    </p>
                    <ul className="space-y-1 mb-4">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-primary-600 font-semibold">
                      {service.price}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transmission Types */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Transmission Types We Service
            </h2>
            <p className="text-xl text-gray-600">
              Expert service for all major transmission models and manufacturers
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {transmissionTypes.map((type, index) => (
              <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="text-sm font-medium text-gray-900">
                  {type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Remanufacturing Process
            </h2>
            <p className="text-xl text-gray-600">
              Six-step process ensuring the highest quality standards
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processSteps.map((process, index) => (
              <div key={index} className="relative">
                <div className="card text-center">
                  <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    {process.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {process.title}
                  </h3>
                  <p className="text-gray-600">
                    {process.description}
                  </p>
                </div>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-gray-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Warranty Options */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Warranty Options
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive warranty coverage for peace of mind
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {warranties.map((warranty, index) => (
              <div key={index} className={`card text-center ${
                index === 1 ? 'ring-2 ring-primary-500 relative' : ''
              }`}>
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <ShieldCheckIcon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {warranty.type}
                </h3>
                <div className="text-2xl font-bold text-primary-600 mb-2">
                  {warranty.duration}
                </div>
                <p className="text-gray-600 mb-4">
                  {warranty.coverage}
                </p>
                <div className="text-lg font-semibold text-gray-900">
                  {warranty.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose Our Services?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">Expert Technicians</div>
                    <div className="text-gray-600">ASE-certified technicians with decades of experience</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">Quality Parts</div>
                    <div className="text-gray-600">OEM and premium aftermarket components only</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">Fast Turnaround</div>
                    <div className="text-gray-600">Most jobs completed within 3-5 business days</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">AI-Powered Support</div>
                    <div className="text-gray-600">Instant assistance with invoices and credit validation</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">Comprehensive Testing</div>
                    <div className="text-gray-600">Every transmission tested before delivery</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-primary-600 text-white rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">Ready to Get Started?</h3>
              <p className="text-primary-100 mb-6">
                Contact us today for a free quote on your transmission service needs. 
                Our AI chat system can provide instant estimates and help with credit validation.
              </p>
              <div className="space-y-4">
                <Link
                  to="/chat"
                  className="block w-full bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
                >
                  Start Chat Support
                </Link>
                <Link
                  to="/contact"
                  className="block w-full border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
