import React from 'react';
import { ArrowLeftIcon } from './Icons';
import Footer from './Footer';

interface PrivacyProps {
  onNavigate: (route: string) => void;
}

const Privacy: React.FC<PrivacyProps> = ({ onNavigate }) => {
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
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-slate-300">Your privacy is important to us. Learn how we collect, use, and protect your data.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 prose prose-invert max-w-none">
          <h2>Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This may include your name, email address, and website domain information.</p>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.</p>

          <h2>Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.</p>

          <h2>Data Sharing</h2>
          <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.</p>

          <h2>Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information. You may also opt out of certain communications at any time.</p>

          <h2>Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>

          <p className="text-sm text-slate-400 mt-8">Last updated: January 2024</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
