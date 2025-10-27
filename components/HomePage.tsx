// HomePage.tsx
import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  ChartBarIcon,
  SparklesIcon,
  ShieldCheckIcon,
  UsersIcon,
  EnvelopeIcon,
  TrendingUpIcon,
  FacebookIcon,
  LinkedInIcon,
  InstagramIcon,
  PaletteIcon,
  MyWokiLogo,
  OutreachIcon
} from './Icons';
import { Link } from 'react-router-dom';

interface PricingPlan {
  name: string;
  price: string;
  monthlyPrice: number;
  pageviews: string;
  features: string[];
  cta: string;
  popular: boolean;
  trial?: boolean;
}

interface Review {
  id: number;
  name: string;
  message: string;
  rating: number;
  image_url: string;
  created_at: string;
  approved: boolean | null;
}

interface HomePageProps {
  onNavigate: (route: string) => void;
  onDomainSubmit: (domain: string) => void;
}

interface UserPlanInfo {
  plan: string;
  trial_ends_at: string | null;
  subscription_id: string | null;
  days_remaining: number;
  is_trial_expired: boolean;
}

const pricingPlans: Record<string, PricingPlan> = {
  free: {
    name: 'Free',
    price: '$0',
    monthlyPrice: 0,
    pageviews: '1,000/month',
    features: ['Basic visitor analytics', '7-day data retention', 'Real-time dashboard', 'Top pages & referrers'],
    cta: 'Get Started',
    popular: false
  },
  starter: {
    name: 'Starter',
    price: '$9',
    monthlyPrice: 9,
    pageviews: '10,000/month',
    features: ['Everything in Free', '30-day data retention', 'Email reports', 'Goal tracking', 'Custom events'],
    cta: 'Start Free Trial',
    popular: false,
    trial: true
  },
  pro: {
    name: 'Pro',
    price: '$19',
    monthlyPrice: 19,
    pageviews: '50,000/month',
    features: ['Everything in Starter', '6-month data retention', 'Advanced filters',  'White-label reports', 'Priority support'],
    cta: 'Start Free Trial',
    popular: true,
    trial: true
  },
  business: {
    name: 'Business',
    price: '$49',
    monthlyPrice: 49,
    pageviews: '200,000/month',
    features: ['Everything in Pro', '1-year data retention', 'Unlimited organizations', 'Custom template designs', 'SAML/SSO', 'Dedicated support'],
    cta: 'Start Free Trial',
    popular: false,
    trial: true
  }
};

export default function HomePage({ onNavigate, onDomainSubmit }: HomePageProps) {
  const { user, signOut } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [message, setMessage] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [userPlanInfo, setUserPlanInfo] = useState<UserPlanInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  const screenshotUrls = [
    'https://i.postimg.cc/4y1NDM8H/Screenshot-2025-10-21-at-23-12-01-Your-Space-Analytics-AI-Powered-Web-Analytics-Traffic-Growth-Plat.png',
    'https://i.postimg.cc/PxbCHKK5/Screenshot-2025-10-22-at-01-15-05-Your-Space-Analytics-AI-Powered-Web-Analytics-Traffic-Growth-Plat.png',
    'https://i.postimg.cc/28z5Qk6v/Screenshot-2025-10-21-at-23-12-29-Your-Space-Analytics-AI-Powered-Web-Analytics-Traffic-Growth-Plat.png',
    'https://i.postimg.cc/5NxtB40C/Screenshot-2025-10-21-at-23-14-01-Your-Space-Analytics-AI-Powered-Web-Analytics-Traffic-Growth-Plat.png',
    'https://i.postimg.cc/159zGmtw/Screenshot-2025-10-21-at-23-15-00-Your-Space-Analytics-AI-Powered-Web-Analytics-Traffic-Growth-Plat.png',
    'https://i.postimg.cc/8Ptzw2JB/Screenshot-2025-10-21-at-23-16-50-Your-Space-Analytics-AI-Powered-Web-Analytics-Traffic-Growth-Plat.png',
    'https://i.postimg.cc/MpLKJ1Y1/Screenshot-2025-10-21-at-23-17-24-Your-Space-Analytics-AI-Powered-Web-Analytics-Traffic-Growth-Plat.png',
    'https://i.postimg.cc/FKJFr1PP/Screenshot-2025-10-21-at-23-17-40-Your-Space-Analytics-AI-Powered-Web-Analytics-Traffic-Growth-Plat.png',
    'https://i.postimg.cc/6QG6WTjK/Screenshot-2025-10-21-at-23-28-19-Your-Space-Analytics-AI-Powered-Web-Analytics-Traffic-Growth-Plat.png'
  ];

  const totalImages = screenshotUrls.length;
  const angleStep = 360 / totalImages;
  const radius = 200;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    fetchReviews();
    if (user) {
      fetchUserPlanInfo();
    } else {
      // Reset userPlanInfo when user logs out or changes
      setUserPlanInfo(null);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [user]);

  // Mobile detection and warning
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShowMobileWarning(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  /* -------------------------
     Calculate trial info from database
     ------------------------- */
  const calculateTrialInfo = (trialEndsAt: string | null): { days_remaining: number; is_trial_expired: boolean } => {
    if (!trialEndsAt) {
      return { days_remaining: 0, is_trial_expired: true };
    }

    const trialEnd = new Date(trialEndsAt);
    const now = new Date();
    const timeDiff = trialEnd.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return {
      days_remaining: Math.max(0, daysRemaining),
      is_trial_expired: daysRemaining <= 0
    };
  };

  /* -------------------------
     Supabase: fetch user plan info from public.profiles table
     ------------------------- */
  async function fetchUserPlanInfo() {
    if (!user) return;

    console.log('Fetching user plan info for user:', user.id);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan, trial_ends_at, subscription_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data) {
        console.log('Data received from profiles:', data);
        const trialInfo = calculateTrialInfo(data.trial_ends_at);
        console.log('Calculated trial info:', trialInfo);
        const planInfo = {
          plan: (data.plan || 'free').toLowerCase(),
          trial_ends_at: data.trial_ends_at,
          subscription_id: data.subscription_id,
          ...trialInfo
        };
        console.log('Setting userPlanInfo:', planInfo);
        setUserPlanInfo(planInfo);
      } else {
        console.log('No data found in profiles, setting default free plan');
        const defaultPlanInfo = {
          plan: 'free',
          trial_ends_at: null,
          subscription_id: null,
          days_remaining: 0,
          is_trial_expired: true
        };
        setUserPlanInfo(defaultPlanInfo);
      }
    } catch (err: any) {
      console.error('Failed to fetch user plan info:', err.message || err);
      console.log('Setting default free plan due to error');
      const defaultPlanInfo = {
        plan: 'free',
        trial_ends_at: null,
        subscription_id: null,
        days_remaining: 0,
        is_trial_expired: true
      };
      setUserPlanInfo(defaultPlanInfo);
    }
  }

  /* -------------------------
     Fetch all reviews
     ------------------------- */
  async function fetchReviews() {
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReviews(data || []);
    } catch (err: any) {
      console.error('Failed to load reviews', err.message || err);
    } finally {
      setLoadingReviews(false);
    }
  }

  const handlePlanSelect = (plan: string) => setSelectedPlan(plan);

  const navigateToSignup = (plan?: string) => {
    if (plan) onNavigate(`getting-started?plan=${plan}`);
    else onNavigate('getting-started');
  };

  const handleDomainSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!domain.trim()) {
      setError('Please enter a valid domain.');
      return;
    }
    try {
      const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
      onNavigate('getting-started');
      setError('');
    } catch (_) {
      setError('Invalid domain format. Please enter a valid domain (e.g., example.com).');
    }
  };

  /* -------------------------
     COMPLETE PLAN CHECKING LOGIC
     ------------------------- */

  /* -------------------------
     Get button state for pricing cards - COMPLETE VERSION
     ------------------------- */
  const getPlanButtonState = (planKey: string) => {
    const plan = pricingPlans[planKey];
    
    console.log(`🔍 getPlanButtonState called for: ${planKey}`, {
      user: !!user,
      userPlanInfo: userPlanInfo,
      currentUserPlan: userPlanInfo?.plan,
      isCurrentPlan: userPlanInfo?.plan === planKey
    });

    // CASE 1: No user (logged out) - show default CTA
    if (!user) {
      return {
        text: plan.cta,
        className: plan.popular ? 'bg-cyan-400 text-slate-900 hover:opacity-95' : 'bg-slate-700 text-slate-100 hover:bg-slate-600',
        disabled: false,
        navigateTo: 'auth',
        isCurrent: false
      };
    }

    // CASE 2: User exists but plan info still loading
    if (!userPlanInfo) {
      return {
        text: 'Loading...',
        className: 'bg-slate-600 text-slate-400 cursor-not-allowed',
        disabled: true,
        navigateTo: '',
        isCurrent: false
      };
    }

    const isCurrentPlan = userPlanInfo.plan === planKey;
    const isFreePlan = planKey === 'free';
    const isPaidPlan = ['starter', 'pro', 'business'].includes(planKey);
    const isHigherPlan = getPlanLevel(planKey) > getPlanLevel(userPlanInfo.plan);

    console.log(`📊 Plan comparison for ${planKey}:`, {
      isCurrentPlan,
      isFreePlan,
      isPaidPlan,
      isHigherPlan,
      currentUserPlan: userPlanInfo.plan,
      userDaysRemaining: userPlanInfo.days_remaining,
      userTrialExpired: userPlanInfo.is_trial_expired
    });

    // CASE 3: User is on BUSINESS plan (highest tier)
    if (userPlanInfo.plan === 'business') {
      // For Business card itself
      if (planKey === 'business') {
        return {
          text: 'Subscribed (Business)',
          className: 'bg-green-600 text-white cursor-not-allowed',
          disabled: true,
          navigateTo: '',
          isCurrent: true
        };
      }
      // For all other plans (Free, Starter, Pro)
      return {
        text: 'Subscribed (Business)',
        className: 'bg-green-600 text-white cursor-not-allowed',
        disabled: true,
        navigateTo: '',
        isCurrent: false
      };
    }

    // CASE 4: User is on PRO plan
    if (userPlanInfo.plan === 'pro') {
      // For Pro card itself
      if (planKey === 'pro') {
        return {
          text: 'Subscribed',
          className: 'bg-green-600 text-white cursor-not-allowed',
          disabled: true,
          navigateTo: '',
          isCurrent: true
        };
      }
      // For Business (upgrade)
      if (planKey === 'business') {
        return {
          text: 'Upgrade',
          className: plan.popular ? 'bg-cyan-400 text-slate-900 hover:opacity-95' : 'bg-slate-700 text-slate-100 hover:bg-slate-600',
          disabled: false,
          navigateTo: 'subscribe',
          isCurrent: false
        };
      }
      // For Starter and Free (downgrade - disabled by default)
      return {
        text: 'Downgrade',
        className: 'bg-slate-600 text-slate-400 cursor-not-allowed',
        disabled: true,
        navigateTo: '',
        isCurrent: false
      };
    }

    // CASE 5: User is on STARTER plan
    if (userPlanInfo.plan === 'starter') {
      // For Starter card itself
      if (planKey === 'starter') {
        return {
          text: 'Subscribed',
          className: 'bg-green-600 text-white cursor-not-allowed',
          disabled: true,
          navigateTo: '',
          isCurrent: true
        };
      }
      // For Pro and Business (upgrade)
      if (planKey === 'pro' || planKey === 'business') {
        return {
          text: 'Upgrade',
          className: plan.popular ? 'bg-cyan-400 text-slate-900 hover:opacity-95' : 'bg-slate-700 text-slate-100 hover:bg-slate-600',
          disabled: false,
          navigateTo: 'subscribe',
          isCurrent: false
        };
      }
      // For Free (downgrade)
      if (planKey === 'free') {
        return {
          text: 'Downgrade',
          className: 'bg-slate-600 text-slate-400 cursor-not-allowed',
          disabled: true, // Set to false if you allow downgrades
          navigateTo: '', // Set to 'subscribe' if you handle downgrades
          isCurrent: false
        };
      }
    }

    // CASE 6: User is on FREE plan
    if (userPlanInfo.plan === 'free') {
      // For Free card itself
      if (planKey === 'free') {
        // Free plan with active trial
        if (userPlanInfo.days_remaining > 0) {
          return {
            text: `Current Plan (${userPlanInfo.days_remaining}d left)`,
            className: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 cursor-not-allowed',
            disabled: true,
            navigateTo: '',
            isCurrent: true
          };
        }
        // Free plan with expired trial
        if (userPlanInfo.is_trial_expired) {
          return {
            text: 'Upgrade Now',
            className: 'bg-amber-500 text-slate-900 hover:bg-amber-400',
            disabled: false,
            navigateTo: 'subscribe',
            isCurrent: true
          };
        }
        // Default free plan state
        return {
          text: 'Current Plan',
          className: 'bg-slate-600 text-slate-400 cursor-not-allowed',
          disabled: true,
          navigateTo: '',
          isCurrent: true
        };
      }
      
      // For paid plans (Starter, Pro, Business) - show upgrade
      if (isPaidPlan) {
        return {
          text: plan.trial ? 'Start Free Trial' : 'Upgrade',
          className: plan.popular ? 'bg-cyan-400 text-slate-900 hover:opacity-95' : 'bg-slate-700 text-slate-100 hover:bg-slate-600',
          disabled: false,
          navigateTo: 'subscribe',
          isCurrent: false
        };
      }
    }

    // FALLBACK: Should never reach here, but just in case
    console.warn('⚠️ No matching case found for plan:', planKey, 'user plan:', userPlanInfo.plan);
    return {
      text: 'Select Plan',
      className: 'bg-slate-700 text-slate-100 hover:bg-slate-600',
      disabled: false,
      navigateTo: 'auth',
      isCurrent: false
    };
  };

  /* -------------------------
     Helper: Get plan level for comparison
     ------------------------- */
  const getPlanLevel = (plan: string): number => {
    const levels: { [key: string]: number } = {
      'free': 0,
      'starter': 1,
      'pro': 2,
      'business': 3
    };
    return levels[plan] || 0;
  };

  /* -------------------------
     Filter plans based on user state - COMPLETE VERSION
     ------------------------- */
  const getFilteredPlans = () => {
    console.log('🔍 getFilteredPlans called:', {
      user: !!user,
      userPlanInfo: userPlanInfo,
      currentPlan: userPlanInfo?.plan
    });

    // CASE 1: No user - show all plans
    if (!user) {
      console.log('👤 No user, showing all plans');
      return pricingPlans;
    }

    // CASE 2: User exists but plan info loading - show all plans
    if (!userPlanInfo) {
      console.log('⏳ User plan info loading, showing all plans');
      return pricingPlans;
    }

    // CASE 3: User on paid plan (Starter, Pro, Business) - hide free plan
    if (userPlanInfo.plan !== 'free') {
      console.log('💳 User on paid plan, hiding free plan');
      const { free, ...paidPlans } = pricingPlans;
      return paidPlans;
    }

    // CASE 4: User on free plan - show all plans
    console.log('🆓 User on free plan, showing all plans');
    return pricingPlans;
  };

  /* -------------------------
     Get user status message - COMPLETE VERSION
     ------------------------- */
  const getUserStatusMessage = () => {
    if (!user || !userPlanInfo) {
      console.log('👤 No user or plan info for status message');
      return null;
    }

    console.log('📢 Generating status message for plan:', userPlanInfo.plan);

    if (userPlanInfo.plan === 'free') {
      if (userPlanInfo.days_remaining > 0) {
        return {
          message: `You're on a free trial! ${userPlanInfo.days_remaining} days remaining.`,
          type: 'info',
          className: 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
        };
      } else if (userPlanInfo.is_trial_expired) {
        return {
          message: ' Your free trial has ended. Upgrade to continue using premium features.',
          type: 'warning', 
          className: 'bg-amber-500/20 border border-amber-400 text-amber-300'
        };
      } else {
        return {
          message: ' You are on the Free plan. Upgrade to unlock premium features.',
          type: 'info',
          className: 'bg-slate-500/20 border border-slate-400 text-slate-300'
        };
      }
    }

    if (userPlanInfo.plan === 'starter') {
      return {
        message: ' You are subscribed to the Starter plan.',
        type: 'success',
        className: 'bg-green-500/20 border border-green-400 text-green-300'
      };
    }

    if (userPlanInfo.plan === 'pro') {
      return {
        message: ' You are subscribed to the Pro plan.',
        type: 'success',
        className: 'bg-green-500/20 border border-green-400 text-green-300'
      };
    }

    if (userPlanInfo.plan === 'business') {
      return {
        message: ' You are fully subscribed to the Business plan!',
        type: 'premium',
        className: 'bg-purple-500/20 border border-purple-400 text-purple-300'
      };
    }

    console.warn('⚠️ Unknown plan type for status message:', userPlanInfo.plan);
    return null;
  };



  /* -------------------------
     Debug useEffect to monitor state changes
     ------------------------- */
  useEffect(() => {
    console.log('🎯 USER PLAN STATE UPDATE:', {
      user: user ? `Logged in (${user.id.substring(0, 8)}...)` : 'Logged out',
      userPlanInfo: userPlanInfo,
      filteredPlans: getFilteredPlans()
    });

    // Log button states for each plan when userPlanInfo changes
    if (userPlanInfo) {
      console.log('🔘 BUTTON STATES:');
      Object.keys(pricingPlans).forEach(planKey => {
        const buttonState = getPlanButtonState(planKey);
        console.log(`   ${planKey}:`, buttonState);
      });
    }
  }, [user, userPlanInfo]);

  const cyan = 'text-cyan-400';
  const cyanBg = 'bg-gradient-to-r from-cyan-500 to-cyan-400';
  const heroGradient = 'bg-gradient-to-br from-slate-900 via-blue-900 via-purple-800 via-cyan-800 to-slate-900';

  const userStatusMessage = getUserStatusMessage();

  const PartnerLogosCarousel = () => {
    const logos = [
      '/mywoki-logo.png',
      'https://i.postimg.cc/NGdwptqT/msoo-logo.png',
      'https://i.postimg.cc/4yfsnNCX/logo-tiffad.jpg',
      'https://i.postimg.cc/rpBckNyB/fitness-center-40dp-A7-C4-E5-FILL0-wght400-GRAD0-opsz40.png',
      'https://i.postimg.cc/W3mRPRHZ/Vibrant-Wordmark-Logo-for-Gigatech.png',
    ];

    const carouselRef = useRef<HTMLDivElement>(null);
    const [isInteracting, setIsInteracting] = useState(false);
    const [startX, setStartX] = useState(0);

    const handleStart = (clientX: number) => {
      setIsInteracting(true);
      setStartX(clientX);
    };

    const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (isInteracting) {
        e.preventDefault();
      }
    };

    const handleEnd = (clientX: number) => {
      if (!isInteracting) return;
      setIsInteracting(false);
      const deltaX = clientX - startX;
      const threshold = 50;

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          // Swipe right, scroll left
          carouselRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
        } else {
          // Swipe left, scroll right
          carouselRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
        }
      }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      handleStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      handleMove(e);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      handleEnd(e.changedTouches[0].clientX);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      handleStart(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      handleMove(e);
    };

    const handleMouseUp = (e: React.MouseEvent) => {
      handleEnd(e.clientX);
    };

    return (
      <div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll {
            animation: scroll 10s linear infinite;
          }
        `}} />
        <div className="relative mt-4 overflow-hidden mx-auto" style={{ width: '300px', height: '60px' }}>
          <div
            ref={carouselRef}
            className={`flex gap-4 ${isInteracting ? '' : 'animate-scroll'}`}
            style={{ width: 'fit-content' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} // In case mouse leaves while dragging
          >
            {logos.concat(logos).map((logo, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border border-slate-600 transition-all duration-300 hover:scale-110"
              >
                <img
                  src={logo}
                  alt={`Partner ${(index % logos.length) + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
          {/* Navigation buttons */}
          <button
            onClick={() => carouselRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg transition-all"
            aria-label="Previous logos"
          >
            ‹
          </button>
          <button
            onClick={() => carouselRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg transition-all"
            aria-label="Next logos"
          >
            ›
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${heroGradient} text-slate-100`}>
      {/* Mobile Warning Banner */}
      {showMobileWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-900 p-4 text-center shadow-lg">
          <div className="flex items-center justify-center gap-3">
            <span className="font-semibold">⚠️ Mobile Experience Limited</span>
            <span>This app is optimized for desktop. Some features may not work properly on mobile devices.</span>
            <button
              onClick={() => setShowMobileWarning(false)}
              className="ml-4 px-2 py-1 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`fixed ${showMobileWarning ? 'top-16' : 'top-0'} w-full z-50 transition-all duration-300 ${isScrolled ? 'backdrop-blur-sm bg-slate-900/80 shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-white/5">
              <img src="/mywoki-logo.png" alt="mywoki logo" className="w-6 h-6 sm:w-9 sm:h-9 rounded-full" />
            </div>
            <div>
              <div className="text-sm sm:text-lg font-semibold">mywoki</div>
              <div className="text-xs text-slate-400 -mt-1">Data-edge</div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-300 hover:text-white">Features</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-300 hover:text-white font-semibold">Pricing</button>
            <button onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })} className="text-slate-300 hover:text-white">Reviews</button>
            <button onClick={() => onNavigate('contact')} className="text-slate-300 hover:text-white">Contact</button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <button onClick={() => onNavigate('welcome-portal')} className="px-3 py-2 sm:px-4 rounded-lg bg-white/6 text-white hover:bg-white/10 text-sm sm:text-base">
                  Dashboard{userPlanInfo ? ` (${userPlanInfo.plan.charAt(0).toUpperCase() + userPlanInfo.plan.slice(1)})` : ''}
                </button>
                <button onClick={signOut} className="px-3 py-2 sm:px-4 rounded-lg bg-cyan-400 text-slate-900 hover:opacity-95 text-sm sm:text-base">Sign Out</button>
              </>
            ) : (
              <>
                <button onClick={() => onNavigate('getting-started')} className="text-slate-300 hover:text-white text-sm sm:text-base">Sign In</button>
                <button onClick={() => navigateToSignup()} className="px-3 py-2 sm:px-4 rounded-lg text-slate-900 bg-cyan-400 font-semibold shadow-md hover:opacity-95 text-sm sm:text-base">Start Free Trial</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <main className="pt-28 pb-20">
        <section className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Understand your <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-cyan-500">business traffic</span> — with privacy.
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-slate-300 mb-8">
            Modern analytics with AI-driven recommendations, conversion insights, and simple pricing — no complexity, no data fishing.
          </p>

          {/* Domain CTA */}
          <div className="mt-6 mx-auto max-w-3xl">
            <form onSubmit={handleDomainSubmit} className="flex flex-col sm:flex-row gap-4 items-center">
              <input
                type="text"
                value={domain}
                onChange={(e) => { setDomain(e.target.value); if (error) setError(''); }}
                className="flex-1 px-4 py-4 rounded-xl bg-slate-800 border border-slate-700 placeholder-slate-500 focus:outline-none text-white"
                placeholder="my-organization.com"
              />
              <button type="submit" className="px-6 py-3 rounded-xl font-semibold text-slate-900 bg-cyan-400 hover:opacity-95 shadow-md">Get Free Analysis</button>
            </form>
            {error && <div className="mt-3 text-sm text-rose-400">{error}</div>}
          </div>

          {/* Circular screenshot carousel */}
          <div className="mt-24 relative h-96 flex items-center justify-center">
            <div className="relative w-full max-w-4xl h-full">
              {screenshotUrls.map((url, index) => {
                const angle = (index * angleStep - currentRotation) * (Math.PI / 180);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const isActive = index === Math.round(currentRotation / angleStep) % totalImages;
                return (
                  <div
                    key={index}
                    className={`absolute w-64 h-40 rounded-lg overflow-hidden shadow-lg border-2 transition-all duration-500 ${
                      isActive ? 'border-cyan-400 scale-110' : 'border-slate-600 scale-90'
                    }`}
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                      left: '50%',
                      top: '50%',
                      marginLeft: '-128px',
                      marginTop: '-80px',
                    }}
                  >
                    <img
                      src={url}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
            {/* Navigation buttons */}
            <button
              onClick={() => setCurrentRotation((prev) => (prev - angleStep + 360) % 360)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-slate-800/80 hover:bg-slate-700 text-white p-3 rounded-full shadow-lg transition-all"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentRotation((prev) => (prev + angleStep) % 360)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-slate-800/80 hover:bg-slate-700 text-white p-3 rounded-full shadow-lg transition-all"
              aria-label="Next image"
            >
              ›
            </button>
          </div>
        </section>

        {/* DATA-DRIVEN TARGETING */}
        <section id="targeting" className="max-w-6xl mx-auto px-6 mt-32 py-16 bg-gradient-to-br from-purple-900/20 to-indigo-900/40 rounded-2xl border border-purple-700/50">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Data-Driven Targeting</h2>
            <p className="text-slate-300 max-w-3xl mx-auto">We use your organization's data to identify the perfect audience, optimize your traffic sources, and drive qualified visitors straight to your business.</p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-cyan-400 to-indigo-500 opacity-50"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <TargetingStep
                step="1"
                title="Data Analysis"
                desc="We analyze your existing traffic patterns, user behavior, and conversion data to understand your audience."
                icon={<ChartBarIcon className="w-8 h-8 text-purple-400" />}
                delay="0"
              />
              <TargetingStep
                step="2"
                title="Audience Profiling"
                desc="Identify key demographics, interests, and behaviors of your ideal customers from the data insights."
                icon={<UsersIcon className="w-8 h-8 text-cyan-400" />}
                delay="200"
              />
              <TargetingStep
                step="3"
                title="Traffic Optimization"
                desc="Optimize your marketing channels and content to attract the right visitors at the right time."
                icon={<TrendingUpIcon className="w-8 h-8 text-indigo-400" />}
                delay="400"
              />
              <TargetingStep
                step="4"
                title="Conversion Driving"
                desc="Guide qualified traffic through your site with personalized experiences that convert visitors to customers."
                icon={<OutreachIcon className="w-8 h-8 text-emerald-400" />}
                delay="600"
              />
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold shadow-lg">
              <SparklesIcon className="w-5 h-5" />
              AI-Powered Insights for Maximum Growth
            </div>
          </div>
        </section>

        {/* REVIEWS (Read-only) */}
        <section id="reviews" className="max-w-6xl mx-auto px-6 mt-20 pb-12">
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 rounded-xl p-8 border border-slate-700 shadow-xl">
            <div className="md:flex md:items-start md:justify-between">
              <div>
                <h3 className="text-2xl font-bold">What Our customers say</h3>
              </div>

              <div className="mt-4 md:mt-0">
                <div className="text-sm text-slate-400">Average rating</div>
                <div className="text-2xl font-bold text-cyan-300 mt-1">{(reviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, reviews.length)).toFixed(1)} ★</div>
              </div>
            </div>

            {/* Horizontal scrolling reviews carousel */}
            <div className="mt-8 relative overflow-hidden">
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes scroll-reviews {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .animate-scroll-reviews {
                  animation: scroll-reviews 40s linear infinite;
                }
                .animate-scroll-reviews:hover {
                  animation-play-state: paused;
                }
              `}} />
              <div
                className="flex gap-6 overflow-x-auto"
                id="reviews-carousel"
                onMouseDown={(e) => {
                  setIsDragging(true);
                  setStartX(e.clientX);
                  const carousel = document.getElementById('reviews-carousel');
                  if (carousel) {
                    setScrollLeft(carousel.scrollLeft);
                  }
                }}
                onMouseMove={(e) => {
                  if (!isDragging) return;
                  e.preventDefault();
                  const x = e.clientX - startX;
                  const carousel = document.getElementById('reviews-carousel');
                  if (carousel) {
                    carousel.scrollLeft = scrollLeft - x;
                  }
                }}
                onMouseUp={() => {
                  setIsDragging(false);
                }}
                onMouseLeave={() => {
                  setIsDragging(false);
                }}
                style={{ cursor: isDragging ? 'grabbing' : 'grab', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {loadingReviews ? (
                  <div className="text-slate-400 whitespace-nowrap">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                  <div className="text-slate-400 whitespace-nowrap">No reviews yet — be the first to submit!</div>
                ) : (
                  <>
                    {reviews.concat(reviews).map((r, index) => (
                      <div key={`${r.id}-${index}`} className="flex-shrink-0 w-80 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={r.image_url}
                              alt={`${r.name} avatar`}
                              className="w-10 h-10 rounded-full object-cover border border-slate-600"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2MzY2ZjEiLz4KPHBhdGggZD0iTTIwIDIwQzIyLjc2MTQgMjAgMjUgMTcuNzYxNCAyNSAxNUMyNSAxMi4yMzg2IDIyLjc2MTQgMTAgMjAgMTBDMTcuMjM4NiAxMCAxNSAxMi4yMzg2IDE1IDE1QzE1IDE3Ljc2MTQgMTcgMjAgMjBaIiBmaWxsPSIjOWNhM2FmIi8+Cjwvc3ZnPgo=';
                              }}
                            />
                            <div className="font-semibold">{r.name}</div>
                          </div>
                          <div className="text-sm text-slate-400">{new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="text-cyan-300 font-semibold mt-2">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                        <div className="text-slate-300 mt-2">{r.message}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
              {/* Navigation buttons */}
              <button
                onClick={() => {
                  const carousel = document.getElementById('reviews-carousel');
                  if (carousel) carousel.scrollBy({ left: -320, behavior: 'smooth' });
                }}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-slate-800/80 hover:bg-slate-700 text-white p-3 rounded-full shadow-lg transition-all"
                aria-label="Previous reviews"
              >
                ‹
              </button>
              <button
                onClick={() => {
                  const carousel = document.getElementById('reviews-carousel');
                  if (carousel) carousel.scrollBy({ left: 320, behavior: 'smooth' });
                }}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-slate-800/80 hover:bg-slate-700 text-white p-3 rounded-full shadow-lg transition-all"
                aria-label="Next reviews"
              >
                ›
              </button>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="max-w-7xl mx-auto px-6 mt-32 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Transform Your Data Into
              <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Strategic Growth
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Every business has a story hidden in its data. We help you read it, understand it, and turn it into your competitive advantage.
            </p>
          </div>

          {/* Unique Feature Layout */}
          <div className="relative">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Large central feature */}
              <div className="md:col-span-2 md:row-span-2">
                <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-slate-800/80 via-slate-900/60 to-slate-800/80 border border-slate-700/50 backdrop-blur-sm hover:border-cyan-400/30 transition-all duration-500 group">
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="inline-flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse"></div>
                        <span className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">Core Intelligence</span>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors">
                        Real-time Analytics Engine
                      </h3>
                      <p className="text-slate-300 text-lg leading-relaxed mb-6">
                        See exactly where your visitors come from, what they do on your site, and which pages drive the most conversions.
                        Our advanced tracking captures every interaction without compromising privacy.
                      </p>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-cyan-400">99.9%</div>
                          <div className="text-sm text-slate-400">Accuracy Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">{'< 1s'}</div>
                          <div className="text-sm text-slate-400">Response Time</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-sm text-slate-400">Live tracking active</span>
                      </div>
                      <div className="text-sm text-slate-500">24/7 monitoring</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top right feature */}
              <div className="md:col-span-1">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/40 to-slate-800/60 border border-purple-700/30 hover:border-purple-400/50 transition-all duration-300 group">
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                      <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">AI Powered</span>
                    </div>
                    <h4 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">Smart Recommendations</h4>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Our AI analyzes your data patterns and provides prioritized, actionable recommendations to boost conversions.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">AI Confidence</span>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom right feature */}
              <div className="md:col-span-1">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-900/40 to-slate-800/60 border border-cyan-700/30 hover:border-cyan-400/50 transition-all duration-300 group">
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"></div>
                      <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Privacy First</span>
                    </div>
                    <h4 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">GDPR Compliant</h4>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Built with privacy at the core. No invasive tracking, no data selling, just pure analytics insights.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500/20 border border-green-400/50 flex items-center justify-center">
                      <div className="w-2 h-2 rounded bg-green-400"></div>
                    </div>
                    <span className="text-xs text-slate-400">Privacy certified</span>
                  </div>
                </div>
              </div>

              {/* Bottom features row */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-700/50 hover:border-slate-600/70 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white group-hover:text-slate-300 transition-colors">Visitor Journey Mapping</h4>
                      <p className="text-slate-300 text-sm leading-relaxed mt-2">
                        Visualize complete user journeys, identify drop-off points, and optimize conversion funnels.
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                      <div className="w-6 h-6 rounded bg-gradient-to-r from-slate-400 to-slate-500"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-cyan-400 to-purple-400 h-2 rounded-full w-3/4"></div>
                    </div>
                    <span className="text-xs text-slate-400">75% optimized</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-700/50 hover:border-slate-600/70 transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white group-hover:text-slate-300 transition-colors">Targeted Outreach</h4>
                      <p className="text-slate-300 text-sm leading-relaxed mt-2">
                        Reach your ideal customers with data-driven insights and personalized marketing strategies.
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
                      <div className="w-6 h-6 rounded bg-gradient-to-r from-slate-400 to-slate-500"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full w-5/6"></div>
                    </div>
                    <span className="text-xs text-slate-400">83% effective</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="mt-20 text-center">
              <div className="inline-flex items-center gap-6 px-8 py-4 rounded-full bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">10K+</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Organizations</div>
                </div>
                <div className="w-px h-8 bg-slate-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">99.9%</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Uptime</div>
                </div>
                <div className="w-px h-8 bg-slate-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">24/7</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Support</div>
                </div>
              </div>
            </div>

            {/* Partner logos */}
            <div className="mt-12">
              <PartnerLogosCarousel />
            </div>

            {/* CTA */}
            {!user && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => navigateToSignup('pro')}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <span>Start Your Growth Journey</span>
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                </button>
                <p className="text-slate-400 text-sm mt-4">14-day free trial • No credit card required</p>
              </div>
            )}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="max-w-6xl mx-auto px-6 mt-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Simple, transparent pricing</h2>
            {!user && <p className="text-slate-300 mt-2">Start with a 14-day free trial — no credit card required.</p>}
            
            {/* User status banner */}
            {userStatusMessage && (
              <div className="mt-4 max-w-md mx-auto">
                <div className={`rounded-lg p-4 ${userStatusMessage.className}`}>
                  <p className="font-semibold text-center">
                    {userStatusMessage.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Object.entries(getFilteredPlans()).map(([key, plan]) => {
              const buttonState = getPlanButtonState(key);
              const isCurrentPlan = buttonState.isCurrent;

              return (
                <div 
                  key={key} 
                  onClick={() => !buttonState.disabled && handlePlanSelect(key)} 
                  className={`p-6 rounded-xl border ${
                    plan.popular ? 'border-cyan-400 scale-105 shadow-2xl' : 'border-slate-700'
                  } bg-slate-800 ${
                    buttonState.disabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:border-slate-500'
                  } transition-all duration-200`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    {plan.popular && <div className="text-xs px-2 py-1 rounded-full bg-cyan-500 text-slate-900">Most popular</div>}
                    {isCurrentPlan && (
                      <div className="text-xs px-2 py-1 rounded-full bg-green-600 text-white">Current</div>
                    )}
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">
                    {plan.price}<span className="text-sm text-slate-400">/mo</span>
                  </div>
                  <div className="text-slate-400 mb-4">{plan.pageviews}</div>
                  <ul className="mb-6 space-y-2 text-slate-300">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <svg className="h-5 w-5 text-emerald-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!buttonState.disabled) {
                          if (buttonState.navigateTo === 'subscribe') {
                            onNavigate(`subscribe?plan=${key}`);
                          } else if (buttonState.navigateTo === 'auth') {
                            navigateToSignup(key);
                          }
                        }
                      }}
                      disabled={buttonState.disabled}
                      className={`w-full py-3 rounded-lg font-semibold transition-all ${buttonState.className} ${
                        buttonState.disabled ? '' : 'hover:scale-105'
                      }`}
                    >
                      {buttonState.text}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 sm:gap-4 mb-4">
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center bg-white/5">
                <img src="/mywoki-logo.png" alt="mywoki logo" className="w-6 h-6 sm:w-9 sm:h-9 rounded-full" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-semibold">mywoki</div>
                <div className="text-xs text-slate-400">Data-edge</div>
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-sm">Simple, powerful analytics for everyone. Understand your organization workability without the complexity.</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3 uppercase">Product</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button></li>
              <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Pricing</button></li>
            <li><Link to="/status" className='theme-text-secondary hover:theme-text-primary transition-colors'>System Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3 uppercase">Company</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><button onClick={() => onNavigate('contact')}>Contact</button></li>
              <li><button onClick={() => onNavigate('privacy')}>Privacy</button></li>
              <li><button onClick={() => onNavigate('terms')}>Terms</button></li>
              <li><a href="/about" className='theme-text-secondary hover:theme-text-primary transition-colors'>About</a></li>
              
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3 uppercase">Follow</h4>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 rounded-md bg-white/5"><FacebookIcon className="w-5 h-5 text-slate-200" /></a>
              <a href="#" className="p-2 rounded-md bg-white/5"><LinkedInIcon className="w-5 h-5 text-slate-200" /></a>
              <a href="#" className="p-2 rounded-md bg-white/5"><InstagramIcon className="w-5 h-5 text-slate-200" /></a>
            </div>
            <div className="text-slate-400 text-xs mt-4">© {new Date().getFullYear()} mywoki</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* -------------------------
   Reusable small component
   ------------------------- */
function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: React.JSX.Element; }) {
  return (
    <div className="p-5 rounded-xl bg-gradient-to-br from-slate-800/40 to-slate-800/20 border border-slate-700">
      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h4 className="font-semibold text-white">{title}</h4>
      <p className="text-slate-300 mt-2">{desc}</p>
    </div>
  );
}

function TargetingStep({ step, title, desc, icon, delay }: { step: string; title: string; desc: string; icon: React.JSX.Element; delay: string; }) {
  return (
    <div className="relative flex flex-col items-center text-center" style={{ animationDelay: `${delay}ms` }}>
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 border-2 border-slate-600 flex items-center justify-center mb-6 relative z-10">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-sm text-slate-400 font-semibold mb-2">Step {step}</div>
      <h4 className="text-lg font-semibold text-white mb-3">{title}</h4>
      <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
