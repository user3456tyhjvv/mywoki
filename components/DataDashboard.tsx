import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChartBarIcon, SparklesIcon, ShieldCheckIcon, UsersIcon, GlobeIcon, TrendingUpIcon, DownloadIcon, RefreshIcon, CalendarIcon, FilterIcon, UserIcon, EyeIcon, ClockIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);


interface Domain {
  id: string;
  user_id: string;
  domain: string;
  name?: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'free' | 'starter' | 'pro' | 'business';
  days_remaining: number;
  total_visitors: number;
  total_page_views: number;
  bounce_rate: number;
  avg_session_duration: number;
  last_analytics_update?: string;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  created_at: string | number | Date;
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface DashboardStats {
  totalUsers: number;
  totalDomains: number;
  totalVisitors: number;
  totalScrapes: number;
  activeDomains: number;
  avgBounceRate: number;
  avgSessionDuration: number;
}

interface ScrapeRun {
  id: string;
  domain_id: string;
  user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  target_url: string;
  images_found: number;
  videos_found: number;
  links_found: number;
  content_quality_score: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

interface TrafficEvent {
  id: string;
  domain_id: string;
  event_type: 'page_view' | 'session_start' | 'session_end' | 'conversion' | 'bounce';
  visitor_id: string;
  session_id: string;
  page_url?: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
  country?: string;
  city?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  timestamp: string;
  duration?: number;
  metadata?: any;
}

interface ExitPage {
  id: string;
  domain_id: string;
  page_url: string;
  exit_count: number;
  total_views: number;
  exit_rate: number;
  avg_time_on_page: number;
  bounce_rate: number;
  last_updated: string;
}

interface TrafficSource {
  id: string;
  domain_id: string;
  source: string;
  medium?: string;
  campaign?: string;
  visitors: number;
  sessions: number;
  page_views: number;
  bounce_rate: number;
  conversion_rate: number;
  avg_session_duration: number;
  last_updated: string;
}

interface Conversion {
  id: string;
  domain_id: string;
  funnel_stage: string;
  visitors: number;
  conversions: number;
  conversion_rate: number;
  drop_off_count: number;
  drop_off_rate: number;
  avg_time_to_convert: number;
  created_at: string;
  updated_at: string;
}

interface ScrapedItem {
  id: string;
  domain_id: string;
  scrape_run_id: string;
  item_type: 'image' | 'video' | 'link' | 'content' | 'heading';
  url?: string;
  title?: string;
  content?: string;
  metadata?: any;
  created_at: string;
}

interface Admin {
  id: string;
  user_id: string;
  role: 'admin' | 'super_admin';
  created_at: string;
}

const DataDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'scraping' | 'users'>('overview');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [scrapeRuns, setScrapeRuns] = useState<ScrapeRun[]>([]);
  const [trafficEvents, setTrafficEvents] = useState<TrafficEvent[]>([]);
  const [exitPages, setExitPages] = useState<ExitPage[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [scrapedItems, setScrapedItems] = useState<ScrapedItem[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDomains: 0,
    totalVisitors: 0,
    totalScrapes: 0,
    activeDomains: 0,
    avgBounceRate: 0,
    avgSessionDuration: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Check if user is admin by querying the admins table
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      setAdminCheckLoading(true);
      try {
        // Check if user has admin metadata or role
        if (user.role === 'admin' || user.user_metadata?.is_admin) {
          setIsAdmin(true);
          setAdminCheckLoading(false);
          return;
        }

        // Fallback: check admins table by user_id
        const { data, error } = await supabase
          .from('admins')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error checking admin status:', error);
          setAdminCheckLoading(false);
          return;
        }

        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/admin-login');
      return;
    }

    // Don't redirect if user has admin role or metadata
    if (user.role === 'admin' || user.user_metadata?.is_admin) {
      loadDashboardData();
      return;
    }

    if (adminCheckLoading) {
      // Wait for admin check to complete
      return;
    }

    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    loadDashboardData();
  }, [user, isAdmin, adminCheckLoading, navigate]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Load all domains
      const { data: domainsData, error: domainsError } = await supabase
        .from('domains')
        .select('*')
        .order('created_at', { ascending: false });

      if (domainsError) throw domainsError;
      setDomains(domainsData || []);

      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load scrape runs
      const { data: scrapesData, error: scrapesError } = await supabase
        .from('scrape_runs')
        .select('*')
        .order('created_at', { ascending: false });

      if (scrapesError) throw scrapesError;
      setScrapeRuns(scrapesData || []);

      // Load traffic events
      const { data: trafficEventsData, error: trafficEventsError } = await supabase
        .from('traffic_events')
        .select('*')
        .order('timestamp', { ascending: false });

      if (trafficEventsError) throw trafficEventsError;
      setTrafficEvents(trafficEventsData || []);

      // Load exit pages
      const { data: exitPagesData, error: exitPagesError } = await supabase
        .from('exit_pages')
        .select('*')
        .order('last_updated', { ascending: false });

      if (exitPagesError) throw exitPagesError;
      setExitPages(exitPagesData || []);

      // Load traffic sources
      const { data: trafficSourcesData, error: trafficSourcesError } = await supabase
        .from('traffic_sources')
        .select('*')
        .order('last_updated', { ascending: false });

      if (trafficSourcesError) throw trafficSourcesError;
      setTrafficSources(trafficSourcesData || []);

      // Load conversions
      const { data: conversionsData, error: conversionsError } = await supabase
        .from('conversions')
        .select('*')
        .order('created_at', { ascending: false });

      if (conversionsError) throw conversionsError;
      setConversions(conversionsData || []);

      // Load scraped items
      const { data: scrapedItemsData, error: scrapedItemsError } = await supabase
        .from('scraped_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (scrapedItemsError) throw scrapedItemsError;
      setScrapedItems(scrapedItemsData || []);

      // Load admins
      const { data: adminsData, error: adminsError } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminsError) throw adminsError;
      setAdmins(adminsData || []);

      // Calculate stats
      const totalUsers = usersData?.length || 0;
      const totalDomains = domainsData?.length || 0;
      const totalVisitors = domainsData?.reduce((sum, domain) => sum + domain.total_visitors, 0) || 0;
      const totalScrapes = scrapesData?.length || 0;
      const activeDomains = domainsData?.filter(d => d.status === 'active').length || 0;
      const avgBounceRate = domainsData?.length ?
        domainsData.reduce((sum, domain) => sum + domain.bounce_rate, 0) / domainsData.length : 0;
      const avgSessionDuration = domainsData?.length ?
        domainsData.reduce((sum, domain) => sum + domain.avg_session_duration, 0) / domainsData.length : 0;

      setStats({
        totalUsers,
        totalDomains,
        totalVisitors,
        totalScrapes,
        activeDomains,
        avgBounceRate,
        avgSessionDuration
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/admin-login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const filteredDomains = useMemo(() => {
    return domains.filter(domain => {
      const matchesSearch = domain.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          domain.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || domain.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [domains, searchTerm, statusFilter]);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: number;
    color?: string;
  }> = ({ title, value, icon, trend, color = 'blue' }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/20 rounded-xl p-6 hover:bg-slate-800/70 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-200 mt-1">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className={`p-3 bg-${color}-500/20 rounded-full`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-200">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900/80 border-r border-slate-700/10 px-4 py-6 flex flex-col overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center text-xl">
            📊
          </div>
          <span className="font-bold text-lg">DataPanel</span>
        </div>

        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-3 px-2">Main</div>
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-600/20 to-violet-600/20 text-blue-400 border-l-3 border-blue-600 pl-2'
                  : 'text-slate-300 hover:bg-slate-700/10'
              }`}
            >
              <span className="text-lg">📈</span>
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-blue-600/20 to-violet-600/20 text-blue-400 border-l-3 border-blue-600 pl-2'
                  : 'text-slate-300 hover:bg-slate-700/10'
              }`}
            >
              <span className="text-lg">📊</span>
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('scraping')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all ${
                activeTab === 'scraping'
                  ? 'bg-gradient-to-r from-blue-600/20 to-violet-600/20 text-blue-400 border-l-3 border-blue-600 pl-2'
                  : 'text-slate-300 hover:bg-slate-700/10'
              }`}
            >
              <span className="text-lg">🔍</span>
              <span>Scraping Control</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-3 px-2">Admin</div>
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-blue-600/20 to-violet-600/20 text-blue-400 border-l-3 border-blue-600 pl-2'
                  : 'text-slate-300 hover:bg-slate-700/10'
              }`}
            >
              <span className="text-lg">👥</span>
              <span>Users</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-700/10">
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-900/50 border-b border-slate-700/10 px-8 py-5 flex justify-between items-center backdrop-blur-sm">
          <h1 className="text-2xl font-bold">Admin Data Control Panel</h1>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-700/10 text-slate-300 rounded-lg hover:bg-slate-700/20 transition-colors border border-slate-600/20">
              <span>🔔</span>
              Notifications
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-700/10 text-slate-300 rounded-lg hover:bg-slate-700/20 transition-colors border border-slate-600/20">
              <span>👤</span>
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors border border-red-600/20"
            >
              <span>🚪</span>
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={<UsersIcon className="w-6 h-6 text-blue-600" />}
                  color="blue"
                />
                <StatCard
                  title="Total Domains"
                  value={stats.totalDomains}
                  icon={<GlobeIcon className="w-6 h-6 text-green-600" />}
                  color="green"
                />
                <StatCard
                  title="Total Visitors"
                  value={stats.totalVisitors.toLocaleString()}
                  icon={<EyeIcon className="w-6 h-6 text-purple-600" />}
                  color="purple"
                />
                <StatCard
                  title="Scrape Jobs"
                  value={stats.totalScrapes}
                  icon={<SparklesIcon className="w-6 h-6 text-orange-600" />}
                  color="orange"
                />
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {scrapeRuns.slice(0, 5).map((run) => (
                    <div key={run.id} className="flex items-center justify-between py-3 border-b border-slate-700/20 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          run.status === 'completed' ? 'bg-green-500' :
                          run.status === 'running' ? 'bg-blue-500' :
                          run.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{run.target_url}</p>
                          <p className="text-xs text-slate-400">
                            {run.status} • {new Date(run.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-300">
                          {run.images_found + run.videos_found + run.links_found} items found
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* Filters */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/20 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search domains..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Domains Table */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/20 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/20">
                  <h3 className="text-lg font-semibold text-slate-200">Domain Analytics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/30">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Domain</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Visitors</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Bounce Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Session</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Last Update</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-800/30 divide-y divide-slate-700/20">
                      {filteredDomains.map((domain) => (
                        <tr key={domain.id} className="hover:bg-slate-700/20">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-slate-200">{domain.domain}</div>
                              {domain.name && <div className="text-sm text-slate-400">{domain.name}</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              domain.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              domain.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {domain.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">{domain.plan}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">{domain.total_visitors.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">{domain.bounce_rate}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                            {Math.floor(domain.avg_session_duration / 60)}m {domain.avg_session_duration % 60}s
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {domain.last_analytics_update ? new Date(domain.last_analytics_update).toLocaleDateString() : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scraping' && (
            <div className="space-y-8">
              {/* Scraping Controls */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-200 mb-4">Scraping Control Panel</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Domain</label>
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a domain...</option>
                      {domains.map((domain) => (
                        <option key={domain.id} value={domain.domain}>{domain.domain}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      disabled={!selectedDomain}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                      Start Scrape
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrape Runs Table */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/20 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/20">
                  <h3 className="text-lg font-semibold text-slate-200">Scrape Jobs</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/30">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Domain</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Items Found</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Quality Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Started</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-800/30 divide-y divide-slate-700/20">
                      {scrapeRuns.map((run) => (
                        <tr key={run.id} className="hover:bg-slate-700/20">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">{run.target_url}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              run.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              run.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                              run.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {run.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                            {run.images_found + run.videos_found + run.links_found}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                            {run.content_quality_score}/10
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {run.started_at ? new Date(run.started_at).toLocaleString() : 'Not started'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {run.started_at && run.completed_at ?
                              `${Math.round((new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s` :
                              run.started_at ? 'Running...' : 'Pending'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8">
              {/* Users Table */}
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/20 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/20">
                  <h3 className="text-lg font-semibold text-slate-200">User Management</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/30">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Domains</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-800/30 divide-y divide-slate-700/20">
                      {users.map((user) => {
                        const userDomains = domains.filter(d => d.user_id === user.id);
                        return (
                          <tr key={user.id} className="hover:bg-slate-700/20">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {user.avatar_url ? (
                                  <img className="h-8 w-8 rounded-full" src={user.avatar_url} alt="" />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center">
                                    <UsersIcon className="w-4 h-4 text-slate-300" />
                                  </div>
                                )}
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-slate-200">{user.name || 'No name'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">{userDomains.length}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-400 hover:text-blue-300">View Details</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
    </div>
    </div>
  );
};

export default DataDashboard;
