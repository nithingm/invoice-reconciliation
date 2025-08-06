import React from 'react';
import { 
  CogIcon, 
  UserGroupIcon, 
  TrophyIcon,
  ClockIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

const About = () => {
  const values = [
    {
      icon: ShieldCheckIcon,
      title: 'Quality First',
      description: 'Every transmission undergoes rigorous testing and quality control to ensure peak performance.'
    },
    {
      icon: ClockIcon,
      title: 'Reliability',
      description: 'Consistent delivery times and dependable service you can count on for your business needs.'
    },
    {
      icon: UserGroupIcon,
      title: 'Customer Focus',
      description: 'Your success is our priority. We provide personalized service and ongoing support.'
    },
    {
      icon: CogIcon,
      title: 'Innovation',
      description: 'Combining traditional craftsmanship with modern technology and AI-powered customer service.'
    }
  ];

  const milestones = [
    { year: '1998', event: 'TransMaster Pro founded in Detroit, Michigan' },
    { year: '2005', event: 'Expanded to serve nationwide automotive dealers' },
    { year: '2012', event: 'Introduced advanced diagnostic equipment and testing' },
    { year: '2018', event: 'Reached 10,000+ successful transmission rebuilds' },
    { year: '2023', event: 'Launched AI-powered customer support system' },
    { year: '2024', event: 'Celebrating 25+ years of excellence in transmission remanufacturing' }
  ];

  const team = [
    {
      name: 'Michael Rodriguez',
      role: 'Founder & CEO',
      experience: '30+ years',
      description: 'Master transmission technician with three decades of experience in automotive repair and remanufacturing.'
    },
    {
      name: 'Sarah Chen',
      role: 'Head of Quality Control',
      experience: '15+ years',
      description: 'Ensures every remanufactured transmission meets our strict quality standards and performance requirements.'
    },
    {
      name: 'David Thompson',
      role: 'Lead Technician',
      experience: '20+ years',
      description: 'Specializes in complex transmission rebuilds and training new technicians in best practices.'
    },
    {
      name: 'Lisa Johnson',
      role: 'Customer Success Manager',
      experience: '12+ years',
      description: 'Manages customer relationships and oversees our AI-powered support system implementation.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-automotive-700 to-automotive-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About TransMaster Pro
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Over 25 years of excellence in automobile transmission remanufacturing, 
              combining traditional craftsmanship with cutting-edge technology.
            </p>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Founded in 1998 in Detroit, Michigan, TransMaster Pro began as a small 
                  transmission repair shop with a simple mission: to provide the highest 
                  quality transmission remanufacturing services in the automotive industry.
                </p>
                <p>
                  Over the past 25+ years, we've grown from a local repair shop to a 
                  nationwide leader in transmission remanufacturing, serving automotive 
                  dealers, repair shops, and fleet operators across the country.
                </p>
                <p>
                  Today, we combine decades of mechanical expertise with modern technology, 
                  including our innovative AI-powered customer support system that helps 
                  streamline invoice management and credit validation for our clients.
                </p>
                <p>
                  Our commitment to quality, reliability, and customer service has made us 
                  the trusted choice for over 10,000 successful transmission rebuilds and 
                  countless satisfied customers.
                </p>
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">25+</div>
                  <div className="text-gray-600">Years in Business</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">10K+</div>
                  <div className="text-gray-600">Transmissions Rebuilt</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">98%</div>
                  <div className="text-gray-600">Customer Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">50+</div>
                  <div className="text-gray-600">States Served</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do and shape our commitment 
              to excellence in transmission remanufacturing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="card text-center hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600">
              Key milestones in our 25+ year history
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gray-300"></div>
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative flex items-center ${
                  index % 2 === 0 ? 'justify-start' : 'justify-end'
                }`}>
                  <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white p-6 rounded-lg shadow-md border">
                      <div className="text-primary-600 font-bold text-lg mb-2">
                        {milestone.year}
                      </div>
                      <div className="text-gray-700">
                        {milestone.event}
                      </div>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary-600 rounded-full border-4 border-white shadow"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600">
              Experienced professionals dedicated to transmission excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="card text-center">
                <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <UserGroupIcon className="h-10 w-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <div className="text-primary-600 font-medium mb-2">
                  {member.role}
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  {member.experience}
                </div>
                <p className="text-gray-600 text-sm">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications & Awards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Certifications & Recognition
            </h2>
            <p className="text-xl text-gray-600">
              Industry recognition for our commitment to quality and excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <TrophyIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ASE Certified
              </h3>
              <p className="text-gray-600 text-sm">
                Automotive Service Excellence certification for transmission specialists
              </p>
            </div>
            <div className="card text-center">
              <ShieldCheckIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ISO 9001 Certified
              </h3>
              <p className="text-gray-600 text-sm">
                International quality management system certification
              </p>
            </div>
            <div className="card text-center">
              <WrenchScrewdriverIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ATRA Member
              </h3>
              <p className="text-gray-600 text-sm">
                Automatic Transmission Rebuilders Association member in good standing
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
