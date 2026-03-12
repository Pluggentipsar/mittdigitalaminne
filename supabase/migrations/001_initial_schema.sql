-- Mitt Digitala Minne - Initial Schema

-- Core memories table
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'link', 'article', 'thought')),
  title TEXT NOT NULL,
  original_content TEXT,
  summary TEXT,
  image_url TEXT,
  image_storage_path TEXT,
  link_url TEXT,
  link_metadata JSONB,
  source TEXT DEFAULT 'web' CHECK (source IN ('mcp', 'web', 'manual')),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_memories_content_type ON memories(content_type);
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX idx_memories_is_favorite ON memories(is_favorite) WHERE is_favorite = TRUE;

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tags_name ON tags(name);

-- Junction table
CREATE TABLE memory_tags (
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, tag_id)
);

CREATE INDEX idx_memory_tags_tag_id ON memory_tags(tag_id);

-- Full-text search with Swedish dictionary
ALTER TABLE memories ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('swedish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('swedish', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('swedish', coalesce(original_content, '')), 'C')
  ) STORED;

CREATE INDEX idx_memories_fts ON memories USING GIN(fts);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memories_updated_at
  BEFORE UPDATE ON memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS (single-user, allow all)
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON memories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON memory_tags FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for images (created via Supabase dashboard or seed script)
-- Note: Run this manually or via supabase storage API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('memory-images', 'memory-images', true);
