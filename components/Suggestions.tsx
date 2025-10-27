import React, { useState, useEffect } from 'react';
import { getImprovementSuggestions } from '../services/geminiService';
import type { TrafficData } from '../types';
import { SparklesIcon, LightBulbIcon, RefreshIcon } from './Icons';

interface SuggestionsProps {
  trafficData: TrafficData;
  domain: string; // Add domain prop
}

const Suggestions: React.FC<SuggestionsProps> = ({ trafficData, domain }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleFetchSuggestions = async () => {
    if (!trafficData || !domain) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await getImprovementSuggestions(trafficData, domain);
      // Ensure result is always an array
      setSuggestions(Array.isArray(result) ? result : []);
    } catch (e) {
      setError("Failed to fetch suggestions due to high demand. Please try again in a moment.");
      console.error(e);
      setSuggestions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetchSuggestions();
  }, [trafficData, domain]); // Add dependencies

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-brand-accent" />
            <h3 className="text-xl font-bold text-white">AI-Powered Suggestions</h3>
        </div>
        <button
            onClick={handleFetchSuggestions}
            disabled={loading}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh suggestions"
        >
            <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {loading && (
        <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-slate-700 rounded-full mt-1"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    </div>
                </div>
            ))}
        </div>
      )}
      
      {!loading && error && (
        <div className="text-red-400 p-4 bg-red-900/20 rounded-lg">
          {error}
        </div>
      )}
      
      {!loading && !error && suggestions.length > 0 && (
        <ul className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <LightBulbIcon className="w-5 h-5 text-yellow-300"/>
              </div>
              <p className="text-slate-300">{suggestion}</p>
            </li>
          ))}
        </ul>
      )}
      
      {!loading && !error && suggestions.length === 0 && (
        <div className="text-slate-400 text-center p-4">
          No suggestions available at the moment.
        </div>
      )}
    </div>
  );
};

export default Suggestions;