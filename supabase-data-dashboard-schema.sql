-- Data Dashboard Schema Extension
-- This file contains additional tables for the comprehensive data dashboard

-- Admins table for dashboard access control
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Domains table for data dashboard
CREATE TABLE domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
  days_remaining INTEGER DEFAULT 30,
  last_analytics_update TIMESTAMP WITH TIME ZONE,
  total_visitors INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_session_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

-- Traffic events table for detailed analytics
CREATE TABLE traffic_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'session_start', 'session_end', 'conversion', 'bounce')),
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  browser TEXT,
  os TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration INTEGER, -- in seconds
  metadata JSONB DEFAULT '{}'
);

-- Exit pages analysis table
CREATE TABLE exit_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  exit_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  exit_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_time_on_page INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(domain_id, page_url)
);

-- Traffic sources table
CREATE TABLE traffic_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  medium TEXT,
  campaign TEXT,
  visitors INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_session_duration INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(domain_id, source, medium, campaign)
);

-- Conversions table
CREATE TABLE conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  funnel_stage TEXT NOT NULL,
  visitors INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  drop_off_count INTEGER DEFAULT 0,
  drop_off_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_time_to_convert INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scraped items table for scraping results
CREATE TABLE scraped_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  scrape_run_id UUID REFERENCES scrape_runs(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('image', 'video', 'link', 'content', 'heading')),
  url TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scrape runs table for tracking scraping jobs
CREATE TABLE scrape_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  target_url TEXT NOT NULL,
  images_found INTEGER DEFAULT 0,
  videos_found INTEGER DEFAULT 0,
  links_found INTEGER DEFAULT 0,
  content_quality_score DECIMAL(3,1) DEFAULT 0.0,
  ai_summary TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_domains_status ON domains(status);
CREATE INDEX idx_traffic_events_domain_id ON traffic_events(domain_id);
CREATE INDEX idx_traffic_events_timestamp ON traffic_events(timestamp);
CREATE INDEX idx_traffic_events_visitor_id ON traffic_events(visitor_id);
CREATE INDEX idx_traffic_events_session_id ON traffic_events(session_id);
CREATE INDEX idx_exit_pages_domain_id ON exit_pages(domain_id);
CREATE INDEX idx_traffic_sources_domain_id ON traffic_sources(domain_id);
CREATE INDEX idx_conversions_domain_id ON conversions(domain_id);
CREATE INDEX idx_scraped_items_domain_id ON scraped_items(domain_id);
CREATE INDEX idx_scraped_items_scrape_run_id ON scraped_items(scrape_run_id);
CREATE INDEX idx_scrape_runs_domain_id ON scrape_runs(domain_id);
CREATE INDEX idx_scrape_runs_user_id ON scrape_runs(user_id);
CREATE INDEX idx_scrape_runs_status ON scrape_runs(status);

-- Row Level Security policies
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;

-- Policies for domains
CREATE POLICY "Users can view their own domains" ON domains FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own domains" ON domains FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own domains" ON domains FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own domains" ON domains FOR DELETE USING (auth.uid() = user_id);

-- Policies for traffic_events
CREATE POLICY "Users can view traffic events for their domains" ON traffic_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = traffic_events.domain_id AND domains.user_id = auth.uid())
);
CREATE POLICY "Users can insert traffic events for their domains" ON traffic_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = traffic_events.domain_id AND domains.user_id = auth.uid())
);

-- Policies for exit_pages
CREATE POLICY "Users can view exit pages for their domains" ON exit_pages FOR SELECT USING (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = exit_pages.domain_id AND domains.user_id = auth.uid())
);
CREATE POLICY "Users can insert/update exit pages for their domains" ON exit_pages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = exit_pages.domain_id AND domains.user_id = auth.uid())
);
CREATE POLICY "Users can update exit pages for their domains" ON exit_pages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = exit_pages.domain_id AND domains.user_id = auth.uid())
);

-- Policies for traffic_sources
CREATE POLICY "Users can view traffic sources for their domains" ON traffic_sources FOR SELECT USING (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = traffic_sources.domain_id AND domains.user_id = auth.uid())
);
CREATE POLICY "Users can insert/update traffic sources for their domains" ON traffic_sources FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = traffic_sources.domain_id AND domains.user_id = auth.uid())
);
CREATE POLICY "Users can update traffic sources for their domains" ON traffic_sources FOR UPDATE USING (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = traffic_sources.domain_id AND domains.user_id = auth.uid())
);

-- Policies for conversions
CREATE POLICY "Users can view conversions for their domains" ON conversions FOR SELECT USING (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = conversions.domain_id AND domains.user_id = auth.uid())
);
CREATE POLICY "Users can insert/update conversions for their domains" ON conversions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = conversions.domain_id AND domains.user_id = auth.uid())
);
CREATE POLICY "Users can update conversions for their domains" ON conversions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = conversions.domain_id AND domains.user_id = auth.uid())
);

-- Policies for scraped_items
CREATE POLICY "Users can view scraped items for their domains" ON scraped_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = scraped_items.domain_id AND domains.user_id = auth.uid())
);
CREATE POLICY "Users can insert scraped items for their domains" ON scraped_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = scraped_items.domain_id AND domains.user_id = auth.uid())
);

-- Policies for scrape_runs
CREATE POLICY "Users can view scrape runs for their domains" ON scrape_runs FOR SELECT USING (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = scrape_runs.domain_id AND domains.user_id = auth.uid())
);
CREATE POLICY "Users can insert scrape runs for their domains" ON scrape_runs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = scrape_runs.domain_id AND domains.user_id = auth.uid())
);
CREATE POLICY "Users can update scrape runs for their domains" ON scrape_runs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM domains WHERE domains.id = scrape_runs.domain_id AND domains.user_id = auth.uid())
);

-- Policies for admins
CREATE POLICY "Admins can view admin records" ON admins FOR SELECT USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
);
CREATE POLICY "Admins can insert admin records" ON admins FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
);

-- Triggers for updating updated_at
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversions_updated_at BEFORE UPDATE ON conversions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scrape_runs_updated_at BEFORE UPDATE ON scrape_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
