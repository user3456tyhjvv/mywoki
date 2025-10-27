-- Scraped content storage
CREATE TABLE scraped_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES tracked_websites(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('images', 'videos', 'links', 'content')),
  content_data JSONB NOT NULL,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for scraped_content
CREATE INDEX idx_scraped_content_website_id ON scraped_content(website_id);
CREATE INDEX idx_scraped_content_type ON scraped_content(content_type);
CREATE INDEX idx_scraped_content_scraped_at ON scraped_content(scraped_at);

-- RLS for scraped_content
ALTER TABLE scraped_content ENABLE ROW LEVEL SECURITY;

-- Policies for scraped_content
CREATE POLICY "Users can view scraped content of their tracked websites" ON scraped_content FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tracked_websites
    WHERE tracked_websites.id = scraped_content.website_id
    AND tracked_websites.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert scraped content for their tracked websites" ON scraped_content FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tracked_websites
    WHERE tracked_websites.id = scraped_content.website_id
    AND tracked_websites.user_id = auth.uid()
  )
);
