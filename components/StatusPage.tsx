import React, { useState, useEffect } from 'react';
import { CheckIcon, XIcon, HelpCircleIcon, GlobeIcon, CogIcon, ClockIcon } from './Icons';
import { ArrowLeftIcon, RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, MinusIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'unknown';
  responseTime: number;
  lastChecked: string;
  description: string;
}

interface PerformanceMetric {
  name: string;
  value: string | number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

interface SystemStatus {
  overall: 'operational' | 'degraded' | 'outage';
  services: ServiceStatus[];
  metrics: {
    uptime: number;
    responseTime: number;
    activeUsers: number;
    dataProcessed: string;
  };
  lastUpdated: string;
}

interface UpdateItem {
  id: string;
  type: 'maintenance' | 'incident';
  status: 'completed' | 'resolved' | 'scheduled';
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  affectedServices: string[];
  impact: string;
}

const StatusPage: React.FC = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnlineCheck, setLastOnlineCheck] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineCheck(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastOnlineCheck(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check
    const connectivityCheck = setInterval(async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        setIsOnline(response.ok);
      } catch (error) {
        setIsOnline(false);
      }
      setLastOnlineCheck(new Date());
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectivityCheck);
    };
  }, []);

  // Fetch status data
  const fetchStatusData = async () => {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data: SystemStatus = await response.json();
      setSystemStatus(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load status data');
      console.error('Status fetch error:', err);
    }
  };

  // Fetch updates data
  const fetchUpdatesData = async () => {
    try {
      const response = await fetch('/api/updates');
      if (!response.ok) throw new Error('Failed to fetch updates');
      const data = await response.json();
      setUpdates(data.updates || []);
    } catch (err) {
      console.error('Updates fetch error:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchStatusData(), fetchUpdatesData()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Periodic updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStatusData();
      fetchUpdatesData();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckIcon className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <HelpCircleIcon className="w-5 h-5 text-yellow-500" />;
      case 'outage':
        return <XIcon className="w-5 h-5 text-red-500" />;
      default:
        return <HelpCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-700 bg-green-100';
      case 'degraded':
        return 'text-yellow-700 bg-yellow-100';
      case 'outage':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatUptime = (uptime: number) => {
    return uptime.toFixed(1);
  };

  const onNavigate = (route: string) => {
    navigate(route);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <ArrowLeftIcon
          className="w-6 h-6 cursor-pointer hover:text-brand-accent transition-colors mb-4"
          onClick={() => onNavigate('/')}
        />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">System Status</h1>
            <div className="flex items-center justify-center gap-2">
              <RefreshCwIcon className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-xl text-gray-600">Loading status data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <ArrowLeftIcon
          className="w-6 h-6 cursor-pointer hover:text-brand-accent transition-colors mb-4"
          onClick={() => onNavigate('/')}
        />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">System Status</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <XIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-900 mb-2">Failed to Load Status</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  fetchStatusData();
                  fetchUpdatesData();
                  setLoading(false);
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const performanceMetrics: PerformanceMetric[] = [
    {
      name: 'Average Response Time',
      value: systemStatus?.metrics.responseTime || 0,
      unit: 'ms',
      status: 'good',
      trend: 'stable'
    },
    {
      name: 'Uptime (30 days)',
      value: systemStatus?.metrics.uptime || 0,
      unit: '%',
      status: 'good',
      trend: 'up'
    },
    {
      name: 'Active Users',
      value: systemStatus?.metrics.activeUsers || 0,
      unit: '',
      status: 'good',
      trend: 'up'
    },
    {
      name: 'Data Processed',
      value: systemStatus?.metrics.dataProcessed || '0 GB',
      unit: '',
      status: 'good',
      trend: 'up'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <ArrowLeftIcon
        className="w-6 h-6 cursor-pointer hover:text-brand-accent transition-colors mb-4"
        onClick={() => onNavigate('/')}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            System Status
          </h1>
          <p className="text-xl text-gray-600">
            Real-time monitoring of Insight AI services and performance
          </p>
        </div>

        {/* Connectivity Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GlobeIcon className={`w-6 h-6 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Internet Connection
                </h3>
                <p className="text-sm text-gray-600">
                  Last checked: {lastOnlineCheck.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isOnline ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          {!isOnline && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <XIcon className="w-5 h-5 text-red-500" />
                <p className="text-red-800 text-sm">
                  <strong>Connection Issue:</strong> You're currently offline. Some features may not work properly.
                  Please check your internet connection and try again.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Overall Status */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all hover:scale-105">
            <div className="flex items-center gap-3 mb-4">
              <CogIcon className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(systemStatus?.overall || 'operational')}
              <span className={`font-medium ${systemStatus?.overall === 'operational' ? 'text-green-700' : systemStatus?.overall === 'degraded' ? 'text-yellow-700' : 'text-red-700'}`}>
                {systemStatus?.overall === 'operational' ? 'All Systems Operational' :
                 systemStatus?.overall === 'degraded' ? 'Systems Degraded' : 'Systems Outage'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {systemStatus?.overall === 'operational' ? 'All services are running normally' :
               systemStatus?.overall === 'degraded' ? 'Some services are experiencing issues' : 'Major system outage detected'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all hover:scale-105">
            <div className="flex items-center gap-3 mb-4">
              <CogIcon className="w-6 h-6 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {systemStatus?.metrics.responseTime || 0}ms
            </div>
            <p className="text-sm text-gray-600">
              Average response time
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all hover:scale-105">
            <div className="flex items-center gap-3 mb-4">
              <CogIcon className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">Uptime</h3>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatUptime(systemStatus?.metrics.uptime || 0)}%
            </div>
            <p className="text-sm text-gray-600">
              Last 30 days
            </p>
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Service Status</h2>
            <p className="text-gray-600 mt-1">Current status of all Insight AI services</p>
          </div>

          <div className="divide-y divide-gray-200">
            {systemStatus?.services.map((service, index) => (
              <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                      {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {service.responseTime}ms response time
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Updated {new Date(service.lastChecked).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>
            <p className="text-gray-600 mt-1">Key performance indicators and statistics</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`text-3xl font-bold ${getMetricStatusColor(metric.status)} mb-2`}>
                  {typeof metric.value === 'number' && metric.unit === '%' ? formatUptime(metric.value) : metric.value}
                  {metric.unit}
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">{metric.name}</h4>
                <div className="flex items-center justify-center gap-1">
                  {metric.trend === 'up' && <TrendingUpIcon className="w-4 h-4 text-green-500" />}
                  {metric.trend === 'down' && <TrendingDownIcon className="w-4 h-4 text-red-500" />}
                  {metric.trend === 'stable' && <MinusIcon className="w-4 h-4 text-gray-500" />}
                  <span className="text-xs text-gray-500">
                    {metric.trend === 'up' ? 'Improving' : metric.trend === 'down' ? 'Declining' : 'Stable'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Updates */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Recent Updates</h2>
            <p className="text-gray-600 mt-1">Past incidents and maintenance windows</p>
          </div>

          <div className="p-6">
            {updates.length === 0 ? (
              <div className="text-center py-8">
                <CheckIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear</h3>
                <p className="text-gray-600">
                  No recent incidents or maintenance windows. All systems are operating normally.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {updates.map((update, index) => (
                  <div key={update.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      {update.type === 'maintenance' ? (
                        <ClockIcon className="w-5 h-5 text-blue-500 mt-1" />
                      ) : (
                        <XIcon className="w-5 h-5 text-red-500 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{update.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            update.status === 'completed' ? 'bg-green-100 text-green-800' :
                            update.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {update.status.charAt(0).toUpperCase() + update.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{update.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Affected: {update.affectedServices.join(', ')}</span>
                          <span>Impact: {update.impact}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>Started: {new Date(update.startTime).toLocaleString()}</span>
                          <span>Ended: {new Date(update.endTime).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            Status page updates automatically. Last updated: {lastUpdated.toLocaleString()}
          </p>
          <p className="mt-2">
            For urgent issues, contact our support team at{' '}
            <a href="mailto:support@insight-ai.com" className="text-blue-600 hover:underline">
              support@insight-ai.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;
