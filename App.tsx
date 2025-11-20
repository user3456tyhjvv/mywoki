// App.tsx — MyWoki AI Enhanced Design (Cyan Glow + Animated Background)
import React, { useState, useCallback, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import TrialExpiredModal from './components/TrialExpiredModal';
import AuthTimeoutModal from './components/AuthTimeoutModal';
import ThemeToggle from './components/ThemeToggle';
import ChatWidget from './components/ChatWidget';
import { SparklesIcon, ChartBarIcon, ShieldCheckIcon, QuestionMarkCircleIcon, PaletteIcon } from './components/Icons';
import type { InstallationRequest } from './types';
import Footer from './components/Footer';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useNetwork } from './contexts/NetworkContext';

// Lazy load heavy components
const Dashboard = lazy(() => import('./components/Dashboard'));

const DesignDashboard = lazy(() => import('./components/DesignDashboard'));

interface AppProps {
  onNavigate?: (route: string) => void;
  onSignOut?: () => void;
}

// Moving gradient animation keyframes (add to tailwind.config if you want smoother infinite motion)
// animation: gradient-x 8s ease infinite;
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-cyan-900 to-black text-cyan-200">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <span>Loading MyWoki...</span>
    </div>
  </div>
);

// Domain validation function (unchanged)
const validateDomain = (domain: string): boolean => {
  if (!domain.trim()) return false;
  const simpleDomainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (simpleDomainRegex.test(domain)) return true;
  try {
    const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
    return url.hostname.includes('.');
  } catch {
    return false;
  }
};

const App: React.FC<AppProps> = ({ onNavigate, onSignOut }) => {
  const { user, authTimeout } = useAuth();
  const { resolvedTheme } = useTheme();
  const { showFullScreenNetworkModal } = useNetwork();

  const [domain, setDomain] = useState('');
  const [submittedDomain, setSubmittedDomain] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [installationRequests, setInstallationRequests] = useState<InstallationRequest[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);
  const [isDesignView, setIsDesignView] = useState(false);

  const [footerHeight] = useState<number>(80);

  const isValidDomain = useMemo(() => validateDomain(domain), [domain]);

  const analyticsFeatures = useMemo(() => [
    { icon: <ChartBarIcon className="w-5 h-5" />, title: "Real-time Insights", description: "Track visitors, sources, and user behavior instantly." },
    { icon: <SparklesIcon className="w-5 h-5" />, title: "AI Recommendations", description: "Smart insights to fix drop-offs & boost conversions." },
    { icon: <ShieldCheckIcon className="w-5 h-5" />, title: "Secure Setup", description: "One-click install with full privacy & data protection." }
  ], []);

  const designFeatures = useMemo(() => [
    "Professional, sleek templates",
    "SEO-optimized structure",
    "Mobile-first responsiveness",
    "E-commerce ready integration",
    "Lightning-fast loading",
  ], []);

  const handleDomainChange = useCallback((value: string) => {
    setDomain(value);
    if (error) setError('');
  }, [error]);

  const handleDomainSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!domain.trim()) return setError('Please enter your website domain');
    if (!isValidDomain) return setError('Please enter a valid domain (e.g., example.com)');
    setIsLoading(true);
    try {
      const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
      setSubmittedDomain(url.hostname);
    } catch {
      setError('Invalid domain format.');
    } finally {
      setIsLoading(false);
    }
  }, [domain, isValidDomain]);

  const handleBackToApp = useCallback(() => {
    setSubmittedDomain(null);
    setDomain('');
    setIsAdminView(false);
    setIsDesignView(false);
  }, []);

  const handleNavigate = useCallback((route: string) => onNavigate?.(route), [onNavigate]);
  const handleSignOut = useCallback(() => onSignOut?.(), [onSignOut]);

  useEffect(() => {
    if (user && user.days_remaining <= 0 && !['starter', 'pro', 'business'].includes((user.plan || '').toLowerCase()))
      setShowTrialExpiredModal(true);
    else setShowTrialExpiredModal(false);
  }, [user?.days_remaining, user?.plan]);

  const handleSubscribe = useCallback(() => handleNavigate('/subscribe'), [handleNavigate]);

  // Render logic unchanged
  let content = null;
  if (isDesignView) {
    content = (
      <Suspense fallback={<LoadingFallback />}>
        <DesignDashboard onBack={handleBackToApp} />
      </Suspense>
    );
  } else if (submittedDomain) {
    content = (
      <Suspense fallback={<LoadingFallback />}>
        <Dashboard
          domain={submittedDomain}
          onReset={handleBackToApp}
          onGoToAdmin={() => setIsAdminView(true)}
          onAddHelpRequest={() => {}}
          onSignOut={handleSignOut}
          onDomainChange={setSubmittedDomain}
          onNavigate={handleNavigate}
        />
      </Suspense>
    );
  } else {
    content = (
      <div className="relative min-h-screen text-white font-sans overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900 via-slate-900 to-black animate-[gradient_15s_ease_infinite] bg-[length:400%_400%]" />

        {/* Subtle floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/40 rounded-full blur-[1px] animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${3 + Math.random() * 4}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Header */}
        <header className="relative z-10 backdrop-blur-lg bg-black/30 border-b border-cyan-400/20 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-3">
              <img src="/mywoki-logo.png" alt="MyWoki" className="w-10 h-10 rounded-full shadow-md shadow-cyan-500/40" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">MyWoki</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHelp(!showHelp)}
                aria-label="Help section"
                aria-expanded={showHelp}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-400/10 hover:bg-cyan-400/20 transition-all"
              >
                <QuestionMarkCircleIcon className="w-5 h-5 text-cyan-300" />
                <span className="hidden sm:inline">Help</span>
              </button>
              <button
                onClick={() => handleNavigate('/')}
                className="text-cyan-200 hover:text-white transition-colors"
              >
                Home
              </button>
              <button
                onClick={handleSignOut}
                className="text-cyan-200 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 pt-20 px-6 pb-20 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-blue-300 to-cyan-200 bg-clip-text text-transparent animate-pulse">
              Empower Your organization with MyWoki AI
            </h2>
            <p className="text-cyan-100/80 max-w-2xl mx-auto">
              Analyze, optimize, and elevate your online performance with AI-powered insights.
            </p>
          </div>

          {/* Form Section */}
          <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-8 shadow-2xl shadow-cyan-500/10">
            <form onSubmit={handleDomainSubmit} className="space-y-6">
              <input
                type="text"
                value={domain}
                onChange={(e) => handleDomainChange(e.target.value)}
                placeholder="Enter your domain (e.g., myorganization.com)"
                className="w-full px-5 py-3 rounded-xl bg-cyan-950/30 border border-cyan-400/30 text-white placeholder-cyan-300/50 focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 font-semibold rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-gray-900 shadow-lg shadow-cyan-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-95"
              >
                {isLoading ? 'Analyzing...' : 'Analyze Traffic'}
              </button>
            </form>
          </div>

          {/* Help Section */}
          <div
            className={`transition-all duration-500 overflow-hidden ${
              showHelp ? 'max-h-[600px] opacity-100 mt-10' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="bg-white/10 border border-cyan-400/20 rounded-2xl p-8 backdrop-blur-xl shadow-xl">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-cyan-400" />
                How MyWoki Works
              </h3>
              <div className="grid md:grid-cols-2 gap-8 text-cyan-100/90">
                <div>
                  <h4 className="font-semibold text-cyan-300 mb-2">For organization/brand Owners</h4>
                  <ul className="space-y-2 text-sm">
                    <li>→ Enter your domain to unlock insights</li>
                    <li>→ Get real-time traffic and behavior analytics</li>
                    <li>→ Receive AI-powered optimization advice</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-cyan-300 mb-2">Get ready to</h4>
                  <ul className="space-y-2 text-sm">
                    <li>→ Manage installations and clients and Let mywoki handle the rest</li>
                    <li>→ Monitor performance dashboards</li>
                    <li>→ Get support via built-in contact tools</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Modals */}
        {showTrialExpiredModal && (
          <TrialExpiredModal
            isOpen={showTrialExpiredModal}
            onClose={() => setShowTrialExpiredModal(false)}
            onSubscribe={handleSubscribe}
            daysRemaining={user?.days_remaining || 0}
            plan={user?.plan || 'free'}
          />
        )}

        {authTimeout && (
          <AuthTimeoutModal
            isOpen={authTimeout}
            onClose={() => {}}
            onRefresh={() => window.location.reload()}
          />
        )}

        {showFullScreenNetworkModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl text-gray-800">
              <h3 className="font-bold text-xl mb-2">Network Status</h3>
              <p>Checking your connection...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {content}
      <ChatWidget />
    </>
  );
};

export default App;
