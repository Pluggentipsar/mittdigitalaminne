-- 012: Add remind_at column for "Påminn mig" (Remind me) feature
--
-- Allows setting a reminder date/time on a memory.
-- NULL = no reminder, past datetime = due/overdue.

ALTER TABLE memories ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ DEFAULT NULL;

-- Index for efficient reminder queries (only non-null values)
CREATE INDEX IF NOT EXISTS idx_memories_remind_at
  ON memories (remind_at)
  WHERE remind_at IS NOT NULL;
