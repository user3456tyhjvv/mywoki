import React from 'react';
import type { TrafficData } from '../types';

// Lazy load these components
const CodeSnippet = React.lazy(() => import('./CodeSnippet'));
const WeeklySummary = React.lazy(() => import('./WeeklySummary'));
const UserProfile = React.lazy(() => import('./UserProfile'));
const QuickActions = React.lazy(() => import('./QuickActions'));
const ExitPagesAnalysis = React.lazy(() => import('./ExitPagesAnalysis'));
const TrafficSourcePerformance = React.lazy(() => import('./TrafficSourcePerformance'));
const ConversionFunnel = React.lazy(() => import('./ConversionFunnel'));
const VisitorDataTable = React.lazy(() => import('./VisitorDataTable'));
const ChatWidget = React.lazy(() => import('./ChatWidget'));

interface LazyNonCriticalProps {
  domain: string;
  onAddHelpRequest: (domain: string) => void;
  trafficData?: TrafficData | null;
  activeView?: string;
  userId?: string;
  onExport?: () => void;
  onManualRefresh?: () => void;
  refreshing?: boolean;
}

const LazyNonCritical: React.FC<LazyNonCriticalProps> = ({
  domain,
  onAddHelpRequest,
  trafficData,
  activeView,
  userId,
  onExport,
  onManualRefresh,
  refreshing
}) => {
  return (
    <>
      {/* Code Snippet */}
      {!trafficData?.realData && (
        <CodeSnippet domain={domain} onAddHelpRequest={onAddHelpRequest} />
      )}
      
      {/* View-specific components */}
      {activeView === 'behavior' && trafficData?.exitPages && trafficData.exitPages.length > 0 && (
        <ExitPagesAnalysis domain={domain} userId={userId || ''} />
      )}
      
      {activeView === 'sources' && trafficData?.trafficSources && trafficData.trafficSources.length > 0 && (
        <TrafficSourcePerformance data={trafficData.trafficSources} domain={domain} />
      )}
      
      {activeView === 'conversions' && (
        <ConversionFunnel
          data={trafficData?.conversionFunnel || []}
          domain={domain}
          pageViews={trafficData?.visitors?.flatMap(v => v.pageViews) || []}
        />
      )}
      
      {/* Weekly Summary */}
      {trafficData && (
        <WeeklySummary trafficData={trafficData} domain={domain} />
      )}
      
      {/* Visitor Table */}
      {trafficData && (
        <VisitorDataTable domain={domain} userId={userId || ''} />
      )}
      
      {/* Quick Actions */}
      <QuickActions
        domain={domain}
        onExport={onExport}
        onAddHelpRequest={onAddHelpRequest}
        hasRealData={trafficData?.realData || false}
        onManualRefresh={onManualRefresh}
        refreshing={refreshing}
      />
      
      {/* Chat Widget */}
      <ChatWidget />
    </>
  );
};

export default LazyNonCritical;