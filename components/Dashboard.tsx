import React, { useState, useEffect, useCallback, useRef, Suspense, lazy, useMemo } from 'react';
import type { TrafficData, ChartDataPoint, Notification, Visitor, Message } from '../types';
import DashboardSkeleton, { HeaderSkeleton, MetricCardSkeleton, ChartSkeleton, SuggestionsSkeleton } from './DashboardSkeleton';

// Pre-load critical components immediately with better organization
const MetricCard = lazy(() => import('./MetricCard'));
const GrowthChart = lazy(() => import('./GrowthChart'));
const Suggestions = lazy(() => import('./Suggestions'));

// Group non-critical components into logical chunks to reduce lazy loading overhead
const CodeSnippet = lazy(() => import('./CodeSnippet'));
const WeeklySummary = lazy(() => import('./WeeklySummary'));
const UserProfile = lazy(() => import('./UserProfile'));
const QuickActions = lazy(() => import('./QuickActions'));
const ExitPagesAnalysis = lazy(() => import('./ExitPagesAnalysis').catch(() => ({ default: () => null })));
const TrafficSourcePerformance = lazy(() => import('./TrafficSourcePerformance').catch(() => ({ default: () => null })));
const ConversionFunnel = lazy(() => import('./ConversionFunnel').catch(() => ({ default: () => null })));
const VisitorDataTable = lazy(() => import('./VisitorDataTable').catch(() => ({ default: () => null })));
const ExportModal = lazy(() => import('./ExportModal').catch(() => ({ default: () => null })));
const ChatWidget = lazy(() => import('./ChatWidget').catch(() => ({ default: () => null })));
const NotificationModal = lazy(() => import('./NotificationModal').catch(() => ({ default: () => null })));
const TrialExpiredModal = lazy(() => import('./TrialExpiredModal').catch(() => ({ default: () => null })));
const NetworkStatus = lazy(() => import('./NetworkStatus').catch(() => ({ default: () => null })));

// Pre-load critical components on module load
if (typeof window !== 'undefined') {
  // Pre-load critical components when idle
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      import('./MetricCard');
      import('./GrowthChart');
      import('./Suggestions');
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      import('./MetricCard');
      import('./GrowthChart');
      import('./Suggestions');
    }, 100);
  }
}

import {
  UsersIcon, UserPlusIcon, UserRefreshIcon, BounceIcon,
  TimerIcon, PagesIcon, ArrowLeftIcon, ChartBarIcon,
  ShieldCheckIcon, RefreshIcon, DownloadIcon,
  CalendarIcon, TrendingUpIcon, ClockIcon, BellIcon,
  ChatBubbleLeftRightIcon
} from './Icons';
import { getRealTimeStats, markMessageAsRead, markNotificationAsRead, type RealTimeStats, getRefreshInterval, type ConnectionSpeed } from '../services/realTimeService';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from '../contexts/NetworkContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  domain: string;
  onReset: () => void;
  onGoToAdmin: () => void;
  onAddHelpRequest: (domain: string) => void;
  onSignOut?: () => void;
  onDomainChange?: (domain: string) => void;
  onNavigate: (route: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  domain, onReset, onGoToAdmin, onAddHelpRequest, onDomainChange, onNavigate
}) => {
  const { user, loading: authLoading } = useAuth();
  const { networkState, isSlowConnection, isOffline } = useNetwork();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'overview' | 'behavior' | 'sources' | 'conversions'>('overview');
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefreshing, setAutoRefreshing] = useState<boolean>(false);

  const [dataLoaded, setDataLoaded ]= useState<boolean>(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
  const [showScrollUp, setShowScrollUp] = useState<boolean>(false);
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState<boolean>(false);
  
  const [loadTimeout, setLoadTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  
  // Theme-aware styling functions
  const getThemeClasses = {
    background: () => resolvedTheme === 'dark' 
      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
      : 'bg-gradient-to-br from-gray-50 via-white to-blue-50',
    card: () => resolvedTheme === 'dark'
      ? 'bg-slate-800/50 backdrop-blur-sm border border-slate-700'
      : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm',
    header: () => resolvedTheme === 'dark'
      ? 'bg-slate-800/50 border-b border-slate-700'
      : 'bg-white/80 border-b border-gray-200',
    text: {
      primary: () => resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900',
      secondary: () => resolvedTheme === 'dark' ? 'text-slate-400' : 'text-gray-600',
      muted: () => resolvedTheme === 'dark' ? 'text-slate-500' : 'text-gray-500',
    },
    button: {
      primary: () => resolvedTheme === 'dark'
        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
      secondary: () => resolvedTheme === 'dark'
        ? 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-600/50 hover:text-white'
        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:text-gray-900',
      danger: () => resolvedTheme === 'dark'
        ? 'bg-red-600/20 text-red-300 border border-red-600/30 hover:bg-red-600/30 hover:text-white'
        : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:text-red-800',
    },
    badge: {
      success: () => resolvedTheme === 'dark'
        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
        : 'bg-green-100 text-green-800 border border-green-200',
      warning: () => resolvedTheme === 'dark'
        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        : 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      info: () => resolvedTheme === 'dark'
        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        : 'bg-blue-100 text-blue-800 border border-blue-200',
    },
    input: () => resolvedTheme === 'dark'
      ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
  };

  // Performance optimization: Use refs to track mounted state and prevent memory leaks
  const isMountedRef = useRef<boolean>(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (loadTimeout) clearTimeout(loadTimeout);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/getting-started');
      return;
    }
    // Check if trial is expired and show modal immediately to block access
    // Only show for free plan or if plan is not starter/pro/business and days_remaining <= 0
    if (user && user.days_remaining <= 0 && !['starter', 'pro', 'business'].includes((user.plan || '').toLowerCase())) {
      setShowTrialExpiredModal(true);
    }
  }, [authLoading, user, navigate]);

  // Scroll up functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollUp(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Memoized data fetching function
  const fetchRealData = useCallback(async (showLoading: boolean, isRefresh: boolean, range: '24h' | '7d' | '30d') => {
    if (showLoading && !initialLoadComplete) {
      setIsLoading(true);
    }

    if (isRefresh) {
      setAutoRefreshing(true);
    }

    try {
      if (!user) return;

      // Determine connection speed based on network state
      let connectionSpeed: ConnectionSpeed = 'fast';
      if (isOffline) {
        connectionSpeed = 'offline';
      } else if (isSlowConnection) {
        connectionSpeed = 'slow';
      } else if (networkState?.effectiveType === 'slow-2g' || networkState?.effectiveType === '2g') {
        connectionSpeed = 'slow';
      } else if (networkState?.effectiveType === '3g') {
        connectionSpeed = 'medium';
      } else {
        connectionSpeed = 'fast';
      }

      console.log('🔄 Fetching real data for domain:', domain, 'range:', range, 'connection speed:', connectionSpeed);
      const data = await getRealTimeStats(domain, user.id, range, connectionSpeed);
      
      // Map the data properly
      const mappedData: TrafficData = {
        ...data,
        currentVisitors: Array.isArray(data.recentVisitors) ? data.recentVisitors.length : (typeof data.recentVisitors === 'number' ? data.recentVisitors : 0),
        exitPages: (data.exitPages || []).map((ep: any) => ({
          pageUrl: ep.pageUrl ?? ep.url ?? '',
          url: ep.url ?? ep.pageUrl ?? '',
          averageTimeOnPage: ep.averageTimeOnPage ?? ep.avgTime ?? 0,
          avgTimeOnPage: ep.avgTimeOnPage ?? ep.averageTimeOnPage ?? ep.avgTime ?? 0,
          exitRate: ep.exitRate || 0,
          visits: ep.visits || 0,
          suggestions: ep.suggestions ?? [],
        })),
        trafficSources: (data.trafficSources || []).map((src: any) => ({
          source: src.source || 'Unknown',
          visitors: src.visitors || 0,
          bounceRate: src.bounceRate || 0,
          conversionRate: src.conversionRate || 0,
          ...src
        })),
        conversionFunnel: (data.conversionFunnel || []).map((stage: any) => ({
          stage: stage.stage,
          visitors: stage.visitors,
          dropOffCount: stage.dropOffCount,
          dropOffRate: stage.dropOffRate,
          suggestions: stage.suggestions ?? [],
          ...stage
        })),
        trends: data.trends || {
          bounceRate: 0,
          avgSessionDuration: 0,
          pagesPerVisit: 0,
          totalVisitors: 0,
          newVisitors: 0,
          returningVisitors: 0
        },
        total: false,
        data: false
      };
      
      setTrafficData(mappedData);
      setLastUpdated(new Date());
      setDataLoaded(true);
      
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
      
      console.log('✅ Data loaded successfully:', {
        totalVisitors: mappedData.totalVisitors,
        realData: mappedData.realData
      });

    } catch (error) {
      console.error('❌ Failed to fetch real-time data:', error);
      setDataLoaded(true);
    } finally {
      if (showLoading && !initialLoadComplete) {
        setIsLoading(false);
      }
      if (isRefresh) {
        setAutoRefreshing(false);
      }
    }
  }, [domain, user, initialLoadComplete]);

  // Single effect for data fetching with proper cleanup
  useEffect(() => {
    let isMounted = true;
    let refreshInterval: NodeJS.Timeout;

    const initializeDashboard = async () => {
      if (!isMounted || authLoading || !user?.id) return;

      try {
        console.log('🚀 Starting initial data fetch...');
        await fetchRealData(true, false, timeRange);

        if (isMounted) {
          console.log('✅ Initial data fetch completed');
        }
      } catch (err) {
        console.error("❌ Failed to load dashboard data", err);
        if (isMounted) {
          setIsLoading(false);
          setDataLoaded(true);
          setInitialLoadComplete(true);
        }
      }
    };

    // Only set up auto-refresh if we have real data and not already refreshing
    const setupAutoRefresh = () => {
      if (user?.id && isMounted && trafficData?.realData && !refreshing && !autoRefreshing) {
        refreshInterval = setInterval(() => {
          if (isMounted && !refreshing && !autoRefreshing) {
            fetchRealData(false, true, timeRange);
          }
        }, 60000); // 60 seconds - less frequent to prevent "stuck" feeling
      }
    };

    initializeDashboard().then(setupAutoRefresh);

    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [domain, user?.id, authLoading, timeRange, fetchRealData]);

  // Handle time range change
  const handleTimeRangeChange = async (newRange: '24h' | '7d' | '30d') => {
    setTimeRange(newRange);
    await fetchRealData(true, false, newRange);
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchRealData(false, false, timeRange);
    setRefreshing(false);
  };

  // Navigate back to the main application page
  const goToApp = () => {
    console.log('Dashboard: goToApp called, navigating to /app');
    window.location.href = '/welcome-portal';
  };

  const onSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      window.location.href = '/getting-started';
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  const exportData = () => {
    if (!trafficData) return;

    const dataStr = JSON.stringify({
      domain,
      trafficData,
      chartData,
      timeRange,
      exportedAt: new Date().toISOString(),
      reportType: 'analytics_export'
    }, null, 2);

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${domain}-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Fetch messages for the current user
  const fetchMessages = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(email, name)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user?.id]);

  // Fetch notifications for the current user only
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch messages sent by admin (admin replies) to this user
      const { data: adminMessages, error: adminError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(email, name)
        `)
        .eq('sender_id', null) // Admin messages have null sender_id
        .eq('recipient_id', user.id) // Messages sent to this user
        .order('created_at', { ascending: false })
        .limit(50);

      if (adminError) throw adminError;

      // Convert admin replies to notifications
      const notificationsFromAdminMessages = (adminMessages || []).map((message: any) => ({
        id: `admin_reply_${message.id}`,
        user_id: user.id,
        title: 'Reply from Admin',
        message: message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content,
        type: 'info' as const,
        read: message.read,
        created_at: message.created_at,
        action_text: 'View Chat'
      }));

      // Fetch actual notifications separately
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifError) throw notifError;

      // Combine admin reply notifications and actual notifications
      const combinedNotifications = [
        ...notificationsFromAdminMessages,
        ...(notifData || [])
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);

      setNotifications(combinedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user?.id]);

  // Fetch messages and notifications on component mount
  useEffect(() => {
    fetchMessages();
    fetchNotifications();
  }, [fetchMessages, fetchNotifications]);

  // Notification handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Message handlers
  const handleMarkMessageAsRead = (id: string) => {
    setMessages(prev => prev.map(message =>
      message.id === id ? { ...message, read: true } : message
    ));
  };

  const handleMarkAllMessagesAsRead = () => {
    setMessages(prev => prev.map(message => ({ ...message, read: true })));
  };

  // Header Actions Component
  const HeaderActions = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => setShowExportModal(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${getThemeClasses.button.secondary()}`}
      >
        <DownloadIcon className="w-4 h-4" />
        <span>Export</span>
      </button>

      <button
        onClick={handleManualRefresh}
        disabled={refreshing || autoRefreshing}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm font-medium ${getThemeClasses.button.secondary()}`}
      >
        <RefreshIcon className={`w-4 h-4 ${refreshing || autoRefreshing ? 'animate-spin' : ''}`} />
        <span>{(refreshing || autoRefreshing) ? 'Refreshing...' : 'Refresh'}</span>
      </button>

      <button
        onClick={() => setShowUserProfile(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg ${getThemeClasses.button.primary()}`}
      >
        <UsersIcon className="w-4 h-4" />
        <span>Profile</span>
      </button>

      {onSignOut && (
        <button
          onClick={onSignOut}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${getThemeClasses.button.danger()}`}
        >
          <span>Sign Out</span>
        </button>
      )}
    </div>
  );

  // Show loading screen only for initial load
  if (isLoading && !initialLoadComplete) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans ${getThemeClasses.background()} ${getThemeClasses.text.primary()}`}>
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className={`w-16 h-16 border-4 rounded-full animate-spin ${
              resolvedTheme === 'dark' 
                ? 'border-blue-500/30 border-t-blue-500' 
                : 'border-blue-200 border-t-blue-500'
            }`}></div>
            <img src="/mywoki-logo.png" alt="mywoki logo" className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full" />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold mb-2">Loading Real-time Analytics</p>
            <p className={getThemeClasses.text.secondary()}>Processing data for {domain}</p>
            <div className={`mt-4 text-sm ${getThemeClasses.text.muted()}`}>
              <div className={`w-2 h-2 rounded-full animate-pulse inline-block mr-2 ${
                resolvedTheme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'
              }`}></div>
              Connecting to analytics service...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show trial expired modal immediately if trial is expired - blocks access to dashboard
  if (showTrialExpiredModal) {
    return (
      <TrialExpiredModal
        isOpen={showTrialExpiredModal}
        daysRemaining={user?.days_remaining || 0}
        plan={user?.plan || 'free'}
        onSubscribe={() => {
          window.location.href = '/subscribe';
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 lg:p-8 ${getThemeClasses.background()} ${getThemeClasses.text.primary()}`}>
      {/* Chat Widget Container */}
      <div id="chat-widget-root"></div>
      
      {/* Header */}
      <header className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 rounded-2xl p-6 ${getThemeClasses.card()}`}>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => { console.log('Analyze Another Domain button clicked'); goToApp(); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer group z-10 ${
                resolvedTheme === 'dark' 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Analyze Another Domain</span>
            </button>
            
            {/* Time Range Selector */}
            <div className={`flex items-center gap-1 rounded-lg p-1 ${
              resolvedTheme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
            }`}>
              {(['24h', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => handleTimeRangeChange(range)}
                  disabled={refreshing || autoRefreshing}
                  className={`flex items-center gap-2 px-3 py-1 text-xs rounded-md transition-all ${
                    timeRange === range
                      ? 'bg-blue-600 text-white shadow-lg'
                      : resolvedTheme === 'dark'
                      ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  } ${refreshing || autoRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ClockIcon className="w-3 h-3" />
                  <span>{range}</span>
                </button>
              ))}
            </div>
            
            {/* Network Status */}
            <NetworkStatus />

            {/* Notification Icon Button */}
            <button
              onClick={() => setShowNotificationModal(true)}
              className={`ml-4 p-2 rounded-full transition-colors relative ${
                resolvedTheme === 'dark' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
              aria-label="Open Notifications"
            >
              <BellIcon className={`w-6 h-6 ${
                resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-500'
              }`} />
              {(() => {
                const unreadNotifications = notifications.filter(n => !n.read).length;
                const unreadMessages = messages.filter(m => !m.read && m.recipient_id === user?.id).length;
                const totalUnread = unreadNotifications + unreadMessages;
                return totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                );
              })()}
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className={`flex items-center gap-1 rounded-lg p-1 mt-4 ${
            resolvedTheme === 'dark' ? 'bg-slate-800/50' : 'bg-gray-100'
          }`}>
            {[
              { key: 'overview', label: 'Overview', icon: ChartBarIcon },
              { key: 'behavior', label: 'Exit Pages', icon: TrendingUpIcon },
              { key: 'sources', label: 'Traffic Sources', icon: UsersIcon },
              { key: 'conversions', label: 'Conversions', icon: ShieldCheckIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key as typeof activeView)}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-all ${
                  activeView === key
                    ? 'bg-blue-600 text-white shadow-lg'
                    : resolvedTheme === 'dark'
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-12 h-12 rounded-xl shadow-lg">
              <img src="/mywoki-logo.png" alt="mywoki logo" className="w-full h-full rounded-xl object-cover" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Organization Analytics</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className={`text-lg font-semibold ${
                  resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}>{domain}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trafficData?.realData 
                      ? getThemeClasses.badge.success()
                      : getThemeClasses.badge.warning()
                  }`}>
                    {trafficData?.realData ? ' Live Data' : ' No Tracking Data Yet'}
                  </span>
                  <span className={getThemeClasses.text.muted()}>
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                  {(autoRefreshing || refreshing) && (
                    <span className={`flex items-center gap-1 text-xs ${
                      resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-500'
                    }`}>
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        resolvedTheme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'
                      }`}></div>
                      {autoRefreshing ? 'Auto-refreshing...' : 'Refreshing...'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <HeaderActions />
      </header>

      {/* Auto-refresh indicator */}
      {autoRefreshing && (
        <div className={`mb-4 p-3 rounded-lg flex items-center justify-center gap-2 ${
          resolvedTheme === 'dark' 
            ? 'bg-blue-500/20 border border-blue-500/30' 
            : 'bg-blue-100 border border-blue-200'
        }`}>
          <div className={`w-3 h-3 border rounded-full animate-spin ${
            resolvedTheme === 'dark' 
              ? 'border-blue-400 border-t-transparent' 
              : 'border-blue-500 border-t-transparent'
          }`}></div>
          <span className={`text-sm ${
            resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          }`}>Auto-refreshing data...</span>
        </div>
      )}

      {/* Main Content Grid */}
      <main className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Column - Metrics & Chart */}
        <div className="xl:col-span-3 space-y-6">
          {/* Code Snippet - Only show if no real data */}
          {!trafficData?.realData && (
            <div id="code-snippet-section">
              <CodeSnippet domain={domain} onAddHelpRequest={onAddHelpRequest} />
            </div>
          )}
          
          {/* Overview View */}
          {activeView === 'overview' && (
            <>
              {/* Quick Stats Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Suspense fallback={<div className={`rounded-2xl p-6 ${getThemeClasses.card()}`}>Loading...</div>}>
                  <MetricCard
                    icon={<UsersIcon className="w-5 h-5" />}
                    label="Total Visitors"
                    timeRange={timeRange}
                    value={trafficData?.totalVisitors.toLocaleString() || '0'}
                    trend={trafficData?.trends?.totalVisitors || 0}
                    showTrend={trafficData?.realData || false}
                    size="small"
                    domain={domain}
                    metricType="totalVisitors"
                    onRefresh={handleManualRefresh}
                    isLoading={refreshing || autoRefreshing}
                  />
                </Suspense>
                <Suspense fallback={<div className={`rounded-2xl p-6 ${getThemeClasses.card()}`}>Loading...</div>}>
                  <MetricCard
                    icon={<UserPlusIcon className="w-5 h-5" />}
                    label="New Visitors"
                    timeRange={timeRange}
                    value={trafficData?.newVisitors.toLocaleString() || '0'}
                    trend={trafficData?.trends?.newVisitors || 0}
                    showTrend={trafficData?.realData || false}
                    size="small"
                    domain={domain}
                    metricType="newVisitors"
                    onRefresh={handleManualRefresh}
                    isLoading={refreshing || autoRefreshing}
                  />
                </Suspense>
                <Suspense fallback={<div className={`rounded-2xl p-6 ${getThemeClasses.card()}`}>Loading...</div>}>
                  <MetricCard
                    icon={<UserRefreshIcon className="w-5 h-5" />}
                    label="Returning Visitors"
                    timeRange={timeRange}
                    value={trafficData?.returningVisitors.toLocaleString() || '0'}
                    trend={trafficData?.trends?.returningVisitors || 0}
                    showTrend={trafficData?.realData || false}
                    size="small"
                    domain={domain}
                    metricType="returningVisitors"
                    onRefresh={handleManualRefresh}
                    isLoading={refreshing || autoRefreshing}
                  />
                </Suspense>
              </div>

              {/* Detailed Metrics & Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <MetricCard
                    icon={<BounceIcon className="w-5 h-5" />}
                    label="Bounce Rate"
                    timeRange={timeRange}
                    value={`${trafficData?.bounceRate || 0}%`}
                    trend={trafficData?.trends?.bounceRate || 0}
                    isLowerGood={true}
                    showTrend={trafficData?.realData || false}
                    size="large"
                    domain={domain}
                    metricType="bounceRate"
                    onRefresh={handleManualRefresh}
                    isLoading={refreshing || autoRefreshing}
                  />
                  <MetricCard
                    icon={<TimerIcon className="w-5 h-5" />}
                    label="Avg. Session"
                    timeRange={timeRange}
                    value={trafficData ? `${Math.floor(trafficData.avgSessionDuration / 60)}m ${trafficData.avgSessionDuration % 60}s` : '0m 0s'}
                    trend={trafficData?.trends?.avgSessionDuration || 0}
                    showTrend={trafficData?.realData || false}
                    size="large"
                    domain={domain}
                    metricType="avgSessionDuration"
                    onRefresh={handleManualRefresh}
                    isLoading={refreshing || autoRefreshing}
                  />
                  <MetricCard
                    icon={<PagesIcon className="w-5 h-5" />}
                    label="Pages / Visit"
                    timeRange={timeRange}
                    value={trafficData?.pagesPerVisit.toString() || '0'}
                    trend={trafficData?.trends?.pagesPerVisit || 0}
                    showTrend={trafficData?.realData || false}
                    size="large"
                    domain={domain}
                    metricType="pagesPerVisit"
                    onRefresh={handleManualRefresh}
                    isLoading={refreshing || autoRefreshing}
                  />
                </div>

                <div className={`lg:col-span-2 h-80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm ${getThemeClasses.card()}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div className={`flex items-center gap-2 text-sm ${getThemeClasses.text.secondary()}`}>
                      <CalendarIcon className="w-4 h-4" />
                      <span>Real-time - {timeRange}</span>
                      {(refreshing || autoRefreshing) && (
                        <div className={`flex items-center gap-1 text-xs ${
                          resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-500'
                        }`}>
                          <div className={`w-2 h-2 rounded-full animate-pulse ${
                            resolvedTheme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'
                          }`}></div>
                          Updating...
                        </div>
                      )}
                    </div>
                  </div>
                  <GrowthChart
                    domain={domain}
                    timeRange={timeRange}
                    data={trafficData}
                    isLoading={refreshing || autoRefreshing}
                    onRefresh={handleManualRefresh}
                    
                  />
                </div>
              </div>
            </>
          )}

          {/* Behavior View */}
          {activeView === 'behavior' && trafficData?.exitPages && trafficData.exitPages.length > 0 && (
            <ExitPagesAnalysis 
              domain={domain}
              userId={user?.id || ''}
              isLoading={refreshing || autoRefreshing}
              onRefresh={handleManualRefresh}
            />
          )}

          {/* Sources View */}
          {activeView === 'sources' && trafficData?.trafficSources && trafficData.trafficSources.length > 0 && (
            <TrafficSourcePerformance 
              data={trafficData.trafficSources} 
              domain={domain} 
            />
          )}

          {/* Conversions View */}
          {activeView === 'conversions' && (
            <ConversionFunnel
              data={trafficData?.conversionFunnel || []}
              domain={domain}
              pageViews={trafficData?.visitors?.flatMap(v => v.pageViews) || []}
            />
          )}

          {/* Weekly Summary */}
          {trafficData && (
            <div className={`rounded-2xl p-6 shadow-2xl backdrop-blur-sm ${getThemeClasses.card()}`}>
              <WeeklySummary trafficData={trafficData} domain={domain} />
            </div>
          )}

          {/* Visitor Data Table */}
          {trafficData && (
            <div className={`rounded-2xl p-6 shadow-2xl backdrop-blur-sm mt-6 ${getThemeClasses.card()}`}>
              <VisitorDataTable 
                domain={domain} 
                userId={user?.id || ''}
              />
            </div>
          )}
        </div>

        {/* Right Column - Suggestions & Quick Actions */}
        <div className="xl:col-span-1 space-y-6">
          {/* AI Suggestions */}
          <div className={`rounded-2xl p-6 shadow-2xl backdrop-blur-sm ${getThemeClasses.card()}`}>
            <Suggestions trafficData={trafficData} domain={domain} />
          </div>
          
          <div className="h-screen w-full flex">
            <ChatWidget />
          </div>

          {/* Quick Actions */}
          <QuickActions 
            domain={domain}
            onExport={exportData}
            onAddHelpRequest={onAddHelpRequest}
            hasRealData={trafficData?.realData || false}
            onManualRefresh={handleManualRefresh}
            refreshing={refreshing || autoRefreshing}
          />
        </div>
      </main>

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile
          onClose={() => setShowUserProfile(false)}
          currentDomain={domain}
          onSelectDomain={(selectedDomain: string) => {
            if (onDomainChange) {
              onDomainChange(selectedDomain);
            }
            setShowUserProfile(false);
          }}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          domain={domain}
          timeRange={timeRange}
          trafficData={trafficData}
          chartData={chartData}
          onJsonExport={exportData}
        />
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          notifications={notifications}
          messages={messages}
          onMarkAsRead={markNotificationAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDeleteNotification={handleDeleteNotification}
          onMarkMessageAsRead={markMessageAsRead}
          onMarkAllMessagesAsRead={handleMarkAllMessagesAsRead}
        />
      )}

      {/* Scroll Up Button */}
      {showScrollUp && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
          aria-label="Scroll to top"
        >
          <ArrowLeftIcon className="w-5 h-5 rotate-90" />
        </button>
      )}

      {/* Trial Expired Modal */}
      {showTrialExpiredModal && (
        <TrialExpiredModal
          isOpen={showTrialExpiredModal}
          onClose={() => setShowTrialExpiredModal(false)}
          daysRemaining={user?.days_remaining || 0}
          plan={user?.plan || 'free'}
          onSubscribe={() => {
            window.location.href = '/subscribe';
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
