import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Expanded types and interfaces
 * - website types expanded to 20+ (union type)
 * - added urlStructureStats, logoUrl, seoHints fields where useful
 */

interface PageView {
  path: string;
  visitor_id: string;
  timestamp: string;
  duration?: number;
  source?: string;
  device?: string;
  country?: string;
}

interface FunnelStage {
  stage: string;
  visitors: number;
  dropOffCount: number;
  dropOffRate: number;
  timestamp?: string;
  conversionRate?: number;
  averageTime?: number;
  pageViews?: number;
}

type WebsiteType =
  | 'ecommerce' | 'marketplace' | 'saas' | 'blog' | 'leadgen' | 'portfolio' | 'education'
  | 'news' | 'media' | 'community' | 'forum' | 'directory' | 'classifieds' | 'membership'
  | 'booking' | 'affiliate' | 'documentation' | 'wiki' | 'government' | 'corporate' | 'nonprofit' | 'entertainment';

interface DetectedProduct {
  name?: string;
  price?: string | number;
  url?: string;
  image?: string;
}

interface UrlStructureStats {
  productPatterns: number;
  categoryPatterns: number;
  datePatterns: number;
  searchPatterns: number;
  deepPaths: number;
  singlePageCount: number;
  examplePaths: string[];
}

interface WebsiteIntelligence {
  type: WebsiteType;
  subtype?: string; // if we detect a specific subcategory
  confidence: number;
  patternScores: { [key: string]: number };
  characteristics: string[];
  productCount?: number;
  detectedProducts?: DetectedProduct[];
  detectedPages: {
    products?: string[];
    categories?: string[];
    checkout?: string[];
    content?: string[];
    features?: string[];
    pricing?: string[];
    signup?: string[];
    contact?: string[];
    about?: string[];
    services?: string[];
    sitemap?: string[];
  };
  technicalInsights: {
    averageLoadTime?: number;
    mobileOptimized: boolean;
    hasSearch: boolean;
    hasFilters: boolean;
    hasRecommendations: boolean;
    hasBlog: boolean;
    hasEcommerce: boolean;
    hasForms: boolean;
    seoHints?: string[]; // e.g., sitemap found, robots found, lengthy urls, meta-like hints
    logoUrl?: string | null;
  };
  contentAnalysis: {
    primaryPurpose: string;
    targetAudience: string[];
    contentQuality: 'high' | 'medium' | 'low';
    updateFrequency: 'frequent' | 'regular' | 'rare';
    seoScore?: number; // rough heuristic
  };
}

interface DeepAnalysis {
  websiteHealth: {
    score: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    issues: Array<{ severity: 'critical' | 'high' | 'medium' | 'low'; message: string; fix: string }>;
  };
  userBehaviorPatterns: {
    commonJourneys: Array<{ path: string[]; frequency: number; conversionRate: number }>;
    exitPoints: Array<{ page: string; percentage: number; reason: string }>;
    engagementZones: Array<{ page: string; avgTime: number; scrollDepth: number }>;
  };
  competitiveInsights: {
    industryBenchmarks: { [key: string]: number };
    yourPosition: 'leader' | 'above_average' | 'average' | 'below_average';
    opportunities: string[];
  };
  revenueOptimization: {
    estimatedLostRevenue: number;
    quickWins: Array<{ action: string; impact: string; effort: 'low' | 'medium' | 'high' }>;
    longTermStrategy: string[];
    budgetRecommendations: {
      estimatedBudget: number;
      allocation: Array<{ channel: string; amount: number; percentage: number }>;
      roiProjection: number;
    };
  };
  technicalRecommendations: {
    performance: string[];
    seo: string[];
    ux: string[];
    conversion: string[];
  };
  marketingRecommendations: {
    channels: Array<{ name: string; suitability: 'high' | 'medium' | 'low'; budget: number; reasoning: string }>;
    strategies: string[];
    timeline: Array<{ phase: string; duration: string; actions: string[] }>;
  };
}

/* -----------------------------
   Component and state
   ----------------------------- */

const ConversionFunnel: React.FC<{ data: FunnelStage[]; domain: string; pageViews: PageView[] }> = ({
  data,
  domain,
  pageViews = []
}) => {
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const [intelligence, setIntelligence] = useState<WebsiteIntelligence | null>(null);
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'funnel' | 'intelligence' | 'recommendations' | 'revenue'>('funnel');
  const [processingStage, setProcessingStage] = useState('Analyzing website structure...');
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark = resolvedTheme === 'dark';

  const API_BASE_URL = process.env.NODE_ENV === 'production' ? 'https://tooler-io.onrender.com' : 'http://localhost:3001';

  /* -----------------------------
     New: Pattern definitions with weights
     ----------------------------- */
  const PATTERNS: { [key in WebsiteType]: { keywords: Array<{ k: string; w: number }>; urlRegex?: RegExp[] } } = {
    ecommerce: {
      keywords: [{ k: 'product', w: 3 }, { k: 'cart', w: 4 }, { k: 'checkout', w: 5 }, { k: 'shop', w: 2 }, { k: 'buy', w: 2 }, { k: 'price', w: 1 }],
      urlRegex: [/\/product\/[^/]+/, /\/p\/\w+/, /\/products\//, /\/cart/, /\/checkout/]
    },
    marketplace: { keywords: [{ k: 'seller', w: 3 }, { k: 'market', w: 3 }, { k: 'listings', w: 3 }], urlRegex: [/\/listings?/, /\/seller\//] },
    saas: { keywords: [{ k: 'pricing', w: 3 }, { k: 'trial', w: 2 }, { k: 'dashboard', w: 3 }, { k: 'api', w: 2 }], urlRegex: [/\/dashboard/, /\/signup/, /\/login/] },
    blog: { keywords: [{ k: 'blog', w: 3 }, { k: 'article', w: 2 }, { k: 'post', w: 2 }, { k: 'author', w: 1 }], urlRegex: [/\/\d{4}\/\d{2}\/\d{2}\/.+/, /\/(blog|post|article)\//] },
    leadgen: { keywords: [{ k: 'contact', w: 3 }, { k: 'form', w: 2 }, { k: 'download', w: 2 }], urlRegex: [/\/contact/, /\/download/] },
    portfolio: { keywords: [{ k: 'portfolio', w: 3 }, { k: 'work', w: 2 }, { k: 'case-study', w: 3 }], urlRegex: [/\/portfolio/, /\/works\//] },
    education: { keywords: [{ k: 'course', w: 3 }, { k: 'lesson', w: 2 }, { k: 'enroll', w: 2 }], urlRegex: [/\/course/, /\/lesson/] },
    news: { keywords: [{ k: 'news', w: 3 }, { k: 'press', w: 2 }, { k: 'breaking', w: 2 }], urlRegex: [/\/news/, /\/\d{4}\/\d{2}\/\d{2}\//] },
    media: { keywords: [{ k: 'video', w: 2 }, { k: 'gallery', w: 1 }], urlRegex: [/\/media/, /\/video/] },
    community: { keywords: [{ k: 'forum', w: 3 }, { k: 'threads', w: 2 }, { k: 'member', w: 1 }], urlRegex: [/\/forum/, /\/thread\//] },
    forum: { keywords: [{ k: 'thread', w: 3 }, { k: 'reply', w: 2 }], urlRegex: [/\/thread\//, /\/topic\//] },
    directory: { keywords: [{ k: 'directory', w: 2 }, { k: 'list', w: 1 }], urlRegex: [/\/directory/, /\/list\//] },
    classifieds: { keywords: [{ k: 'ad', w: 2 }, { k: 'classified', w: 3 }], urlRegex: [/\/classifieds?/, /\/ad\//] },
    membership: { keywords: [{ k: 'member', w: 3 }, { k: 'subscription', w: 3 }], urlRegex: [/\/account/, /\/members/] },
    booking: { keywords: [{ k: 'book', w: 3 }, { k: 'reservation', w: 3 }, { k: 'availability', w: 2 }], urlRegex: [/\/book/, /\/reservation/] },
    affiliate: { keywords: [{ k: 'affiliate', w: 3 }, { k: 'referral', w: 2 }], urlRegex: [/\/affiliate/, /\/ref/ ] },
    documentation: { keywords: [{ k: 'docs', w: 3 }, { k: 'api', w: 2 }, { k: 'reference', w: 1 }], urlRegex: [/\/docs?/, /\/api\//] },
    wiki: { keywords: [{ k: 'wiki', w: 3 }, { k: 'edit', w: 1 }], urlRegex: [/\/wiki\//] },
    government: { keywords: [{ k: 'gov', w: 3 }, { k: 'policy', w: 2 }], urlRegex: [/\/gov/, /\/policy/] },
    corporate: { keywords: [{ k: 'about', w: 1 }, { k: 'investor', w: 2 }, { k: 'team', w: 1 }], urlRegex: [/\/about/, /\/team/] },
    nonprofit: { keywords: [{ k: 'donate', w: 4 }, { k: 'mission', w: 2 }], urlRegex: [/\/donate/, /\/volunteer/] },
    entertainment: { keywords: [{ k: 'show', w: 2 }, { k: 'tickets', w: 3 }, { k: 'events', w: 2 }], urlRegex: [/\/events?/, /\/tickets/] }
  };

  // Theme colors (from original)
  const themeColors = {
    background: isDark ? 'bg-gray-900' : 'bg-white',
    card: isDark ? 'bg-gray-800' : 'bg-white',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-300' : 'text-gray-600',
      muted: isDark ? 'text-gray-400' : 'text-gray-500'
    },
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    gradient: isDark 
      ? 'from-gray-800 to-gray-900' 
      : 'from-blue-50 to-purple-50',
    accent: {
      primary: isDark ? 'from-purple-600 to-blue-600' : 'from-blue-500 to-purple-600',
      secondary: isDark ? 'from-green-600 to-teal-600' : 'from-green-500 to-teal-600',
      warning: isDark ? 'from-yellow-600 to-orange-600' : 'from-yellow-500 to-orange-500',
      danger: isDark ? 'from-red-600 to-pink-600' : 'from-red-500 to-pink-500'
    }
  };

  /* -----------------------------
     New helper: detect logo by trying common paths (lightweight)
     ----------------------------- */
  const tryImageLoad = (url: string, timeout = 2500): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      let done = false;
      const t = setTimeout(() => {
        if (!done) {
          done = true;
          resolve(false);
        }
      }, timeout);
      img.onload = () => {
        if (!done) {
          clearTimeout(t);
          done = true;
          resolve(true);
        }
      };
      img.onerror = () => {
        if (!done) {
          clearTimeout(t);
          done = true;
          resolve(false);
        }
      };
      img.src = url;
    });
  };

  const detectLogoUrl = async (domainHost: string): Promise<string | null> => {
    if (!domainHost) return null;
    const scheme = domainHost.startsWith('http') ? '' : 'https://';
    const candidates = [
      `${scheme}${domainHost}/favicon.ico`,
      `${scheme}${domainHost}/favicon.png`,
      `${scheme}${domainHost}/logo.png`,
      `${scheme}${domainHost}/assets/logo.png`,
      `${scheme}${domainHost}/static/logo.png`,
      `${scheme}${domainHost}/img/logo.png`,
      `${scheme}${domainHost}/logo.svg`,
      `${scheme}${domainHost}/assets/images/logo.svg`
    ];

    for (const c of candidates) {
      try {
        // try load, but skip if cross-origin blocks (still will call onerror)
        const ok = await tryImageLoad(c, 2000);
        if (ok) return c;
      } catch {
        // ignore
      }
    }
    return null;
  };

  /* -----------------------------
     New: URL structure analysis
     ----------------------------- */
  const analyzeUrlStructure = (paths: string[]) : UrlStructureStats => {
    let productPatterns = 0, categoryPatterns = 0, datePatterns = 0, searchPatterns = 0, deepPaths = 0, singlePageCount = 0;
    const examplePaths: string[] = [];
    paths.forEach(p => {
      const path = p.toLowerCase();
      const depth = path.split('/').filter(Boolean).length;
      if (depth <= 1) singlePageCount++;
      if (depth >= 4) deepPaths++;
      if (/(\/product\/|\/products\/|\/p\/)/.test(path)) productPatterns++;
      if (/(\/category\/|\/collection\/|\/shop\/)/.test(path)) categoryPatterns++;
      if (/\d{4}\/\d{2}\/\d{2}/.test(path)) datePatterns++;
      if (/(search|q=|query=)/.test(path)) searchPatterns++;
      if (examplePaths.length < 6) examplePaths.push(path);
    });
    return { productPatterns, categoryPatterns, datePatterns, searchPatterns, deepPaths, singlePageCount, examplePaths };
  };

  /* -----------------------------
     New: Weighted scoring using PATTERNS + URL structure multipliers
     ----------------------------- */
  const scorePatterns = (paths: string[], views: PageView[]) => {
    const scores: { [key in WebsiteType]?: number } = {};
    const uniquePaths = [...new Set(paths)];
    Object.entries(PATTERNS).forEach(([type, def]) => {
      let score = 0;
      // keyword hits with weights
      def.keywords.forEach(({ k, w }) => {
        const matches = uniquePaths.filter(p => p.includes(k)).length;
        score += matches * w;
      });
      // regex/url structure matches add bonus
      if (def.urlRegex) {
        def.urlRegex.forEach(rx => {
          const matches = uniquePaths.filter(p => rx.test(p)).length;
          score += matches * 3; // regex matches are strong signal
        });
      }
      scores[type as WebsiteType] = score;
    });

    // Incorporate path depth and product/category counts to influence ecommerce vs blog
    const urlStats = analyzeUrlStructure(uniquePaths);
    if (urlStats.productPatterns > 0) scores['ecommerce'] = (scores['ecommerce'] || 0) + urlStats.productPatterns * 6;
    if (urlStats.categoryPatterns > 0) scores['ecommerce'] = (scores['ecommerce'] || 0) + urlStats.categoryPatterns * 3;
    if (urlStats.datePatterns > 0) scores['news'] = (scores['news'] || 0) + urlStats.datePatterns * 4;
    if (urlStats.searchPatterns > 0) {
      // search suggests larger content surfaces (marketplaces, directories, ecommerce)
      ['ecommerce', 'directory', 'marketplace'].forEach(t => {
        scores[t] = (scores[t] || 0) + urlStats.searchPatterns * 2;
      });
    }
    // path depth indicates complex app or ecommerce
    if (urlStats.deepPaths > uniquePaths.length * 0.2) {
      scores['saas'] = (scores['saas'] || 0) + urlStats.deepPaths;
    }

    return { scores, urlStats };
  };

  /* -----------------------------
     New: compute confidence using multiple signals
     ----------------------------- */
  const computeConfidence = (patternScores: { [key: string]: number }, urlStats: UrlStructureStats, technical: WebsiteIntelligence['technicalInsights'], viewsCount: number) => {
    const entries = Object.entries(patternScores);
    if (entries.length === 0) return 40;
    const maxScore = Math.max(...entries.map(e => e[1]));
    const second = entries.sort((a,b) => b[1]-a[1])[1]?.[1] || 0;
    // base confidence from dominance of top score vs second
    const dominance = maxScore - second;
    let confidence = Math.min(98, 30 + Math.log(1 + maxScore) * 6 + dominance * 2);
    // boost if technical signals match (hasEcommerce + product patterns)
    if (technical.hasEcommerce && urlStats.productPatterns > 0) confidence += 8;
    // penalize if very little data
    if (viewsCount < 5) confidence -= 12;
    // penalize if single-page site
    if (urlStats.singlePageCount / Math.max(1, viewsCount) > 0.8) confidence -= 10;
    return Math.max(20, Math.min(99, confidence));
  };

  /* -----------------------------
     Enhanced local analysis (fallback)
     ----------------------------- */
  const performLocalAnalysis = async (paths?: string[], views?: PageView[]): Promise<WebsiteIntelligence> => {
    console.log('🔄 Performing enhanced local analysis as fallback');

    const pathList = paths || (pageViews.length > 0 ? pageViews.map(pv => pv.path.toLowerCase()) : ['/']);
    const uniquePaths = [...new Set(pathList)];
    const viewList = views || pageViews;

    // score patterns and url structure
    const { scores: patternScores, urlStats } = scorePatterns(uniquePaths, viewList);

    // pick detected type
    const sorted = Object.entries(patternScores).sort((a,b) => b[1] - a[1]);
    const detectedType = (sorted[0]?.[0] || 'corporate') as WebsiteType;

    // technical insights heuristics
    const technicalInsights: WebsiteIntelligence['technicalInsights'] = {
      averageLoadTime: viewList.length > 0 ? viewList.reduce((s, v) => s + (v.duration || 0), 0) / viewList.length : 2.5,
      mobileOptimized: viewList.length > 0 ? viewList.filter(v => v.device?.includes('mobile')).length / viewList.length > 0.35 : true,
      hasSearch: uniquePaths.some(p => p.includes('search') || p.includes('q=')), 
      hasFilters: uniquePaths.some(p => p.includes('filter') || p.includes('sort') || p.includes('category')),
      hasRecommendations: uniquePaths.some(p => p.includes('recommend') || p.includes('related')),
      hasBlog: uniquePaths.some(p => p.includes('blog') || p.includes('article')),
      hasEcommerce: uniquePaths.some(p => p.includes('product') || p.includes('cart') || p.includes('checkout') || urlStats.productPatterns > 0),
      hasForms: uniquePaths.some(p => p.includes('contact') || p.includes('form') || p.includes('signup')),
      seoHints: []
    };

    // SEO hints (lightweight checks)
    if (uniquePaths.some(p => p.includes('sitemap') || p.includes('sitemap.xml'))) technicalInsights.seoHints!.push('Sitemap patterns detected in URL paths');
    // check typical SEO structure: slug-based (dash separated, date-based)
    if (uniquePaths.some(p => /-[a-z0-9-]{3,}/.test(p))) technicalInsights.seoHints!.push('Slug-like URLs present (good for SEO)');
    if (uniquePaths.some(p => p.includes('tag') || p.includes('category'))) technicalInsights.seoHints!.push('Category / tag pages present');

    // try detect logo (non-blocking)
    let logoUrl: string | null = null;
    try {
      logoUrl = await detectLogoUrl(domain.replace(/^https?:\/\//, '').replace(/\/$/, ''));
      if (logoUrl) technicalInsights.logoUrl = logoUrl;
    } catch {
      technicalInsights.logoUrl = null;
    }

    // content analysis
    const avgDuration = viewList.length > 0 ? viewList.reduce((s, v) => s + (v.duration || 0), 0) / viewList.length : 30;
    const contentQuality: 'high' | 'medium' | 'low' = avgDuration > 60 ? 'high' : avgDuration > 30 ? 'medium' : 'low';
    const contentAnalysis = {
      primaryPurpose: getPrimaryPurpose(detectedType),
      targetAudience: estimateTargetAudience(viewList, detectedType),
      contentQuality,
      updateFrequency: estimateUpdateFrequency(viewList),
      seoScore: Math.round((technicalInsights.seoHints?.length || 0) * 20 + Math.min(60, urlStats.examplePaths.length * 5)) // rough
    };

    // compute confidence
    const confidence = Math.round(computeConfidence(patternScores as any, urlStats, technicalInsights, viewList.length));

    // detected pages (improved)
    const detectedPages = analyzeDetectedPages(uniquePaths, detectedType);

    // generate characteristics
    const characteristics = generateCharacteristics(detectedType, uniquePaths, viewList);

    // product detection: basic count based on patterns
    let productCount = 0;
    if (urlStats.productPatterns > 0) productCount = urlStats.productPatterns * 2; // rough

    return {
      type: detectedType,
      confidence,
      patternScores: patternScores as any,
      characteristics,
      productCount,
      detectedProducts: [], // left blank for now (could scrape product list)
      detectedPages,
      technicalInsights,
      contentAnalysis
    };
  };

  /* -----------------------------
     Analyze website intelligence (calls backend with richer payload)
     ----------------------------- */
  const analyzeWebsiteIntelligence = async (): Promise<WebsiteIntelligence> => {
    try {
      console.log('🔍 Starting enhanced website intelligence analysis for:', domain);

      const paths = pageViews.length > 0 ? pageViews.map(pv => pv.path.toLowerCase()) : ['/'];
      const uniquePaths = [...new Set(paths)];
      const { scores: patternScores, urlStats } = scorePatterns(uniquePaths, pageViews);

      // Build extended analysis payload
      const analysisData = {
        domain,
        pageViews: pageViews.slice(0, 200), // send more context if available
        paths: uniquePaths,
        totalVisitors: pageViews.length > 0 ? new Set(pageViews.map(pv => pv.visitor_id)).size : 1,
        urlStructureStats: urlStats,
        patternScores,
        candidateLogos: [
          '/favicon.ico',
          '/favicon.png',
          '/logo.png',
          '/logo.svg',
          '/assets/logo.png'
        ]
      };

      console.log('📤 Sending extended payload to AI backend');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s

      const response = await fetch(`${API_BASE_URL}/api/ai/website-intelligence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'anonymous'
        },
        body: JSON.stringify(analysisData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('❌ Backend AI analysis failed:', response.status);
        throw new Error(`AI analysis failed: ${response.status}`);
      }

      const text = await response.text();
      let aiAnalysis;
      try {
        aiAnalysis = JSON.parse(text);
      } catch (err) {
        // Try to gracefully fallback if backend returned plain object-like text
        try {
          aiAnalysis = (response as any);
        } catch {
          throw new Error('Invalid JSON from AI backend');
        }
      }

      // Post-process backend output: ensure shape, compute confidence if missing, and try logo detection if backend didn't return one
      if (!aiAnalysis.confidence || aiAnalysis.confidence < 10) {
        // local compute fallback
        const technical: any = aiAnalysis.technicalInsights || { hasEcommerce: false, hasBlog: false };
        aiAnalysis.confidence = Math.round(computeConfidence(aiAnalysis.patternScores || patternScores, urlStats, technical, pageViews.length));
      }
      if (!aiAnalysis.technicalInsights?.logoUrl) {
        try {
          const detected = await detectLogoUrl(domain.replace(/^https?:\/\//, '').replace(/\/$/, ''));
          if (detected) aiAnalysis.technicalInsights = { ...(aiAnalysis.technicalInsights || {}), logoUrl: detected };
        } catch {
          // ignore
        }
      }

      console.log('✅ AI backend analysis returned');
      return aiAnalysis;
    } catch (error) {
      console.error('🚨 Enhanced AI analysis failed, using local enhanced analysis fallback:', error);
      return performLocalAnalysis();
    }
  };

  /* -----------------------------
     Small helpers reused/mostly unchanged from your original file
     ----------------------------- */

  const analyzeDetectedPages = (paths: string[], type: string) => {
    const pages: WebsiteIntelligence['detectedPages'] = {};
    pages.about = paths.filter(p => p.includes('about') || p.includes('company'));
    pages.contact = paths.filter(p => p.includes('contact') || p.includes('support'));
    pages.sitemap = paths.filter(p => p.includes('sitemap') || p.includes('sitemap.xml'));

    if (type === 'ecommerce' || type === 'marketplace') {
      pages.products = paths.filter(p =>
        p.includes('product') || p.includes('item') || p.match(/\/p\/|\/product\//)
      );
      pages.categories = paths.filter(p =>
        p.includes('category') || p.includes('collection') || p.includes('shop')
      );
      pages.checkout = paths.filter(p =>
        p.includes('checkout') || p.includes('cart') || p.includes('payment')
      );
    } else if (type === 'saas' || type === 'membership') {
      pages.features = paths.filter(p => p.includes('feature') || p.includes('solution'));
      pages.pricing = paths.filter(p => p.includes('pricing') || p.includes('plan'));
      pages.signup = paths.filter(p => p.includes('signup') || p.includes('register') || p.includes('create-account'));
    } else if (type === 'blog' || type === 'news' || type === 'media') {
      pages.content = paths.filter(p => p.includes('blog') || p.includes('article') || p.includes('post') || p.includes('news'));
    }
    return pages;
  };

  const getPrimaryPurpose = (type: string): string => {
    const purposes: { [key: string]: string } = {
      ecommerce: 'Sell products and services online',
      marketplace: 'List and facilitate transactions between buyers and sellers',
      saas: 'Provide software solutions and subscriptions',
      blog: 'Share content and build audience',
      leadgen: 'Generate business leads and inquiries',
      portfolio: 'Showcase work and attract clients',
      education: 'Provide educational content and courses',
      news: 'Deliver news and current events',
      community: 'Build community and facilitate discussions',
      corporate: 'Represent corporate brand and information',
      nonprofit: 'Promote causes and collect donations',
      documentation: 'Provide API / product documentation and references'
    };
    return purposes[type] || 'Provide information and services';
  };

  const estimateTargetAudience = (views: PageView[], type: string): string[] => {
    const audiences: string[] = [];
    if (views.length > 0) {
      const mobileUsers = views.filter(v => v.device?.includes('mobile')).length;
      const desktopUsers = views.filter(v => v.device?.includes('desktop')).length;
      if (mobileUsers > desktopUsers) audiences.push('Mobile users');
      if (desktopUsers > mobileUsers) audiences.push('Desktop professionals');
    }
    if (type === 'ecommerce' || type === 'marketplace') audiences.push('Online shoppers');
    if (type === 'saas' || type === 'documentation') audiences.push('Developers and business users');
    if (type === 'blog' || type === 'news') audiences.push('Readers and enthusiasts');
    return audiences.length > 0 ? audiences : ['General internet users'];
  };

  const estimateUpdateFrequency = (views: PageView[]): 'frequent' | 'regular' | 'rare' => {
    if (views.length === 0) return 'regular';
    const timestamps = views.map(v => new Date(v.timestamp).getTime()).sort();
    const timeRange = timestamps[timestamps.length - 1] - timestamps[0];
    const days = timeRange / (1000 * 60 * 60 * 24);
    const viewsPerDay = views.length / Math.max(1, days);
    if (viewsPerDay > 10) return 'frequent';
    if (viewsPerDay > 2) return 'regular';
    return 'rare';
  };

  const generateCharacteristics = (type: string, paths: string[], views: PageView[]): string[] => {
    const chars: string[] = [];
    const avgPathDepth = paths.reduce((sum, p) => sum + p.split('/').filter(Boolean).length, 0) / Math.max(1, paths.length);
    if (avgPathDepth > 3) chars.push('Deep site structure with multiple navigation levels');
    if (avgPathDepth < 2) chars.push('Simple flat site structure');
    if (views.length > 0) {
      const uniqueVisitors = new Set(views.map(v => v.visitor_id)).size;
      const avgPagesPerVisitor = views.length / Math.max(1, uniqueVisitors);
      if (avgPagesPerVisitor > 5) chars.push('High engagement - visitors explore multiple pages');
      if (avgPagesPerVisitor < 2) chars.push('Low engagement - many single-page sessions');
    }
    const hasSearch = paths.some(p => p.includes('search') || p.includes('q='));
    if (hasSearch) chars.push('Active search functionality');
    // type-specific
    if (type === 'ecommerce') chars.push('Product-focused with checkout flows');
    if (type === 'blog') chars.push('Content-driven with potential RSS / sitemaps');
    if (type === 'saas') chars.push('Account / subscription features likely present');
    return chars.length > 0 ? chars : ['Standard website structure detected'];
  };

  const analyzeTechnicalAspects = (views: PageView[], paths: string[]): WebsiteIntelligence['technicalInsights'] => {
    const avgLoadTime = views.length > 0 ? views.reduce((sum, v) => sum + (v.duration || 0), 0) / views.length : 2.5;
    return {
      averageLoadTime: avgLoadTime,
      mobileOptimized: views.length > 0 ? views.filter(v => v.device?.includes('mobile')).length / Math.max(1, views.length) > 0.3 : true,
      hasSearch: paths.some(p => p.includes('search') || p.includes('query')),
      hasFilters: paths.some(p => p.includes('filter') || p.includes('sort') || p.includes('category')),
      hasRecommendations: paths.some(p => p.includes('recommend') || p.includes('related') || p.includes('similar')),
      hasBlog: paths.some(p => p.includes('blog') || p.includes('article') || p.includes('news')),
      hasEcommerce: paths.some(p => p.includes('product') || p.includes('cart') || p.includes('shop')),
      hasForms: paths.some(p => p.includes('contact') || p.includes('form') || p.includes('signup'))
    };
  };

  /* -----------------------------
     Deep analysis orchestration
     ----------------------------- */
  const generateDeepAnalysis = async (intel: WebsiteIntelligence): Promise<DeepAnalysis> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const healthScore = calculateHealthScore(data, intel, pageViews);
        const healthGrade = getHealthGrade(healthScore);
        const issues = identifyIssues(data, intel, pageViews);
        const journeys = analyzeUserJourneys(pageViews);
        const exitPoints = identifyExitPoints(pageViews);
        const engagement = analyzeEngagement(pageViews);
        const benchmarks = getIndustryBenchmarks(intel.type);
        const position = determineMarketPosition(data, benchmarks);
        const opportunities = identifyOpportunities(data, intel, benchmarks);
        const lostRevenue = calculateLostRevenue(data, intel.type, intel.productCount || 0);
        const quickWins = identifyQuickWins(issues, intel);
        const longTerm = generateLongTermStrategy(intel, position);
        const technical = generateTechnicalRecommendations(intel, issues);
        const marketing = generateMarketingRecommendations(intel, data, lostRevenue);
        const budget = generateBudgetRecommendations(intel, data, lostRevenue);

        resolve({
          websiteHealth: { score: healthScore, grade: healthGrade, issues },
          userBehaviorPatterns: { commonJourneys: journeys, exitPoints, engagementZones: engagement },
          competitiveInsights: { industryBenchmarks: benchmarks, yourPosition: position, opportunities },
          revenueOptimization: {
            estimatedLostRevenue: lostRevenue,
            quickWins,
            longTermStrategy: longTerm,
            budgetRecommendations: budget
          },
          technicalRecommendations: technical,
          marketingRecommendations: marketing
        });
      }, 120);
    });
  };

  /* -----------------------------
     Adapted revenue calculation to use productCount and funnel information
     ----------------------------- */
  const calculateLostRevenue = (funnel: FunnelStage[], type: string, productCount = 0): number => {
    if (funnel.length < 2) return 1000;
    const avgOrderValues: { [key: string]: number } = {
      ecommerce: 85,
      marketplace: 65,
      saas: 99,
      leadgen: 150,
      blog: 25,
      membership: 49
    };
    const aov = avgOrderValues[type] || 75;
    const lostVisitors = Math.max(0, funnel[0].visitors - funnel[funnel.length - 1].visitors);
    // If productCount is large, scale potential
    const productFactor = Math.min(3, 1 + productCount / 50);
    const estimatedRecoverableRate = 0.12; // conservative baseline
    return Math.round(lostVisitors * estimatedRecoverableRate * aov * productFactor);
  };

  /* -----------------------------
     Original helper functions from your file
     ----------------------------- */

  const performDeepAnalysis = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setAnalysisCompleted(false);

    try {
      console.log('🚀 Starting deep analysis with AI backend');
      
      // Add timeout protection - maximum 20 seconds for entire analysis
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timeout after 20 seconds')), 20000)
      );

      const analysisPromise = (async () => {
        const stages = [
          'Connecting to AI analysis engine...',
          'Detecting website type and structure...',
          'Analyzing user behavior patterns...',
          'Comparing with industry benchmarks...',
          'Identifying optimization opportunities...',
          'Generating actionable recommendations...',
          'Calculating budget recommendations...',
          'Creating marketing strategy...'
        ];

        // Quick progress updates without long delays
        for (const stage of stages) {
          setProcessingStage(stage);
          await new Promise(resolve => setTimeout(resolve, 300)); // Reduced from 800ms
        }

        const websiteIntel = await analyzeWebsiteIntelligence();
        setIntelligence(websiteIntel);

        const analysis = await generateDeepAnalysis(websiteIntel);
        setDeepAnalysis(analysis);
      })();

      // Race between analysis and timeout
      await Promise.race([analysisPromise, timeoutPromise]);
      
      setAnalysisCompleted(true);
      console.log('✅ Deep analysis completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
      
      // Set fallback data even if analysis fails
      const fallbackIntel = await performLocalAnalysis();
      setIntelligence(fallbackIntel);
      
      // Generate basic deep analysis from fallback
      const basicAnalysis = await generateDeepAnalysis(fallbackIntel);
      setDeepAnalysis(basicAnalysis);
      
      setAnalysisCompleted(true);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Safe initialization with proper cleanup
  useEffect(() => {
    let isMounted = true;
    let analysisStarted = false;

    const initializeAnalysis = async () => {
      if (analysisStarted || !isMounted) return;
      
      analysisStarted = true;
      
      try {
        console.log('🔄 Initializing analysis for domain:', domain);
        console.log('📊 Page views available:', pageViews.length);
        
        if (!domain) {
          console.log('❌ No domain provided');
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        // If no page views, use basic analysis immediately
        if (pageViews.length === 0) {
          console.log('⚠️ No page views data available, using basic analysis');
          if (isMounted) {
            const basicIntel = await performLocalAnalysis();
            setIntelligence(basicIntel);
            const basicAnalysis = await generateDeepAnalysis(basicIntel);
            setDeepAnalysis(basicAnalysis);
            setAnalysisCompleted(true);
            setLoading(false);
          }
          return;
        }

        // Only run full analysis if we haven't analyzed this domain before
        if (!intelligence) {
          await performDeepAnalysis();
        } else {
          console.log('📝 Using cached analysis data');
          if (isMounted) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('🔥 Failed to initialize analysis:', error);
        if (isMounted) {
          setError('Failed to initialize analysis');
          setLoading(false);
        }
      }
    };

    // Start analysis with a small delay to ensure component is mounted
    const timer = setTimeout(() => {
      if (isMounted && domain && !loading && !intelligence) {
        initializeAnalysis();
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [domain]); // Only depend on domain

  /* -----------------------------
     Original helper functions (unchanged)
     ----------------------------- */

  const generateBudgetRecommendations = (intel: WebsiteIntelligence, funnel: FunnelStage[], lostRevenue: number) => {
    const baseBudget = Math.max(500, lostRevenue * 0.1);
    
    const allocations = [
      { channel: 'Google Ads', percentage: 40 },
      { channel: 'Social Media', percentage: 25 },
      { channel: 'Email Marketing', percentage: 15 },
      { channel: 'Content Creation', percentage: 12 },
      { channel: 'SEO', percentage: 8 }
    ];

    return {
      estimatedBudget: Math.round(baseBudget),
      allocation: allocations.map(allocation => ({
        ...allocation,
        amount: Math.round(baseBudget * (allocation.percentage / 100))
      })),
      roiProjection: Math.round(baseBudget * 3.5)
    };
  };

  const generateMarketingRecommendations = (intel: WebsiteIntelligence, funnel: FunnelStage[], lostRevenue: number) => {
    const channels: Array<{ name: string; suitability: 'high' | 'medium' | 'low'; budget: number; reasoning: string }> = [
      {
        name: 'Google Ads',
        suitability: 'high',
        budget: Math.round(lostRevenue * 0.15),
        reasoning: 'High intent traffic for immediate results'
      },
      {
        name: 'Facebook/Instagram',
        suitability: intel.type === 'ecommerce' ? 'high' : 'medium',
        budget: Math.round(lostRevenue * 0.10),
        reasoning: 'Great for visual content and brand building'
      },
      {
        name: 'LinkedIn',
        suitability: intel.type === 'saas' ? 'high' : 'low',
        budget: Math.round(lostRevenue * 0.08),
        reasoning: 'Ideal for B2B and professional services'
      },
      {
        name: 'Content Marketing',
        suitability: 'high',
        budget: Math.round(lostRevenue * 0.12),
        reasoning: 'Builds long-term organic traffic and authority'
      }
    ];

    const strategies = [
      'Implement retargeting campaigns for abandoned carts',
      'Create educational content to build trust and authority',
      'Optimize landing pages for specific audience segments',
      'Build email list with lead magnets and incentives',
      'Leverage social proof and customer testimonials'
    ];

    const timeline = [
      {
        phase: 'Quick Wins (1-4 weeks)',
        duration: '4 weeks',
        actions: [
          'Set up Google Analytics conversion tracking',
          'Implement basic retargeting pixels',
          'Create and test landing page variations',
          'Set up email automation sequences'
        ]
      },
      {
        phase: 'Growth Phase (1-3 months)',
        duration: '3 months',
        actions: [
          'Scale successful ad campaigns',
          'Develop content marketing strategy',
          'Build social media presence',
          'Implement advanced segmentation'
        ]
      },
      {
        phase: 'Optimization (3-6 months)',
        duration: '3 months',
        actions: [
          'A/B test all marketing channels',
          'Refine customer journey mapping',
          'Implement marketing automation',
          'Focus on retention and loyalty'
        ]
      }
    ];

    return { channels, strategies, timeline };
  };

  const calculateHealthScore = (funnel: FunnelStage[], intel: WebsiteIntelligence, views: PageView[]): number => {
    let score = 100;
    
    if (funnel.length > 0) {
      funnel.forEach(stage => {
        if (stage.dropOffRate > 70) score -= 15;
        else if (stage.dropOffRate > 50) score -= 10;
        else if (stage.dropOffRate > 30) score -= 5;
      });
      
      const overallConversion = (funnel[funnel.length - 1]?.visitors || 0) / (funnel[0]?.visitors || 1) * 100;
      if (overallConversion > 5) score += 10;
      else if (overallConversion < 1) score -= 20;
    }
    
    if (views.length > 0) {
      const uniqueVisitors = new Set(views.map(v => v.visitor_id)).size;
      const avgPages = views.length / uniqueVisitors;
      if (avgPages < 1.5) score -= 15;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const getHealthGrade = (score: number): DeepAnalysis['websiteHealth']['grade'] => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const identifyIssues = (funnel: FunnelStage[], intel: WebsiteIntelligence, views: PageView[]): DeepAnalysis['websiteHealth']['issues'] => {
    const issues: DeepAnalysis['websiteHealth']['issues'] = [];

    if (funnel.length > 0) {
      const firstStageDropOff = funnel[0]?.dropOffRate || 0;
      if (firstStageDropOff > 80) {
        issues.push({
          severity: 'critical' as const,
          message: `${firstStageDropOff}% of visitors leave immediately - critical engagement problem`,
          fix: 'Redesign landing page with clear value proposition, reduce load time, improve mobile experience'
        });
      }

      const checkoutDropOff = funnel.find(s => s.stage.includes('checkout'));
      if (checkoutDropOff && checkoutDropOff.dropOffRate > 70) {
        issues.push({
          severity: 'critical' as const,
          message: 'Checkout abandonment is critically high',
          fix: 'Simplify checkout process, add trust badges, offer guest checkout, show shipping costs early'
        });
      }

      funnel.forEach(stage => {
        if (stage.dropOffRate > 50 && stage.dropOffRate < 70) {
          issues.push({
            severity: 'medium' as const,
            message: `${stage.stage} stage has elevated drop-off (${stage.dropOffRate}%)`,
            fix: `Analyze user behavior at ${stage.stage}, A/B test improvements, simplify process, add progress indicators`
          });
        }
      });
    }

    const avgSessionDuration = views.length > 0 ? views.reduce((sum, v) => sum + (v.duration || 0), 0) / views.length : 0;
    if (avgSessionDuration < 30) {
      issues.push({
        severity: 'high' as const,
        message: 'Low session duration indicates poor content relevance',
        fix: 'Improve content quality, match user intent, add engaging visuals, implement better navigation'
      });
    }

    if (!intel.technicalInsights.mobileOptimized) {
      issues.push({
        severity: 'medium' as const,
        message: 'Website may not be optimized for mobile devices',
        fix: 'Implement responsive design, test on multiple devices, optimize touch targets, improve mobile load speed'
      });
    }

    return issues.length > 0 ? issues : [{
      severity: 'low' as const,
      message: 'No critical issues detected - focus on optimization and growth',
      fix: 'Continue monitoring performance and implement growth strategies'
    }];
  };

  const analyzeUserJourneys = (views: PageView[]) => {
    if (views.length === 0) {
      return [{
        path: ['Home', 'About', 'Contact'],
        frequency: 1,
        conversionRate: 15
      }];
    }

    const journeyMap = new Map<string, { count: number; converted: boolean }>();
    
    const visitorJourneys = new Map<string, string[]>();
    views.forEach(view => {
      if (!visitorJourneys.has(view.visitor_id)) {
        visitorJourneys.set(view.visitor_id, []);
      }
      visitorJourneys.get(view.visitor_id)!.push(view.path);
    });
    
    const journeys: Array<{ path: string[]; frequency: number; conversionRate: number }> = [];
    visitorJourneys.forEach((path, visitor) => {
      const journeyKey = path.slice(0, 4).join(' → ');
      const existing = journeyMap.get(journeyKey) || { count: 0, converted: false };
      existing.count++;
      if (path.some(p => p.includes('success') || p.includes('thank') || p.includes('complete'))) {
        existing.converted = true;
      }
      journeyMap.set(journeyKey, existing);
    });
    
    journeyMap.forEach((data, key) => {
      if (data.count > 1) {
        journeys.push({
          path: key.split(' → '),
          frequency: data.count,
          conversionRate: data.converted ? 85 : 15
        });
      }
    });
    
    return journeys.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
  };

  const identifyExitPoints = (views: PageView[]) => {
    if (views.length === 0) {
      return [{
        page: '/',
        percentage: 100,
        reason: 'Homepage - typical entry and exit point'
      }];
    }

    const exitCounts = new Map<string, number>();
    const totalExits = new Set(views.map(v => v.visitor_id)).size;
    
    views.forEach(view => {
      const path = view.path;
      exitCounts.set(path, (exitCounts.get(path) || 0) + 1);
    });
    
    const exitPoints = Array.from(exitCounts.entries())
      .map(([page, count]) => ({
        page,
        percentage: (count / totalExits) * 100,
        reason: getExitReason(page)
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
    
    return exitPoints;
  };

  const getExitReason = (page: string): string => {
    if (page.includes('price') || page.includes('pricing')) return 'Price concerns or comparison shopping';
    if (page.includes('cart')) return 'Cart abandonment - likely due to unexpected costs or trust issues';
    if (page.includes('shipping') || page.includes('delivery')) return 'Shipping costs or delivery times not acceptable';
    if (page.includes('product')) return 'Product not meeting expectations or missing information';
    return 'User found what they needed or content not engaging';
  };

  const analyzeEngagement = (views: PageView[]) => {
    if (views.length === 0) {
      return [{
        page: '/',
        avgTime: 45,
        scrollDepth: 65
      }];
    }

    const pageStats = new Map<string, { totalTime: number; count: number }>();
    
    views.forEach(view => {
      const stats = pageStats.get(view.path) || { totalTime: 0, count: 0 };
      stats.totalTime += view.duration || 0;
      stats.count++;
      pageStats.set(view.path, stats);
    });
    
    return Array.from(pageStats.entries())
      .map(([page, stats]) => ({
        page,
        avgTime: stats.totalTime / stats.count,
        scrollDepth: Math.random() * 100
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);
  };

  const getIndustryBenchmarks = (type: string) => {
    const benchmarks: { [key: string]: { [metric: string]: number } } = {
      ecommerce: {
        conversionRate: 2.5,
        avgOrderValue: 85,
        cartAbandonmentRate: 70,
        bounceRate: 45,
        pagesPerSession: 4.2
      },
      saas: {
        conversionRate: 5.0,
        trialToCustomer: 15,
        bounceRate: 35,
        avgSessionDuration: 180,
        pagesPerSession: 5.5
      },
      blog: {
        bounceRate: 65,
        avgSessionDuration: 120,
        pagesPerSession: 2.5,
        emailSignup: 2.0
      },
      leadgen: {
        conversionRate: 3.5,
        formCompletionRate: 25,
        bounceRate: 40,
        pagesPerSession: 3.2
      }
    };
    
    return benchmarks[type] || benchmarks.ecommerce;
  };

  const determineMarketPosition = (funnel: FunnelStage[], benchmarks: { [key: string]: number }): 'leader' | 'above_average' | 'average' | 'below_average' => {
    if (funnel.length === 0) return 'average';
    
    const conversion = (funnel[funnel.length - 1]?.visitors || 0) / (funnel[0]?.visitors || 1) * 100;
    const benchmark = benchmarks.conversionRate || 2.5;
    
    if (conversion > benchmark * 1.5) return 'leader';
    if (conversion > benchmark) return 'above_average';
    if (conversion > benchmark * 0.7) return 'average';
    return 'below_average';
  };

  const identifyOpportunities = (funnel: FunnelStage[], intel: WebsiteIntelligence, benchmarks: any) => {
    const opportunities: string[] = [];
    
    if (intel.type === 'ecommerce') {
      opportunities.push('Implement AI-powered product recommendations to increase AOV by 15-30%');
      opportunities.push('Add urgency triggers (limited stock, countdown timers) to reduce cart abandonment');
      opportunities.push('Create abandoned cart email sequence - recover 10-15% of lost sales');
    }
    
    if (!intel.technicalInsights.hasRecommendations) {
      opportunities.push('Add personalized recommendations engine to increase cross-selling by 25%');
    }
    
    if (funnel.some(s => s.dropOffRate > 60)) {
      opportunities.push('Implement exit-intent popups with special offers to recover 5-10% of abandoning visitors');
    }
    
    opportunities.push('Add live chat support to answer questions in real-time - can lift conversions 15-40%');
    opportunities.push('Implement retargeting campaigns for visitors who did not convert');
    opportunities.push('A/B test simplified checkout process - often increases conversions 10-35%');
    
    return opportunities.length > 0 ? opportunities : ['Focus on content quality and user experience improvements'];
  };

  const identifyQuickWins = (issues: any[], intel: WebsiteIntelligence) => {
    const quickWins: Array<{ action: string; impact: string; effort: 'low' | 'medium' | 'high' }> = [
      {
        action: 'Add trust badges (SSL, payment logos, reviews) to checkout',
        impact: 'Increase conversion by 15-25%',
        effort: 'low' as const
      },
      {
        action: 'Implement exit-intent popup with 10% discount offer',
        impact: 'Recover 5-10% of abandoning visitors',
        effort: 'low' as const
      },
      {
        action: 'Add progress indicator to checkout flow',
        impact: 'Reduce checkout abandonment by 10-15%',
        effort: 'low' as const
      }
    ];
    
    if (intel.type === 'ecommerce') {
      quickWins.push({
        action: 'Add product video demos',
        impact: 'Increase conversion by 80% for products with videos',
        effort: 'medium' as const
      });
    }
    
    return quickWins;
  };

  const generateLongTermStrategy = (intel: WebsiteIntelligence, position: string) => {
    const strategy: string[] = [];
    
    strategy.push('Build comprehensive email marketing automation (welcome series, abandoned cart, post-purchase)');
    strategy.push('Implement advanced analytics and heat mapping to understand user behavior patterns');
    strategy.push('Create loyalty program to increase customer lifetime value by 30-50%');
    
    if (intel.type === 'ecommerce') {
      strategy.push('Expand to new sales channels (Amazon, social commerce, marketplaces)');
      strategy.push('Implement subscription model for recurring revenue stream');
    }
    
    if (position === 'below_average') {
      strategy.push('Consider comprehensive UX audit and redesign focused on conversion optimization');
    }
    
    return strategy;
  };

  const generateTechnicalRecommendations = (intel: WebsiteIntelligence, issues: any[]) => {
    return {
      performance: [
        'Implement lazy loading for images and videos below the fold',
        'Enable browser caching and CDN for static assets',
        'Minify CSS, JavaScript, and HTML files',
        'Optimize images (WebP format, proper sizing)'
      ],
      seo: [
        'Add structured data markup (Schema.org) for better search visibility',
        'Optimize meta descriptions and title tags for higher CTR',
        'Improve internal linking structure for better crawlability',
        'Create XML sitemap and submit to search engines'
      ],
      ux: [
        'Add clear calls-to-action (CTAs) on every page',
        'Improve navigation menu organization and labeling',
        'Ensure consistent design language across all pages',
        'Add search functionality with auto-complete'
      ],
      conversion: [
        'Add social proof (reviews, testimonials, user count)',
        'Create sense of urgency with limited-time offers',
        'Simplify forms - remove unnecessary fields',
        'Add live chat for instant customer support'
      ]
    };
  };

  const getWebsiteTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      ecommerce: isDark ? 'bg-purple-600' : 'bg-purple-500',
      marketplace: isDark ? 'bg-indigo-600' : 'bg-indigo-500',
      saas: isDark ? 'bg-blue-600' : 'bg-blue-500',
      blog: isDark ? 'bg-green-600' : 'bg-green-500',
      leadgen: isDark ? 'bg-orange-600' : 'bg-orange-500',
      portfolio: isDark ? 'bg-indigo-600' : 'bg-indigo-500',
      education: isDark ? 'bg-yellow-600' : 'bg-yellow-500',
      news: isDark ? 'bg-red-600' : 'bg-red-500',
      media: isDark ? 'bg-pink-600' : 'bg-pink-500',
      community: isDark ? 'bg-pink-600' : 'bg-pink-500',
      forum: isDark ? 'bg-gray-600' : 'bg-gray-500',
      directory: isDark ? 'bg-teal-600' : 'bg-teal-500',
      classifieds: isDark ? 'bg-amber-600' : 'bg-amber-500',
      membership: isDark ? 'bg-violet-600' : 'bg-violet-500',
      booking: isDark ? 'bg-emerald-600' : 'bg-emerald-500',
      affiliate: isDark ? 'bg-fuchsia-600' : 'bg-fuchsia-500',
      documentation: isDark ? 'bg-slate-600' : 'bg-slate-500',
      wiki: isDark ? 'bg-stone-600' : 'bg-stone-500',
      government: isDark ? 'bg-cyan-600' : 'bg-cyan-500',
      corporate: isDark ? 'bg-gray-600' : 'bg-gray-500',
      nonprofit: isDark ? 'bg-teal-600' : 'bg-teal-500',
      entertainment: isDark ? 'bg-rose-600' : 'bg-rose-500'
    };
    return colors[type] || (isDark ? 'bg-gray-600' : 'bg-gray-500');
  };

  const getGradeColor = (grade: string) => {
    const baseColors = {
      A: isDark ? 'text-green-400 bg-green-900' : 'text-green-600 bg-green-100',
      B: isDark ? 'text-blue-400 bg-blue-900' : 'text-blue-600 bg-blue-100',
      C: isDark ? 'text-yellow-400 bg-yellow-900' : 'text-yellow-600 bg-yellow-100',
      D: isDark ? 'text-orange-400 bg-orange-900' : 'text-orange-600 bg-orange-100',
      F: isDark ? 'text-red-400 bg-red-900' : 'text-red-600 bg-red-100'
    };
    
    if (grade.startsWith('A')) return baseColors.A;
    if (grade === 'B') return baseColors.B;
    if (grade === 'C') return baseColors.C;
    if (grade === 'D') return baseColors.D;
    return baseColors.F;
  };

  const getQuickFix = (stage: string): string => {
    const fixes: { [key: string]: string } = {
      'view-product': 'Add high-quality product images and customer reviews',
      'add-to-cart': 'Highlight free shipping and easy returns',
      'checkout': 'Add guest checkout and trust badges',
      'purchase': 'Simplify form fields and add payment options'
    };
    return fixes[stage] || 'Optimize user experience and add clear CTAs';
  };

  const getExpectedImpact = (stage: string): string => {
    const impacts: { [key: string]: string } = {
      'view-product': '+15-25% engagement increase',
      'add-to-cart': '+20-30% add-to-cart rate',
      'checkout': '+15-40% checkout completion',
      'purchase': '+10-20% final conversion'
    };
    return impacts[stage] || '+10-15% improvement expected';
  };

  // Chart colors for dark/light mode
  const chartColors = {
    bar: isDark ? '#8b5cf6' : '#7c3aed',
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#d1d5db' : '#374151'
  };

  // Manual retry function
  const handleRetryAnalysis = async () => {
    setError(null);
    setIntelligence(null);
    setDeepAnalysis(null);
    setAnalysisCompleted(false);
    await performDeepAnalysis();
  };

  // Show error state
  if (error && !loading) {
    return (
      <div className={`bg-gradient-to-br ${themeColors.gradient} rounded-xl shadow-2xl p-8 ${themeColors.border} border`}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h3 className={`text-xl font-semibold ${themeColors.text.primary} mb-2`}>Analysis Failed</h3>
          <p className={`${themeColors.text.secondary} mb-6 max-w-md`}>
            {error}
          </p>
          <button
            onClick={handleRetryAnalysis}
            className={`px-6 py-3 bg-gradient-to-r ${themeColors.accent.primary} text-white rounded-lg font-semibold hover:opacity-90 transition-opacity`}
          >
            Retry Analysis
          </button>
          <button
            onClick={() => {
              setError(null);
              performLocalAnalysis().then(basicIntel => {
                setIntelligence(basicIntel);
                generateDeepAnalysis(basicIntel).then(setDeepAnalysis);
                setAnalysisCompleted(true);
              });
            }}
            className={`mt-3 px-6 py-2 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} rounded-lg font-semibold hover:opacity-90 transition-opacity`}
          >
            Use Basic Analysis
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-gradient-to-br ${themeColors.gradient} rounded-xl shadow-2xl p-8 ${themeColors.border} border`}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative w-20 h-20 mb-6">
            <div className={`absolute inset-0 border-4 ${isDark ? 'border-blue-800' : 'border-blue-200'} rounded-full`}></div>
            <div className={`absolute inset-0 border-4 ${isDark ? 'border-blue-400' : 'border-blue-600'} border-t-transparent rounded-full animate-spin`}></div>
          </div>
          <h3 className={`text-xl font-semibold ${themeColors.text.primary} mb-2`}>AI Deep Analysis in Progress</h3>
          <p className={`${themeColors.text.secondary} text-center max-w-md mb-4`}>{processingStage}</p>
          <div className="mt-6 flex gap-2">
            <div className={`w-2 h-2 ${isDark ? 'bg-blue-400' : 'bg-blue-600'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
            <div className={`w-2 h-2 ${isDark ? 'bg-purple-400' : 'bg-purple-600'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
            <div className={`w-2 h-2 ${isDark ? 'bg-blue-400' : 'bg-blue-600'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
          </div>
          
          {/* Add retry button if stuck for too long */}
          <button
            onClick={() => {
              setLoading(false);
              setError('Analysis cancelled by user');
            }}
            className="mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Cancel Analysis
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!intelligence && !loading && !error) {
    return (
      <div className={`bg-gradient-to-br ${themeColors.gradient} rounded-xl shadow-2xl p-8 ${themeColors.border} border`}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className={`text-xl font-semibold ${themeColors.text.primary} mb-2`}>Ready for Analysis</h3>
          <p className={`${themeColors.text.secondary} mb-6 max-w-md`}>
            Click the button below to start the AI-powered conversion funnel analysis.
          </p>
          <button
            onClick={handleRetryAnalysis}
            className={`px-6 py-3 bg-gradient-to-r ${themeColors.accent.primary} text-white rounded-lg font-semibold hover:opacity-90 transition-opacity`}
          >
            Start Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className={`bg-gradient-to-br ${themeColors.accent.primary} rounded-xl shadow-2xl p-6 text-white`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">AI-Powered Analytics</h2>
            <p className={isDark ? 'text-blue-200' : 'text-blue-100'}>Professional-grade insights powered by advanced algorithms</p>
          </div>
          <div className="flex gap-3 mt-4 lg:mt-0">
            <div className={`${getWebsiteTypeColor(intelligence?.type || 'unknown')} px-4 py-2 rounded-lg font-semibold`}>
              {intelligence?.type.toUpperCase()}
            </div>
            <div className={`${getGradeColor(deepAnalysis?.websiteHealth.grade || 'F')} px-4 py-2 rounded-lg font-semibold`}>
              Grade: {deepAnalysis?.websiteHealth.grade}
            </div>
          </div>
        </div>
        
        {intelligence && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-sm text-blue-100">Detection Confidence</p>
              <p className="text-2xl font-bold">{intelligence.confidence.toFixed(0)}%</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-sm text-blue-100">Health Score</p>
              <p className="text-2xl font-bold">{deepAnalysis?.websiteHealth.score}/100</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-sm text-blue-100">Lost Revenue</p>
              <p className="text-2xl font-bold">${(deepAnalysis?.revenueOptimization.estimatedLostRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-sm text-blue-100">Recommended Budget</p>
              <p className="text-2xl font-bold">${(deepAnalysis?.revenueOptimization.budgetRecommendations.estimatedBudget || 0).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className={`${themeColors.card} rounded-xl shadow-lg p-2 ${themeColors.border} border`}>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'funnel', label: 'Conversion Funnel' },
            { key: 'intelligence', label: 'Website Intelligence' },
            { key: 'recommendations', label: 'Recommendations' },
            { key: 'revenue', label: 'Revenue Optimization' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.key
                  ? `bg-gradient-to-r ${themeColors.accent.primary} text-white shadow-lg`
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Funnel Tab */}
      {activeTab === 'funnel' && (
        <div className={`${themeColors.card} rounded-xl shadow-lg p-6 ${themeColors.border} border`}>
          <h3 className={`text-2xl font-bold ${themeColors.text.primary} mb-6`}>Conversion Funnel Analysis</h3>
          
          <div className="space-y-6">
            {data.map((stage, index) => {
              const stageAnalysis = deepAnalysis?.websiteHealth.issues.find(i => 
                i.message.toLowerCase().includes(stage.stage.toLowerCase())
              );
              const conversionRate = index === 0 ? 100 : (stage.visitors / data[0].visitors) * 100;

              return (
                <div key={index} className="relative">
                  {index > 0 && (
                    <div className={`absolute left-8 -top-4 w-0.5 h-4 bg-gradient-to-b ${isDark ? 'from-gray-600 to-transparent' : 'from-gray-300 to-transparent'}`}></div>
                  )}
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-2xl ${getWebsiteTypeColor(intelligence?.type || 'unknown')} flex items-center justify-center text-2xl text-white font-bold shadow-lg`}>
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className={`bg-gradient-to-br ${isDark ? 'from-gray-700 to-gray-800' : 'from-gray-50 to-white'} border-2 ${themeColors.border} rounded-xl p-5`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className={`text-xl font-bold ${themeColors.text.primary} capitalize mb-1`}>
                              {stage.stage.replace(/-/g, ' ')}
                            </h4>
                            <div className={`flex gap-4 text-sm ${themeColors.text.secondary}`}>
                              <span>{stage.visitors.toLocaleString()} visitors</span>
                              <span>{stage.dropOffCount.toLocaleString()} dropped off</span>
                              <span className="font-semibold">{conversionRate.toFixed(1)}% conversion</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className={`text-sm ${themeColors.text.secondary} mb-1`}>Drop-off Rate</p>
                            <p className={`text-3xl font-bold ${
                              stage.dropOffRate > 60 ? 'text-red-500' : 
                              stage.dropOffRate > 40 ? 'text-yellow-500' : 'text-green-500'
                            }`}>
                              {stage.dropOffRate}%
                            </p>
                          </div>
                        </div>
                        
                        <div className={`relative h-4 ${isDark ? 'bg-gray-600' : 'bg-gray-200'} rounded-full overflow-hidden mb-4`}>
                          <div 
                            className={`h-full transition-all duration-1000 ${
                              stage.dropOffRate > 60 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                              stage.dropOffRate > 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                              'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                            style={{ width: `${conversionRate}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                            {conversionRate.toFixed(1)}% of initial traffic
                          </div>
                        </div>
                        
                        {stageAnalysis && (
                          <div className={`${isDark ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-3 mb-3`}>
                            <p className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-800'} mb-1`}>Critical Issue</p>
                            <p className={`text-sm ${isDark ? 'text-red-200' : 'text-red-700'}`}>{stageAnalysis.message}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className={`${isDark ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-3`}>
                            <p className={`text-xs font-semibold ${isDark ? 'text-blue-300' : 'text-blue-800'} mb-1`}>Quick Fix</p>
                            <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>{getQuickFix(stage.stage)}</p>
                          </div>
                          <div className={`${isDark ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg p-3`}>
                            <p className={`text-xs font-semibold ${isDark ? 'text-green-300' : 'text-green-800'} mb-1`}>Expected Impact</p>
                            <p className={`text-sm ${isDark ? 'text-green-200' : 'text-green-700'}`}>{getExpectedImpact(stage.stage)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`mt-8 bg-gradient-to-br ${isDark ? 'from-purple-900 to-blue-900' : 'from-purple-50 to-blue-50'} rounded-xl p-6 border-2 ${isDark ? 'border-purple-700' : 'border-purple-200'}`}>
            <h4 className={`text-lg font-bold ${themeColors.text.primary} mb-4`}>Visual Funnel</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="stage" stroke={chartColors.text} />
                <YAxis stroke={chartColors.text} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    color: chartColors.text
                  }}
                />
                <Bar dataKey="visitors" fill={chartColors.bar} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Intelligence Tab */}
      {activeTab === 'intelligence' && intelligence && deepAnalysis && (
        <div className="space-y-6">
          <div className={`${themeColors.card} rounded-xl shadow-lg p-6 ${themeColors.border} border`}>
            <h3 className={`text-2xl font-bold ${themeColors.text.primary} mb-4`}>Website Intelligence</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`bg-gradient-to-br ${isDark ? 'from-blue-900 to-purple-900' : 'from-blue-50 to-purple-50'} rounded-lg p-5 border-2 ${isDark ? 'border-blue-700' : 'border-blue-200'}`}>
                <h4 className={`font-bold ${themeColors.text.primary} mb-3`}>Detected Characteristics</h4>
                <ul className="space-y-2">
                  {intelligence.characteristics.map((char, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'} mt-1`}>✓</span>
                      <span className={themeColors.text.secondary}>{char}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className={`bg-gradient-to-br ${isDark ? 'from-green-900 to-teal-900' : 'from-green-50 to-teal-50'} rounded-lg p-5 border-2 ${isDark ? 'border-green-700' : 'border-green-200'}`}>
                <h4 className={`font-bold ${themeColors.text.primary} mb-3`}>Technical Insights</h4>
                <div className="space-y-3">
                  {Object.entries(intelligence.technicalInsights).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className={themeColors.text.secondary}>
                        {key.split(/(?=[A-Z])/).join(' ')}
                      </span>
                      <span className={`font-bold ${
                        typeof value === 'boolean' 
                          ? value 
                            ? 'text-green-500' 
                            : 'text-red-500'
                          : themeColors.text.primary
                      }`}>
                        {typeof value === 'boolean' 
                          ? value ? '✓ Yes' : '✗ No'
                          : typeof value === 'number'
                          ? `${value.toFixed(1)}s`
                          : String(value)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Analysis */}
            <div className={`mt-6 bg-gradient-to-br ${isDark ? 'from-yellow-900 to-orange-900' : 'from-yellow-50 to-orange-50'} rounded-lg p-5 border-2 ${isDark ? 'border-yellow-700' : 'border-yellow-200'}`}>
              <h4 className={`font-bold ${themeColors.text.primary} mb-3`}>Content Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${themeColors.text.secondary}`}>Primary Purpose</p>
                  <p className={`font-semibold ${themeColors.text.primary}`}>{intelligence.contentAnalysis.primaryPurpose}</p>
                </div>
                <div>
                  <p className={`text-sm ${themeColors.text.secondary}`}>Target Audience</p>
                  <p className={`font-semibold ${themeColors.text.primary}`}>{intelligence.contentAnalysis.targetAudience.join(', ')}</p>
                </div>
                <div>
                  <p className={`text-sm ${themeColors.text.secondary}`}>Content Quality</p>
                  <p className={`font-semibold ${
                    intelligence.contentAnalysis.contentQuality === 'high' ? 'text-green-500' :
                    intelligence.contentAnalysis.contentQuality === 'medium' ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {intelligence.contentAnalysis.contentQuality.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${themeColors.text.secondary}`}>Update Frequency</p>
                  <p className={`font-semibold ${themeColors.text.primary}`}>
                    {intelligence.contentAnalysis.updateFrequency.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User Behavior Patterns */}
          <div className={`${themeColors.card} rounded-xl shadow-lg p-6 ${themeColors.border} border`}>
            <h3 className={`text-2xl font-bold ${themeColors.text.primary} mb-4`}>User Behavior Patterns</h3>
            
            <div className="mb-6">
              <h4 className={`font-bold ${themeColors.text.primary} mb-3`}>Most Common User Journeys</h4>
              <div className="space-y-3">
                {deepAnalysis.userBehaviorPatterns.commonJourneys.map((journey, idx) => (
                  <div key={idx} className={`bg-gradient-to-r ${isDark ? 'from-blue-900 to-purple-900' : 'from-blue-50 to-purple-50'} rounded-lg p-4 border ${isDark ? 'border-blue-700' : 'border-blue-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`${isDark ? 'bg-blue-600' : 'bg-blue-600'} text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold`}>
                          {idx + 1}
                        </span>
                        <span className={`text-sm font-semibold ${themeColors.text.primary}`}>{journey.frequency} visitors</span>
                      </div>
                      <span className={`text-sm font-bold ${journey.conversionRate > 50 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {journey.conversionRate}% conversion
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      {journey.path.map((step, stepIdx) => (
                        <React.Fragment key={stepIdx}>
                          <span className={`${isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600'} px-3 py-1 rounded-full border ${themeColors.border}`}>
                            {step.split('/').pop() || 'home'}
                          </span>
                          {stepIdx < journey.path.length - 1 && <span className={themeColors.text.secondary}>→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className={`font-bold ${themeColors.text.primary} mb-3`}>Critical Exit Points</h4>
              <div className="space-y-3">
                {deepAnalysis.userBehaviorPatterns.exitPoints.map((exit, idx) => (
                  <div key={idx} className={`${isDark ? 'bg-red-900' : 'bg-red-50'} rounded-lg p-4 border ${isDark ? 'border-red-700' : 'border-red-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className={`font-semibold ${themeColors.text.primary}`}>{exit.page}</p>
                        <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{exit.reason}</p>
                      </div>
                      <span className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{exit.percentage.toFixed(1)}%</span>
                    </div>
                    <div className={`w-full ${isDark ? 'bg-red-700' : 'bg-red-200'} rounded-full h-2`}>
                      <div 
                        className={`${isDark ? 'bg-red-400' : 'bg-red-600'} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${exit.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Competitive Analysis */}
          <div className={`${themeColors.card} rounded-xl shadow-lg p-6 ${themeColors.border} border`}>
            <h3 className={`text-2xl font-bold ${themeColors.text.primary} mb-4`}>Competitive Analysis</h3>
            
            <div className={`bg-gradient-to-br ${isDark ? 'from-yellow-900 to-orange-900' : 'from-yellow-50 to-orange-50'} rounded-lg p-5 border-2 ${isDark ? 'border-yellow-700' : 'border-yellow-200'} mb-6`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">
                  {deepAnalysis.competitiveInsights.yourPosition === 'leader' ? '🥇' :
                   deepAnalysis.competitiveInsights.yourPosition === 'above_average' ? '🥈' :
                   deepAnalysis.competitiveInsights.yourPosition === 'average' ? '🥉' : '📊'}
                </span>
                <div>
                  <h4 className={`text-xl font-bold ${themeColors.text.primary} capitalize`}>
                    {deepAnalysis.competitiveInsights.yourPosition.replace('_', ' ')} Performance
                  </h4>
                  <p className={themeColors.text.secondary}>Compared to {intelligence.type} industry standards</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(deepAnalysis.competitiveInsights.industryBenchmarks).map(([metric, value]) => (
                <div key={metric} className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 border ${themeColors.border}`}>
                  <p className={`text-sm ${themeColors.text.secondary} capitalize mb-1`}>{metric.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className={`text-2xl font-bold ${themeColors.text.primary}`}>{value}%</p>
                  <p className={`text-xs ${themeColors.text.muted} mt-1`}>Industry avg</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && deepAnalysis && (
        <div className="space-y-6">
          <div className={`${themeColors.card} rounded-xl shadow-lg p-6 ${themeColors.border} border`}>
            <h3 className={`text-2xl font-bold ${themeColors.text.primary} mb-4`}>Critical Issues Requiring Attention</h3>
            <div className="space-y-4">
              {deepAnalysis.websiteHealth.issues
                .filter(issue => issue.severity === 'critical' || issue.severity === 'high')
                .map((issue, idx) => (
                  <div key={idx} className={`rounded-lg p-5 border-2 ${
                    issue.severity === 'critical' 
                      ? `${isDark ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-300'}` 
                      : `${isDark ? 'bg-orange-900 border-orange-700' : 'bg-orange-50 border-orange-300'}`
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{issue.severity === 'critical' ? '🚨' : '⚠️'}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            issue.severity === 'critical' 
                              ? 'bg-red-600 text-white' 
                              : 'bg-orange-600 text-white'
                          }`}>
                            {issue.severity}
                          </span>
                          <h4 className={`font-bold ${themeColors.text.primary}`}>{issue.message}</h4>
                        </div>
                        <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-lg p-3 border`}>
                          <p className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-700'} mb-1`}>Recommended Fix:</p>
                          <p className={`text-sm ${themeColors.text.secondary}`}>{issue.fix}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className={`${themeColors.card} rounded-xl shadow-lg p-6 ${themeColors.border} border`}>
            <h3 className={`text-2xl font-bold ${themeColors.text.primary} mb-4`}>Technical Recommendations</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(deepAnalysis.technicalRecommendations).map(([category, recommendations]) => (
                <div key={category} className={`bg-gradient-to-br ${isDark ? 'from-gray-700 to-gray-800' : 'from-gray-50 to-white'} rounded-lg p-5 border-2 ${themeColors.border}`}>
                  <h4 className={`font-bold ${themeColors.text.primary} mb-3 capitalize flex items-center gap-2`}>
                    <span className="text-xl">
                      {category === 'performance' ? '⚡' : 
                       category === 'seo' ? '🔍' :
                       category === 'ux' ? '🎨' : '📈'}
                    </span>
                    {category.toUpperCase()}
                  </h4>
                  <ul className="space-y-2">
                    {recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className={`${isDark ? 'text-green-400' : 'text-green-600'} mt-0.5`}>✓</span>
                        <span className={themeColors.text.secondary}>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className={`bg-gradient-to-br ${themeColors.accent.primary} rounded-xl shadow-lg p-6 text-white`}>
            <h3 className="text-2xl font-bold mb-4">Strategic Growth Opportunities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deepAnalysis.competitiveInsights.opportunities.map((opp, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💎</span>
                    <p className="text-sm">{opp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Optimization Tab */}
      {activeTab === 'revenue' && deepAnalysis && (
        <div className="space-y-6">
          <div className={`bg-gradient-to-br ${themeColors.accent.secondary} rounded-xl shadow-lg p-8 text-white`}>
            <h3 className="text-3xl font-bold mb-2">Revenue Optimization Analysis</h3>
            <p className={isDark ? 'text-green-200' : 'text-green-100'} mb-6>Estimated recoverable revenue through optimization</p>
            
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <p className="text-sm text-green-100 mb-2">Estimated Lost Revenue (Monthly)</p>
              <p className="text-5xl font-bold mb-4">
                ${deepAnalysis.revenueOptimization.estimatedLostRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-green-100">
                Based on current traffic and industry conversion benchmarks
              </p>
            </div>
          </div>

          {/* Budget Recommendations */}
          <div className={`${themeColors.card} rounded-xl shadow-lg p-6 ${themeColors.border} border`}>
            <h3 className={`text-2xl font-bold ${themeColors.text.primary} mb-4`}>Budget Recommendations</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className={`font-bold ${themeColors.text.primary} mb-3`}>Recommended Allocation</h4>
                <div className="space-y-3">
                  {deepAnalysis.revenueOptimization.budgetRecommendations.allocation.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className={themeColors.text.secondary}>{item.channel}</span>
                      <div className="text-right">
                        <span className={`font-bold ${themeColors.text.primary}`}>${item.amount.toLocaleString()}</span>
                        <span className={`text-sm ${themeColors.text.muted} ml-2`}>({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={`bg-gradient-to-br ${isDark ? 'from-blue-900 to-purple-900' : 'from-blue-50 to-purple-50'} rounded-lg p-5 border-2 ${isDark ? 'border-blue-700' : 'border-blue-200'}`}>
                <h4 className={`font-bold ${themeColors.text.primary} mb-3`}>Investment Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={themeColors.text.secondary}>Total Budget</span>
                    <span className={`font-bold ${themeColors.text.primary}`}>
                      ${deepAnalysis.revenueOptimization.budgetRecommendations.estimatedBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={themeColors.text.secondary}>Projected ROI</span>
                    <span className="font-bold text-green-500">
                      ${deepAnalysis.revenueOptimization.budgetRecommendations.roiProjection.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={themeColors.text.secondary}>ROI Multiple</span>
                    <span className="font-bold text-green-500">3.5x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Marketing Channels */}
          <div className={`${themeColors.card} rounded-xl shadow-lg p-6 ${themeColors.border} border`}>
            <h3 className={`text-2xl font-bold ${themeColors.text.primary} mb-4`}>Recommended Marketing Channels</h3>
            <div className="space-y-4">
              {deepAnalysis.marketingRecommendations.channels.map((channel, idx) => (
                <div key={idx} className={`bg-gradient-to-r ${
                  channel.suitability === 'high' 
                    ? isDark ? 'from-green-900 to-teal-900' : 'from-green-50 to-teal-50'
                    : channel.suitability === 'medium'
                    ? isDark ? 'from-yellow-900 to-orange-900' : 'from-yellow-50 to-orange-50'
                    : isDark ? 'from-gray-700 to-gray-800' : 'from-gray-50 to-gray-100'
                } rounded-lg p-5 border-2 ${
                  channel.suitability === 'high' 
                    ? isDark ? 'border-green-700' : 'border-green-200'
                    : channel.suitability === 'medium'
                    ? isDark ? 'border-yellow-700' : 'border-yellow-200'
                    : themeColors.border
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">
                        {channel.name.includes('Google') ? '🔍' :
                         channel.name.includes('Facebook') ? '📱' :
                         channel.name.includes('LinkedIn') ? '💼' : '📝'}
                      </span>
                      <div>
                        <h4 className={`font-bold ${themeColors.text.primary} mb-1`}>{channel.name}</h4>
                        <p className={`text-sm ${themeColors.text.secondary}`}>{channel.reasoning}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        channel.suitability === 'high' ? 'bg-green-600 text-white' :
                        channel.suitability === 'medium' ? 'bg-yellow-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {channel.suitability}
                      </span>
                      <p className={`text-lg font-bold ${themeColors.text.primary} mt-1`}>
                        ${channel.budget.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Marketing Timeline */}
          <div className={`${themeColors.card} rounded-xl shadow-lg p-6 ${themeColors.border} border`}>
            <h3 className={`text-2xl font-bold ${themeColors.text.primary} mb-4`}>Implementation Timeline</h3>
            <div className="space-y-6">
              {deepAnalysis.marketingRecommendations.timeline.map((phase, idx) => (
                <div key={idx} className="relative">
                  {idx > 0 && (
                    <div className={`absolute left-6 -top-6 w-0.5 h-6 bg-gradient-to-b ${isDark ? 'from-gray-600 to-transparent' : 'from-gray-300 to-transparent'}`}></div>
                  )}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full ${getWebsiteTypeColor(intelligence?.type || 'unknown')} flex items-center justify-center text-white font-bold`}>
                        {idx + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className={`bg-gradient-to-br ${isDark ? 'from-gray-700 to-gray-800' : 'from-gray-50 to-white'} border-2 ${themeColors.border} rounded-xl p-5`}>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className={`text-lg font-bold ${themeColors.text.primary}`}>{phase.phase}</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}>
                            {phase.duration}
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {phase.actions.map((action, actionIdx) => (
                            <li key={actionIdx} className="flex items-start gap-2 text-sm">
                              <span className={`${isDark ? 'text-green-400' : 'text-green-600'} mt-0.5`}>•</span>
                              <span className={themeColors.text.secondary}>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Wins */}
          <div className={`${themeColors.card} rounded-xl shadow-lg p-6 ${themeColors.border} border`}>
            <h3 className={`text-2xl font-bold ${themeColors.text.primary} mb-4`}>Quick Wins (Implement This Week)</h3>
            <div className="space-y-4">
              {deepAnalysis.revenueOptimization.quickWins.map((win, idx) => (
                <div key={idx} className={`bg-gradient-to-r ${isDark ? 'from-yellow-900 to-orange-900' : 'from-yellow-50 to-orange-50'} rounded-lg p-5 border-2 ${isDark ? 'border-yellow-700' : 'border-yellow-200'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">⚡</span>
                      <div>
                        <h4 className={`font-bold ${themeColors.text.primary} mb-1`}>{win.action}</h4>
                        <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'} font-semibold`}>{win.impact}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      win.effort === 'low' ? 'bg-green-600 text-white' :
                      win.effort === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-red-600 text-white'
                    }`}>
                      {win.effort} effort
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Long-term Strategy */}
          <div className={`${themeColors.card} rounded-xl shadow-lg p-6 ${themeColors.border} border`}>
            <h3 className={`text-2xl font-bold ${themeColors.text.primary} mb-4`}>Long-term Revenue Strategy</h3>
            <div className="space-y-3">
              {deepAnalysis.revenueOptimization.longTermStrategy.map((strategy, idx) => (
                <div key={idx} className={`bg-gradient-to-r ${isDark ? 'from-blue-900 to-purple-900' : 'from-blue-50 to-purple-50'} rounded-lg p-4 border ${isDark ? 'border-blue-700' : 'border-blue-200'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`${isDark ? 'bg-blue-600' : 'bg-blue-600'} text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
                      {idx + 1}
                    </span>
                    <p className={`${themeColors.text.secondary} pt-1`}>{strategy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversionFunnel;