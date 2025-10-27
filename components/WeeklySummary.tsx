import React, { useState } from 'react';
import { getWeeklySummary } from '../services/geminiService';
import type { TrafficData } from '../types';
import { DocumentTextIcon, SparklesIcon } from './Icons';

interface WeeklySummaryProps {
  trafficData: TrafficData;
  domain: string;
}

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ trafficData, domain }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      setSummary(null);
      const result = await getWeeklySummary(trafficData, domain);
      setSummary(result.summary);
    } catch (e) {
      setError("Failed to generate summary due to high demand. Please try again in a moment.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-secondary/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <DocumentTextIcon className="w-6 h-6 text-brand-accent" />
          <h3 className="text-xl font-bold text-white">AI Weekly Report</h3>
        </div>
        <button 
          onClick={handleGenerateSummary}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-accent/20 text-brand-accent border border-brand-accent/50 text-sm font-bold rounded-lg hover:bg-brand-accent hover:text-brand-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SparklesIcon className="w-5 h-5" />
          <span>{loading ? 'Generating...' : 'Generate Weekly Summary'}</span>
        </button>
      </div>
      
      {loading && (
        <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        </div>
      )}
      {!loading && error && <p className="text-red-400">{error}</p>}
      
      {!loading && !summary && (
        <p className="text-slate-400">Click the button to generate an AI-powered summary of this week's performance.</p>
      )}

      {summary && (
        <div className="prose prose-invert prose-p:text-slate-300 prose-p:my-3 max-w-none">
          {summary.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeeklySummary;