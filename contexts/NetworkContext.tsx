// contexts/NetworkContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

interface NetworkState {
  isOnline: boolean;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  lastOnlineTime: Date | null;
  connectionType: string;
  latency: number;
  packetLoss: number;
  bandwidth: number;
  reliability: number; // 0-100 score
  connectionStability: 'excellent' | 'good' | 'fair' | 'poor' | 'unstable';
}

interface NetworkMetrics {
  latency: number[];
  bandwidth: number[];
  packetLoss: number[];
  timestamp: number[];
}

interface NetworkContextType {
  networkState: NetworkState;
  isSlowConnection: boolean;
  isUnstableConnection: boolean;
  isOffline: boolean;
  showNetworkWarning: boolean;
  showFullScreenNetworkModal: boolean;
  setShowFullScreenNetworkModal: (show: boolean) => void;
  checkNetworkStatus: () => Promise<void>;
  performSpeedTest: () => Promise<{ downloadSpeed: number; uploadSpeed: number; latency: number }>;
  manuallySetOnline: () => void;
  manuallySetOffline: () => void;
  getConnectionQuality: () => {
    score: number;
    level: 'excellent' | 'good' | 'fair' | 'poor' | 'unstable';
    recommendations: string[];
  };
  networkHistory: NetworkMetrics;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// Advanced connection quality thresholds
const CONNECTION_THRESHOLDS = {
  // Speed thresholds (Mbps)
  download: {
    excellent: 10,
    good: 5,
    fair: 2,
    poor: 0.5
  },
  // Latency thresholds (ms)
  latency: {
    excellent: 50,
    good: 100,
    fair: 200,
    poor: 500
  },
  // Packet loss thresholds (%)
  packetLoss: {
    excellent: 1,
    good: 3,
    fair: 8,
    poor: 15
  },
  // Stability thresholds (score)
  stability: {
    excellent: 90,
    good: 75,
    fair: 60,
    poor: 40
  }
};

// Connection types and their expected performance
const CONNECTION_TYPE_PROFILES = {
  'wifi': { expectedDownload: 50, expectedLatency: 20 },
  'ethernet': { expectedDownload: 100, expectedLatency: 10 },
  'cellular': { expectedDownload: 25, expectedLatency: 80 },
  '4g': { expectedDownload: 20, expectedLatency: 60 },
  '3g': { expectedDownload: 3, expectedLatency: 200 },
  '2g': { expectedDownload: 0.1, expectedLatency: 800 },
  'slow-2g': { expectedDownload: 0.05, expectedLatency: 1800 },
  'unknown': { expectedDownload: 10, expectedLatency: 100 }
};

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: true,
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    lastOnlineTime: new Date(),
    connectionType: 'wifi',
    latency: 50,
    packetLoss: 0,
    bandwidth: 10,
    reliability: 95,
    connectionStability: 'excellent'
  });

  const [networkHistory, setNetworkHistory] = useState<NetworkMetrics>({
    latency: [],
    bandwidth: [],
    packetLoss: [],
    timestamp: []
  });

  const [showNetworkWarning, setShowNetworkWarning] = useState(false);
  const [showFullScreenNetworkModal, setShowFullScreenNetworkModal] = useState(false);
  const [manualOverride, setManualOverride] = useState<'online' | 'offline' | null>(null);

  const metricsRef = useRef<NetworkMetrics>({
    latency: [],
    bandwidth: [],
    packetLoss: [],
    timestamp: []
  });

  const speedTestRef = useRef<boolean>(false);
  const connectionStabilityScore = useRef<number>(100);

  // Enhanced slow connection detection
  const isSlowConnection = useCallback(() => {
    const { downlink, rtt, effectiveType, latency, bandwidth } = networkState;
    
    // Multiple factors for slow connection detection
    const speedFactor = downlink < CONNECTION_THRESHOLDS.download.fair;
    const latencyFactor = rtt > CONNECTION_THRESHOLDS.latency.fair || latency > CONNECTION_THRESHOLDS.latency.fair;
    const typeFactor = ['slow-2g', '2g', '3g'].includes(effectiveType);
    const bandwidthFactor = bandwidth < CONNECTION_THRESHOLDS.download.fair;
    
    return speedFactor || latencyFactor || typeFactor || bandwidthFactor;
  }, [networkState]);

  // Enhanced unstable connection detection
  const isUnstableConnection = useCallback(() => {
    const { reliability, connectionStability, packetLoss } = networkState;
    
    return (
      reliability < CONNECTION_THRESHOLDS.stability.fair ||
      connectionStability === 'unstable' ||
      packetLoss > CONNECTION_THRESHOLDS.packetLoss.fair
    );
  }, [networkState]);

  const isOffline = manualOverride === 'offline' || !networkState.isOnline;

  // Update network state with stability tracking
  const updateNetworkState = useCallback((update: Partial<NetworkState>) => {
    setNetworkState(prev => {
      const newState = { ...prev, ...update };
      
      // Update last online time when coming back online
      if (!prev.isOnline && update.isOnline) {
        newState.lastOnlineTime = new Date();
      }
      
      // Calculate connection stability
      if (update.latency !== undefined || update.downlink !== undefined) {
        newState.connectionStability = calculateConnectionStability(newState);
      }
      
      return newState;
    });
  }, []);

  // Calculate connection stability based on metrics history
  const calculateConnectionStability = useCallback((state: NetworkState): NetworkState['connectionStability'] => {
    const recentLatency = metricsRef.current.latency.slice(-10); // Last 10 measurements
    const recentBandwidth = metricsRef.current.bandwidth.slice(-10);
    
    if (recentLatency.length < 3) return 'excellent';
    
    const latencyVariance = calculateVariance(recentLatency);
    const bandwidthVariance = calculateVariance(recentBandwidth);
    
    const stabilityScore = Math.max(0, 100 - (latencyVariance * 2 + bandwidthVariance * 0.1));
    connectionStabilityScore.current = stabilityScore;
    
    if (stabilityScore >= CONNECTION_THRESHOLDS.stability.excellent) return 'excellent';
    if (stabilityScore >= CONNECTION_THRESHOLDS.stability.good) return 'good';
    if (stabilityScore >= CONNECTION_THRESHOLDS.stability.fair) return 'fair';
    if (stabilityScore >= CONNECTION_THRESHOLDS.stability.poor) return 'poor';
    return 'unstable';
  }, []);

  const calculateVariance = (numbers: number[]): number => {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((a, b) => a + b) / numbers.length;
    const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
    return variance;
  };

  // Advanced network quality assessment
  const getConnectionQuality = useCallback(() => {
    const { downlink, latency, packetLoss, connectionStability } = networkState;
    
    // Calculate individual scores (0-100)
    const speedScore = Math.min(100, (downlink / CONNECTION_THRESHOLDS.download.excellent) * 100);
    const latencyScore = Math.max(0, 100 - (latency / CONNECTION_THRESHOLDS.latency.poor) * 100);
    const packetLossScore = Math.max(0, 100 - (packetLoss / CONNECTION_THRESHOLDS.packetLoss.poor) * 100);
    const stabilityScore = connectionStabilityScore.current;
    
    // Weighted overall score
    const overallScore = Math.round(
      (speedScore * 0.3) +
      (latencyScore * 0.4) +
      (packetLossScore * 0.2) +
      (stabilityScore * 0.1)
    );
    
    // Determine quality level
    let level: 'excellent' | 'good' | 'fair' | 'poor' | 'unstable' = 'unstable';
    if (overallScore >= CONNECTION_THRESHOLDS.stability.excellent) level = 'excellent';
    else if (overallScore >= CONNECTION_THRESHOLDS.stability.good) level = 'good';
    else if (overallScore >= CONNECTION_THRESHOLDS.stability.fair) level = 'fair';
    else if (overallScore >= CONNECTION_THRESHOLDS.stability.poor) level = 'poor';
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (speedScore < 50) recommendations.push('Try moving closer to your router or switch to a faster network');
    if (latencyScore < 60) recommendations.push('High latency detected. Avoid bandwidth-intensive activities');
    if (packetLossScore < 70) recommendations.push('Network instability detected. Consider resetting your router');
    if (level === 'poor' || level === 'unstable') recommendations.push('Your connection may not support real-time features');
    
    return {
      score: overallScore,
      level,
      recommendations
    };
  }, [networkState]);

  // Enhanced network status check with latency measurement
  const checkNetworkStatus = useCallback(async () => {
    if (speedTestRef.current) return; // Prevent multiple simultaneous tests
    
    speedTestRef.current = true;
    
    try {
      const startTime = performance.now();
      
      // Test multiple endpoints for better accuracy
      const endpoints = [
        'https://www.google.com/favicon.ico',
        'https://www.cloudflare.com/favicon.ico',
        'https://www.apple.com/favicon.ico'
      ];
      
      const results = await Promise.allSettled(
        endpoints.map(url => 
          fetch(url, { 
            method: 'HEAD', 
            mode: 'no-cors',
            cache: 'no-cache'
          })
        )
      );
      
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      const successfulRequests = results.filter(result => result.status === 'fulfilled').length;
      const packetLoss = ((endpoints.length - successfulRequests) / endpoints.length) * 100;
      
      // Update metrics history
      const timestamp = Date.now();
      metricsRef.current = {
        latency: [...metricsRef.current.latency.slice(-49), latency], // Keep last 50 measurements
        bandwidth: [...metricsRef.current.bandwidth.slice(-49), networkState.downlink],
        packetLoss: [...metricsRef.current.packetLoss.slice(-49), packetLoss],
        timestamp: [...metricsRef.current.timestamp.slice(-49), timestamp]
      };
      
      setNetworkHistory(metricsRef.current);
      
      updateNetworkState({
        isOnline: successfulRequests > 0,
        latency: Math.round(latency),
        packetLoss: Math.round(packetLoss * 100) / 100, // Round to 2 decimal places
        reliability: Math.round((successfulRequests / endpoints.length) * 100),
        lastOnlineTime: successfulRequests > 0 ? new Date() : networkState.lastOnlineTime
      });
      
      setManualOverride(null);
      
    } catch (error) {
      console.error('Network check failed:', error);
      updateNetworkState({
        isOnline: false,
        reliability: 0
      });
    } finally {
      speedTestRef.current = false;
    }
  }, [networkState.lastOnlineTime, updateNetworkState]);

  // Perform detailed speed test
  const performSpeedTest = useCallback(async () => {
    const testData = {
      downloadSpeed: 0,
      uploadSpeed: 0,
      latency: 0
    };
    
    try {
      // Latency test
      const latencyStart = performance.now();
      await fetch('https://www.google.com/favicon.ico', { cache: 'no-cache' });
      testData.latency = performance.now() - latencyStart;
      
      // Download speed test (small file)
      const downloadStart = performance.now();
      const downloadResponse = await fetch('https://httpbin.org/bytes/100000'); // ~100KB
      const downloadBlob = await downloadResponse.blob();
      const downloadTime = performance.now() - downloadStart;
      
      testData.downloadSpeed = (downloadBlob.size * 8) / (downloadTime * 1000); // Mbps
      
      // Update network state with speed test results
      updateNetworkState({
        downlink: testData.downloadSpeed,
        latency: testData.latency,
        bandwidth: testData.downloadSpeed
      });
      
    } catch (error) {
      console.error('Speed test failed:', error);
    }
    
    return testData;
  }, [updateNetworkState]);

  // Manual override functions
  const manuallySetOnline = useCallback(() => {
    setManualOverride('online');
    updateNetworkState({
      isOnline: true,
      lastOnlineTime: new Date(),
    });
  }, [updateNetworkState]);

  const manuallySetOffline = useCallback(() => {
    setManualOverride('offline');
    updateNetworkState({
      isOnline: false,
    });
  }, [updateNetworkState]);

  // Set up advanced network monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network: Online');
      updateNetworkState({
        isOnline: true,
        lastOnlineTime: new Date(),
      });
      setManualOverride(null);
      setShowFullScreenNetworkModal(false);
    };

    const handleOffline = () => {
      console.log('🌐 Network: Offline');
      updateNetworkState({
        isOnline: false,
      });
      setShowFullScreenNetworkModal(true);
    };

    // Basic online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Network Information API
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const handleConnectionChange = () => {
        console.log('🌐 Network connection changed:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });

        updateNetworkState({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
          connectionType: connection.type || 'unknown',
        });
      };

      connection.addEventListener('change', handleConnectionChange);
      
      // Set initial connection info
      updateNetworkState({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        connectionType: connection.type || 'unknown',
      });

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateNetworkState]);

  // Enhanced network quality monitoring
  useEffect(() => {
    if (isOffline) return;

    // Adaptive checking based on connection quality
    const { level } = getConnectionQuality();
    let checkInterval: number;

    switch (level) {
      case 'excellent':
        checkInterval = 60000; // 1 minute
        break;
      case 'good':
        checkInterval = 30000; // 30 seconds
        break;
      case 'fair':
        checkInterval = 15000; // 15 seconds
        break;
      case 'poor':
      case 'unstable':
        checkInterval = 10000; // 10 seconds
        break;
      default:
        checkInterval = 30000;
    }

    const interval = setInterval(() => {
      checkNetworkStatus();
    }, checkInterval);

    return () => clearInterval(interval);
  }, [isOffline, networkState, checkNetworkStatus]);

  // Show/hide network warnings based on advanced conditions
  useEffect(() => {
    const { level } = getConnectionQuality();

    if (isOffline) {
      setShowNetworkWarning(true);
      setShowFullScreenNetworkModal(true);
    } else if (level === 'poor' || level === 'unstable') {
      setShowNetworkWarning(true);
      setShowFullScreenNetworkModal(false);
    } else if (level === 'fair') {
      setShowNetworkWarning(true);
      setShowFullScreenNetworkModal(false);
    } else {
      setShowNetworkWarning(false);
      setShowFullScreenNetworkModal(false);
    }
  }, [isOffline, getConnectionQuality]);

  const value: NetworkContextType = {
    networkState,
    isSlowConnection: isSlowConnection(),
    isUnstableConnection: isUnstableConnection(),
    isOffline,
    showNetworkWarning,
    showFullScreenNetworkModal,
    setShowFullScreenNetworkModal,
    checkNetworkStatus,
    performSpeedTest,
    manuallySetOnline,
    manuallySetOffline,
    getConnectionQuality,
    networkHistory
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};