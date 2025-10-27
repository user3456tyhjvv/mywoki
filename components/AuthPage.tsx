// AuthPage.tsx — Redesigned, functionality preserved
'use client';
import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheckIcon } from './Icons';
import Footer from './Footer';
import TrialExpiredModal from './TrialExpiredModal';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface AuthPageProps {
  onNavigate: (route: string) => void;
}

/* -----------------------
   Small UI helpers
   ----------------------- */

// Star rating display (readonly)
function StarRating({ value }: { value: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < value);
  return (
    <div className="flex gap-1">
      {stars.map((on, idx) => (
        <svg key={idx} className={`w-4 h-4 ${on ? 'text-cyan-400' : 'text-slate-600'}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.369 2.448a1 1 0 00-.364 1.118l1.286 3.96c.3.921-.755 1.688-1.54 1.118l-3.368-2.447a1 1 0 00-1.176 0L5.21 17.95c-.784.57-1.84-.197-1.54-1.118l1.286-3.96a1 1 0 00-.364-1.118L1.223 8.207c-.784-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.96z" />
        </svg>
      ))}
    </div>
  );
}

// Small sparkline chart using recharts
function SparklineChart({ data }: { data: Array<{ x: string; y: number }> }) {
  return (
    <div className="w-full h-28">
      <ResponsiveContainer>
        <LineChart data={data}>
          <Line type="monotone" dataKey="y" stroke="#38e2ff" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ReviewCard({ name, rating, message, date }: { name: string; rating: number; message: string; date?: string }) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-800/20 border border-slate-700 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold text-white">{name}</div>
          <div className="text-xs text-slate-400">{date ? new Date(date).toLocaleDateString() : ''}</div>
        </div>
        <div><StarRating value={rating} /></div>
      </div>
      <p className="text-slate-200 mt-3 text-sm leading-relaxed">{message}</p>
    </div>
  );
}

function ReviewsCarousel({ reviews }: { reviews: Array<any> }) {
  // simple horizontal scroll with arrows
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!containerRef.current) return;
    const amount = containerRef.current.clientWidth * 0.9;
    containerRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="relative">
        <div ref={containerRef} className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          {reviews.map((r: any) => (
            <div key={r.id} className="min-w-[260px] flex-shrink-0">
              <ReviewCard name={r.name} rating={r.rating} message={r.message.length > 180 ? `${r.message.slice(0, 180)}…` : r.message} date={r.created_at} />
            </div>
          ))}
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          <button onClick={() => scroll('left')} aria-label="Scroll left" className="p-2 rounded-md bg-slate-800/60 hover:bg-slate-800/80">
            ‹
          </button>
          <button onClick={() => scroll('right')} aria-label="Scroll right" className="p-2 rounded-md bg-slate-800/60 hover:bg-slate-800/80">
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

/* -----------------------
   Main AuthPage (redesigned)
   ----------------------- */

const AuthPage: React.FC<AuthPageProps> = memo(({ onNavigate }) => {
  const {
    user,
    authTimeout,
    isSessionExpired,
    authError,
    loading,
    isFreshSignIn, // flag from AuthContext
    clearFreshSignIn // clears flag
  } = useAuth();

  // preserve existing state shape and logic
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot-password'>('signin');
  const [authFormData, setAuthFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authErrorState, setAuthErrorState] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasRedirected, setHasRedirected] = useState(false);

  // marketing & reviews state
  const [reviews, setReviews] = useState<Array<any>>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => { /* nothing - kept for parity with homepage look */ };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect logic retained, using isFreshSignIn to detect fresh sign-in and preserve existing behavior
  useEffect(() => {
    if (user && isFreshSignIn && !hasRedirected && !loading) {
      setHasRedirected(true);
      let targetRoute = '/welcome-portal';

      if (user.plan === 'free' && user.is_trial_expired) {
        targetRoute = '/subscribe';
      }

      clearFreshSignIn();
      onNavigate(targetRoute);
    }
  }, [user, isFreshSignIn, hasRedirected, loading, clearFreshSignIn, onNavigate]);

  // fetch reviews (approved)
  async function fetchReviews() {
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setLoadingReviews(false);
    }
  }

  /* -------------------------
     Validation & handlers (kept largely as you provided)
     ------------------------- */

  const validationRules = useMemo(() => ({
    name: (value: string) => !value.trim() ? 'Please enter your full name.' : '',
    email: (value: string) => {
      if (!value.trim()) return 'Please enter your email address.';
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(value)) return 'Please enter a valid email address.';
      return '';
    },
    password: (value: string, mode: string) => {
      if ((mode === 'signin' || mode === 'signup') && !value) return 'Please enter your password.';
      if (mode === 'signup' && value.length < 6) return 'Password must be at least 6 characters.';
      return '';
    },
    confirmPassword: (value: string, password: string) => {
      if (value !== password) return 'Passwords do not match.';
      return '';
    }
  }), []);

  const handleAuthFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAuthFormData(prev => ({ ...prev, [name]: value }));
    if (authErrorState || successMessage) {
      setAuthErrorState('');
      setSuccessMessage('');
    }
  }, [authErrorState, successMessage]);

  const errorMappings = useMemo(() => new Map([
    ['Invalid login credentials', 'Invalid email or password. Please try again.'],
    ['Email not confirmed', 'Please check your email to confirm your account before signing in.'],
    ['User already registered', 'An account with this email already exists. Please sign in instead.'],
    ['Password should be at least', 'Password must be at least 6 characters long.'],
    ['rate limit', 'Too many attempts. Please try again in a few minutes.'],
    ['fetch failed', 'Network error. Please check your internet connection.'],
    ['Failed to fetch', 'Network error. Please check your internet connection.'],
    ['timeout', 'Request timeout. Please try again.']
  ]), []);

  const handleError = useCallback((error: unknown, defaultMessage: string = 'An unexpected error occurred') => {
    let errorMessage = defaultMessage;
    if (error instanceof Error) errorMessage = error.message;
    else if (typeof error === 'string') errorMessage = error;
    for (const [key, msg] of errorMappings) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        errorMessage = msg;
        break;
      }
    }
    setAuthErrorState(errorMessage);
  }, [errorMappings]);

  const clearMessages = useCallback(() => {
    setAuthErrorState('');
    setSuccessMessage('');
  }, []);

  const validateForm = useCallback((): boolean => {
    clearMessages();
    if (authMode === 'signup') {
      const nameError = validationRules.name(authFormData.name);
      if (nameError) { setAuthErrorState(nameError); return false; }
      const confirmError = validationRules.confirmPassword(authFormData.confirmPassword, authFormData.password);
      if (confirmError) { setAuthErrorState(confirmError); return false; }
    }
    const emailError = validationRules.email(authFormData.email);
    if (emailError) { setAuthErrorState(emailError); return false; }
    const passwordError = validationRules.password(authFormData.password, authMode);
    if (passwordError) { setAuthErrorState(passwordError); return false; }
    return true;
  }, [authMode, authFormData, validationRules, clearMessages]);

  const handleAuthSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setAuthLoading(true);
    clearMessages();
    setHasRedirected(false);

    try {
      const email = authFormData.email.trim().toLowerCase();

      if (authMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: authFormData.password });
        if (error) throw error;
        if (data.user) setSuccessMessage('Successfully signed in! Redirecting...');
      } else if (authMode === 'signup') {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email,
          password: authFormData.password,
          options: {
            data: {
              name: authFormData.name.trim(),
              plan: 'free',
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            }
          }
        });
        if (authErr) throw authErr;
        if (authData.user) {
          // upsert profile (non-blocking)
          try {
            await supabase.from('profiles').upsert([{
              id: authData.user.id,
              name: authFormData.name.trim(),
              email,
              plan: 'free',
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }], { onConflict: 'id' });
          } catch (profileErr) {
            console.error('Profile upsert error', profileErr);
          }
          if (!authData.session) setSuccessMessage('Please check your email to confirm your account. You can sign in after confirmation.');
          else setSuccessMessage('Account created successfully! Redirecting...');
        }
      } else if (authMode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(authFormData.email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSuccessMessage('Password reset email sent. Please check your inbox.');
      }
    } catch (err: any) {
      console.error('Auth error', err);
      handleError(err, 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  }, [authMode, authFormData, validateForm, clearMessages, handleError]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      clearMessages();
      setAuthLoading(true);
      setHasRedirected(false);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: { access_type: 'offline', prompt: 'consent' }
        }
      });
      if (error) throw error;
    } catch (err) {
      handleError(err, 'Failed to sign in with Google');
      setAuthLoading(false);
    }
  }, [clearMessages, handleError]);

  const handleModeChange = useCallback((mode: 'signin' | 'signup' | 'forgot-password') => {
    setAuthMode(mode);
    clearMessages();
    setHasRedirected(false);
    setAuthFormData({ name: '', email: '', password: '', confirmPassword: '' });
  }, [clearMessages]);

  const formConfig = useMemo(() => ({
    title: { signin: 'Welcome Back', signup: 'Create Your Account', 'forgot-password': 'Reset Password' }[authMode],
    subtitle: { signin: 'Sign in to access your dashboard', signup: 'Join thousands growing with insights', 'forgot-password': 'Enter the email to reset your password' }[authMode],
    buttonText: { signin: 'Sign In', signup: 'Sign Up', 'forgot-password': 'Send Reset Email' }[authMode]
  }), [authMode]);

  // styled input field wrapper (preserve behavior)
  const InputField = useCallback(({ type, name, value, placeholder, required, disabled, autoComplete }: {
    type: string; name: string; value: string; placeholder: string; required?: boolean; disabled?: boolean; autoComplete?: string;
  }) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="relative">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={handleAuthFormChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-10 rounded-lg bg-white/6 border border-white/10 text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all duration-200"
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            {showPassword ? '👁️' : '🔒'}
          </button>
        )}
      </div>
    );
  }, [handleAuthFormChange]);

  /* -------------------------
     Marketing mock data for the sparkline
     ------------------------- */
  const sparklineData = [
    { x: '1', y: 120 },
    { x: '2', y: 180 },
    { x: '3', y: 140 },
    { x: '4', y: 220 },
    { x: '5', y: 200 },
    { x: '6', y: 260 },
    { x: '7', y: 300 }
  ];

  /* -------------------------
     Layout markup (split)
     ------------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
      {/* Top nav simplified */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5">
              <img src="/mywoki-logo.png" alt="mywoki logo" className="w-9 h-9 rounded-full" />
            </div>
          <div>
            <div className="font-semibold">mywoki</div>
            <div className="text-xs text-slate-400">Data-edge</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <button onClick={() => onNavigate('/')} className="text-slate-300 hover:text-white">Home</button>
          <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="px-3 py-2 rounded-md bg-white/6 hover:bg-white/8">Start Free Trial</button>
        </div>
      </div>

      {/* Main split */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 pb-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        {/* Left: marketing */}
        <aside className="md:col-span-7 lg:col-span-8 relative rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-900/30 border border-slate-700 p-8 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-gradient-to-tr from-cyan-400 to-transparent mix-blend-screen pointer-events-none" />

          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Modern analytics that respect your users — <span className="text-cyan-300">privacy-first</span>.
            </h1>
            <p className="text-slate-300 mb-6 text-lg">AI-prioritized actions, conversion insights, and real-time reporting — designed for founders and growth teams.</p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-cyan-400/10 flex items-center justify-center text-cyan-300">✓</div>
                <div>
                  <div className="font-semibold">No invasive tracking</div>
                  <div className="text-slate-400 text-sm">GDPR-friendly analytics.</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-cyan-400/10 flex items-center justify-center text-cyan-300">✓</div>
                <div>
                  <div className="font-semibold">Actionable AI tips</div>
                  <div className="text-slate-400 text-sm">Fix your highest-impact issues first.</div>
                </div>
              </li>
            </ul>

            {/* Sparkline */}
            <div className="mb-6">
              <div className="text-sm text-slate-400 mb-2">Conversion growth (sample)</div>
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700">
                <SparklineChart data={sparklineData} />
              </div>
            </div>

            {/* Reviews carousel */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Loved by teams</h3>
                <div className="text-sm text-slate-400">{reviews.length} reviews</div>
              </div>

              {loadingReviews ? (
                <div className="text-slate-400">Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="text-slate-400">No reviews yet — be the first!</div>
              ) : (
                <ReviewsCarousel reviews={reviews} />
              )}
            </div>

            {/* Social proof small */}
            <div className="mt-8 flex items-center gap-4 text-sm">
              <div className="text-slate-300">Join 10,000+ sites using Mywoki</div>
              <div className="text-slate-500">•</div>
              <div className="text-slate-300">30-day money back</div>
            </div>
          </div>

          {/* subtle decorative element bottom-right */}
          <div className="absolute right-6 bottom-6 w-36 h-28 rounded-lg bg-gradient-to-tr from-cyan-300/10 to-transparent blur-lg pointer-events-none" />
        </aside>

        {/* Right: auth card */}
        <div className="md:col-span-5 lg:col-span-4 flex items-center">
          <div className="w-full bg-white/6 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/8">
            <div className="text-center mb-6">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5">
              <img src="/mywoki-logo.png" alt="mywoki logo" className="w-9 h-9 rounded-full" />
            </div>
              <h2 className="text-2xl font-bold">{formConfig.title}</h2>
              <p className="text-slate-300 mt-1">{formConfig.subtitle}</p>
            </div>

            {/* context error messages */}
            {authError && !authErrorState && (
              <div className="bg-rose-900/40 border border-rose-700 text-rose-200 px-4 py-2 rounded-md mb-4">
                {authError}
              </div>
            )}
            {authErrorState && (
              <div className="bg-rose-900/40 border border-rose-700 text-rose-200 px-4 py-2 rounded-md mb-4">
                {authErrorState}
              </div>
            )}
            {successMessage && (
              <div className="bg-emerald-900/40 border border-emerald-700 text-emerald-200 px-4 py-2 rounded-md mb-4">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 ">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                  <InputField type="text" name="name" value={authFormData.name} placeholder="Enter your full name" required disabled={authLoading} autoComplete="name" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                <InputField type="email" name="email" value={authFormData.email} placeholder="Enter your email address" required disabled={authLoading} autoComplete="email" />
              </div>
              {authMode !== 'forgot-password' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                  <InputField type="password" name="password" value={authFormData.password} placeholder="Enter your password" required disabled={authLoading} autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} />
                </div>
              )}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                  <InputField type="password" name="confirmPassword" value={authFormData.confirmPassword} placeholder="Confirm your password" required disabled={authLoading} autoComplete="new-password" />
                </div>
              )}

              <button type="submit" disabled={authLoading} className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-900 font-semibold shadow-md hover:brightness-105 transition-all">
                {authLoading ? 'Processing…' : formConfig.buttonText}
              </button>
            </form>

            {/* social sign-in */}
            <div className="mt-4">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative text-center">
                  <span className="px-2 bg-transparent text-slate-400 text-sm">Or continue with</span>
                </div>
              </div>

              <button onClick={handleGoogleSignIn} disabled={authLoading} className="w-full py-2 rounded-lg bg-white text-gray-800 font-semibold hover:bg-gray-100 transition-all flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="mt-4 text-center text-sm space-y-2">
              {authMode === 'signin' ? (
                <>
                  <button onClick={() => handleModeChange('signup')} className="text-cyan-300 hover:underline">Create account</button>
                  <button onClick={() => handleModeChange('forgot-password')} className="text-slate-400 hover:underline">Forgot password?</button>
                </>
              ) : authMode === 'signup' ? (
                <button onClick={() => handleModeChange('signin')} className="text-cyan-300 hover:underline">Already have an account? Sign in</button>
              ) : (
                <button onClick={() => handleModeChange('signin')} className="text-cyan-300 hover:underline">Back to sign in</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Trial expired modal preserved */}
      {user && user.days_remaining <= 0 && !['starter', 'pro', 'business'].includes((user.plan || '').toLowerCase()) && (
        <TrialExpiredModal
          isOpen={true}
          onClose={() => {}}
          daysRemaining={user.days_remaining || 0}
          onSubscribe={() => onNavigate('/subscribe')}
          plan={user.plan || 'free'}
        />
      )}

      {/* Session/Timeout modal */}
      {(authTimeout || isSessionExpired) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white/6 p-6 rounded-lg max-w-md border border-white/10">
            <h3 className="text-lg font-semibold text-white">{isSessionExpired ? 'Session Expired' : 'Connection Timeout'}</h3>
            <p className="text-slate-300 mt-2">{isSessionExpired ? 'Your session expired — please sign in again.' : 'Connection timed out — check your internet.'}</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-md bg-cyan-400 text-slate-900 font-semibold">Reload</button>
              <button onClick={() => { /* no-op or implement retry */ }} className="px-4 py-2 rounded-md border border-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AuthPage.displayName = 'AuthPage';
export default AuthPage;
