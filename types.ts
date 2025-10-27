export interface TrafficData {
  total: boolean;
  data: boolean;
  recentVisitors: any[];
  trends: any;
  totalVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  pagesPerVisit: number;
  lastUpdated: string;
  realData: boolean;
  totalPageViews: number;
  totalSessions: number;
  currentVisitors: number;
  message?: string;
  exitPages: ExitPageAnalysis[];
  trafficSources: TrafficSourceAnalysis[];
  conversionFunnel: ConversionFunnelStage[];
  [key: string]: any;
}
export interface ExitPageAnalysis {
  avgTimeOnPage: any;
  url: any;
  pageUrl: string;
  exitRate: number;
  visits: number;
  averageTimeOnPage: number;
  suggestions: string[];
}

export interface TrafficSourceAnalysis {
  source: string;
  visitors: number;
  bounceRate: number;
  conversionRate: number;
  cost?: number;
  revenue?: number;
  roi?: number;
}

export interface ConversionFunnelStage {
  stage: string;
  visitors: number;
  dropOffCount: number;
  dropOffRate: number;
  suggestions: string[];
}
 export interface TrafficEvent {
      id?: number;
      site_id: string;
      visitor_id: string;
      event_type: string;
      path: string;
      referrer: string;
      screen_width?: number;
      screen_height?: number;
      created_at?: string;
    }
export interface ChartDataPoint {
  time: string;
  visitors: number;
  pageViews?: number;
  timestamp?: number;
  date?: string;
  fullDate?: string;
}

export interface InstallationRequest {
  id: number;
  domain: string;
  requestedAt: Date;
  status: 'Pending' | 'In Progress' | 'Completed';
}
export interface Visitor {
  id: string;
  site_id: string;
  visitor_id: string;
  path: string;
  referrer: string | null;
  screen_width: number | null;
  screen_height: number | null;
  language: string | null;
  timezone: string | null;
  event_type: string;
  time_on_page: number | null;
  session_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'user';
  trial_start_date?: string;
  trial_end_date?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  installation_request?: InstallationRequest;
  trial_status?: 'active' | 'expired' | 'expiring_soon';
  days_remaining?: number;
  is_trial_expired?: boolean;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  message_type: 'text' | 'system';
  read: boolean;
  created_at: string;
  sender?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  sent_by?: string;
  created_at: string;
  action_url?: string;
  action_text?: string;
}

export interface Trial {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  notified_3_days: boolean;
  notified_1_day: boolean;
  notified_expired: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
  updated_at?: string;
}

export interface ScrapingComment {
  id: string;
  user_id: string;
  website_url: string;
  content: string;
  parent_id?: string | null;
  created_at: string;
  user?: User;
  replies?: ScrapingComment[];
}

export interface TrackedWebsite {
  id: string;
  user_id: string;
  url: string;
  name?: string;
  created_at: string;
  last_scraped_at?: string;
  status: 'active' | 'inactive';
  scrape_count?: number;
  performance?: WebsitePerformance[];
}

export interface WebsitePerformance {
  id: string;
  website_id: string;
  date: string;
  visitors: number;
  page_views: number;
  bounce_rate: number;
  avg_session_duration: number;
  new_visitors?: number;
  returning_visitors?: number;
  images_count?: number;
  videos_count?: number;
  links_count?: number;
}

//chat modal
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  plan?: string;
  trial_ends_at?: string;
  is_active?: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  sender: {
    id: string;
    type: 'user' | 'admin';
    full_name?: string;
    email?: string;
  };
  content: string;
  fileURL?: string;
  fileName?: string;
  read: boolean;
  created_at: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  lastMessage: string;
  lastMessageTimestamp: any; // Firestore Timestamp
  unreadByUser: boolean;
  unreadByAdmin: boolean;
  userName?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  action_text?: string;
}
