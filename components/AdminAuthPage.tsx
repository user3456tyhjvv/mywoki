import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';

interface AdminAuthPageProps {
  onNavigate?: (route: string) => void;
  redirectTo?: string;
}

const AdminAuthPage: React.FC<AdminAuthPageProps> = ({ onNavigate, redirectTo }) => {
  const navigate = useNavigate();
  const { adminSignIn, adminLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await adminSignIn(email, password);
      if (redirectTo) {
        if (onNavigate) {
          onNavigate(redirectTo);
        } else {
          navigate(redirectTo);
        }
      } else {
        navigate('/data-dashboard-protected');
      }
    } catch (err: any)      {
      setError(err.message || 'Invalid admin credentials');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => onNavigate ? onNavigate('/') : navigate('/')}
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
          <p className="text-slate-300">Access the admin dashboard</p>
        </div>

        {/* Auth Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="admin@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div role="alert" className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={adminLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              {adminLoading ? 'Signing In...' : 'Sign In as Admin'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-slate-400 text-sm">
            Admin access only. Contact support if you need assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthPage;