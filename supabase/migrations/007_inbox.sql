-- 007: Inbox flow - quick capture, process later
-- Adds is_inbox boolean to memories and updates search_memories RPC

-- Add inbox column (existing memories = processed, new = inbox by default)
ALTER TABLE memories ADD COLUMN is_inbox BOOLEAN DEFAULT FALSE;
UPDATE memories SET is_inbox = FALSE WHERE is_inbox IS NULL;
ALTER TABLE memories ALTER COLUMN is_inbox SET NOT NULL;
ALTER TABLE memories ALTER COLUMN is_inbox SET DEFAULT TRUE;

-- Index for inbox queries
CREATE INDEX idx_memories_is_inbox ON memories(is_inbox) WHERE is_inbox = TRUE;

-- Update search_memories to support inbox filtering
CREATE OR REPLACE FUNCTION search_memories(
  search_query TEXT DEFAULT NULL,
  filter_content_type TEXT DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL,
  filter_date_from TIMESTAMPTZ DEFAULT NULL,
  filter_date_to TIMESTAMPTZ DEFAULT NULL,
  filter_favorites_only BOOLEAN DEFAULT FALSE,
  filter_inbox BOOLEAN DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  result_limit INT DEFAULT 50,
  result_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  content_type TEXT,
  title TEXT,
  original_content TEXT,
  summary TEXT,
  image_url TEXT,
  image_storage_path TEXT,
  link_url TEXT,
  link_metadata JSONB,
  source TEXT,
  is_favorite BOOLEAN,
  is_inbox BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rank REAL,
  tag_ids UUID[],
  tag_names TEXT[],
  tag_colors TEXT[],
  total_count BIGINT
) AS $$
DECLARE
  use_fts BOOLEAN := FALSE;
  fts_query tsquery;
  total BIGINT;
BEGIN
  -- Try FTS first if query provided
  IF search_query IS NOT NULL AND search_query <> '' THEN
    fts_query := plainto_tsquery('swedish', search_query);

    SELECT count(*) INTO total
    FROM memories m
    WHERE m.fts @@ fts_query;

    IF total > 0 THEN
      use_fts := TRUE;
    END IF;
  END IF;

  -- Count total results
  SELECT count(DISTINCT m.id) INTO total
  FROM memories m
  LEFT JOIN memory_tags mt ON mt.memory_id = m.id
  LEFT JOIN tags t ON t.id = mt.tag_id
  WHERE
    (NOT use_fts OR m.fts @@ fts_query)
    AND (use_fts OR search_query IS NULL OR search_query = '' OR
         m.title ILIKE '%' || search_query || '%' OR
         m.summary ILIKE '%' || search_query || '%' OR
         m.original_content ILIKE '%' || search_query || '%')
    AND (filter_content_type IS NULL OR m.content_type = filter_content_type)
    AND (NOT filter_favorites_only OR m.is_favorite = TRUE)
    AND (filter_inbox IS NULL OR m.is_inbox = filter_inbox)
    AND (filter_date_from IS NULL OR m.created_at >= filter_date_from)
    AND (filter_date_to IS NULL OR m.created_at <= filter_date_to)
    AND (filter_tags IS NULL OR array_length(filter_tags, 1) IS NULL OR
         (SELECT count(DISTINCT t2.name) FROM memory_tags mt2 JOIN tags t2 ON t2.id = mt2.tag_id
          WHERE mt2.memory_id = m.id AND t2.name = ANY(filter_tags)) = array_length(filter_tags, 1));

  RETURN QUERY
  SELECT
    m.id,
    m.content_type,
    m.title,
    m.original_content,
    m.summary,
    m.image_url,
    m.image_storage_path,
    m.link_url,
    m.link_metadata,
    m.source,
    m.is_favorite,
    m.is_inbox,
    m.created_at,
    m.updated_at,
    CASE
      WHEN use_fts THEN ts_rank_cd(m.fts, fts_query)
      ELSE 0.0
    END::REAL AS rank,
    COALESCE(array_agg(DISTINCT t.id) FILTER (WHERE t.id IS NOT NULL), '{}') AS tag_ids,
    COALESCE(array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tag_names,
    COALESCE(array_agg(DISTINCT t.color) FILTER (WHERE t.color IS NOT NULL), '{}') AS tag_colors,
    total AS total_count
  FROM memories m
  LEFT JOIN memory_tags mt ON mt.memory_id = m.id
  LEFT JOIN tags t ON t.id = mt.tag_id
  WHERE
    (NOT use_fts OR m.fts @@ fts_query)
    AND (use_fts OR search_query IS NULL OR search_query = '' OR
         m.title ILIKE '%' || search_query || '%' OR
         m.summary ILIKE '%' || search_query || '%' OR
         m.original_content ILIKE '%' || search_query || '%')
    AND (filter_content_type IS NULL OR m.content_type = filter_content_type)
    AND (NOT filter_favorites_only OR m.is_favorite = TRUE)
    AND (filter_inbox IS NULL OR m.is_inbox = filter_inbox)
    AND (filter_date_from IS NULL OR m.created_at >= filter_date_from)
    AND (filter_date_to IS NULL OR m.created_at <= filter_date_to)
    AND (filter_tags IS NULL OR array_length(filter_tags, 1) IS NULL OR
         (SELECT count(DISTINCT t2.name) FROM memory_tags mt2 JOIN tags t2 ON t2.id = mt2.tag_id
          WHERE mt2.memory_id = m.id AND t2.name = ANY(filter_tags)) = array_length(filter_tags, 1))
  GROUP BY m.id
  ORDER BY
    CASE WHEN sort_by = 'relevance' AND use_fts THEN ts_rank_cd(m.fts, fts_query) END DESC NULLS LAST,
    CASE WHEN sort_by = 'oldest' THEN m.created_at END ASC,
    CASE WHEN sort_by = 'title' THEN m.title END ASC,
    m.created_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql;
