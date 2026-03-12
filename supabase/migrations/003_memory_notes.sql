-- Memory notes (comment thread per memory)
CREATE TABLE memory_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_memory_notes_memory_id ON memory_notes(memory_id);

ALTER TABLE memory_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON memory_notes FOR ALL USING (true) WITH CHECK (true);
