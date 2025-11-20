import React, { useState, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';
import TrialExpiredModal from './components/TrialExpiredModal';
import type { InstallationRequest } from './types';
import Robots from './components/Robots';
import DataDashboard from './components/DataDashboard';
// Lazy load components for better performance
const HomePage = lazy(() => import('./components/HomePage'));
const AuthPage = lazy(() => import('./components/AuthPage'));
const App = lazy(() => import('./App'));
const PayPalPage = lazy(() => import('./components/PayPalPage'));
const PayPalCheckout = lazy(() => import('./components/PayPalCheckout'));
const Contact = lazy(() => import('./components/Contact'));
const Privacy = lazy(() => import('./components/Privacy'));
const Terms = lazy(() => import('./components/Terms'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const AdminAuthPage = lazy(() => import('./components/AdminAuthPage'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const Documentation = lazy(() => import('./components/Documentation'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const StatusPage = lazy(() => import('./components/StatusPage'));
const ScrapingDashboard = lazy(() => import('./components/ScrapingDashboard'));
const ReviewsPage = lazy(() => import('./components/ReviewsPage'));
const About = lazy(() => import('./components/About'));
const NotFound = lazy(() => import('./components/NotFound'));
const Feedback = lazy(() => import('./components/Feedback'));
const NewDashboard = lazy(() => import('./components/NewDashboard'));
const AcceptInvite = lazy(() => import('./components/AcceptInvite'));
const Profile = lazy(() => import('./components/Profile'));


// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-b from-brand-primary via-brand-secondary to-brand-primary flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
      <p className="text-white">Loading...</p>
    </div>
  </div>
);


const App1Routes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [submittedDomain, setSubmittedDomain] = useState<string>('example.com');
  const [installationRequests, setInstallationRequests] = useState<InstallationRequest[]>([]);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  const handleNavigate = (route: string) => {
    console.log('App1: handleNavigate called with route:', route);
    setIsNavigating(true);
    navigate(route);
    // Reset navigation state after a short delay to allow for route transition
    setTimeout(() => setIsNavigating(false), 500);
  };

  const handleDomainSubmit = (domain: string) => {
    // Navigate to getting-started page for sign in
    navigate('/getting-started');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/getting-started');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still navigate to getting-started page
      navigate('/getting-started');
    }
  };

  const handleReset = () => {
    setSubmittedDomain('example.com');
  };

  const handleGoToAdmin = () => {
    // Dummy
  };

  const handleAddHelpRequest = (domain: string) => {
    const newRequest: InstallationRequest = {
      id: Date.now() + Math.random(),
      domain,
      requestedAt: new Date(),
      status: 'Pending',
    };
    setInstallationRequests(prev => [newRequest, ...prev]);
  };

  const handleUpdateRequestStatus = (id: number, status: 'Pending' | 'In Progress' | 'Completed') => {
    setInstallationRequests(prev => prev.map(req =>
      req.id === id ? { ...req, status, updatedAt: new Date() } : req
    ));
  };

  const handleExitAdminView = () => {
    navigate('/dashboard');
  };

  const handleSubscribe = () => {
    navigate('/subscribe');
  };

  // Check if trial is expired and show modal
  useEffect(() => {
    if (user && user.days_remaining <= 0) {
      setShowTrialExpiredModal(true);
    } else {
      setShowTrialExpiredModal(false);
    }
  }, [user?.days_remaining]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      {isNavigating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-accent"></div>
            <span className="text-gray-700">Navigating...</span>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<HomePage onNavigate={handleNavigate} onDomainSubmit={handleDomainSubmit} />} />
        <Route path="/getting-started" element={<AuthPage onNavigate={handleNavigate} />} />
        <Route path="/admin-auth" element={<AdminAuthPage onNavigate={handleNavigate} />} />

        <Route path="/welcome-portal" element={
          <App onNavigate={handleNavigate} onSignOut={handleSignOut} />
        } />
        <Route path="/contact" element={<Contact onNavigate={handleNavigate} />} />
        <Route path="/privacy" element={<Privacy onNavigate={handleNavigate} />} />
        <Route path="/terms" element={<Terms onNavigate={handleNavigate} />} />
        <Route path="/dashboard" element={
          <Dashboard domain={submittedDomain} onReset={handleReset} onGoToAdmin={handleGoToAdmin} onAddHelpRequest={handleAddHelpRequest} onSignOut={handleSignOut} onDomainChange={(newDomain: string) => setSubmittedDomain(newDomain)} onNavigate={handleNavigate} />
        } />
        <Route path="/user-profile" element={<UserProfile />} />
        <Route path="/subscribe" element={<PayPalPage />} />
        <Route path="/checkout" element={<PayPalCheckout plan="premium" />} />
        <Route path="/robots.txt" element={<Robots />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/new-dashboard" element={<NewDashboard />} />
        <Route path="/settings" element={<Profile />} />
        <Route path="/team/invite/accept" element={<AcceptInvite />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/OpenSource" element={<ScrapingDashboard onNavigate={handleNavigate} />} />
        <Route path="/employeeSpace" element={
           (
            <AdminAuthPage onNavigate={handleNavigate} />
          )
        } />
        <Route path="/data-dashboard" element={<AdminAuthPage redirectTo="/data-dashboard" />} />
        <Route path="/data-dashboard-auth" element={<AdminAuthPage redirectTo="/data-dashboard" />} />
        <Route path="/data-dashboard-protected" element={<DataDashboard />} />
        <Route path="/reviews" element={<ReviewsPage onNavigate={handleNavigate} />} />
        <Route path="/about" element={<About onNavigate={handleNavigate} />} />
  <Route path="*" element={<NotFound />} />
  <Route path="/feedback" element={<Feedback />} />
      </Routes>

      {/* Trial Expired Modal */}
      {showTrialExpiredModal && (
        <TrialExpiredModal
          isOpen={showTrialExpiredModal}
          onClose={() => setShowTrialExpiredModal(false)}
          onSubscribe={handleSubscribe}
          daysRemaining={user?.days_remaining || 0}
          plan={user?.plan || 'free'}
        />
      )}
    </Suspense>
  );
};

const App1: React.FC = () => {
  return (
    <BrowserRouter>
      <NavigationProvider>
        {/* Include structured data for SEO */}
        <Robots />
        <App1Routes />
      </NavigationProvider>
    </BrowserRouter>
  );
};

export default App1;
