import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { FacebookIcon, LinkedInIcon, InstagramIcon } from './Icons';

const Footer: React.FC = () => {
  const { resolvedTheme } = useTheme();
  return (
    <footer className={`${resolvedTheme === 'dark' ? 'bg-slate-900 border-t border-slate-800 text-white' : 'theme-bg-secondary theme-text-primary theme-border-primary'} py-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5">
              <img src="/mywoki-logo.png" alt="mywoki logo" className="w-9 h-9 rounded-full" />
            </div>
              <span className="text-xl font-bold">mywoki</span>
            </div>
            <p className={`${resolvedTheme === 'dark' ? 'text-slate-400' : 'theme-text-secondary'} mb-4`}>
              Advanced analytics and insights for your website traffic. Make data-driven decisions with AI-powered tools.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="/" className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} transition-colors`}>Features</a></li>
              <li><a href="/subscribe" className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} transition-colors`}>Pricing</a></li>
              <li><a href="/auth" className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} transition-colors`}>Analytics</a></li>
              <li><Link to="/docs" className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} transition-colors`}>Documentation</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="/about" className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} transition-colors`}>About</a></li>
              <li><a href="/contact" className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} transition-colors`}>Contact</a></li>
              <li><a href="mailto:support@mywoki.com" className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} transition-colors`}>support@mywoki.com</a></li>
              <li><Link to="/status" className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} transition-colors`}>System Status</Link></li>
              {/* <li><a href="/blog" className="text-slate-400 hover:text-white transition-colors">Blog</a></li> */}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-6">
              <a
                href="https://www.facebook.com/mywoki"
                target="_blank"
                rel="noopener noreferrer"
                className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} transition-colors`}
              >
                <FacebookIcon className="w-6 h-6" />
              </a>

              <a
                href="https://www.linkedin.com/company/mywoki"
                target="_blank"
                rel="noopener noreferrer"
                className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} transition-colors`}
              >
                <LinkedInIcon className="w-6 h-6" />
              </a>

              <a
                href="https://www.instagram.com/mywoki"
                target="_blank"
                rel="noopener noreferrer"
                className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} transition-colors`}
              >
                <InstagramIcon className="w-6 h-6" />
              </a>

              <a
                href="https://x.com/mywokiB2B"
                target="_blank"
                rel="noopener noreferrer"
                className={`${resolvedTheme === 'dark' ? 'p-2 rounded-md bg-white/5 hover:bg-white/10 transition' : 'p-2 rounded-md bg-white/5 hover:bg-white/10 transition'}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1200 1227"
                  className="w-5 h-5 fill-slate-200"
                >
                  <path d="M714 519L1160 0H1051L673 442 377 0H0L466 682 0 1227H109L510 755 836 1227H1200L714 519zM180 80H301L1020 1147H899L180 80z" />
                </svg>
              </a>
            </div>
            </div>
          </div>
        </div>

        <div className={`${resolvedTheme === 'dark' ? 'border-t border-slate-800' : 'theme-border-primary'} mt-8 pt-8 flex flex-col md:flex-row justify-between items-center`}>
          <p className={`${resolvedTheme === 'dark' ? 'text-slate-400' : 'theme-text-secondary'} text-sm`}>
            © 2025 mywoki. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/privacy" className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} text-sm transition-colors`}>Privacy Policy</a>
            <a href="/terms" className={`${resolvedTheme === 'dark' ? 'text-slate-400 hover:text-white' : 'theme-text-secondary hover:theme-text-primary'} text-sm transition-colors`}>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
