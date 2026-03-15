-- Add 'import' and 'extension' as valid source values
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_source_check;
ALTER TABLE memories ADD CONSTRAINT memories_source_check
  CHECK (source IN ('mcp', 'web', 'manual', 'import', 'extension'));
