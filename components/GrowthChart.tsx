import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { ChartDataPoint, TrafficData } from '../types';
import { useAuth } from '../contexts/AuthContext';

// API base URL - use localhost in development, production URL otherwise
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : 'https://tooler-io.onrender.com';

interface GrowthChartProps {
  domain: string;
  timeRange: '24h' | '7d' | '30d';
  isLoading?: boolean;
  data?: TrafficData;
  onRefresh?: () => void;
}

const GrowthChart: React.FC<GrowthChartProps> = ({
  domain,
  timeRange,
  isLoading = false,
  data,
  onRefresh
}) => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRealData, setHasRealData] = useState(false);

  // Generate zero data for unregistered domains or no tracking
  const generateZeroData = useCallback((): ChartDataPoint[] => {
    console.log('📊 Generating zero data for domain:', domain);

    const now = Date.now();
    const points: ChartDataPoint[] = [];

    let dataPoints = 24;
    let timeIncrement = 60 * 60 * 1000; // 1 hour

    switch (timeRange) {
      case '7d':
        dataPoints = 7;
        timeIncrement = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '30d':
        dataPoints = 30;
        timeIncrement = 24 * 60 * 60 * 1000; // 1 day
        break;
    }

    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = now - (i * timeIncrement);
      const date = new Date(timestamp);

      let timeLabel = '';
      switch (timeRange) {
        case '24h':
          timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          break;
        case '7d':
          timeLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case '30d':
          timeLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
      }

      points.push({
        time: timeLabel,
        visitors: 0, // Always zero for unregistered domains
        pageViews: 0, // Always zero for unregistered domains
        timestamp,
        date: date.toLocaleDateString(),
        fullDate: date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
    }

    return points;
  }, [timeRange, domain]);

  // Enhanced fetch function with better error handling
  const fetchChartData = useCallback(async () => {
    if (!user?.id || !domain) {
      console.log('📊 Missing user ID or domain for chart data');
      setChartData(generateZeroData());
      setHasRealData(false);
      return;
    }

    // Don't fetch if already loading
    if (chartLoading) {
      console.log('📊 Already loading chart data, skipping');
      return;
    }

    setChartLoading(true);
    setError(null);
    setHasRealData(false);

    try {
      console.log(`📊 Fetching chart data for ${domain}, range: ${timeRange} from ${API_BASE_URL}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `${API_BASE_URL}/api/chart-data/${encodeURIComponent(domain)}?range=${timeRange}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
            'Accept': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      // Check for CORS issues first
      if (response.type === 'opaque' || response.status === 0) {
        throw new Error('CORS blocked the request. Check backend CORS configuration.');
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Failed to fetch chart data`;

        if (response.status === 403) {
          errorMessage = 'Access forbidden - trial may have expired or domain ownership issue';
        } else if (response.status === 404) {
          errorMessage = 'Chart data endpoint not found';
        } else if (response.status >= 500) {
          errorMessage = 'Server error - please try again later';
        }

        throw new Error(errorMessage);
      }

      const apiData = await response.json();
      console.log('📊 Received chart data:', apiData);

      // Check if we have real data from the API
      if (apiData && Array.isArray(apiData) && apiData.length > 0) {
        // Check if this is real data (not empty/zero data)
        const hasValidData = apiData.some((item: any) => 
          (item.visitors && item.visitors > 0) || 
          (item.pageViews && item.pageViews > 0)
        );

        if (hasValidData) {
          // Transform API data to match ChartDataPoint format
          const formattedData = apiData.map((item: any) => ({
            time: item.time,
            visitors: item.visitors || 0,
            pageViews: item.pageViews || 0,
            timestamp: item.timestamp || new Date().getTime(),
            date: item.date || item.time,
            fullDate: item.date || new Date(item.timestamp).toLocaleDateString()
          }));

          setChartData(formattedData);
          setHasRealData(true);
          console.log('📊 Formatted chart data with real data:', formattedData);
        } else {
          // API returned data but all zeros - domain registered but no traffic
          console.log('📊 Domain registered but no traffic data, showing zeros');
          setChartData(generateZeroData());
          setHasRealData(false);
        }
      } else {
        // No data from API - domain may not be registered or no tracking
        console.log('📊 No chart data available from API, showing zeros');
        setChartData(generateZeroData());
        setHasRealData(false);
      }
    } catch (err: any) {
      console.error('❌ Error fetching chart data:', err);

      let errorMessage = 'Failed to fetch chart data';

      if (err.name === 'AbortError') {
        errorMessage = 'Request timeout - server is taking too long to respond';
      } else if (err.message.includes('CORS') || err.message.includes('NetworkError')) {
        errorMessage = `Network error: Cannot connect to analytics server. This is usually a CORS configuration issue on the backend.`;
      } else if (err.message.includes('forbidden')) {
        errorMessage = 'Access denied: Please check your subscription status and domain ownership.';
      }

      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
      setChartData(generateZeroData());
      setHasRealData(false);
    } finally {
      setChartLoading(false);
    }
  }, [domain, timeRange, user?.id, generateZeroData, chartLoading]); // Added chartLoading to dependencies

  // Fetch chart data when dependencies change - FIXED to prevent loops
  useEffect(() => {
    console.log('🔄 GrowthChart useEffect triggered', { domain, timeRange, userId: user?.id });
    fetchChartData();
  }, [domain, timeRange, user?.id]); // Only depend on these core props

  // Handle manual refresh
  const handleRefresh = () => {
    console.log('🔄 Manual chart refresh');
    if (onRefresh && !isLoading) {
      onRefresh();
    }
    fetchChartData();
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{dataPoint.fullDate || label}</p>
          <p className="text-blue-400">
            Visitors: <span className="font-bold text-white">{dataPoint.visitors}</span>
          </p>
          {dataPoint.pageViews !== undefined && (
            <p className="text-green-400">
              Page Views: <span className="font-bold text-white">{dataPoint.pageViews}</span>
            </p>
          )}
          {!hasRealData && (
            <p className="text-yellow-400 text-xs mt-1">
              ⚠️ No tracking data - domain may not be registered
            </p>
          )}
          <p className="text-slate-400 text-xs mt-1">
            {new Date(dataPoint.timestamp).toLocaleTimeString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const getChartTitle = () => {
    switch (timeRange) {
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      default: return 'Visitor Growth';
    }
  };

  // Calculate statistics - always return 0 if no real data
  const stats = hasRealData && chartData.length > 0 ? {
    peak: Math.max(...chartData.map(d => d.visitors)),
    average: Math.round(chartData.reduce((a, b) => a + b.visitors, 0) / chartData.length),
    total: chartData.reduce((a, b) => a + b.visitors, 0),
    trend: chartData.length > 1 ?
      ((chartData[chartData.length - 1].visitors - chartData[0].visitors) / Math.max(1, chartData[0].visitors) * 100) : 0
  } : {
    peak: 0,
    average: 0,
    total: 0,
    trend: 0
  };

  // Only log when meaningful changes happen
  useEffect(() => {
    console.log('📊 GrowthChart state updated:', {
      isLoading,
      chartLoading,
      chartDataLength: chartData.length,
      hasRealData,
      stats,
      totalVisitors: data?.totalVisitors,
      error,
      apiBaseUrl: API_BASE_URL
    });
  }, [isLoading, chartLoading, chartData.length, hasRealData, stats, data?.totalVisitors, error]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Visitor Growth</h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">
            {getChartTitle()}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading || chartLoading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50 p-1 rounded hover:bg-slate-700"
            title="Refresh chart data"
          >
            <svg className={`w-4 h-4 ${isLoading || chartLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1">
        {isLoading || chartLoading ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p>Loading chart data...</p>
              <p className="text-sm text-slate-400 mt-1">Fetching real-time analytics</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            <div className="text-center max-w-md">
              <div className="text-4xl mb-2">⚠️</div>
              <p className="text-red-400 mb-2">{error}</p>
              <p className="text-sm text-slate-400 mb-4">
                {hasRealData ? 'Showing last known data' : 'No tracking data available'}
              </p>
              <div className="space-y-2">
                <button 
                  onClick={handleRefresh}
                  className="w-full px-4 py-2 bg-blue-500/20 text-blue-300 rounded text-sm hover:bg-blue-500/30 transition-colors"
                >
                  Retry Connection
                </button>
                <div className="text-xs text-slate-500 bg-slate-800/50 p-2 rounded">
                  <p>Domain: {domain}</p>
                  <p>User: {user?.id?.substring(0, 8)}...</p>
                </div>
              </div>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={hasRealData ? 0.3 : 0.1}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                width={40}
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke={hasRealData ? "#3B82F6" : "#6B7280"}
                strokeWidth={hasRealData ? 3 : 2}
                fill="url(#visitorGradient)"
                dot={{ 
                  fill: hasRealData ? '#3B82F6' : '#6B7280', 
                  strokeWidth: 2, 
                  r: hasRealData ? 4 : 2 
                }}
                activeDot={{ r: 6, fill: hasRealData ? '#1D4ED8' : '#4B5563' }}
                strokeDasharray={hasRealData ? "" : "5 5"}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            <div className="text-center max-w-md">
              <div className="text-4xl mb-2">📊</div>
              <p className="mb-2">No tracking data for {domain}</p>
              <p className="text-sm text-slate-400 mb-4">
                This domain may not be registered or tracking is not active
              </p>
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-xs text-left space-y-1">
                <p className="text-slate-400">
                  <span className="text-slate-300">Domain:</span> {domain}
                </p>
                <p className="text-slate-400">
                  <span className="text-slate-300">Status:</span> {hasRealData ? 'Active Tracking' : 'Not Registered'}
                </p>
                <p className="text-slate-400">
                  <span className="text-slate-300">Time Range:</span> {timeRange}
                </p>
              </div>
              <button 
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
              >
                Check Domain Status
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats - ALWAYS SHOW (with 0 values when no data) */}
      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-700">
        <div className="text-center">
          <p className="text-sm text-slate-400">Peak</p>
          <p className={`text-lg font-bold ${hasRealData ? 'text-white' : 'text-slate-500'}`}>
            {stats.peak}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-400">Average</p>
          <p className={`text-lg font-bold ${hasRealData ? 'text-white' : 'text-slate-500'}`}>
            {stats.average}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-400">Total</p>
          <p className={`text-lg font-bold ${hasRealData ? 'text-green-400' : 'text-slate-500'}`}>
            {stats.total}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-400">Trend</p>
          <p className={`text-lg font-bold ${
            hasRealData 
              ? (stats.trend > 0 ? 'text-green-400' : stats.trend < 0 ? 'text-red-400' : 'text-slate-400')
              : 'text-slate-500'
          }`}>
            {hasRealData ? `${stats.trend > 0 ? '+' : ''}${stats.trend.toFixed(1)}%` : '0%'}
          </p>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-2 text-center">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
          hasRealData
            ? 'bg-green-500/20 text-green-400'
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          <span className={`w-2 h-2 rounded-full mr-1 ${
            hasRealData ? 'bg-green-400' : 'bg-yellow-400'
          }`}></span>
          {hasRealData ? 'Live Tracking Active' : 'No Tracking Data'}
        </span>
      </div>
    </div>
  );
};

export default GrowthChart;