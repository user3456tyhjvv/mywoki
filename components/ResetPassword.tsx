import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { ShieldCheckIcon, ArrowLeftIcon, EyeIcon, EyeOffIcon } from './Icons';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check if we have a valid session from the URL hash
    const checkSession = async () => {
      try {
        // Parse the hash fragment for authentication tokens
        const hash = location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (accessToken && refreshToken && type === 'recovery') {
          // Set the session with the tokens from the URL
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError('Invalid or expired reset link. Please request a new password reset.');
            return;
          }

          setIsValidSession(true);
        } else {
          setError('Invalid reset link. Please request a new password reset.');
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setError('An error occurred. Please try again.');
      }
    };

    checkSession();
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        setError(updateError.message || 'Failed to update password. Please try again.');
        return;
      }

      setSuccess(true);

      // Redirect to auth page after a short delay
      setTimeout(() => {
        navigate('/auth');
      }, 3000);

    } catch (err) {
      console.error('Error updating password:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidSession && !error) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'theme-bg-gradient'} flex items-center justify-center ${resolvedTheme === 'dark' ? 'text-white' : 'theme-text-primary'} font-sans p-4`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <ShieldCheckIcon className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold mb-2">Verifying Reset Link</p>
            <p className={`${resolvedTheme === 'dark' ? 'text-slate-400' : 'theme-text-secondary'}`}>Please wait while we validate your reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'theme-bg-gradient'} flex items-center justify-center ${resolvedTheme === 'dark' ? 'text-white' : 'theme-text-primary'} font-sans p-4`}>
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Reset Link Invalid</h2>
          <p className={`mb-6 ${resolvedTheme === 'dark' ? 'text-slate-300' : 'theme-text-secondary'}`}>{error}</p>
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 mx-auto"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'theme-bg-gradient'} flex items-center justify-center ${resolvedTheme === 'dark' ? 'text-white' : 'theme-text-primary'} font-sans p-4`}>
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4">Password Updated Successfully!</h2>
          <p className={`mb-6 ${resolvedTheme === 'dark' ? 'text-slate-300' : 'theme-text-secondary'}`}>
            Your password has been changed. You will be redirected to the sign-in page shortly.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 mx-auto"
          >
            Continue to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${resolvedTheme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'theme-bg-gradient'} flex items-center justify-center ${resolvedTheme === 'dark' ? 'text-white' : 'theme-text-primary'} font-sans p-4`}>
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 rounded-2xl p-8 shadow-2xl backdrop-blur-sm border border-slate-700">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Reset Your Password</h1>
            <p className="text-slate-400">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all duration-200 pr-12"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all duration-200 pr-12"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/auth')}
              className="text-slate-400 hover:text-slate-300 text-sm flex items-center gap-1 mx-auto"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
