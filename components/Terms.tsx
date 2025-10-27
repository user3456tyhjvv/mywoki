import React from 'react';
import { ArrowLeftIcon } from './Icons';
import Footer from './Footer';

interface TermsProps {
  onNavigate: (route: string) => void;
}

const Terms: React.FC<TermsProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-primary via-brand-secondary to-brand-primary text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <span
                      className="inline-block w-6 h-6 cursor-pointer hover:text-brand-accent transition-colors mb-4"
                      onClick={() => onNavigate('/')}
                      role="button"
                      tabIndex={0}
                      aria-label="Go back"
                      onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') onNavigate('/'); }}
                    >
                      <ArrowLeftIcon className="w-6 h-6" />
                    </span>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-slate-300">Please read these terms carefully before using our service.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 prose prose-invert max-w-none">
          <h2>Acceptance of Terms</h2>
          <p>By accessing and using Web Traffic Insight AI, you accept and agree to be bound by the terms and provision of this agreement.</p>

          <h2>Use License</h2>
          <p>Permission is granted to temporarily use our service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>

          <h2>User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>

          <h2>Service Availability</h2>
          <p>While we strive to provide continuous service, we do not guarantee that our service will be uninterrupted or error-free. We reserve the right to modify or discontinue service at any time.</p>

          <h2>Limitation of Liability</h2>
          <p>In no event shall Web Traffic Insight AI or its suppliers be liable for any damages arising out of the use or inability to use our service.</p>

          <h2>Governing Law</h2>
          <p>These terms shall be interpreted and governed by the laws of the jurisdiction in which our company is incorporated, without regard to conflict of law provisions.</p>

          <h2>Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of our service after changes constitutes acceptance of the new terms.</p>

          <p className="text-sm text-slate-400 mt-8">Last updated: January 2024</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
