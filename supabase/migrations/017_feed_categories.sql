-- Add category column to feed_sources for topic-based filtering
ALTER TABLE feed_sources ADD COLUMN IF NOT EXISTS category TEXT;

-- Index for fast category filtering
CREATE INDEX IF NOT EXISTS idx_feed_sources_category ON feed_sources(category);
