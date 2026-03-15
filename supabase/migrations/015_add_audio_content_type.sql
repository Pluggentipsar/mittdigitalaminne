-- Add 'audio' to allowed content types (for podcasts, Spotify, etc.)
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_content_type_check;
ALTER TABLE memories ADD CONSTRAINT memories_content_type_check
  CHECK (content_type IN ('image','link','article','thought','youtube','linkedin','instagram','twitter','audio'));
