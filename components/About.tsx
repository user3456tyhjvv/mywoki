import React from 'react';
import { ArrowLeftIcon, ShieldCheckIcon, BrainIcon, UsersIcon, GlobeIcon, RocketIcon } from './Icons';
import Footer from './Footer';

interface AboutProps {
  onNavigate: (route: string) => void;
}

const About: React.FC<AboutProps> = ({ onNavigate }) => {
  const features = [
    {
      icon: <BrainIcon className="w-8 h-8" />,
      title: "AI-Powered Insights",
      description: "Get intelligent analytics and automated recommendations to optimize your website performance."
    },
    {
      icon: <ShieldCheckIcon className="w-8 h-8" />,
      title: "Privacy-First",
      description: "We respect user privacy with GDPR-compliant tracking and no unnecessary data collection."
    },
    {
      icon: <RocketIcon className="w-8 h-8" />,
      title: "Real-Time Analytics",
      description: "Monitor your website traffic as it happens with live updates and instant notifications."
    },
    {
      icon: <UsersIcon className="w-8 h-8" />,
      title: "User Behavior Analysis",
      description: "Understand how visitors interact with your site and identify opportunities for improvement."
    },
    {
      icon: <GlobeIcon className="w-8 h-8" />,
      title: "Multi-organization Support",
      description: "Track multiple organizations from a single dashboard with unified reporting."
    }
  ];

  const stats = [
    { number: "99.9%", label: "Uptime" },
    { number: "2s", label: "Avg. Load Time" },
    { number: "10K+", label: "Organizations Tracked" },
    { number: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group mb-8"
        >
          <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-blue-300 text-sm font-medium">Transforming Organization Analytics with AI</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
          About MyWoki
        </h1>

        <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          MyWoki is a cutting-edge web analytics platform that empowers businesses and organizations
          to understand their online presence through AI-driven insights, privacy-first tracking,
          and comprehensive traffic analysis. We help you transform raw data into strategic decisions.
        </p>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
              <div className="text-slate-400 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        {/* Our Story */}
        <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-white">Our Story</h2>
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p>
                  MyWoki was born from a simple observation: most analytics tools are either
                  too complex for beginners or too limited for professionals. We set out to create a platform
                  that bridges this gap.
                </p>
                <p>
                  Founded in 2024, our team of data scientists, developers, and UX designers came together 
                  with a shared vision: to make powerful web analytics accessible to everyone, regardless 
                  of technical expertise.
                </p>
                <p>
                  Today, we serve thousands of businesses worldwide, from solo entrepreneurs to enterprise 
                  teams, helping them unlock the full potential of their website data.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-8 aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  <img src="https://i.postimg.cc/PxbCHKK5/Screenshot-2025-10-22-at-01-15-05-Your-Space-Analytics-AI-Powered-Web-Analytics-Traffic-Growth-Plat.png" alt="mywoki image" />
                </div>
                <p className="text-blue-200 font-semibold">Building the future of web analytics</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 md:p-12 border border-blue-500/20">
          <h2 className="text-3xl font-bold mb-8 text-center text-white">Our Mission</h2>
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl text-slate-300 leading-relaxed">
              To democratize web analytics by providing enterprise-grade insights with consumer-grade simplicity. 
              We believe every website owner deserves to understand their audience and optimize their digital presence 
              without needing a data science degree.
            </p>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-3xl font-bold mb-12 text-center text-white">Why Choose MyWoki?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300 hover:transform hover:-translate-y-1"
              >
                <div className="text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Technology Stack */}
        <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-white/10">
          <h2 className="text-3xl font-bold mb-8 text-center text-white">Our Technology</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Advanced AI Engine</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Our proprietary AI algorithms analyze billions of data points to provide intelligent 
                recommendations for improving user engagement, conversion rates, and overall website performance.
              </p>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Real-time pattern recognition
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Predictive analytics
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  Automated A/B testing insights
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">Privacy & Security</h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                We built MyWoki with privacy and security as core principles from day one.
              </p>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  GDPR & CCPA compliant tracking
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  End-to-end encryption
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  No personal data collection
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  Regular security audits
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-12 text-white">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/20">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-semibold text-white mb-3">Transparency</h3>
              <p className="text-slate-300">
                We're open about how we work, what we track, and how we use data to help you succeed.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold text-white mb-3">Innovation</h3>
              <p className="text-slate-300">
                We constantly push boundaries to bring you the most advanced analytics features.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-6 border border-orange-500/20">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-white mb-3">Customer Success</h3>
              <p className="text-slate-300">
                Your success is our success. We're committed to helping you achieve your goals.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
            Join thousands of website owners who are already transforming their digital presence with MyWoki.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('/getting-started')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => onNavigate('/contact')}
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Contact Sales
            </button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default About;