import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Message sent successfully! We\'ll get back to you within 24 hours.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        service: '',
        message: ''
      });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPinIcon,
      title: 'Address',
      details: ['1234 Industrial Boulevard', 'Detroit, MI 48201', 'United States']
    },
    {
      icon: PhoneIcon,
      title: 'Phone',
      details: ['Main: (555) 123-4567', 'Toll Free: 1-800-TRANS-PRO', 'Fax: (555) 123-4568']
    },
    {
      icon: EnvelopeIcon,
      title: 'Email',
      details: ['info@transmasterpro.com', 'support@transmasterpro.com', 'sales@transmasterpro.com']
    },
    {
      icon: ClockIcon,
      title: 'Business Hours',
      details: ['Monday - Friday: 8:00 AM - 6:00 PM', 'Saturday: 9:00 AM - 4:00 PM', 'Sunday: Closed']
    }
  ];

  const serviceOptions = [
    'Transmission Remanufacturing',
    'Transmission Repair',
    'Diagnostic Services',
    'Fleet Services',
    'Warranty Claim',
    'General Inquiry',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-automotive-700 to-automotive-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
              Get in touch with our transmission experts. We're here to help with 
              all your remanufacturing needs and questions.
            </p>
            <Link
              to="/chat"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-flex items-center space-x-2"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span>Try AI Chat Support</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {contactInfo.map((info, index) => (
              <div key={index} className="card text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <info.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {info.title}
                </h3>
                <div className="space-y-1">
                  {info.details.map((detail, idx) => (
                    <div key={idx} className="text-gray-600 text-sm">
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Send Us a Message
              </h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we'll get back to you within 24 hours. 
                For immediate assistance, try our AI chat support.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="ABC Auto Repair"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                    Service Needed
                  </label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select a service</option>
                    {serviceOptions.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="input-field resize-none"
                    placeholder="Please describe your transmission needs or questions..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Map & Additional Info */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Visit Our Facility
              </h2>
              <p className="text-gray-600 mb-8">
                Located in the heart of Detroit's automotive district, our state-of-the-art 
                facility is equipped with the latest transmission remanufacturing technology.
              </p>

              {/* Map Placeholder */}
              <div className="bg-gray-300 rounded-lg h-64 mb-8 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <MapPinIcon className="h-12 w-12 mx-auto mb-2" />
                  <div className="font-medium">Interactive Map</div>
                  <div className="text-sm">1234 Industrial Blvd, Detroit, MI</div>
                </div>
              </div>

              {/* Quick Contact Options */}
              <div className="space-y-4">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Need Immediate Help?
                  </h3>
                  <div className="space-y-3">
                    <Link
                      to="/chat"
                      className="flex items-center space-x-3 text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      <span>Start AI Chat Support</span>
                    </Link>
                    <a
                      href="tel:+15551234567"
                      className="flex items-center space-x-3 text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      <PhoneIcon className="h-5 w-5" />
                      <span>Call (555) 123-4567</span>
                    </a>
                    <a
                      href="mailto:info@transmasterpro.com"
                      className="flex items-center space-x-3 text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      <EnvelopeIcon className="h-5 w-5" />
                      <span>Email Us</span>
                    </a>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Emergency Services
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    For urgent transmission failures and emergency repairs, 
                    we offer priority scheduling and expedited service.
                  </p>
                  <a
                    href="tel:+18007726776"
                    className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                  >
                    Emergency Hotline: 1-800-TRANS-PRO
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Quick answers to common questions about our services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How long does a transmission rebuild take?
                </h3>
                <p className="text-gray-600 text-sm">
                  Most transmission rebuilds are completed within 3-5 business days. 
                  Complex cases or special orders may take longer.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What warranty do you offer?
                </h3>
                <p className="text-gray-600 text-sm">
                  We offer a standard 12-month/12,000-mile warranty, with extended 
                  options available up to 24 months/24,000 miles.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do you offer pickup and delivery?
                </h3>
                <p className="text-gray-600 text-sm">
                  Yes, we provide pickup and delivery services within a 50-mile 
                  radius of our facility for an additional fee.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How does the AI chat support work?
                </h3>
                <p className="text-gray-600 text-sm">
                  Our AI system can instantly validate credits, check invoice status, 
                  and provide quotes. Just provide your customer ID and invoice details.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600 text-sm">
                  We accept cash, check, all major credit cards, and offer financing 
                  options for qualified customers.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do you work on all transmission types?
                </h3>
                <p className="text-gray-600 text-sm">
                  Yes, we service all major transmission types including automatic, 
                  manual, CVT, and commercial transmissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
