import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, XIcon, RefreshIcon } from './Icons';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number;
  isLowerGood?: boolean;
  showTrend?: boolean;
  isLoading?: boolean;
  error?: string | null;
  debugInfo?: any;
  showDebug?: boolean;
  size?: 'small' | 'large';
  domain?: string;
  metricType?: 'totalVisitors' | 'newVisitors' | 'returningVisitors' | 'bounceRate' | 'avgSessionDuration' | 'pagesPerVisit';
  timeRange?: '24h' | '7d' | '30d';
  onRefresh?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  trend = 0,
  isLowerGood = false,
  showTrend = true,
  isLoading = false,
  error = null,
  debugInfo = null,
  showDebug = false,
  size = 'large',
  domain,
  metricType,
  timeRange = '24h',
  onRefresh
}) => {
  // Data validation
  const isValidValue = value !== null && value !== undefined && value !== '';
  const isValidTrend = trend !== undefined && !isNaN(trend);

  // Error states
  const hasError = error || !isValidValue;
  const displayValue = isValidValue ? (typeof value === 'number' ? value.toLocaleString() : value) : 'N/A';

  const shouldShowTrend = showTrend && isValidTrend && trend !== 0 && !hasError;
  const isPositive = isLowerGood ? trend < 0 : trend > 0;

  // Format trend display text based on the metric type
  const getTrendText = () => {
    if (!shouldShowTrend) return null;

    if (isLowerGood) {
      // For bounce rate - lower is better
      return trend < 0 ? 'Improving' : 'Increasing';
    } else {
      // For other metrics - higher is better
      return trend > 0 ? 'Growing' : 'Declining';
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const isRefreshable = domain && metricType && onRefresh;

  // Debug information
  const getDebugInfo = () => {
    if (!showDebug) return null;

    return (
      <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs text-slate-400 font-mono">
        <div>Raw Value: {JSON.stringify(value)}</div>
        <div>Trend: {JSON.stringify(trend)}</div>
        <div>Error: {JSON.stringify(error)}</div>
        <div>Domain: {domain || 'N/A'}</div>
        <div>Metric Type: {metricType || 'N/A'}</div>
        <div>Time Range: {timeRange}</div>
        <div>Loading: {isLoading ? 'true' : 'false'}</div>
        {debugInfo && Object.entries(debugInfo).map(([key, val]) => (
          <div key={key}>{key}: {JSON.stringify(val)}</div>
        ))}
      </div>
    );
  };

  return (
    <div className={`bg-brand-secondary/50 ${size === 'small' ? 'p-4' : 'p-6'} rounded-2xl shadow-xl border transition-all duration-300 ${
      hasError
        ? 'border-red-500/50 bg-red-900/20'
        : 'border-slate-700/50 hover:bg-brand-secondary/80 hover:border-brand-accent'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          {label}
          {hasError && <XIcon className="w-4 h-4 text-red-400" />}
          {isLoading && <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin"></div>}
        </h3>
        <div className="flex items-center gap-2">
          {isRefreshable && (
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshIcon className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <div className={`text-brand-accent ${hasError ? 'opacity-50' : ''}`}>{icon}</div>
        </div>
      </div>

      <div>
        <p className={`${size === 'small' ? 'text-2xl' : 'text-3xl'} font-bold ${hasError ? 'text-red-400' : 'text-white'}`}>
          {isLoading ? '...' : displayValue}
        </p>

        {hasError && error && (
          <div className="text-sm text-red-400 mt-1">
            Error: {error}
          </div>
        )}

        {shouldShowTrend && (
          <div className={`flex items-center text-sm mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
            <span className="ml-1 font-semibold">{Math.abs(trend).toFixed(1)}%</span>
            <span className="ml-1.5 text-slate-500">{getTrendText()}</span>
          </div>
        )}

        {!shouldShowTrend && showTrend && !hasError && (
          <div className="text-sm text-slate-500 mt-1">No trend data yet</div>
        )}

        {getDebugInfo()}
      </div>
    </div>
  );
};

export default MetricCard;