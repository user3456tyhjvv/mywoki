import React, { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Visitor, TrafficData } from '../types';

// API base URL - use localhost in development, production URL otherwise
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : 'https://tooler-io.onrender.com';

interface VisitorDataTableProps {
  domain: string;
  userId: string; // Add userId for API calls
}

const VisitorDataTable: React.FC<VisitorDataTableProps> = ({ 
  domain, 
  userId 
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch visitor data from backend
  const fetchVisitorData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching visitor data for:', domain);
      
      const response = await fetch(`${API_BASE_URL}/api/recent-visitors/${domain}?limit=50`, {
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Received visitor data:', data);
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setVisitors(data);
        } else if (data.recentVisitors && Array.isArray(data.recentVisitors)) {
          setVisitors(data.recentVisitors);
        } else if (data.data && Array.isArray(data.data)) {
          setVisitors(data.data);
        } else {
          setVisitors([]);
        }
        
        setLastUpdated(new Date().toISOString());
      } else {
        console.error('❌ Failed to fetch visitor data:', response.status);
        setVisitors([]);
      }
    } catch (error) {
      console.error('❌ Error fetching visitor data:', error);
      setVisitors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    fetchVisitorData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchVisitorData, 30000);
    return () => clearInterval(interval);
  }, [domain, userId]);

  const rowVirtualizer = useVirtualizer({
    count: visitors.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  const getDevice = (width: number | null) => {
    if (!width) return 'Unknown';
    return width < 768 ? 'Mobile' : width < 1024 ? 'Tablet' : 'Desktop';
  };

  const getLocation = (timezone: string | null) => {
    if (!timezone) return 'Unknown';
    const locations: Record<string, string> = {
      'Africa/Nairobi': 'Kenya',
      'Africa/Dar_es_Salaam': 'Tanzania',
      'Africa/Kampala': 'Uganda',
      'Africa/Kigali': 'Rwanda',
      'America/New_York': 'USA (NY)',
      'America/Los_Angeles': 'USA (CA)',
      'Europe/London': 'UK',
      'Europe/Paris': 'France',
      'Asia/Dubai': 'UAE',
      'Asia/Singapore': 'Singapore',
    };
    return locations[timezone] || (timezone.split('/')[1] || 'Unknown');
  };

  const getSource = (visitor: Visitor) => {
    if (visitor.utm_source) return `UTM: ${visitor.utm_source}`;
    if (visitor.referrer === 'direct' || !visitor.referrer) return 'Direct';

    try {
      const url = new URL(visitor.referrer || '');
      return url.hostname.replace('www.', '');
    } catch {
      return visitor.referrer || 'Direct';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      };
    } catch {
      return { time: 'Invalid', date: 'Date' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Recent Visitors</h3>
              {lastUpdated && (
                <p className="text-xs text-slate-400 mt-1">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{new Date().toLocaleTimeString()}</span>
              <button
                onClick={fetchVisitorData}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                    <span>Refreshing</span>
                  </>
                ) : (
                  <>
                    <span>↻</span>
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Debug Info */}
          <div className="mb-4 p-3 bg-slate-700/50 rounded text-xs">
            <div className="text-slate-300">
              <strong>Live Data:</strong> {visitors.length} visitors | Domain: {domain} | 
              Loading: {isLoading ? 'Yes' : 'No'} | User: {userId}
            </div>
          </div>

          {/* Table Container */}
          <div
            ref={parentRef}
            className="overflow-auto border border-slate-700 rounded-lg bg-slate-800/30"
            style={{ height: '500px' }}
          >
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {/* Header Row - Sticky */}
              <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
                <div className="flex min-w-max">
                  <div className="w-32 px-4 py-3 text-left">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Time</span>
                  </div>
                  <div className="w-36 px-4 py-3 text-left">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Visitor ID</span>
                  </div>
                  <div className="w-48 px-4 py-3 text-left">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Page</span>
                  </div>
                  <div className="w-44 px-4 py-3 text-left">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Source</span>
                  </div>
                  <div className="w-28 px-4 py-3 text-left">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Device</span>
                  </div>
                  <div className="w-32 px-4 py-3 text-left">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Location</span>
                  </div>
                </div>
              </div>

              {/* Virtual Rows */}
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const visitor = visitors[virtualRow.index];
                if (!visitor) return null;

                const { time, date } = formatTime(visitor.created_at);

                return (
                  <div
                    key={visitor.id || visitor.visitor_id || virtualRow.index}
                    className="absolute top-0 left-0 w-full hover:bg-slate-700/30 transition-colors border-b border-slate-700/30"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="flex min-w-max h-full items-center">
                      {/* Time */}
                      <div className="w-32 px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-200">
                            {time}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {date}
                          </span>
                        </div>
                      </div>

                      {/* Visitor ID */}
                      <div className="w-36 px-4 py-3">
                        <span className="font-mono text-xs text-slate-300">
                          {visitor.visitor_id?.substring(0, 12)}...
                        </span>
                      </div>

                      {/* Page */}
                      <div className="w-48 px-4 py-3">
                        <span className="text-xs text-slate-300 block truncate" title={visitor.path || '/'}>
                          {visitor.path || '/'}
                        </span>
                      </div>

                      {/* Source */}
                      <div className="w-44 px-4 py-3">
                        <span className="text-xs text-slate-300 block truncate" title={getSource(visitor)}>
                          {getSource(visitor)}
                        </span>
                      </div>

                      {/* Device */}
                      <div className="w-28 px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold ${
                            getDevice(visitor.screen_width) === 'Mobile'
                              ? 'bg-blue-500/20 text-blue-300'
                              : getDevice(visitor.screen_width) === 'Tablet'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}
                        >
                          {getDevice(visitor.screen_width)}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="w-32 px-4 py-3">
                        <span className="text-xs text-slate-300">
                          {getLocation(visitor.timezone)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">
                Showing <span className="font-semibold text-slate-300">{visitors.length}</span> visitors
              </span>
              <span className="text-sm text-slate-500">{domain}</span>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && visitors.length === 0 && (
            <div className="mt-4 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p>Loading visitor data...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && visitors.length === 0 && (
            <div className="mt-4 text-center text-slate-400">
              <div className="text-4xl mb-2">👥</div>
              <p>No visitor data available</p>
              <p className="text-sm">Visitor data will appear here once people visit your website</p>
              <button
                onClick={fetchVisitorData}
                className="mt-2 px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
              >
                Check Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitorDataTable;