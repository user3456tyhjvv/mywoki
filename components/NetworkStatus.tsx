import React, { useEffect, useState } from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { ExclamationTriangleIcon, CheckCircleIcon, RefreshIcon, InformationCircleIcon } from './Icons';

interface NetworkStatusProps {
  className?: string;
  showDetailedInfo?: boolean;
  showQualityIndicator?: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  className = '',
  showDetailedInfo = false,
  showQualityIndicator = true
}) => {
  const {
    networkState,
    isSlowConnection,
    isUnstableConnection,
    isOffline,
    showNetworkWarning,
    showFullScreenNetworkModal,
    setShowFullScreenNetworkModal,
    checkNetworkStatus,
    performSpeedTest,
    manuallySetOnline,
    getConnectionQuality
  } = useNetwork();
  
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [lastStatus, setLastStatus] = useState<'online' | 'offline' | 'slow' | 'unstable'>('online');
  const [showQualityDetails, setShowQualityDetails] = useState(false);
  const [speedTestRunning, setSpeedTestRunning] = useState(false);

  const connectionQuality = getConnectionQuality();

  useEffect(() => {
    let notificationTimer: NodeJS.Timeout;

    if (isOffline && lastStatus !== 'offline') {
      setNotificationMessage('You are currently offline. Some features may not work.');
      setShowNotification(true);
      setLastStatus('offline');
    } else if (!isOffline && lastStatus === 'offline') {
      setNotificationMessage('Connection restored! You are back online.');
      setShowNotification(true);
      setLastStatus('online');
      notificationTimer = setTimeout(() => setShowNotification(false), 4000);
    } else if (isUnstableConnection && lastStatus !== 'unstable') {
      setNotificationMessage('Unstable connection detected. Features may work intermittently.');
      setShowNotification(true);
      setLastStatus('unstable');
    } else if (isSlowConnection && !isOffline && lastStatus !== 'slow') {
      setNotificationMessage('Slow connection detected. Loading may take longer.');
      setShowNotification(true);
      setLastStatus('slow');
    } else if (!isSlowConnection && lastStatus === 'slow') {
      setNotificationMessage('Connection speed improved.');
      setShowNotification(true);
      setLastStatus('online');
      notificationTimer = setTimeout(() => setShowNotification(false), 3000);
    }

    return () => {
      if (notificationTimer) clearTimeout(notificationTimer);
    };
  }, [isOffline, isSlowConnection, isUnstableConnection]);

  const getStatusColor = () => {
    if (isOffline) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (isUnstableConnection) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    if (isSlowConnection) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-green-400 bg-green-500/20 border-green-500/30';
  };

  const getStatusIcon = () => {
    if (isOffline) return <ExclamationTriangleIcon className="w-4 h-4" />;
    if (isUnstableConnection) return <ExclamationTriangleIcon className="w-4 h-4" />;
    if (isSlowConnection) return <ExclamationTriangleIcon className="w-4 h-4" />;
    return <CheckCircleIcon className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isOffline) return 'Offline';
    if (isUnstableConnection) return 'Unstable';
    if (isSlowConnection) return 'Slow';
    return 'Online';
  };

  const getQualityColor = () => {
    switch (connectionQuality.level) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-orange-400';
      case 'unstable': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionDetails = () => {
    if (networkState.effectiveType) {
      return ` (${networkState.effectiveType.toUpperCase()})`;
    }
    return '';
  };

  const getSpeedInfo = () => {
    if (isOffline) return null;
    
    return (
      <span className="text-xs opacity-75 ml-1">
        {networkState.downlink ? `${networkState.downlink.toFixed(1)} Mbps` : ''}
        {networkState.rtt ? ` • ${networkState.rtt}ms` : ''}
        {networkState.packetLoss ? ` • ${networkState.packetLoss}% loss` : ''}
      </span>
    );
  };

  const handleRetryConnection = async () => {
    setShowNotification(false);
    await checkNetworkStatus();
  };

  const handleRunSpeedTest = async () => {
    setSpeedTestRunning(true);
    await performSpeedTest();
    setSpeedTestRunning(false);
  };

  const handleManualOnline = () => {
    manuallySetOnline();
    setShowFullScreenNetworkModal(false);
  };

  const getQualityRecommendations = () => {
    return connectionQuality.recommendations.map((rec, index) => (
      <li key={index} className="text-sm text-gray-600 dark:text-gray-300 py-1">
        • {rec}
      </li>
    ));
  };

  return (
    <>
      {/* Full-screen Network Disconnection Modal */}
      {showFullScreenNetworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-slate-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L5.636 18.364m12.728-12.728L18.364 18.364M5.636 5.636l12.728 12.728" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Internet Connection
              </h2>

              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                You appear to be offline. Please check your internet connection and try again.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleRetryConnection}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <RefreshIcon className="w-5 h-5" />
                  Retry Connection
                </button>
                
                <button
                  onClick={handleManualOnline}
                  className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  I'm online, ignore this warning
                </button>
              </div>

              {showDetailedInfo && (
                <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded text-xs text-left space-y-1">
                  <p><strong>Connection Type:</strong> {networkState.connectionType}</p>
                  <p><strong>Last Online:</strong> {networkState.lastOnlineTime ? networkState.lastOnlineTime.toLocaleTimeString() : 'Never'}</p>
                  <p><strong>Effective Type:</strong> {networkState.effectiveType}</p>
                  <p><strong>Connection Quality:</strong> <span className={getQualityColor()}>{connectionQuality.level} ({connectionQuality.score}/100)</span></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Bar with Enhanced Information */}
      {(!showFullScreenNetworkModal && showNetworkWarning) && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor()} ${className}`}>
          {getStatusIcon()}
          <span className="flex items-center">
            {getStatusText()}{getConnectionDetails()}
            {getSpeedInfo()}
          </span>
          
          {/* Quality Indicator */}
          {showQualityIndicator && !isOffline && (
            <button
              onClick={() => setShowQualityDetails(!showQualityDetails)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getQualityColor()} bg-black/10 hover:bg-black/20 transition-colors`}
              title="Connection Quality"
            >
              <InformationCircleIcon className="w-3 h-3" />
              {connectionQuality.score}
            </button>
          )}
          
          <button
            onClick={handleRetryConnection}
            className="ml-1 p-1 rounded hover:bg-white/10 transition-colors"
            title="Check connection status"
          >
            <RefreshIcon className="w-3 h-3" />
          </button>

          {speedTestRunning && (
            <div className="flex items-center gap-1 text-xs opacity-75">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Testing...
            </div>
          )}

          {isSlowConnection && !speedTestRunning && (
            <button
              onClick={handleRunSpeedTest}
              className="text-xs opacity-75 hover:opacity-100 transition-opacity"
              title="Run speed test"
            >
              Test Speed
            </button>
          )}
        </div>
      )}

      {/* Quality Details Popover */}
      {showQualityDetails && !isOffline && (
        <div className="absolute top-12 left-0 z-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl p-4 min-w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Connection Quality</h3>
            <button
              onClick={() => setShowQualityDetails(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Overall Score</span>
              <span className={`font-semibold ${getQualityColor()}`}>
                {connectionQuality.score}/100
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Quality Level</span>
              <span className={`font-semibold ${getQualityColor()}`}>
                {connectionQuality.level}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Download Speed</span>
              <span className="text-sm font-mono">{networkState.downlink.toFixed(1)} Mbps</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Latency</span>
              <span className="text-sm font-mono">{networkState.latency}ms</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Packet Loss</span>
              <span className="text-sm font-mono">{networkState.packetLoss}%</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Stability</span>
              <span className="text-sm font-mono">{networkState.connectionStability}</span>
            </div>
          </div>
          
          {connectionQuality.recommendations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {getQualityRecommendations()}
              </ul>
            </div>
          )}
          
          <button
            onClick={handleRunSpeedTest}
            disabled={speedTestRunning}
            className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded transition-colors"
          >
            {speedTestRunning ? 'Testing...' : 'Run Speed Test'}
          </button>
        </div>
      )}

      {/* Notification Toast */}
      {showNotification && !showFullScreenNetworkModal && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm ${
          isOffline
            ? 'bg-red-500/20 border-red-500/30 text-red-400'
            : isUnstableConnection
            ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
            : isSlowConnection
            ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
            : 'bg-green-500/20 border-green-500/30 text-green-400'
        }`}>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{notificationMessage}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRetryConnection}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title="Check connection"
            >
              <RefreshIcon className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowNotification(false)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkStatus;