-- Add auto-generated tags to feed items for content-level filtering
ALTER TABLE feed_items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- GIN index for efficient array containment queries (WHERE tags @> ARRAY['ai'])
CREATE INDEX IF NOT EXISTS idx_feed_items_tags ON feed_items USING GIN(tags);
