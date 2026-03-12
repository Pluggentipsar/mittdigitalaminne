-- 002: Improved search - relevance ranking, tags in FTS, ILIKE fallback, SQL tag filtering

-- Step 1: Drop the generated FTS column (can't include cross-table data in GENERATED)
ALTER TABLE memories DROP COLUMN IF EXISTS fts;

-- Step 2: Add a regular tsvector column maintained by trigger
ALTER TABLE memories ADD COLUMN fts tsvector;

-- Step 3: Function to rebuild FTS vector including tag names
CREATE OR REPLACE FUNCTION rebuild_memory_fts(mem_id UUID) RETURNS void AS $$
DECLARE
  tag_text TEXT;
BEGIN
  SELECT string_agg(t.name, ' ') INTO tag_text
  FROM memory_tags mt
  JOIN tags t ON t.id = mt.tag_id
  WHERE mt.memory_id = mem_id;

  UPDATE memories SET fts =
    setweight(to_tsvector('swedish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('swedish', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('swedish', coalesce(original_content, '')), 'C') ||
    setweight(to_tsvector('swedish', coalesce(tag_text, '')), 'D')
  WHERE id = mem_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Trigger on memories insert/update
CREATE OR REPLACE FUNCTION trigger_rebuild_memory_fts() RETURNS TRIGGER AS $$
BEGIN
  PERFORM rebuild_memory_fts(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_memories_fts
  AFTER INSERT OR UPDATE OF title, summary, original_content ON memories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_rebuild_memory_fts();

-- Step 5: Trigger on memory_tags changes (so adding/removing tags updates FTS)
CREATE OR REPLACE FUNCTION trigger_rebuild_fts_on_tag_change() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM rebuild_memory_fts(OLD.memory_id);
  ELSE
    PERFORM rebuild_memory_fts(NEW.memory_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_memory_tags_fts
  AFTER INSERT OR DELETE ON memory_tags
  FOR EACH ROW
  EXECUTE FUNCTION trigger_rebuild_fts_on_tag_change();

-- Step 6: Rebuild FTS for all existing memories
DO $$
DECLARE
  mem RECORD;
BEGIN
  FOR mem IN SELECT id FROM memories LOOP
    PERFORM rebuild_memory_fts(mem.id);
  END LOOP;
END;
$$;

-- Step 7: Re-create GIN index
DROP INDEX IF EXISTS idx_memories_fts;
CREATE INDEX idx_memories_fts ON memories USING GIN(fts);

-- Step 8: Trigram extension for fuzzy/ILIKE search fallback
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_memories_title_trgm ON memories USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_memories_summary_trgm ON memories USING GIN(summary gin_trgm_ops);

-- Step 9: search_memories RPC function with relevance ranking + ILIKE fallback + SQL tag filtering
CREATE OR REPLACE FUNCTION search_memories(
  search_query TEXT DEFAULT NULL,
  filter_content_type TEXT DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL,
  filter_date_from TIMESTAMPTZ DEFAULT NULL,
  filter_date_to TIMESTAMPTZ DEFAULT NULL,
  filter_favorites_only BOOLEAN DEFAULT FALSE,
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

    -- Check if FTS would return results
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
