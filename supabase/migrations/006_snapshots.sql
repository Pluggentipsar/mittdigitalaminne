-- 006: Snapshots - preserve page content at save time
-- Adds snapshot_html for richer content preservation and snapshot_taken_at timestamp

ALTER TABLE memories ADD COLUMN snapshot_html TEXT;
ALTER TABLE memories ADD COLUMN snapshot_taken_at TIMESTAMPTZ;
