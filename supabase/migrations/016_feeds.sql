-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Feed sources: RSS feeds, YouTube channels, podcasts, newsletters
CREATE TABLE feed_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  site_url TEXT,
  feed_type TEXT DEFAULT 'rss'
    CHECK (feed_type IN ('rss', 'youtube', 'podcast', 'newsletter')),
  icon_url TEXT,
  color TEXT DEFAULT '#b45309',
  is_active BOOLEAN DEFAULT TRUE,
  fetch_interval_minutes INT DEFAULT 60,
  last_fetched_at TIMESTAMPTZ,
  last_error TEXT,
  item_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feed items: individual items fetched from feeds
CREATE TABLE feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES feed_sources(id) ON DELETE CASCADE,
  guid TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  content_html TEXT,
  link_url TEXT,
  image_url TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  is_read BOOLEAN DEFAULT FALSE,
  is_saved BOOLEAN DEFAULT FALSE,
  saved_memory_id UUID REFERENCES memories(id) ON DELETE SET NULL,
  relevance_score REAL DEFAULT 0,
  metadata JSONB,
  UNIQUE (source_id, guid)
);

CREATE INDEX idx_feed_items_source_id ON feed_items(source_id);
CREATE INDEX idx_feed_items_published_at ON feed_items(published_at DESC);
CREATE INDEX idx_feed_items_unread ON feed_items(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_feed_items_relevance ON feed_items(relevance_score DESC);

-- Trigger: update updated_at on feed_sources
CREATE TRIGGER update_feed_sources_updated_at
  BEFORE UPDATE ON feed_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS: allow all (single-user app)
ALTER TABLE feed_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on feed_sources" ON feed_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on feed_items" ON feed_items FOR ALL USING (true) WITH CHECK (true);

-- Update source constraint to include 'feed'
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_source_check;
-- Note: the constraint may not exist if not previously added
