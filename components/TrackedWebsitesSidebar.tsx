import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrackedWebsite } from '../types';
import { GlobeAltIcon, ChartBarIcon, ClockIcon, TrashIcon } from './Icons';
import ChatWidget from './ChatWidget';

interface TrackedWebsitesSidebarProps {
  onSelectWebsite: (url: string) => void;
  currentWebsite?: string;
}

const TrackedWebsitesSidebar: React.FC<TrackedWebsitesSidebarProps> = ({
  onSelectWebsite,
  currentWebsite
}) => {
  const { user } = useAuth();
  const [websites, setWebsites] = useState<TrackedWebsite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchTrackedWebsites();
    }
  }, [user]);

  const fetchTrackedWebsites = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tracked_websites')
        .select(`
          *,
          performance:website_performance(*)
        `)
        .eq('user_id', user.id)
        .order('last_scraped_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebsites(data || []);
    } catch (err) {
      console.error('Error fetching tracked websites:', err);
      setError('Failed to load tracked websites');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebsite = async (websiteId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to remove this website from tracking?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tracked_websites')
        .delete()
        .eq('id', websiteId);

      if (error) throw error;

      setWebsites(prev => prev.filter(w => w.id !== websiteId));
    } catch (err) {
      console.error('Error deleting website:', err);
      setError('Failed to remove website');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  if (!user) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 p-4">
        <div className="text-center text-gray-500 py-8">
          <GlobeAltIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Sign in to track websites</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <GlobeAltIcon className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Tracked Websites</h3>
        </div>
        <p className="text-sm text-gray-600">
          Websites you've scraped and their performance
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Websites List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : websites.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <GlobeAltIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No tracked websites yet</p>
            <p className="text-xs mt-1">Scrape a website to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {websites.map((website) => (
              <div
                key={website.id}
                onClick={() => onSelectWebsite(website.url)}
                className={`border rounded-lg p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                  currentWebsite === website.url
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {getDomainFromUrl(website.url)}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">
                      {website.url}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        <span>Last: {formatDate(website.last_scraped_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChartBarIcon className="w-3 h-3" />
                        <span>{website.scrape_count} scrapes</span>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    {website.performance && website.performance.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {website.performance[0].images_count || 0}
                          </div>
                          <div className="text-gray-500">Images</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {website.performance[0].videos_count || 0}
                          </div>
                          <div className="text-gray-500">Videos</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">
                            {website.performance[0].links_count || 0}
                          </div>
                          <div className="text-gray-500">Links</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDeleteWebsite(website.id, e)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove from tracking"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          {websites.length} website{websites.length !== 1 ? 's' : ''} tracked
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default TrackedWebsitesSidebar;
