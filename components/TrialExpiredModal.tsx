import React, { useState, useEffect } from 'react';
import { XIcon, CreditCardIcon } from './Icons';
import { supabase } from '../lib/supabase';

interface TrialExpiredModalProps {
  isOpen: boolean;
  userId?: string | null;
  onClose?: () => void;
  onSubscribe: () => void;
  daysRemaining?: number;
  plan?: string;
}

const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({ isOpen, userId, onClose, onSubscribe, daysRemaining, plan }) => {
  const [profileData, setProfileData] = useState<{
    daysRemaining: number;
    plan: string;
    loading: boolean;
    error: string | null;
  }>({
    daysRemaining: 0,
    plan: 'free',
    loading: false,
    error: null
  });

  // Use provided props or fetch profile data when modal should be open and userId is available
  useEffect(() => {
    if (daysRemaining !== undefined && plan !== undefined) {
      setProfileData({
        daysRemaining: daysRemaining || 0,
        plan: plan || 'free',
        loading: false,
        error: null
      });
      return;
    }

    if (!isOpen || !userId) {
      setProfileData(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchProfileData = async () => {
      setProfileData(prev => ({ ...prev, loading: true, error: null }));

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('plan, trial_end_date')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile for modal:', error);
          setProfileData(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load profile data'
          }));
          return;
        }

        if (!profile) {
          setProfileData(prev => ({
            ...prev,
            loading: false,
            error: 'Profile not found'
          }));
          return;
        }

        // Calculate days remaining
        let daysRemaining = 0;
        if (profile.trial_end_date) {
          const endDate = new Date(profile.trial_end_date);
          const now = new Date();
          daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysRemaining < 0) daysRemaining = 0;
        }

        setProfileData({
          daysRemaining,
          plan: profile.plan || 'free',
          loading: false,
          error: null
        });

      } catch (err) {
        console.error('Error in fetchProfileData:', err);
        setProfileData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load profile data'
        }));
      }
    };

    fetchProfileData();
  }, [isOpen, userId, daysRemaining, plan]);

  console.log('TrialExpiredModal render:', {
    isOpen,
    userId,
    profileData,
    onClose: !!onClose,
    onSubscribe: !!onSubscribe
  });

  // Don't show modal if not open, loading, error, or user is on a paid plan
  if (!isOpen || profileData.loading || profileData.error || ['starter', 'pro', 'business'].includes(profileData.plan.toLowerCase())) {
    console.log('TrialExpiredModal: not open, loading, error, or user on paid plan, returning null');
    return null;
  }

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Default behavior: navigate to homepage with full page reload
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-secondary rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-700">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <CreditCardIcon className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {profileData.daysRemaining <= 0 ? 'Trial Expired' : 'Trial Expiring Soon'}
              </h2>
              <p className="text-slate-400 text-sm">
                {profileData.daysRemaining <= 0 ? 'Your 14-day trial has ended' : `Your trial expires in ${profileData.daysRemaining} day${profileData.daysRemaining !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700"
            title="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-slate-300">
            {profileData.daysRemaining <= 0
              ? 'Your free trial period has expired. To continue using the analytics dashboard and access your data, please subscribe to one of our plans.'
              : 'Your trial is expiring soon. Subscribe now to avoid any interruption to your analytics service.'
            }
          </p>

          <div className="bg-brand-primary/50 rounded-lg p-4 border border-slate-600">
            <h3 className="text-white font-semibold mb-2">What you'll get:</h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Unlimited website analytics</li>
              <li>• Real-time data tracking</li>
              <li>• AI-powered insights</li>
              <li>• Advanced reporting</li>
              <li>• Priority support</li>
            </ul>
          </div>

          {profileData.daysRemaining > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-300 text-sm">
                <strong>Note:</strong> You have {profileData.daysRemaining} day{profileData.daysRemaining !== 1 ? 's' : ''} remaining in your trial. Subscribe now to avoid any interruption.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">

          <button
            onClick={onSubscribe}
            className="flex-1 bg-brand-accent text-brand-primary font-bold py-3 px-6 rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2"
          >
            <CreditCardIcon className="w-5 h-5" />
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialExpiredModal;
