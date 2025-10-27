import { GoogleGenerativeAI } from '@google/generative-ai';

// services/geminiService.ts

const API_BASE = 'https://tooler-io.onrender.com';
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'api-key');
export interface AIPageAnalysis {
  severity: 'high' | 'medium' | 'low';
  suggestions: string[];
  performanceIssues: string[];
  securityConcerns: string[];
  seoRecommendations: string[];
}

export interface AIFunnelAnalysis {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  stageAnalyses: {
    [stage: string]: {
      issues: string[];
      recommendations: string[];
      industryBenchmark: number;
    };
  };
  industryInsights: string[];
  optimizationOpportunities: string[];
}

export interface AISourceAnalysis {
  performanceRating: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation: string;
  budgetAllocation: 'increase' | 'maintain' | 'decrease' | 'test';
  industryComparison: string;
  optimizationTips: string[];
  riskFactors: string[];
  opportunityAreas: string[];
}

export type WebsiteType = 'ecommerce' | 'blog' | 'saas' | 'leadgen' | 'portfolio' | 'unknown';

// Generic fetch helper with better error handling
async function fetchWithFallback<T>(
  endpoint: string, 
  data: any, 
  fallback: T,
  options?: { timeout?: number }
): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options?.timeout || 10000);

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON but got: ${contentType}. Response: ${text.slice(0, 100)}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    
    // Log to your error tracking service if you have one
    if (process.env.NODE_ENV === 'production') {
      // You can send error to your error tracking service here
      console.log('AI service error:', error);
    }
    
    return fallback;
  }
}

export const getAISuggestions = async (trafficData: any, domain: string) => {
  const fallback = {
    insights: [
      "We're currently optimizing our analysis system",
      "Your site shows potential for growth",
      "Focus on user experience improvements"
    ],
    recommendations: [
      "Ensure fast page loading times",
      "Make content easily accessible",
      "Engage visitors with clear calls to action"
    ]
  };

  return fetchWithFallback(
    '/api/suggestions',
    { trafficData, domain },
    fallback,
    { timeout: 15000 } // 15 second timeout for AI processing
  );
};

export const getWeeklySummary = async (trafficData: any, domain: string) => {
  const fallback = {
    summary: `Summary for ${domain}: Your analytics dashboard is being optimized. Check back soon for detailed insights.`
  };

  return fetchWithFallback(
    '/api/summary',
    { trafficData, domain },
    fallback
  );
};

export const getImprovementSuggestions = async (trafficData: any, domain: string) => {
  const fallback = [
    "Optimize images for faster loading",
    "Simplify navigation menus", 
    "Enhance mobile responsiveness",
    "Improve page loading speed",
    "Add engaging content sections"
  ];

  const result = await fetchWithFallback(
    '/api/improvements',
    { trafficData, domain },
    { improvements: fallback }
  );

  // Ensure we always return an array
  return Array.isArray(result.improvements) ? result.improvements : fallback;
};

// Optional: Add a method to check service health
export const checkAIHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
};
export const getAIPageAnalysis = async (page: any, domain: string): Promise<AIPageAnalysis> => {
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const prompt = `
Analyze this webpage's performance data and provide specific recommendations:

Page URL: ${page.url}
Domain: ${domain}
Performance Metrics:
- Exit Rate: ${page.exitRate}%
- Visits: ${page.visits}
- Average Time on Page: ${page.avgTimeOnPage} seconds
- Page Load Time: ${page.pageLoadTime || 'N/A'} ms

Based on these metrics and typical web performance standards, provide:
1. Severity assessment (high/medium/low)
2. 3-5 specific suggestions to improve retention
3. Performance issues to address
4. Security concerns if any
5. SEO recommendations

Return as JSON with this exact structure:
{
  "severity": "high|medium|low",
  "suggestions": ["suggestion1", "suggestion2", ...],
  "performanceIssues": ["issue1", "issue2", ...],
  "securityConcerns": ["concern1", "concern2", ...],
  "seoRecommendations": ["rec1", "rec2", ...]
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid AI response format');
  } catch (error) {
    console.error('AI page analysis failed:', error);
    throw error;
  }
};

export const getAIFunnelAnalysis = async (
  funnel: any[],
  domain: string,
  websiteType: string
): Promise<AIFunnelAnalysis> => {
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const prompt = `
Analyze this conversion funnel data for a ${websiteType} website:

Domain: ${domain}
Funnel Stages:
${funnel.map(stage => `- ${stage.stage}: ${stage.visitors} visitors, ${stage.dropOffRate}% drop-off`).join('\n')}

Provide comprehensive analysis including:
1. Overall funnel health (excellent/good/fair/poor)
2. Analysis for each stage with issues and recommendations
3. Industry-specific insights
4. Optimization opportunities

Return as JSON with proper structure for funnel analysis.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid AI response format');
  } catch (error) {
    console.error('AI funnel analysis failed:', error);
    throw error;
  }
};

export const getAITrafficSourceAnalysis = async (
  source: any,
  domain: string,
  timeRange: string
): Promise<AISourceAnalysis> => {
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const prompt = `
Analyze this traffic source performance:

Source: ${source.source}
Domain: ${domain}
Time Range: ${timeRange}
Metrics:
- Visitors: ${source.visitors}
- Bounce Rate: ${source.bounceRate}%
- Conversion Rate: ${source.conversionRate}%
- Cost: $${source.cost || 'N/A'}
- Revenue: $${source.revenue || 'N/A'}

Provide performance analysis including:
1. Performance rating (excellent/good/fair/poor)
2. Budget allocation recommendation
3. Industry comparison
4. Optimization tips
5. Risk factors
6. Opportunity areas

Return as structured JSON for traffic source analysis.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid AI response format');
  } catch (error) {
    console.error('AI traffic source analysis failed:', error);
    throw error;
  }
};
export const getAIWebsiteType = async (domain: string, samplePaths: string[]): Promise<WebsiteType> => {
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
Analyze this website based on its domain and common page paths to determine its type:

Domain: ${domain}
Sample Page Paths: ${samplePaths.slice(0, 10).join(', ')}

Determine if this is primarily an:
- ecommerce (shopping, products, cart)
- blog (articles, posts, content)
- saas (software, features, pricing)
- leadgen (forms, contact, downloads)
- portfolio (projects, work, showcase)
- unknown (can't determine)

Return only the type as a single word: ecommerce, blog, saas, leadgen, portfolio, or unknown
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim().toLowerCase();

    const validTypes = ['ecommerce', 'blog', 'saas', 'leadgen', 'portfolio', 'unknown'];
    return validTypes.includes(text) ? text as WebsiteType : 'unknown';
  } catch (error: any) {
    // Handle quota exceeded errors gracefully
    if (error?.message?.includes('quota') || error?.message?.includes('429') || error?.message?.includes('exceeded')) {
      console.log('AI website type detection: Free tier quota exceeded, using fallback detection');
      return 'unknown';
    }

    // Log other errors but don't show them to users
    console.warn('AI website type detection encountered an error, using fallback');
    return 'unknown';
  }
};
