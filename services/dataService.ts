import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { TrafficData } from '../types';

const supabaseUrl = 'https://cprykdfnsrgwotyxqaef.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnlrZGZuc3Jnd290eXhxYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTg2MDAsImV4cCI6MjA3NDQ3NDYwMH0.mqNCK2k0ADcuT565qGX-GezFqF94k2huSxMVN8qt9Ek';

// Use environment variables for better security
const backendUrl = process.env.NODE_ENV === 'production' 
  ? 'https://tooler-io.onrender.com' 
  : 'http://localhost:3001';

let supabase: SupabaseClient;

if (supabaseUrl.includes('your-project-url') || supabaseKey.includes('your-public-anon-key')) {
  console.warn('Supabase credentials not configured. Real-time features disabled.');
  supabase = {} as SupabaseClient;
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };

// Create a proper fallback TrafficData object
const createFallbackTrafficData = (): TrafficData => ({
  totalVisitors: 0,
  newVisitors: 0,
  returningVisitors: 0,
  bounceRate: 0,
  avgSessionDuration: 0,
  pagesPerVisit: 0,
  lastUpdated: new Date().toISOString(),
  realData: false,
  totalPageViews: 0,
  totalSessions: 0,
  message: "No tracking data available",
  exitPages: [],
  trafficSources: [],
  conversionFunnel: [],
  trends: {}
});

export const getInitialStats = async (domain: string, userId?: string): Promise<TrafficData> => {
  try {
    // Validate domain
    if (!domain || domain.trim() === '' || domain === 'undefined') {
      console.warn('Invalid domain provided:', domain);
      return createFallbackTrafficData();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user ID header if provided
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch(`${backendUrl}/api/stats/${encodeURIComponent(domain)}`, {
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status} error for domain ${domain}:`, errorText);
      return createFallbackTrafficData();
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`Expected JSON but got ${contentType} for domain ${domain}:`, text.substring(0, 100));
      return createFallbackTrafficData();
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response for domain:', domain, jsonError);
      return createFallbackTrafficData();
    }

    // Validate that the response has the expected structure
    if (typeof data !== 'object' || data === null) {
      console.error('Invalid response data for domain:', domain, data);
      return createFallbackTrafficData();
    }

    // Ensure all required fields are present
    const validatedData: TrafficData = {
      totalVisitors: Number(data.totalVisitors) || 0,
      newVisitors: Number(data.newVisitors) || 0,
      returningVisitors: Number(data.returningVisitors) || 0,
      bounceRate: Number(data.bounceRate) || 0,
      avgSessionDuration: Number(data.avgSessionDuration) || 0,
      pagesPerVisit: Number(data.pagesPerVisit) || 0,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      realData: Boolean(data.realData),
      totalPageViews: Number(data.totalPageViews) || 0,
      totalSessions: Number(data.totalSessions) || 0,
      message: data.message || "Data loaded successfully",
      exitPages: data.exitPages || [],
      trafficSources: data.trafficSources || [],
      conversionFunnel: data.conversionFunnel || [],
      trends: data.trends || {}
    };

    return validatedData;

  } catch (error) {
    console.error('Error fetching initial stats for domain', domain, ':', error);
    return createFallbackTrafficData();
  }
};

// Register a website for a user
export const registerWebsite = async (domain: string, userId: string): Promise<boolean> => {
  try {
    if (!domain || !userId) {
      console.warn('Invalid parameters for website registration:', { domain, userId });
      return false;
    }

    const response = await fetch(`${backendUrl}/api/websites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({ domain }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status} error registering website ${domain}:`, errorText);
      return false;
    }

    const data = await response.json();
    console.log('Website registered successfully:', data);
    return true;

  } catch (error) {
    console.error('Error registering website:', error);
    return false;
  }
};

// Fetch websites for a user
export const getUserWebsites = async (userId: string): Promise<string[]> => {
  try {
    if (!userId) {
      console.warn('Invalid userId for fetching websites:', userId);
      return [];
    }

    const response = await fetch(`${backendUrl}/api/websites/${encodeURIComponent(userId)}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status} error fetching websites for user ${userId}:`, errorText);
      return [];
    }

    const websites = await response.json();

    // Ensure we return an array of domain strings
    if (Array.isArray(websites)) {
      return websites.map(website => website.domain || website).filter(domain => domain);
    }

    console.warn('Unexpected response format for websites:', websites);
    return [];

  } catch (error) {
    console.error('Error fetching user websites:', error);
    return [];
  }
};

// Optional: Add a method to check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${backendUrl}/api/health`, {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};
