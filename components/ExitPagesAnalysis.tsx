import React, { useState, useEffect } from 'react';

// Define proper types based on your actual data structure
interface ExitPage {
  isEstimated: unknown;
  url: string;
  avgTimeOnPage: number;
  exitRate: number;
  visits: number;
  pageUrl?: string;
  averageTimeOnPage?: number;
  suggestions?: string[];
}

interface ExitPagesAnalysisProps {
  domain: string;
  userId: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface AIAnalysis {
  severity: 'high' | 'medium' | 'low';
  insights: string[];
  suggestions: string[];
  performanceIssues: string[];
  securityConcerns: string[];
  seoRecommendations: string[];
  userExperience: string[];
  conversionOpportunities: string[];
  technicalRecommendations: string[];
  contentImprovements: string[];
}

interface DataStatus {
  isLive: boolean;
  lastUpdated: string | null;
  dataSource: 'api' | 'fallback' | 'error';
  error?: string;
  debugInfo?: any;
}

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const BACKEND_BASE_URL = isProduction
  ? 'https://tooler-io.onrender.com'
  : 'http://localhost:3001';

const ExitPagesAnalysis: React.FC<ExitPagesAnalysisProps> = ({ 
  domain, 
  userId,
  isLoading = false,
  onRefresh 
}) => {
  const [exitPages, setExitPages] = useState<ExitPage[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [dataStatus, setDataStatus] = useState<DataStatus>({
    isLive: false,
    lastUpdated: null,
    dataSource: 'error'
  });
  const [rawApiResponse, setRawApiResponse] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [aiAnalysisCache, setAiAnalysisCache] = useState<Map<string, AIAnalysis>>(new Map());

  // Fetch exit pages data from backend with comprehensive error handling
  const fetchExitPagesData = async () => {
    if (!userId || !domain) {
      setDataStatus({
        isLive: false,
        lastUpdated: null,
        dataSource: 'error',
        error: 'Missing userId or domain'
      });
      return;
    }

    setInternalLoading(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/stats/${domain}?range=7d`, {
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
        setRawApiResponse(data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response text:', text);
        throw new Error(`Invalid JSON response from server: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }

      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response format');
      }

      // Check if we have real data or dummy data
      const hasRealData = data.realData === true;
      const hasExitPages = data.exitPages && Array.isArray(data.exitPages);
      
      let processedPages: ExitPage[] = [];
      let dataSource: 'api' | 'fallback' = 'api';

      if (hasExitPages) {
        // Process all pages
        const allPages = data.exitPages.map((page: any) => ({
          url: page.url || page.pageUrl || '',
          avgTimeOnPage: page.avgTimeOnPage || page.averageTimeOnPage || 0,
          exitRate: page.exitRate || 0,
          visits: page.visits || 0,
          isDummy: (page.url && page.url.startsWith('/page')) || false,
          isEstimated: page.isEstimated || false
        }));

        // Filter out dummy pages
        processedPages = allPages.filter(page => 
          page && page.url && 
          (!page.isDummy || page.isEstimated)
        );

        // Check data quality
        const hasMeaningfulData = processedPages.length > 0;
        const hasDummyData = allPages.some(page => page.isDummy);

        if (hasMeaningfulData) {
          dataSource = 'api';
        } else if (hasDummyData) {
          dataSource = 'fallback';
        }
      }

      setExitPages(processedPages);
      
      setDataStatus({
        isLive: hasRealData && processedPages.length > 0,
        lastUpdated: new Date().toISOString(),
        dataSource,
        debugInfo: {
          responseTime: Date.now() - responseTime,
          totalVisitors: data.totalVisitors,
          hasRealData: data.realData,
          exitPagesCount: data.exitPages?.length || 0,
          processedPagesCount: processedPages.length
        }
      });

    } catch (error) {
      console.error('Error fetching exit pages data:', error);
      setExitPages([]);
      setDataStatus({
        isLive: false,
        lastUpdated: null,
        dataSource: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setInternalLoading(false);
    }
  };

  // Fetch data on component mount - let parent handle auto-refresh
  useEffect(() => {
    if (userId && domain) {
      fetchExitPagesData();
    }
  }, [domain, userId]);

  // Safe data processing with fallbacks - only show real pages
  const topExitPages = (Array.isArray(exitPages) ? exitPages : [])
    .filter(page => page && page.url && !page.url.startsWith('/page'))
    .sort((a, b) => (b.exitRate || 0) - (a.exitRate || 0))
    .slice(0, 5)
    .map(page => ({
      url: page.url || '',
      avgTimeOnPage: page.avgTimeOnPage || page.averageTimeOnPage || 0,
      exitRate: page.exitRate || 0,
      visits: page.visits || 0,
      suggestions: Array.isArray(page.suggestions) ? page.suggestions : [],
      isEstimated: page.isEstimated ?? false
    }));

  // Enhanced AI Analysis with Gemini integration
  const getAIAnalysis = async (page: ExitPage): Promise<AIAnalysis> => {
    // Check cache first
    const cacheKey = `${page.url}-${page.exitRate}-${page.avgTimeOnPage}`;
    const cached = aiAnalysisCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Call backend AI analysis endpoint
      const response = await fetch(`${BACKEND_BASE_URL}/api/ai/exit-page-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          pageData: page,
          domain: domain,
          metrics: {
            exitRate: page.exitRate,
            avgTimeOnPage: page.avgTimeOnPage,
            visits: page.visits
          }
        })
      });

      if (response.ok) {
        const aiAnalysis = await response.json();
        // Cache the result
        setAiAnalysisCache(prev => new Map(prev.set(cacheKey, aiAnalysis)));
        return aiAnalysis;
      } else {
        throw new Error(`AI analysis failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('AI analysis failed, using fallback analysis:', error);
    }

    // Fallback analysis when AI is unavailable
    return getFallbackAnalysis(page);
  };

  // Professional fallback analysis
  const getFallbackAnalysis = (page: ExitPage): AIAnalysis => {
    const insights = [];
    const suggestions = [];
    const performanceIssues = [];
    const securityConcerns = [];
    const seoRecommendations = [];
    const userExperience = [];
    const conversionOpportunities = [];
    const technicalRecommendations = [];
    const contentImprovements = [];

    // Comprehensive analysis based on real metrics
    const isHighExitRate = page.exitRate > 70;
    const isMediumExitRate = page.exitRate > 40 && page.exitRate <= 70;
    const isLowEngagement = page.avgTimeOnPage < 30;
    const isVeryLowEngagement = page.avgTimeOnPage < 15;

    // Core insights
    if (isHighExitRate) {
      insights.push(`Critical exit rate of ${page.exitRate}% indicates significant user drop-off`);
      insights.push(`Only ${Math.round(page.avgTimeOnPage)} seconds average time suggests content isn't engaging users`);
    } else if (isMediumExitRate) {
      insights.push(`Moderate exit rate of ${page.exitRate}% shows room for improvement`);
      insights.push(`Users spend average ${Math.round(page.avgTimeOnPage)} seconds before leaving`);
    }

    // Performance analysis
    if (isVeryLowEngagement) {
      performanceIssues.push('Extremely low engagement time suggests immediate attention needed');
      performanceIssues.push('Page may be loading too slowly or content not visible');
    } else if (isLowEngagement) {
      performanceIssues.push('Below-average time on page indicates engagement issues');
    }

    // Page-type specific analysis
    if (page.url.includes('/checkout') || page.url.includes('/cart')) {
      insights.push('Checkout page exits directly impact revenue and conversion rates');
      suggestions.push('Simplify checkout process to 3 steps or fewer');
      suggestions.push('Add progress indicators and trust signals (security badges)');
      suggestions.push('Implement guest checkout option to reduce friction');
      conversionOpportunities.push('Add exit-intent offers or discount codes');
      conversionOpportunities.push('Show shipping costs earlier in the process');
      technicalRecommendations.push('Optimize form validation and error handling');
      technicalRecommendations.push('Implement one-click upsell opportunities');
    } else if (page.url.includes('/login') || page.url.includes('/signin')) {
      insights.push('Login page exits prevent user access and engagement');
      suggestions.push('Add social login options (Google, Facebook, Apple)');
      suggestions.push('Implement "Forgot Password" flow prominently');
      suggestions.push('Show benefits of creating an account');
      securityConcerns.push('Implement rate limiting for login attempts');
      securityConcerns.push('Add CAPTCHA for suspicious activity detection');
      userExperience.push('Remember user email for faster future logins');
      userExperience.push('Provide clear error messages for failed logins');
    } else if (page.url === '/' || page.url === '') {
      insights.push('Homepage exits indicate first impression issues');
      suggestions.push('Ensure clear value proposition above the fold');
      suggestions.push('Add compelling hero section with strong CTAs');
      suggestions.push('Show social proof and trust indicators');
      contentImprovements.push('Refresh hero content regularly');
      contentImprovements.push('Add featured products/services prominently');
      seoRecommendations.push('Optimize meta tags and page speed for homepage');
      seoRecommendations.push('Ensure mobile-responsive design');
    } else if (page.url.includes('/product') || page.url.includes('/item')) {
      insights.push('Product page exits lose potential customers');
      suggestions.push('Add high-quality images with zoom functionality');
      suggestions.push('Include customer reviews and ratings prominently');
      suggestions.push('Show stock availability and shipping information');
      conversionOpportunities.push('Add related products and cross-sell items');
      conversionOpportunities.push('Implement "Customers also bought" section');
      contentImprovements.push('Enhance product descriptions with benefits, not just features');
    } else if (page.url.includes('/blog') || page.url.includes('/article')) {
      insights.push('Content page exits suggest engagement or relevance issues');
      suggestions.push('Add related articles at the bottom of the post');
      suggestions.push('Include social sharing buttons prominently');
      suggestions.push('Add email subscription CTA within content');
      contentImprovements.push('Improve readability with subheadings and bullet points');
      contentImprovements.push('Add engaging visuals and multimedia content');
      seoRecommendations.push('Optimize for featured snippets and long-tail keywords');
    }

    // General suggestions based on metrics
    if (isHighExitRate) {
      suggestions.push('Implement exit-intent popups with valuable offers');
      suggestions.push('Add internal linking to related, engaging content');
      suggestions.push('Conduct user testing to identify pain points');
      technicalRecommendations.push('Audit page loading speed and Core Web Vitals');
      technicalRecommendations.push('Test cross-browser and cross-device compatibility');
    }

    if (isLowEngagement) {
      suggestions.push('Add interactive elements (quizzes, calculators, videos)');
      suggestions.push('Improve content scannability with headings and visuals');
      suggestions.push('Ensure mobile optimization and touch-friendly design');
    }

    // SEO and technical recommendations
    seoRecommendations.push('Optimize page title and meta description for click-through');
    seoRecommendations.push('Ensure proper heading structure (H1, H2, H3)');
    seoRecommendations.push('Add schema markup for rich snippets');

    technicalRecommendations.push('Monitor and optimize Largest Contentful Paint (LCP)');
    technicalRecommendations.push('Reduce Cumulative Layout Shift (CLS)');
    technicalRecommendations.push('Implement proper caching and CDN strategies');

    // User experience enhancements
    userExperience.push('Ensure clear visual hierarchy and navigation');
    userExperience.push('Add breadcrumb navigation for multi-level sites');
    userExperience.push('Implement search functionality with autocomplete');

    // Content improvements
    contentImprovements.push('Use compelling headlines and subheadings');
    contentImprovements.push('Add social proof (testimonials, case studies)');
    contentImprovements.push('Include clear, action-oriented CTAs');

    // Determine severity
    let severity: 'high' | 'medium' | 'low' = 'low';
    if (page.exitRate > 70 || page.avgTimeOnPage < 10) {
      severity = 'high';
    } else if (page.exitRate > 40 || page.avgTimeOnPage < 30) {
      severity = 'medium';
    }

    // Ensure we have comprehensive suggestions
    if (suggestions.length < 3) {
      suggestions.push(
        'Conduct A/B testing on page layout and CTAs',
        'Analyze user session recordings for behavior patterns',
        'Survey exiting users for direct feedback'
      );
    }

    return {
      severity,
      insights: insights.length > 0 ? insights : [`Page shows ${page.exitRate}% exit rate with ${Math.round(page.avgTimeOnPage)}s average engagement`],
      suggestions: suggestions.slice(0, 6),
      performanceIssues: performanceIssues.slice(0, 3),
      securityConcerns: securityConcerns.slice(0, 2),
      seoRecommendations: seoRecommendations.slice(0, 3),
      userExperience: userExperience.slice(0, 3),
      conversionOpportunities: conversionOpportunities.slice(0, 3),
      technicalRecommendations: technicalRecommendations.slice(0, 3),
      contentImprovements: contentImprovements.slice(0, 3)
    };
  };

  const getPerformanceIcon = (page: ExitPage) => {
    if (page.avgTimeOnPage > 180) return '⚡';
    if (page.avgTimeOnPage > 60) return '📊';
    return '📄';
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      fetchExitPagesData();
    }
  };

  const getStatusColor = () => {
    if (dataStatus.isLive) return 'text-green-400';
    if (dataStatus.dataSource === 'fallback') return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = () => {
    if (dataStatus.isLive) return '🟢';
    if (dataStatus.dataSource === 'fallback') return '🟡';
    return '🔴';
  };

  const getStatusMessage = () => {
    if (dataStatus.isLive) return 'Live Data';
    if (dataStatus.dataSource === 'fallback') return 'Sample Data';
    if (dataStatus.error) return `Error: ${dataStatus.error}`;
    return 'No Data';
  };

  // Enhanced analysis component for each page
  const AnalysisSection = ({ page, analysis }: { page: ExitPage; analysis: AIAnalysis }) => (
    <div className="space-y-4 mt-3">
      {/* Key Insights */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
        <p className="text-sm font-medium text-blue-400 mb-2">🔍 AI Insights</p>
        <ul className="text-sm text-blue-300 list-disc list-inside space-y-1">
          {analysis.insights.map((insight, idx) => (
            <li key={idx}>{insight}</li>
          ))}
        </ul>
      </div>

      {/* Performance & Technical Issues */}
      {(analysis.performanceIssues.length > 0 || analysis.technicalRecommendations.length > 0) && (
        <div>
          <p className="text-sm font-medium text-red-400 mb-1">🚨 Performance & Technical</p>
          <div className="space-y-2">
            {analysis.performanceIssues.map((issue, idx) => (
              <div key={idx} className="text-sm text-red-300 bg-red-500/10 p-2 rounded">
                ⚠️ {issue}
              </div>
            ))}
            {analysis.technicalRecommendations.map((rec, idx) => (
              <div key={idx} className="text-sm text-orange-300 bg-orange-500/10 p-2 rounded">
                🔧 {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Experience */}
      {analysis.userExperience.length > 0 && (
        <div>
          <p className="text-sm font-medium text-purple-400 mb-1">👤 User Experience</p>
          <ul className="text-sm text-purple-300 list-disc list-inside space-y-1">
            {analysis.userExperience.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Conversion Optimization */}
      {analysis.conversionOpportunities.length > 0 && (
        <div>
          <p className="text-sm font-medium text-green-400 mb-1">💸 Conversion Opportunities</p>
          <ul className="text-sm text-green-300 list-disc list-inside space-y-1">
            {analysis.conversionOpportunities.map((opportunity, idx) => (
              <li key={idx}>{opportunity}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Content & SEO */}
      {(analysis.contentImprovements.length > 0 || analysis.seoRecommendations.length > 0) && (
        <div>
          <p className="text-sm font-medium text-yellow-400 mb-1">📈 Content & SEO</p>
          <div className="space-y-2">
            {analysis.contentImprovements.map((improvement, idx) => (
              <div key={idx} className="text-sm text-yellow-300 bg-yellow-500/10 p-2 rounded">
                ✍️ {improvement}
              </div>
            ))}
            {analysis.seoRecommendations.map((rec, idx) => (
              <div key={idx} className="text-sm text-blue-300 bg-blue-500/10 p-2 rounded">
                🔍 {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security */}
      {analysis.securityConcerns.length > 0 && (
        <div>
          <p className="text-sm font-medium text-orange-400 mb-1">🛡️ Security</p>
          <ul className="text-sm text-orange-300 list-disc list-inside space-y-1">
            {analysis.securityConcerns.map((concern, idx) => (
              <li key={idx}>{concern}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actionable Recommendations */}
      <div>
        <p className="text-sm font-medium text-white mb-1">🎯 Recommended Actions</p>
        <ul className="text-sm text-slate-300 list-disc list-inside space-y-1">
          {analysis.suggestions.map((suggestion, idx) => (
            <li key={idx}>{suggestion}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  // Minimal debug panel (hidden by default)
  const DebugPanel = () => (
    <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-yellow-300">🔧 Debug Information</h4>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded"
        >
          {showDebug ? 'Hide' : 'Show'} Raw Data
        </button>
      </div>
      
      {showDebug && rawApiResponse && (
        <div className="mt-3 p-3 bg-black rounded border border-gray-600">
          <h5 className="font-mono text-sm text-green-400 mb-2">Raw API Response:</h5>
          <pre className="text-xs text-gray-300 overflow-auto max-h-60">
            {JSON.stringify(rawApiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  // Calculate high priority pages correctly
  const highPriorityPagesCount = topExitPages.filter(p => p.exitRate > 70).length;

  const isActuallyLoading = isLoading || internalLoading;

  // Individual page analysis component with AI loading
  const PageAnalysis = ({ page, index }: { page: ExitPage; index: number }) => {
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    useEffect(() => {
      const loadAnalysis = async () => {
        setLoadingAnalysis(true);
        try {
          const aiAnalysis = await getAIAnalysis(page);
          setAnalysis(aiAnalysis);
        } catch (error) {
          console.error('Failed to load AI analysis:', error);
          const fallbackAnalysis = getFallbackAnalysis(page);
          setAnalysis(fallbackAnalysis);
        }
        setLoadingAnalysis(false);
      };

      loadAnalysis();
    }, [page]);

    const currentAnalysis = analysis || getFallbackAnalysis(page);

    return (
      <div className={`border-l-4 ${
        currentAnalysis.severity === 'high' ? 'border-red-400' :
        currentAnalysis.severity === 'medium' ? 'border-yellow-400' : 'border-green-400'
      } pl-4 py-3 bg-gradient-to-r from-slate-700/50 to-slate-800/30 rounded-r-lg`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getPerformanceIcon(page)}</span>
              <h4 className="font-semibold text-white truncate" title={page.url}>
                {page.url || 'Unknown Page'}
              </h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-300 mb-3">
              <div>
                <span className="font-medium">Exit Rate: </span>
                <strong className={`${
                  page.exitRate > 70 ? 'text-red-400' :
                  page.exitRate > 40 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {page.exitRate}%
                </strong>
              </div>
              <div>
                <span className="font-medium">Visits: </span>
                {page.visits.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Avg Time: </span>
                {Math.floor(page.avgTimeOnPage / 60)}m {page.avgTimeOnPage % 60}s
              </div>
              <div>
                <span className="font-medium">Priority: </span>
                <span className={currentAnalysis.severity === 'high' ? 'text-red-400' : 
                               currentAnalysis.severity === 'medium' ? 'text-yellow-400' : 'text-green-400'}>
                  {currentAnalysis.severity.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Enhanced Analysis Section */}
            {loadingAnalysis ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-slate-400 text-sm">AI is analyzing page performance...</p>
              </div>
            ) : (
              <AnalysisSection page={page} analysis={currentAnalysis} />
            )}
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
            currentAnalysis.severity === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
            currentAnalysis.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
            'bg-green-500/20 text-green-300 border-green-500/30'
          } ml-4`}>
            {currentAnalysis.severity.toUpperCase()}
          </div>
        </div>
      </div>
    );
  };

  // Show loading state
  if (isActuallyLoading) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            🚨 Exit Pages Analysis
          </h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-400">Loading Live Data...</div>
            <button
              onClick={handleRefresh}
              disabled={isActuallyLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 transition-colors"
            >
              <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
              <span>Refreshing</span>
            </button>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Fetching live exit page data...</p>
          <p className="text-sm text-slate-500 mt-2">
            Connecting to {domain} for real-time analytics
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (dataStatus.dataSource === 'error') {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-red-500/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            🚨 Exit Pages Analysis
          </h3>
          <div className="flex items-center gap-2 text-sm text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Connection Error</span>
          </div>
        </div>
        
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-red-300 mb-2">⚠️ Live Data Unavailable</h4>
          <p className="text-red-200 text-sm">{dataStatus.error}</p>
        </div>

        <div className="text-center py-4">
          <button
            onClick={fetchExitPagesData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry Live Connection
          </button>
        </div>
      </div>
    );
  }

  // Show message if no live data available
  if (topExitPages.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            🚨 Exit Pages Analysis
          </h3>
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Awaiting Live Data</span>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-slate-300">No live exit page data available yet.</p>
          <p className="text-sm text-slate-500 mt-2">
            Real exit page analysis will appear here once visitors start leaving your pages.
          </p>
          
          <div className="mt-6 space-y-3">
            <button
              onClick={fetchExitPagesData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              🔄 Check for Live Data
            </button>
            <p className="text-xs text-slate-400">
              The system automatically checks for new data every 2 minutes
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">
            🚨 Live Exit Pages Analysis
          </h3>
          {dataStatus.lastUpdated && (
            <p className="text-xs text-slate-400 mt-1">
              Last updated: {new Date(dataStatus.lastUpdated).toLocaleTimeString()} • Auto-refresh every 2 minutes
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
            <span>{getStatusIcon()}</span>
            <span>{getStatusMessage()}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isActuallyLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 transition-colors"
          >
            {isActuallyLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                <span>Refreshing</span>
              </>
            ) : (
              <>
                <span>↻</span>
                <span>Refresh Now</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Live Data Status Panel */}
      <div className={`mb-4 p-3 rounded text-xs ${
        dataStatus.isLive ? 'bg-green-500/20 border border-green-500/30' :
        dataStatus.dataSource === 'fallback' ? 'bg-yellow-500/20 border border-yellow-500/30' :
        'bg-blue-500/20 border border-blue-500/30'
      }`}>
        <div className="text-slate-300">
          <strong>
            {dataStatus.isLive ? '✅ Live Data Analysis' : 
             dataStatus.dataSource === 'fallback' ? '⚠️ Sample Data Analysis' : '🔍 Data Analysis'}
          </strong>
          <div className="mt-1 text-slate-400 space-y-1">
            <p>Domain: {domain} | Pages: {topExitPages.length} | Total Visitors: {dataStatus.debugInfo?.totalVisitors || 0}</p>
          </div>
        </div>
      </div>
      
      <p className="text-slate-300 mb-6">
        AI-powered insights on why visitors leave your site. Analyzing {topExitPages.length} pages with highest exit rates from actual visitor data.
      </p>
      
      <div className="space-y-4">
        {topExitPages.map((page, index) => (
          <PageAnalysis key={index} page={page} index={index} />
        ))}
      </div>

      {/* Enhanced Summary Section */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
        <h4 className="font-semibold text-blue-300 mb-3">🧠 AI-Powered Exit Analysis Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-300 font-medium">📈 Key Opportunities</p>
            <ul className="text-blue-200 mt-2 space-y-1">
              <li>• {highPriorityPagesCount} high-priority pages need immediate attention</li>
              <li>• Average exit rate: {Math.round(topExitPages.reduce((acc, p) => acc + p.exitRate, 0) / topExitPages.length)}% across analyzed pages</li>
              <li>• Focus on checkout and login pages for maximum impact</li>
            </ul>
          </div>
          <div>
            <p className="text-purple-300 font-medium">🎯 Recommended Focus Areas</p>
            <ul className="text-purple-200 mt-2 space-y-1">
              <li>• Improve page loading speeds and Core Web Vitals</li>
              <li>• Enhance mobile user experience and responsiveness</li>
              <li>• Implement exit-intent strategies for high-value pages</li>
              <li>• Optimize content engagement and readability</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-blue-500/30">
          <p className="text-green-300 text-sm">
            💡 <strong>Pro Tip:</strong> Start with the highest exit rate pages first for maximum impact on user retention.
          </p>
        </div>
      </div>

      {/* Debug panel is now completely hidden unless explicitly shown */}
      {showDebug && <DebugPanel />}
    </div>
  );
};

export default ExitPagesAnalysis;