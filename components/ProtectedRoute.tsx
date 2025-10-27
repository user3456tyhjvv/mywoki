import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import TrialExpiredModal from './TrialExpiredModal';
import { ChartBarIcon } from './Icons';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, authTimeout } = useAuth();
  const { resolvedTheme } = useTheme();
  const [showLoading, setShowLoading] = useState(true);

  // Show loading spinner only after a brief delay to prevent flickering
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [loading]);

  // Hide loading when auth is done
  useEffect(() => {
    if (!loading) {
      setShowLoading(false);
    }
  }, [loading]);

  // Force stop loading after 10 seconds to prevent infinite loading
  useEffect(() => {
    const forceStopTimer = setTimeout(() => {
      if (loading) {
        console.warn('ProtectedRoute: Force stopping loading after 10 seconds');
        setShowLoading(false);
      }
    }, 10000);

    return () => clearTimeout(forceStopTimer);
  }, [loading]);

  // Immediate redirect if no user and not loading
  useEffect(() => {
    if (!loading && !user) {
      console.log('🔄 No user found, redirecting to auth...');
      // Use window.location for a clean redirect that works with React Router
      window.location.href = '/getting-started';
    }
  }, [loading, user]);

  // Show loading state
  if (loading || showLoading) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'theme-bg-gradient'} flex items-center justify-center ${resolvedTheme === 'dark' ? 'text-white' : 'theme-text-primary'} font-sans`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <ChartBarIcon className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold mb-2">Loading Your Dashboard</p>
            <p className={`${resolvedTheme === 'dark' ? 'text-slate-400' : 'theme-text-secondary'} text-sm`}>
              {authTimeout ? 'Connection timeout - retrying...' : 'Checking authentication...'}
            </p>
            {authTimeout && (
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show trial expired modal only for free plan users with expired trial
  if (user && user.days_remaining <= 0) {
    return (
      <TrialExpiredModal
        isOpen={true}
        userId={user.id}
        onClose={() => {
          // Allow users to close the modal temporarily, but it will show again on refresh
          console.log('Trial expired modal closed by user');
        }}
        onSubscribe={() => {
          window.location.href = '/subscribe';
        }}
      />
    );
  }

  // Render children if user exists and trial is valid
  return <>{children}</>;
};

export default ProtectedRoute;
