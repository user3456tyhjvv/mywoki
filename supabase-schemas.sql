-- User profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Scraping Dashboard Tables

-- Comments table for user feedback and discussions
CREATE TABLE scraping_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES scraping_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracked websites table
CREATE TABLE tracked_websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  scrape_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, url)
);

-- Website performance metrics
CREATE TABLE website_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID REFERENCES tracked_websites(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  visitors INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_session_duration INTEGER DEFAULT 0,
  new_visitors INTEGER DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,
  images_count INTEGER DEFAULT 0,
  videos_count INTEGER DEFAULT 0,
  links_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(website_id, date)
);

-- Indexes for better performance
CREATE INDEX idx_scraping_comments_user_id ON scraping_comments(user_id);
CREATE INDEX idx_scraping_comments_website_url ON scraping_comments(website_url);
CREATE INDEX idx_scraping_comments_parent_id ON scraping_comments(parent_id);
CREATE INDEX idx_tracked_websites_user_id ON tracked_websites(user_id);
CREATE INDEX idx_website_performance_website_id ON website_performance(website_id);
CREATE INDEX idx_website_performance_date ON website_performance(date);

-- Row Level Security (RLS) policies
ALTER TABLE scraping_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_performance ENABLE ROW LEVEL SECURITY;

-- Policies for scraping_comments
CREATE POLICY "Users can view all comments" ON scraping_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON scraping_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON scraping_comments FOR UPDATE USING (auth.uid() = user_id);

-- Policies for tracked_websites
CREATE POLICY "Users can view their own tracked websites" ON tracked_websites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tracked websites" ON tracked_websites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tracked websites" ON tracked_websites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tracked websites" ON tracked_websites FOR DELETE USING (auth.uid() = user_id);

-- Policies for website_performance
CREATE POLICY "Users can view performance of their tracked websites" ON website_performance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tracked_websites
    WHERE tracked_websites.id = website_performance.website_id
    AND tracked_websites.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert performance for their tracked websites" ON website_performance FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tracked_websites
    WHERE tracked_websites.id = website_performance.website_id
    AND tracked_websites.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update performance of their tracked websites" ON website_performance FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tracked_websites
    WHERE tracked_websites.id = website_performance.website_id
    AND tracked_websites.user_id = auth.uid()
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updating updated_at
CREATE TRIGGER update_scraping_comments_updated_at
    BEFORE UPDATE ON scraping_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Reviews table for customer testimonials
CREATE TABLE public.reviews (
  id bigint generated by default as identity not null,
  user_id uuid null,
  name text not null,
  message text not null,
  rating integer not null,
  image_url text not null, -- Required image URL or uploaded image path
  approved boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint reviews_pkey primary key (id),
  constraint reviews_rating_check check (
    (
      (rating >= 1)
      and (rating <= 5)
    )
  )
) TABLESPACE pg_default;

-- Enable RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
CREATE POLICY "Anyone can view approved reviews" ON reviews FOR SELECT USING (approved = true);
CREATE POLICY "Anyone can insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update reviews" ON reviews FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
);

-- Index for reviews
CREATE INDEX idx_reviews_approved ON reviews(approved);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
