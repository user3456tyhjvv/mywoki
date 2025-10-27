import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cprykdfnsrgwotyxqaef.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwcnlrZGZuc3Jnd290eXhxYWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTg2MDAsImV4cCI6MjA3NDQ3NDYwMH0.mqNCK2k0ADcuT565qGX-GezFqF94k2huSxMVN8qt9Ek'

// Enhanced Supabase client with better timeout handling
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',
    debug: import.meta.env?.DEV, // Only debug in development
    // Remove the commented out line to avoid confusion
  },
  global: {
    headers: {
      'X-Client-Info': 'yourspace-analytics-v1.0',
      'X-Client-Type': 'web-app'
    },
    // Enhanced fetch with better timeout and error handling
    fetch: async (url, options = {}) => {
      const controller = new AbortController();
      const timeoutDuration = getTimeoutDuration(url);
      const timeoutId = setTimeout(() => {
        console.warn(`⏰ Supabase request timeout (${timeoutDuration}ms) for:`, url);
        controller.abort();
      }, timeoutDuration);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response;

      } catch (error) {
        clearTimeout(timeoutId);
        
        // Don't log aborted requests (timeouts) as errors
        if (error.name !== 'AbortError') {
          console.error('❌ Supabase fetch error:', error);
        }
        
        throw error;
      }
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Dynamic timeout based on endpoint type
function getTimeoutDuration(url: string): number {
  const urlStr = url.toString();

  // Storage uploads get longer timeouts
  if (urlStr.includes('/storage/') || urlStr.includes('/object/')) {
    return 30000; // 30 seconds for file uploads
  }

  // Auth endpoints get longer timeouts
  if (urlStr.includes('/auth/')) {
    return 15000; // 15 seconds for auth
  }

  // Profile queries get medium timeouts
  if (urlStr.includes('/profiles') || urlStr.includes('select')) {
    return 10000; // 10 seconds for profiles
  }

  // Real-time and other endpoints get shorter timeouts
  if (urlStr.includes('/realtime') || urlStr.includes('/websocket')) {
    return 5000; // 5 seconds for realtime
  }

  return 8000; // 8 seconds default
}

// Enhanced connection check with timeout
export const checkSupabaseConnection = async (): Promise<{
  success: boolean;
  responseTime: number;
  error?: string;
}> => {
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;

    if (error) {
      return {
        success: false,
        responseTime: Math.round(responseTime),
        error: error.message
      };
    }

    console.log('✅ Supabase connection successful:', {
      responseTime: Math.round(responseTime),
      data: data?.length
    });

    return {
      success: true,
      responseTime: Math.round(responseTime)
    };

  } catch (error: any) {
    clearTimeout(timeoutId);
    
    const errorMessage = error.name === 'AbortError' 
      ? 'Connection check timeout' 
      : error.message;

    console.error('❌ Supabase connection failed:', errorMessage);
    
    return {
      success: false,
      responseTime: -1,
      error: errorMessage
    };
  }
}

// Enhanced health check with detailed diagnostics
export const healthCheck = async (): Promise<{
  success: boolean;
  responseTime: number;
  hasSession: boolean;
  userId?: string;
  error?: string;
  diagnostics?: any;
}> => {
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Check both auth and database in parallel
    const [sessionResult, dbResult] = await Promise.allSettled([
      supabase.auth.getSession().then(({ data, error }) => ({ data, error })),
      supabase.from('profiles').select('count').limit(1).single()
    ]);

    clearTimeout(timeoutId);
    const responseTime = performance.now() - startTime;

    const diagnostics = {
      session: sessionResult.status === 'fulfilled' ? 'ok' : 'failed',
      database: dbResult.status === 'fulfilled' ? 'ok' : 'failed',
      responseTime: Math.round(responseTime)
    };

    // Check if session call was successful
    if (sessionResult.status === 'rejected') {
      return {
        success: false,
        responseTime: Math.round(responseTime),
        hasSession: false,
        error: sessionResult.reason?.message || 'Session check failed',
        diagnostics
      };
    }

    const { data: sessionData, error: sessionError } = sessionResult.value;

    if (sessionError) {
      return {
        success: false,
        responseTime: Math.round(responseTime),
        hasSession: false,
        error: sessionError.message,
        diagnostics
      };
    }

    const hasSession = !!sessionData.session;
    const userId = sessionData.session?.user?.id;

    console.log('🔍 Supabase health check:', {
      success: true,
      hasSession,
      userId: userId ? `${userId.substring(0, 8)}...` : 'none',
      responseTime: Math.round(responseTime)
    });

    return {
      success: true,
      responseTime: Math.round(responseTime),
      hasSession,
      userId: userId ? `${userId.substring(0, 8)}...` : undefined,
      diagnostics
    };

  } catch (error: any) {
    clearTimeout(timeoutId);
    
    const errorMessage = error.name === 'AbortError' 
      ? 'Health check timeout' 
      : error.message;

    console.error('❌ Supabase health check failed:', errorMessage);

    return {
      success: false,
      responseTime: -1,
      hasSession: false,
      error: errorMessage
    };
  }
}

// Connection state monitoring
let connectionState: 'connected' | 'disconnected' | 'slow' = 'connected';
let lastHealthCheck = 0;

export const monitorConnection = async (): Promise<void> => {
  const now = Date.now();
  
  // Only check every 30 seconds minimum
  if (now - lastHealthCheck < 30000) {
    return;
  }

  lastHealthCheck = now;
  
  try {
    const health = await healthCheck();
    
    if (health.success) {
      if (health.responseTime > 3000) {
        connectionState = 'slow';
        console.warn('🐌 Supabase connection is slow:', health.responseTime + 'ms');
      } else {
        connectionState = 'connected';
      }
    } else {
      connectionState = 'disconnected';
      console.error('🔴 Supabase connection lost:', health.error);
    }
  } catch (error) {
    connectionState = 'disconnected';
    console.error('🔴 Supabase connection monitoring failed:', error);
  }
}

export const getConnectionState = (): string => connectionState;

// Development debugging
if (import.meta.env?.DEV) {
  let authListenerInitialized = false;
  
  if (!authListenerInitialized) {
    authListenerInitialized = true;
    
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Supabase Auth Event:', event, 
        session?.user?.id ? `User: ${session.user.id.substring(0, 8)}...` : 'No user',
        `Session: ${session ? 'active' : 'none'}`
      );
    });

    // Log initial connection state
    setTimeout(() => {
      checkSupabaseConnection().then(result => {
        console.log('🔍 Initial Supabase connection:', result.success ? '✅ Connected' : '❌ Failed', 
          result.responseTime ? `(${result.responseTime}ms)` : '');
      });
    }, 1000);
  }
}