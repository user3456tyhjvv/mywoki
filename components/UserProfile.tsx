'use client'
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { UsersIcon, CalendarIcon, GlobeIcon, CreditCardIcon, ShieldCheckIcon } from './Icons';
import { useNavigate } from 'react-router-dom';
import { getUserWebsites } from '../services/dataService';

interface UserProfileProps {
  onClose?: () => void;
  currentDomain?: string;
  onSelectDomain?: (domain: string) => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  plan: string;
  trial_ends_at: string;
  created_at: string;
  subscription_id?: string;
  tracking_code?: string;
  avatar_url?: string;
  full_name?: string;
  next_billing_date?: string;
  plan_updated_at?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose, currentDomain, onSelectDomain }) => {
  const { user, refreshProfile } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [websites, setWebsites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'websites' | 'billing'>('profile');

  // Fetch user data from Supabase profiles table
  const fetchUserData = async () => {
    if (!user) {
      setMessage('No user logged in');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      console.log('🔍 Fetching user profile from Supabase for user:', user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        if (profileError.code === 'PGRST116') {
          // Profile doesn't exist, create one
          await createUserProfile();
          return;
        }
        throw profileError;
      }

      console.log('✅ Profile fetched successfully:', profile);

      const enhancedProfile: UserData = {
        ...profile,
        name: profile.name || user.user_metadata?.full_name || user.user_metadata?.name || 'User',
        email: profile.email || user.email || '',
        avatar_url: profile.avatar_url || user.user_metadata?.avatar_url,
        plan: profile.plan || 'free',
      };

      setUserData(enhancedProfile);

      // Fetch websites
      try {
        const userWebsites = await getUserWebsites(user.id);
        setWebsites(userWebsites);
      } catch (websiteError) {
        console.error('Error fetching websites:', websiteError);
        setWebsites([]);
      }

    } catch (error) {
      console.error('Error in fetchUserData:', error);
      setMessage('Error loading profile data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for profile updates
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchUserData();

    // Subscribe to profile changes
    const subscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Profile updated via real-time:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = payload.new as UserData;
            setUserData(prev => ({ ...prev, ...newData }));
            refreshProfile?.();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Create user profile if it doesn't exist
  const createUserProfile = async () => {
    if (!user) return;
    
    try {
      const profileData = {
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url,
        plan: 'free',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) throw error;

      setUserData(profile);
      
    } catch (error) {
      console.error('Error creating user profile:', error);
      setMessage('Error creating profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Helper function to normalize plan name (case-insensitive)
  const normalizePlan = (plan: string | undefined): string => {
    if (!plan) return 'free';
    return plan.toLowerCase();
  };

  // Calculate trial days remaining for free plan
  const getTrialDaysLeft = () => {
    if (!userData?.trial_ends_at) return 14;

    const trialEnds = new Date(userData.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnds.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  // Calculate next billing date for paid plans
  const getNextBillingDate = () => {
    if (!userData) return null;

    if (userData.next_billing_date) {
      return new Date(userData.next_billing_date);
    }

    const referenceDate = userData.plan_updated_at 
      ? new Date(userData.plan_updated_at) 
      : new Date(userData.created_at);
    
    const nextBilling = new Date(referenceDate);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    
    return nextBilling;
  };

  // Check if user is on a paid plan (case-insensitive)
  const isPaidPlan = (): boolean => {
    const plan = normalizePlan(userData?.plan);
    return ['starter', 'pro', 'business'].includes(plan);
  };

  // Check if user should see upgrade CTA (case-insensitive)
  const shouldShowUpgrade = (): boolean => {
    const plan = normalizePlan(userData?.plan);
    return plan === 'free' || !userData?.plan;
  };

  const getPlanDetails = (plan: string | undefined) => {
    const normalizedPlan = normalizePlan(plan);
    
    const plans = {
      free: { 
        name: 'Free', 
        color: 'text-gray-400', 
        bgColor: 'bg-gray-500/20', 
        features: ['Basic Analytics', '1 Website', '7-day Data Retention'],
        price: 'Free'
      },
      starter: { 
        name: 'Starter', 
        color: 'text-blue-400', 
        bgColor: 'bg-blue-500/20', 
        features: ['Enhanced Analytics', '5 Websites', '30-day Data Retention'],
        price: '$9.99/month'
      },
      pro: { 
        name: 'Pro', 
        color: 'text-purple-400', 
        bgColor: 'bg-purple-500/20', 
        features: ['Advanced Analytics', 'Unlimited Websites', '6-month Data Retention'],
        price: '$19.99/month'
      },
      business: { 
        name: 'Business', 
        color: 'text-orange-400', 
        bgColor: 'bg-orange-500/20', 
        features: ['Enterprise Features', 'Unlimited Everything', 'Priority Support'],
        price: '$39.99/month'
      }
    };

    return plans[normalizedPlan as keyof typeof plans] || plans.free;
  };

  const handleSubscribe = () => {
    navigate('/subscribe');
    onClose?.();
  };

  const handleRefreshProfile = async () => {
    try {
      setSaving(true);
      await refreshProfile?.();
      await fetchUserData();
      setMessage('Profile refreshed successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to refresh profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUserAvatar = () => {
    if (userData?.avatar_url) {
      return userData.avatar_url;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=6366f1&color=fff&size=128`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-700 shadow-2xl">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <UsersIcon className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-white text-lg font-semibold mt-4">Loading Profile</p>
            <p className="text-slate-400 text-sm mt-2">Getting your account information...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = userData?.plan || 'free';
  const planDetails = getPlanDetails(currentPlan);
  const isUserOnPaidPlan = isPaidPlan();
  const showUpgrade = shouldShowUpgrade();

  console.log('📊 Current Plan Debug:', {
    rawPlan: userData?.plan,
    normalizedPlan: normalizePlan(userData?.plan),
    isPaidPlan: isUserOnPaidPlan,
    showUpgrade: showUpgrade,
    planDetails: planDetails
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${resolvedTheme === 'dark' ? 'bg-slate-800 border-slate-700' : 'theme-bg-primary theme-border-primary'} rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border shadow-2xl`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Account Settings</h2>
              <p className="text-slate-400 text-sm">Manage your profile and subscription</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)]">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-700 bg-slate-900/30">
            <div className="p-6">
              {/* User Avatar & Basic Info */}
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={getUserAvatar()}
                  alt={userData?.name}
                  className="w-16 h-16 rounded-full border-2 border-slate-600"
                />
                <div>
                  <h3 className="text-white font-semibold text-lg">{userData?.name}</h3>
                  <p className="text-slate-400 text-sm">{userData?.email}</p>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    planDetails.bgColor
                  } ${planDetails.color}`}>
                    {planDetails.name}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-1">
                {[
                  { id: 'profile', label: 'Profile', icon: UsersIcon },
                  { id: 'websites', label: 'Websites', icon: GlobeIcon },
                  { id: 'billing', label: 'Billing', icon: CreditCardIcon },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {message && (
                <div className={`p-4 rounded-xl ${
                  message.includes('Error') 
                    ? 'bg-red-900/50 text-red-200 border border-red-700/50' 
                    : 'bg-green-900/50 text-green-200 border border-green-700/50'
                }`}>
                  <div className="flex items-center gap-2">
                    {message.includes('Error') ? '❌' : '✅'}
                    <span>{message}</span>
                  </div>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Account Information */}
                    <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-blue-400" />
                        Account Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-slate-400 text-sm font-medium">Full Name</label>
                          <p className="text-white text-lg font-semibold">{userData?.name}</p>
                        </div>
                        <div>
                          <label className="text-slate-400 text-sm font-medium">Email Address</label>
                          <p className="text-white text-lg">{userData?.email}</p>
                        </div>
                        <div>
                          <label className="text-slate-400 text-sm font-medium">Member Since</label>
                          <p className="text-white">{formatDate(userData?.created_at || '')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Subscription Status */}
                    <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                        Subscription Status
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-slate-400 text-sm font-medium">Current Plan</label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-lg font-bold ${planDetails.color}`}>
                              {planDetails.name}
                            </span>
                            {!isUserOnPaidPlan && (
                              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                                Trial
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Free Plan - Show Trial Days */}
                        {!isUserOnPaidPlan && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-blue-300 text-sm font-medium">Trial Days Remaining</span>
                              <span className={`text-xl font-bold ${
                                getTrialDaysLeft() <= 3 ? 'text-red-400' : 'text-blue-400'
                              }`}>
                                {getTrialDaysLeft()} days
                              </span>
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${((14 - getTrialDaysLeft()) / 14) * 100}%` }}
                              ></div>
                            </div>
                            <p className="text-blue-300 text-sm mt-2">
                              Trial ends: {formatDate(userData?.trial_ends_at)}
                            </p>
                          </div>
                        )}

                        {/* Paid Plan - Show Next Billing */}
                        {isUserOnPaidPlan && (
                          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-green-300 text-sm font-medium">Next Billing Date</span>
                              <span className="text-green-400 text-xl font-bold">
                                {formatDate(getNextBillingDate()?.toISOString() || '')}
                              </span>
                            </div>
                            <p className="text-green-300 text-sm">
                              Your {planDetails.name} plan will automatically renew
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Plan Features */}
                  <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4">Plan Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {planDetails.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-slate-600/30 rounded-lg">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-white text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Websites Tab */}
              {activeTab === 'websites' && (
                <div className="space-y-6">
                  <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <GlobeIcon className="w-5 h-5 text-green-400" />
                      Tracked Websites
                    </h3>
                    
                    {websites.length > 0 ? (
                      <div className="space-y-3">
                        {websites.map((website, index) => (
                          <div
                            key={index}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                              website === currentDomain
                                ? 'bg-blue-500/20 border-blue-500/50'
                                : 'bg-slate-600/30 border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-500/30 rounded-lg flex items-center justify-center">
                                <GlobeIcon className="w-5 h-5 text-slate-300" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{website}</p>
                                <p className="text-slate-400 text-sm">
                                  {website === currentDomain ? 'Currently viewing' : 'Click to view analytics'}
                                </p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => {
                                if (onSelectDomain) {
                                  onSelectDomain(website);
                                  onClose?.();
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              {website === currentDomain ? 'Current' : 'Select'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <GlobeIcon className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg mb-2">No websites tracked yet</p>
                        <p className="text-slate-500 text-sm">
                          Add your first website to start tracking analytics
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <CreditCardIcon className="w-5 h-5 text-purple-400" />
                        Current Plan
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Plan</span>
                          <span className={`font-semibold ${planDetails.color}`}>
                            {planDetails.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Price</span>
                          <span className="text-white">{planDetails.price}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Status</span>
                          <span className="text-green-400 font-medium">Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-blue-400" />
                        Billing Information
                      </h3>
                      <div className="space-y-4">
                        {/* Free Plan - Trial Information */}
                        {!isUserOnPaidPlan && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Trial Ends</span>
                            <span className="text-yellow-400">{formatDate(userData?.trial_ends_at)}</span>
                          </div>
                        )}

                        {/* Paid Plan - Next Billing */}
                        {isUserOnPaidPlan && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Next Billing</span>
                            <span className="text-white">
                              {formatDate(getNextBillingDate()?.toISOString() || '')}
                            </span>
                          </div>
                        )}

                        {userData?.tracking_code && (
                          <div>
                            <span className="text-slate-400 text-sm">Tracking Code</span>
                            <p className="text-white font-mono text-sm bg-slate-600/50 px-3 py-2 rounded-lg mt-1 break-all">
                              {userData.tracking_code}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Manual Refresh Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleRefreshProfile}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Refreshing...' : 'Refresh Profile'}
                    </button>
                  </div>

                  {/* Upgrade CTA - Only show for free users */}
                  {showUpgrade && (
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
                      <div className="text-center">
                        <CreditCardIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Upgrade Your Plan</h3>
                        <p className="text-blue-200 mb-4 max-w-md mx-auto">
                          Unlock advanced analytics, longer data retention, and premium features to grow your business.
                        </p>
                        <button
                          onClick={handleSubscribe}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-8 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                        >
                          View Plans & Pricing
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;