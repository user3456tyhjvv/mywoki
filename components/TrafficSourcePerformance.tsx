import React from 'react';

interface TrafficSource {
  source: string;
  visitors: number;
  bounceRate: number;
  conversionRate: number;
  cost?: number;
  revenue?: number;
  sessions?: number;
  pageViews?: number;
}

interface TrafficSourcePerformanceProps {
  data: TrafficSource[];
  domain: string;
  timeRange?: '7d' | '30d' | '90d';
  isLoading?: boolean;
}

interface AISourceAnalysis {
  performanceRating: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation: string;
  budgetAllocation: 'increase' | 'maintain' | 'decrease' | 'test';
  industryComparison: string;
  optimizationTips: string[];
  riskFactors: string[];
  opportunityAreas: string[];
}

const TrafficSourcePerformance: React.FC<TrafficSourcePerformanceProps> = ({ 
  data, 
  domain, 
  timeRange = '30d',
  isLoading = false
}) => {
  const getFallbackAnalysis = (source: TrafficSource): AISourceAnalysis => {
    const roi = calculateROI(source);
    const performanceRating = getPerformanceRating(source, roi);
    
    let recommendation = '';
    let budgetAllocation: AISourceAnalysis['budgetAllocation'] = 'maintain';
    const optimizationTips: string[] = [];
    const riskFactors: string[] = [];
    const opportunityAreas: string[] = [];

    // Performance-based recommendations
    if (performanceRating === 'excellent') {
      recommendation = 'Scale this channel - exceptional performance';
      budgetAllocation = 'increase';
      opportunityAreas.push('Consider expanding to similar audience segments');
    } else if (performanceRating === 'good') {
      recommendation = 'Maintain current investment with minor optimizations';
      budgetAllocation = 'maintain';
    } else if (performanceRating === 'fair') {
      recommendation = 'Test optimizations before increasing budget';
      budgetAllocation = 'test';
      optimizationTips.push('A/B test ad creatives and targeting');
    } else {
      recommendation = 'Review strategy - consider reducing spend';
      budgetAllocation = 'decrease';
      riskFactors.push('High bounce rate indicates poor audience targeting');
    }

    // Source-specific insights
    switch (source.source.toLowerCase()) {
      case 'google':
        optimizationTips.push('Optimize Google Ads quality score');
        optimizationTips.push('Use negative keywords to improve targeting');
        break;
      case 'facebook':
        optimizationTips.push('Test different audience segments');
        optimizationTips.push('Optimize for mobile-first experience');
        break;
      case 'instagram':
        optimizationTips.push('Focus on visual content and stories');
        optimizationTips.push('Leverage influencer partnerships');
        break;
      case 'direct':
        opportunityAreas.push('Direct traffic often has highest conversion rates');
        break;
    }

    // Bounce rate analysis
    if (source.bounceRate > 70) {
      riskFactors.push('Very high bounce rate indicates landing page issues');
      optimizationTips.push('Improve landing page relevance and load speed');
    }

    // Conversion rate analysis
    if (source.conversionRate < 1) {
      riskFactors.push('Low conversion rate suggests funnel optimization needed');
    }

    return {
      performanceRating,
      recommendation,
      budgetAllocation,
      industryComparison: getIndustryComparison(source),
      optimizationTips: optimizationTips.length ? optimizationTips : ['Monitor performance closely'],
      riskFactors,
      opportunityAreas: opportunityAreas.length ? opportunityAreas : ['Continue current strategy']
    };
  };

  const calculateROI = (source: TrafficSource) => {
    if (!source.cost || !source.revenue) return null;
    return ((source.revenue - source.cost) / source.cost) * 100;
  };

  const getPerformanceRating = (source: TrafficSource, roi: number | null): AISourceAnalysis['performanceRating'] => {
    if (roi !== null) {
      if (roi > 200) return 'excellent';
      if (roi > 50) return 'good';
      if (roi > 0) return 'fair';
      return 'poor';
    }
    
    // Fallback to engagement metrics
    const score = (source.conversionRate * 3) + ((100 - source.bounceRate) * 0.1);
    if (score > 20) return 'excellent';
    if (score > 10) return 'good';
    if (score > 5) return 'fair';
    return 'poor';
  };

  const getIndustryComparison = (source: TrafficSource): string => {
    const benchmarks: any = {
      google: { bounceRate: 40, conversionRate: 3.5 },
      facebook: { bounceRate: 50, conversionRate: 2.0 },
      instagram: { bounceRate: 45, conversionRate: 1.5 },
      direct: { bounceRate: 35, conversionRate: 4.0 },
      organic: { bounceRate: 42, conversionRate: 2.8 }
    };

    const benchmark = benchmarks[source.source.toLowerCase()] || { bounceRate: 45, conversionRate: 2.0 };
    
    const bounceComparison = source.bounceRate <= benchmark.bounceRate ? 'better' : 'worse';
    const conversionComparison = source.conversionRate >= benchmark.conversionRate ? 'better' : 'worse';
    
    return `Bounce rate ${bounceComparison}, Conversion rate ${conversionComparison} than industry average`;
  };

  const getBudgetColor = (allocation: string) => {
    switch (allocation) {
      case 'increase': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'maintain': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'test': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'decrease': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getPerformanceColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'bg-green-500/20 text-green-300';
      case 'good': return 'bg-blue-500/20 text-blue-300';
      case 'fair': return 'bg-yellow-500/20 text-yellow-300';
      case 'poor': return 'bg-red-500/20 text-red-300';
      default: return 'bg-slate-500/20 text-slate-300';
    }
  };

  const getSourceIcon = (source: string) => {
    const icons: { [key: string]: string } = {
      'google': '🔍',
      'facebook': '📘',
      'instagram': '📷',
      'twitter': '🐦',
      'linkedin': '💼',
      'direct': '🏠',
      'organic': '🌱',
      'email': '📧'
    };
    return icons[source.toLowerCase()] || '📊';
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">
          📊 Traffic Source Performance
        </h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Updating traffic source analysis...</p>
          <p className="text-sm text-slate-500 mt-2">
            Loading latest traffic source data for {domain}
          </p>
        </div>
      </div>
    );
  }

  // Show message if no data
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">
          📊 Traffic Source Performance
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🚀</div>
          <p className="text-slate-300">No traffic source data available yet.</p>
          <p className="text-sm text-slate-500 mt-2">
            Traffic source analysis will appear here once you have sufficient traffic data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">
          📊 Traffic Source Performance
        </h3>
        <div className="text-sm text-slate-400">
          Period: {timeRange}
        </div>
      </div>
      
      <p className="text-slate-300 mb-6">
        Analysis of marketing channels with budget recommendations and optimization tips.
      </p>
      
      <div className="space-y-4">
        {data.map((source, index) => {
          const roi = calculateROI(source);
          const analysis = getFallbackAnalysis(source);

          return (
            <div key={index} className="border border-slate-700 rounded-lg p-4 hover:bg-slate-700/30 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getSourceIcon(source.source)}</span>
                  <div>
                    <h4 className="font-semibold text-white capitalize">
                      {source.source}
                    </h4>
                    <p className="text-sm text-slate-400">
                      {source.visitors.toLocaleString()} visitors
                      {source.sessions && ` • ${source.sessions.toLocaleString()} sessions`}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceColor(analysis.performanceRating)}`}>
                    {analysis.performanceRating.toUpperCase()}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getBudgetColor(analysis.budgetAllocation)}`}>
                    {analysis.budgetAllocation.toUpperCase()}
                  </div>
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                <div>
                  <p className="text-slate-400">Bounce Rate</p>
                  <p className={`font-semibold ${
                    source.bounceRate > 70 ? 'text-red-400' :
                    source.bounceRate > 50 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {source.bounceRate}%
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Conversion Rate</p>
                  <p className={`font-semibold ${
                    source.conversionRate > 5 ? 'text-green-400' :
                    source.conversionRate > 2 ? 'text-blue-400' : 'text-yellow-400'
                  }`}>
                    {source.conversionRate}%
                  </p>
                </div>
                {source.cost && (
                  <div>
                    <p className="text-slate-400">Cost</p>
                    <p className="font-semibold text-white">${source.cost.toLocaleString()}</p>
                  </div>
                )}
                {roi !== null && (
                  <div>
                    <p className="text-slate-400">ROI</p>
                    <p className={`font-semibold ${
                      roi > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {/* Main Recommendation */}
                <div className="p-3 bg-blue-500/20 rounded border border-blue-500/30">
                  <p className="text-sm font-medium text-blue-300">
                    💡 {analysis.recommendation}
                  </p>
                </div>

                {/* Industry Comparison */}
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-1">🏭 Industry Comparison:</p>
                  <p className="text-sm text-slate-400">{analysis.industryComparison}</p>
                </div>

                {/* Optimization Tips */}
                {analysis.optimizationTips.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-400 mb-1">🚀 Optimization Tips:</p>
                    <ul className="text-sm text-green-300 list-disc list-inside space-y-1">
                      {analysis.optimizationTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk Factors */}
                {analysis.riskFactors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-400 mb-1">⚠️ Risk Factors:</p>
                    <ul className="text-sm text-red-300 list-disc list-inside space-y-1">
                      {analysis.riskFactors.map((risk, idx) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Opportunity Areas */}
                {analysis.opportunityAreas.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-purple-400 mb-1">🎯 Opportunity Areas:</p>
                    <ul className="text-sm text-purple-300 list-disc list-inside space-y-1">
                      {analysis.opportunityAreas.map((opportunity, idx) => (
                        <li key={idx}>{opportunity}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
        <h4 className="font-semibold text-purple-300 mb-3">📈 Channel Performance Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-purple-300">Total Channels</p>
            <p className="text-lg font-bold text-purple-400">{data.length}</p>
          </div>
          <div>
            <p className="text-purple-300">High Performers</p>
            <p className="text-lg font-bold text-green-400">
              {data.filter(source => getPerformanceRating(source, calculateROI(source)) === 'excellent').length}
            </p>
          </div>
          <div>
            <p className="text-purple-300">Need Optimization</p>
            <p className="text-lg font-bold text-red-400">
              {data.filter(source => getPerformanceRating(source, calculateROI(source)) === 'poor').length}
            </p>
          </div>
          <div>
            <p className="text-purple-300">Total Visitors</p>
            <p className="text-lg font-bold text-blue-400">
              {data.reduce((acc, source) => acc + source.visitors, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficSourcePerformance;