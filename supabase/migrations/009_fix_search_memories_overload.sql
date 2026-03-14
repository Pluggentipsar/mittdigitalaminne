-- 009: Fix search_memories function overload ambiguity
--
-- Migration 002 created search_memories with 9 parameters (without filter_inbox).
-- Migration 007 added a new overload with 10 parameters (with filter_inbox).
-- Because the signatures differ, Postgres kept both versions, causing
-- "could not choose the best candidate function" errors when calling
-- without the filter_inbox argument.
--
-- Fix: Drop the old 9-parameter version. The 007 version (with filter_inbox
-- DEFAULT NULL) is the canonical one and handles all cases.

DROP FUNCTION IF EXISTS search_memories(
  TEXT,    -- search_query
  TEXT,    -- filter_content_type
  TEXT[],  -- filter_tags
  TIMESTAMPTZ,  -- filter_date_from
  TIMESTAMPTZ,  -- filter_date_to
  BOOLEAN, -- filter_favorites_only
  TEXT,    -- sort_by
  INT,     -- result_limit
  INT      -- result_offset
);
