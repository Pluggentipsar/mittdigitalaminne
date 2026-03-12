-- Smart Spaces: saved search/filter configurations
CREATE TABLE smart_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  icon TEXT DEFAULT 'folder',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_smart_spaces_sort_order ON smart_spaces(sort_order, created_at);

ALTER TABLE smart_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON smart_spaces FOR ALL USING (true) WITH CHECK (true);

-- Reuse existing updated_at trigger function
CREATE TRIGGER smart_spaces_updated_at
  BEFORE UPDATE ON smart_spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
