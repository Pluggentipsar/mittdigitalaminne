-- Memory shares table for public sharing links
CREATE TABLE IF NOT EXISTS memory_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_memory_shares_token ON memory_shares(share_token);

-- Index for finding shares by memory
CREATE INDEX IF NOT EXISTS idx_memory_shares_memory_id ON memory_shares(memory_id);

-- RLS: allow all (single-user app)
ALTER TABLE memory_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_memory_shares" ON memory_shares FOR ALL USING (true);
